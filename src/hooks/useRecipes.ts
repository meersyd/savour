import { useContext } from 'react';
import { RecipeContext, type RecipesContextValue } from '../context/RecipeContext';
export function useRecipes(): RecipesContextValue {
  const context = useContext(RecipeContext);
  if (!context) throw new Error('useRecipes must be used inside RecipeProvider.');
  return context;
}
