import { useRef, useState } from 'react';
import { Button } from '../components/Button';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRecipes } from '../hooks/useRecipes';
import type { RootStackParamList } from '../types/recipe';
import categories from '../data/recipetypes.json';
import { colors, shared } from '../constants/theme';
import { EmptyState } from '../components/EmptyState';
import { RecipeImage } from '../components/RecipeImage';
export function RecipeDetailScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'RecipeDetail'>) {
  const { recipes, deleteRecipe } = useRecipes();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deletionPending = useRef(false);
  const recipe = recipes.find((r) => r.id === route.params.recipeId);
  function confirmDelete() {
    if (!recipe || deletionPending.current) return;
    deletionPending.current = true;
    const id = recipe.id;
    Alert.alert(
      'Delete this recipe?',
      `“${recipe.name}” will be removed from your collection. This cannot be undone.`,
      [
        {
          text: 'Keep recipe',
          style: 'cancel',
          onPress: () => {
            deletionPending.current = false;
          },
        },
        {
          text: 'Delete recipe',
          style: 'destructive',
          onPress: () => {
            setDeleting(true);
            setDeleteError(null);
            void deleteRecipe(id)
              .then(() => navigation.popToTop())
              .catch((cause: unknown) => {
                setDeleteError(
                  cause instanceof Error
                    ? cause.message
                    : 'Could not delete the recipe. Please retry.',
                );
              })
              .finally(() => {
                setDeleting(false);
                deletionPending.current = false;
              });
          },
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          deletionPending.current = false;
        },
      },
    );
  }
  if (!recipe)
    return (
      <SafeAreaView style={shared.page} edges={['bottom', 'left', 'right']}>
        <EmptyState
          title="Recipe not found"
          message="It may have been removed from your collection."
          actionLabel="Back to recipes"
          onAction={() => navigation.popToTop()}
        />
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={shared.page} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <RecipeImage uri={recipe.imageUri} label={recipe.name} style={styles.hero} />
        <View style={styles.body}>
          <Text style={styles.category}>
            {categories.find((c) => c.id === recipe.categoryId)?.name.toUpperCase()}
          </Text>
          <Text style={shared.title}>{recipe.name}</Text>
          {recipe.description ? <Text style={shared.muted}>{recipe.description}</Text> : null}
          <View style={styles.stats}>
            {[
              [`${recipe.prepTime} min`, 'PREP'],
              [`${recipe.cookTime} min`, 'COOK'],
              [String(recipe.servings), 'SERVINGS'],
            ].map(([value, label]) => (
              <View key={label} style={styles.stat}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>
          <Button
            label="Edit recipe"
            disabled={deleting}
            icon="create-outline"
            variant="secondary"
            onPress={() => navigation.navigate('RecipeEditor', { recipeId: recipe.id })}
          />
          <Text style={shared.heading}>Ingredients</Text>
          <View style={styles.ingredients}>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredient}>
                <View style={styles.bullet} />
                <Text style={[shared.body, styles.flex]}>{ingredient}</Text>
              </View>
            ))}
          </View>
          <Text style={shared.heading}>Let’s make it</Text>
          {recipe.steps.map((step, index) => (
            <View key={index} style={styles.step}>
              <View style={styles.number}>
                <Text style={styles.numberText}>{String(index + 1).padStart(2, '0')}</Text>
              </View>
              <Text style={[shared.body, styles.flex]}>{step}</Text>
            </View>
          ))}
          {deleteError && (
            <Text accessibilityRole="alert" style={shared.error}>
              {deleteError}
            </Text>
          )}
          <Button
            label={deleting ? 'Deleting…' : 'Delete recipe'}
            icon="trash-outline"
            variant="danger"
            loading={deleting}
            onPress={confirmDelete}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 800, alignSelf: 'center' },
  hero: { width: '100%', aspectRatio: 1.35 },
  body: { padding: 24, gap: 20 },
  category: { color: colors.primary, fontSize: 12, letterSpacing: 2, fontWeight: '700' },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.pale,
    borderRadius: 18,
    paddingVertical: 20,
    gap: 12,
    justifyContent: 'space-around',
  },
  stat: { alignItems: 'center', gap: 8, paddingHorizontal: 10 },
  statValue: { color: colors.primary, fontWeight: '700', fontSize: 19 },
  statLabel: { fontSize: 10, letterSpacing: 1.5, color: colors.primary },
  ingredients: { backgroundColor: colors.card, borderRadius: 18, padding: 20, gap: 14 },
  ingredient: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginTop: 10 },
  flex: { flex: 1 },
  step: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  number: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.pale,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: { fontWeight: '700', color: colors.primary },
});
