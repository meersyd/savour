import { describe, expect, it } from '@jest/globals';
import {
  RecipeRepository,
  STORAGE_KEY,
  type StorageAdapter,
} from '../src/services/recipeRepository';
import samples from '../src/data/sampleRecipes.json';
import legacySamples from '../src/data/legacyStarterRecipes.json';
import categories from '../src/data/recipetypes.json';
import { isRecipe, validateRecipe } from '../src/utils/validation';
function setup(initial?: string) {
  let value: string | null = initial ?? null;
  let fail = false;
  let id = 0;
  const storage: StorageAdapter = {
    getItem: async () => value,
    setItem: async (_key, next) => {
      if (fail) throw new Error('Disk full');
      value = next;
    },
  };
  return {
    repo: new RecipeRepository(storage, () => `new-${++id}`),
    storage,
    raw: () => value,
    fail: (next: boolean) => {
      fail = next;
    },
  };
}
describe('offline recipe repository', () => {
  it('ships valid sample records and JSON category references', () => {
    expect(samples.length).toBeGreaterThanOrEqual(6);
    expect(samples.every(isRecipe)).toBe(true);
    expect(samples.every((r) => categories.some((c) => c.id === r.categoryId))).toBe(true);
  });
  it('seeds once and preserves edits across repository restarts', async () => {
    const { repo, storage } = setup();
    const first = await repo.load();
    await repo.update(first[0].id, { ...first[0], name: 'My breakfast' });
    const restarted = new RecipeRepository(storage, () => 'x');
    expect((await restarted.load())[0].name).toBe('My breakfast');
  });
  it('does not reseed a collection after deleting every recipe', async () => {
    const { repo, storage } = setup();
    for (const r of await repo.load()) await repo.delete(r.id);
    expect(await new RecipeRepository(storage, () => 'x').load()).toEqual([]);
  });
  it('serializes concurrent creates and updates without lost writes', async () => {
    const { repo } = setup();
    await Promise.all([
      repo.create({ ...samples[0], name: 'A' }),
      repo.create({ ...samples[0], name: 'B' }),
    ]);
    const recipes = await repo.load();
    expect(recipes).toHaveLength(8);
    expect(new Set(recipes.map((r) => r.id)).size).toBe(8);
  });
  it('preserves identity and creation date when editing', async () => {
    const { repo } = setup();
    const r = (await repo.load())[0];
    const edited = (await repo.update(r.id, { ...r, name: 'Changed' }))[0];
    expect(edited.id).toBe(r.id);
    expect(edited.createdAt).toBe(r.createdAt);
    expect(edited.name).toBe('Changed');
  });
  it('leaves data untouched when a write fails, then recovers', async () => {
    const s = setup();
    await s.repo.load();
    const before = s.raw();
    s.fail(true);
    await expect(s.repo.create(samples[0])).rejects.toThrow('Disk full');
    expect(s.raw()).toBe(before);
    s.fail(false);
    expect(await s.repo.create(samples[0])).toHaveLength(7);
  });
  it.each(['invalid JSON', '{"version":2,"recipes":[]}', '{"version":1,"recipes":[{}]}'])(
    'does not overwrite corrupt/unsupported data: %s',
    async (raw) => {
      const s = setup(raw);
      await expect(s.repo.load()).rejects.toThrow();
      expect(s.raw()).toBe(raw);
      await expect(s.repo.create(samples[0])).rejects.toThrow();
      expect(s.raw()).toBe(raw);
    },
  );
  it('rejects missing updates and tolerates repeated deletion', async () => {
    const { repo } = setup();
    await expect(repo.update('gone', samples[0])).rejects.toThrow('no longer exists');
    await repo.delete(samples[0].id);
    expect(await repo.delete(samples[0].id)).toHaveLength(5);
  });
  it('surfaces unavailable storage', async () => {
    const repo = new RecipeRepository(
      {
        getItem: async () => {
          throw new Error('Unavailable');
        },
        setItem: async () => undefined,
      },
      () => 'x',
    );
    await expect(repo.load()).rejects.toThrow('Unavailable');
  });
  it('rejects invalid input before persistence', async () => {
    const s = setup();
    await expect(s.repo.create({ ...samples[0], name: ' ' })).rejects.toThrow();
    expect(s.raw()).toBeNull();
  });
  it('uses a versioned storage key', () => expect(STORAGE_KEY).toBe('@savour/recipes/v1'));
});
describe('form validation', () => {
  const valid = { ...samples[0], prepTime: '10', cookTime: '0', servings: '2' };
  it('accepts zero cooking time', () => expect(validateRecipe(valid)).toEqual({}));
  it('validates all required fields and numeric boundaries', () => {
    const errors = validateRecipe({
      ...valid,
      name: ' ',
      categoryId: 'invalid',
      imageUri: '',
      ingredients: [''],
      steps: [],
      prepTime: '-1',
      cookTime: '1.5',
      servings: '0',
    });
    expect(Object.keys(errors)).toHaveLength(8);
  });
});

