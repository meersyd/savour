import categories from '../data/recipetypes.json';
import type { FormErrors, Recipe, RecipeFormValues, RecipeInput } from '../types/recipe';
export function validateRecipe(values: RecipeFormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) errors.name = 'Give your recipe a name.';
  else if (values.name.trim().length > 100) errors.name = 'Use 100 characters or fewer.';
  if (!categories.some((c) => c.id === values.categoryId)) errors.categoryId = 'Choose a category.';
  if (!values.imageUri) errors.imageUri = 'Choose a photo for your recipe.';
  if (!values.ingredients.length || values.ingredients.some((s) => !s.trim()))
    errors.ingredients = 'Enter each ingredient, or remove empty rows.';
  if (!values.steps.length || values.steps.some((s) => !s.trim()))
    errors.steps = 'Enter each cooking step, or remove empty rows.';
  for (const field of ['prepTime', 'cookTime', 'servings'] as const) {
    const min = field === 'servings' ? 1 : 0;
    if (!/^\d+$/.test(values[field]) || Number(values[field]) < min || Number(values[field]) > 999)
      errors[field] = `Enter a whole number from ${min} to 999.`;
  }
  return errors;
}
export function toRecipeInput(values: RecipeFormValues): RecipeInput {
  return {
    ...values,
    name: values.name.trim(),
    description: values.description.trim(),
    ingredients: values.ingredients.map((s) => s.trim()),
    steps: values.steps.map((s) => s.trim()),
    prepTime: Number(values.prepTime),
    cookTime: Number(values.cookTime),
    servings: Number(values.servings),
  };
}
// Retired bundled photos must not make an existing saved collection unreadable.
export function isStoredImageReference(uri: string): boolean {
  return /^sample:[a-z0-9-]+$/.test(uri) || /^local:[a-zA-Z0-9-]+\.[a-zA-Z0-9]+$/.test(uri);
}
export function isRecipe(value: unknown): value is Recipe {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  return (
    ['id', 'name', 'categoryId', 'description', 'imageUri', 'createdAt', 'updatedAt'].every(
      (k) => typeof r[k] === 'string',
    ) &&
    typeof r.name === 'string' &&
    r.name.trim().length > 0 &&
    typeof r.id === 'string' &&
    r.id.length > 0 &&
    typeof r.imageUri === 'string' &&
    isStoredImageReference(r.imageUri) &&
    categories.some((c) => c.id === r.categoryId) &&
    ['ingredients', 'steps'].every(
      (k) =>
        Array.isArray(r[k]) &&
        r[k].length > 0 &&
        r[k].every((s: unknown) => typeof s === 'string' && s.trim().length > 0),
    ) &&
    ['prepTime', 'cookTime', 'servings'].every(
      (k) =>
        typeof r[k] === 'number' &&
        Number.isInteger(r[k]) &&
        r[k] >= (k === 'servings' ? 1 : 0) &&
        r[k] <= 999,
    ) &&
    Number.isFinite(Date.parse(String(r.createdAt))) &&
    Number.isFinite(Date.parse(String(r.updatedAt)))
  );
}
