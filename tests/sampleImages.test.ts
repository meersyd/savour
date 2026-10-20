import samples from '../src/data/sampleRecipes.json';

// Exercise the real static asset imports, not the UI suite's image resolver mock.
const { recipeImage } =
  jest.requireActual<typeof import('../src/utils/images')>('../src/utils/images');

describe('bundled starter photos', () => {
  it.each(samples)('resolves the bundled photo for $name', (recipe) => {
    expect(recipeImage(recipe.imageUri)).toBeDefined();
  });
  it('returns no source for retired photos so the UI can show its fallback', () => {
    expect(recipeImage('sample:avocado-toast')).toBeUndefined();
  });
});
