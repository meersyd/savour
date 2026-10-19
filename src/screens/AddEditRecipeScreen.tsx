import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreventRemove } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RecipeForm } from '../components/RecipeForm';
import { EmptyState } from '../components/EmptyState';
import { useRecipes } from '../hooks/useRecipes';
import { persistRecipeImage, removeRecipeImage } from '../services/recipeImages';
import { shared } from '../constants/theme';
import type { RecipeFormValues, RecipeInput, RootStackParamList } from '../types/recipe';
export function AddEditRecipeScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'RecipeEditor'>) {
  const { recipes, createRecipe, updateRecipe } = useRecipes();
  const recipeId = route.params?.recipeId;
  const recipe = recipes.find((r) => r.id === recipeId);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const headerHeight = useHeaderHeight();
  const initialValues = useMemo<RecipeFormValues>(
    () =>
      recipe
        ? {
            ...recipe,
            prepTime: String(recipe.prepTime),
            cookTime: String(recipe.cookTime),
            servings: String(recipe.servings),
          }
        : {
            name: '',
            categoryId: '',
            imageUri: '',
            description: '',
            ingredients: [''],
            steps: [''],
            prepTime: '10',
            cookTime: '0',
            servings: '2',
          },
    [recipe],
  );
  usePreventRemove(!savedId && (dirty || busy), ({ data }) => {
    if (busy) {
      Alert.alert('Saving your recipe', 'Please wait a moment for saving to finish.');
      return;
    }
    Alert.alert('Discard your changes?', 'Your unsaved changes will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });
  useEffect(() => {
    if (savedId) {
      if (recipeId) navigation.goBack();
      else navigation.replace('RecipeDetail', { recipeId: savedId });
      Alert.alert(
        recipeId ? 'Changes saved' : 'Recipe saved',
        'Your recipe is ready in your collection.',
      );
    }
  }, [savedId, recipeId, navigation]);
  async function save(input: RecipeInput) {
    let ownedUri: string | undefined;
    try {
      ownedUri = persistRecipeImage(input.imageUri);
      const next = { ...input, imageUri: ownedUri };
      if (recipeId) {
        await updateRecipe(recipeId, next);
        setSavedId(recipeId);
      } else {
        const created = await createRecipe(next);
        setSavedId(created.id);
      }
    } catch (cause) {
      if (ownedUri && ownedUri !== input.imageUri) {
        try {
          removeRecipeImage(ownedUri);
        } catch {
          throw new Error(
            'The recipe could not be saved, and the unused photo could not be removed. Please check device storage and retry.',
          );
        }
      }
      throw cause;
    }
  }
  if (recipeId && !recipe)
    return (
      <SafeAreaView style={shared.page} edges={['bottom', 'left', 'right']}>
        <EmptyState
          title="Recipe not found"
          message="This recipe is no longer in your collection."
          actionLabel="Back to recipes"
          onAction={() => navigation.popToTop()}
        />
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={shared.page} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={shared.page}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={headerHeight}
      >
        <ScrollView
          ref={scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={shared.content}
        >
          <Text style={shared.title}>
            {recipeId ? 'Make it your own.' : 'Something delicious.'}
          </Text>
          <Text style={shared.muted}>
            {recipeId
              ? 'A little tweak, an even better recipe.'
              : 'Keep the recipes you love, one ingredient at a time.'}
          </Text>
          <RecipeForm
            key={recipeId ?? 'new'}
            initialValues={initialValues}
            editing={!!recipeId}
            onSubmit={save}
            onDirtyChange={setDirty}
            onBusyChange={setBusy}
            onInvalid={() => scroll.current?.scrollTo({ y: 0, animated: true })}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