it('rejects corrupt image paths without exposing them to the renderer', async () => {
  const broken = { ...samples[0], imageUri: 'local:../outside.jpg' };
  expect(isRecipe(broken)).toBe(false);
  const raw = JSON.stringify({ version: 1, recipes: [broken] });
  const s = setup(raw);
  await expect(s.repo.load()).rejects.toThrow('damaged format');
  expect(s.raw()).toBe(raw);
});

it('preserves saved recipes whose bundled photo was retired', async () => {
  const saved = {
    ...samples[0],
    id: 'avocado-toast',
    name: 'My edited toast',
    imageUri: 'sample:avocado-toast',
  };
  const raw = JSON.stringify({ version: 1, recipes: [saved] });
  const s = setup(raw);
  expect(await s.repo.load()).toContainEqual(saved);
  await s.repo.update(saved.id, { ...saved, description: 'Still editable' });
  expect((await s.repo.load()).find((recipe) => recipe.id === saved.id)?.description).toBe(
    'Still editable',
  );
});

describe('one-time Malaysian starter update', () => {
  it('replaces the untouched old collection with the six Malaysian dishes', async () => {
    const s = setup(JSON.stringify({ version: 1, recipes: legacySamples }));
    expect(await s.repo.load()).toEqual(samples);
    expect(JSON.parse(s.raw()!).starterCatalog).toBe('malaysian-v1');
    expect(await new RecipeRepository(s.storage, () => 'x').load()).toEqual(samples);
  });
  it('preserves personal recipes, edited old samples, and existing Malaysian edits', async () => {
    const edited = { ...legacySamples[0], name: 'My toast' };
    const personal = {
      ...samples[0],
      id: 'my-recipe',
      name: 'My dish',
      imageUri: 'local:photo.jpg',
    };
    const nasi = { ...samples[0], name: 'My nasi lemak' };
    const s = setup(
      JSON.stringify({ version: 1, recipes: [edited, ...legacySamples.slice(1), personal, nasi] }),
    );
    const migrated = await s.repo.load();
    expect(migrated).toHaveLength(8);
    expect(migrated).toEqual(expect.arrayContaining([edited, personal, nasi]));
    expect(migrated.filter((recipe) => recipe.id === nasi.id)).toHaveLength(1);
  });
  it('does not restore Malaysian recipes deleted after migration, even with an edited old sample remaining', async () => {
    const edited = { ...legacySamples[0], name: 'My toast' };
    const s = setup(JSON.stringify({ version: 1, recipes: [edited] }));
    await s.repo.load();
    await s.repo.delete('nasi-lemak');
    const restarted = new RecipeRepository(s.storage, () => 'x');
    expect((await restarted.load()).some((recipe) => recipe.id === 'nasi-lemak')).toBe(false);
  });
  it('keeps an empty collection empty and does not reseed a newer collection with a deleted starter', async () => {
    const empty = setup(JSON.stringify({ version: 1, recipes: [] }));
    expect(await empty.repo.load()).toEqual([]);
    const current = setup(JSON.stringify({ version: 1, recipes: samples.slice(1) }));
    expect(await current.repo.load()).toEqual(samples.slice(1));
  });
  it('leaves the old collection untouched if migration cannot be saved, then retries safely', async () => {
    const raw = JSON.stringify({ version: 1, recipes: legacySamples });
    const s = setup(raw);
    s.fail(true);
    await expect(s.repo.load()).rejects.toThrow('Disk full');
    expect(s.raw()).toBe(raw);
    s.fail(false);
    expect(await s.repo.load()).toEqual(samples);
  });
});
