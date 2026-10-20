import samples from '../data/sampleRecipes.json';
import legacySamples from '../data/legacyStarterRecipes.json';
import type { Recipe, RecipeInput } from '../types/recipe';
import { isRecipe, isStoredImageReference, validateRecipe } from '../utils/validation';
export const STORAGE_KEY = '@savour/recipes/v1';
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
/** Serializes reads and mutations; failed writes never update the source of truth. */
export class RecipeRepository {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(
    private readonly storage: StorageAdapter,
    private readonly makeId: () => string,
  ) {}
  private serial<T>(work: () => Promise<T>): Promise<T> {
    const next = this.queue.then(work);
    this.queue = next.catch(() => undefined);
    return next;
  }
  private async read(): Promise<Recipe[]> {
    const raw = await this.storage.getItem(STORAGE_KEY);
    if (raw === null) {
      const initial: Recipe[] = samples;
      await this.write(initial);
      return initial;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(
        'Your saved collection could not be read. It has not been overwritten. Please retry.',
      );
    }
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !('version' in parsed) ||
      parsed.version !== 1 ||
      !('recipes' in parsed) ||
      !Array.isArray(parsed.recipes) ||
      !parsed.recipes.every(isRecipe) ||
      new Set(parsed.recipes.map((r) => r.id)).size !== parsed.recipes.length
    )
      throw new Error(
        'Your saved collection has an unsupported or damaged format. It has not been overwritten.',
      );
    if (
      !('starterCatalog' in parsed) &&
      parsed.recipes.some((recipe) => legacySamples.some((old) => old.id === recipe.id))
    ) {
      // Replace only exact original samples. Edited samples and personal recipes survive.
      const preserved = parsed.recipes.filter(
        (recipe) =>
          !legacySamples.some(
            (old) =>
              old.id === recipe.id &&
              (Object.keys(old) as (keyof Recipe)[]).every(
                (key) => JSON.stringify(old[key]) === JSON.stringify(recipe[key]),
              ),
          ),
      );
      const existingIds = new Set(preserved.map((recipe) => recipe.id));
      const migrated = [...samples.filter((recipe) => !existingIds.has(recipe.id)), ...preserved];
      await this.write(migrated);
      return migrated;
    }
    return parsed.recipes;
  }
  private async write(recipes: Recipe[]): Promise<void> {
    await this.storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, starterCatalog: 'malaysian-v1', recipes }),
    );
  }
  private check(input: RecipeInput): void {
    const errors = validateRecipe({
      ...input,
      prepTime: String(input.prepTime),
      cookTime: String(input.cookTime),
      servings: String(input.servings),
    });
    if (Object.keys(errors).length || !isStoredImageReference(input.imageUri))
      throw new Error('Please correct the recipe fields before saving.');
  }
  load(): Promise<Recipe[]> {
    return this.serial(() => this.read());
  }
  create(input: RecipeInput): Promise<Recipe[]> {
    return this.serial(async () => {
      this.check(input);
      const recipes = await this.read();
      const now = new Date().toISOString();
      const recipe: Recipe = { ...input, id: this.makeId(), createdAt: now, updatedAt: now };
      const next = [recipe, ...recipes];
      await this.write(next);
      return next;
    });
  }
  update(id: string, input: RecipeInput): Promise<Recipe[]> {
    return this.serial(async () => {
      this.check(input);
      const recipes = await this.read();
      if (!recipes.some((r) => r.id === id)) throw new Error('This recipe no longer exists.');
      const next = recipes.map((r) =>
        r.id === id
          ? { ...input, id: r.id, createdAt: r.createdAt, updatedAt: new Date().toISOString() }
          : r,
      );
      await this.write(next);
      return next;
    });
  }
  delete(id: string): Promise<Recipe[]> {
    return this.serial(async () => {
      const recipes = await this.read();
      const next = recipes.filter((r) => r.id !== id);
      await this.write(next);
      return next;
    });
  }
}
