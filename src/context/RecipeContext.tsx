import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { recipeStorage } from '../services/recipeStorage';
import type { Recipe, RecipeInput } from '../types/recipe';
export interface RecipesContextValue {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createRecipe: (input: RecipeInput) => Promise<Recipe>;
  updateRecipe: (id: string, input: RecipeInput) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
}
export const RecipeContext = createContext<RecipesContextValue | undefined>(undefined);
export function RecipeProvider({ children }: { children: ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const run = useCallback(async (operation: () => Promise<Recipe[]>) => {
    try {
      const next = await operation();
      if (mounted.current) {
        setRecipes(next);
        setError(null);
      }
      return next;
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : 'Your collection could not be saved. Please retry.';
      if (mounted.current) setError(message);
      throw new Error(message);
    }
  }, []);
  const refresh = useCallback(async () => {
    if (mounted.current) setLoading(true);
    try {
      await run(() => recipeStorage.load());
    } catch {
      /* Error is surfaced through context; preserve persisted data. */
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [run]);
  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => {
      mounted.current = false;
    };
  }, [refresh]);
  const createRecipe = useCallback(
    async (input: RecipeInput) => (await run(() => recipeStorage.create(input)))[0],
    [run],
  );
  const updateRecipe = useCallback(
    async (id: string, input: RecipeInput) => {
      await run(() => recipeStorage.update(id, input));
    },
    [run],
  );
  const deleteRecipe = useCallback(
    async (id: string) => {
      await run(() => recipeStorage.delete(id));
    },
    [run],
  );
  const value = useMemo(
    () => ({ recipes, loading, error, refresh, createRecipe, updateRecipe, deleteRecipe }),
    [recipes, loading, error, refresh, createRecipe, updateRecipe, deleteRecipe],
  );
  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
}
