export interface RecipeType {
  id: string;
  name: string;
}
export interface Recipe {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  imageUri: string;
  ingredients: string[];
  steps: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  createdAt: string;
  updatedAt: string;
}
export type RecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;
export interface RecipeFormValues extends Omit<RecipeInput, 'prepTime' | 'cookTime' | 'servings'> {
  prepTime: string;
  cookTime: string;
  servings: string;
}
export type FormErrors = Partial<Record<keyof RecipeFormValues, string>>;
export type RootStackParamList = {
  Recipes: undefined;
  RecipeDetail: { recipeId: string };
  RecipeEditor: { recipeId?: string } | undefined;
};
