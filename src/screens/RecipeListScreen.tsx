import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRecipes } from '../hooks/useRecipes';
import type { RootStackParamList } from '../types/recipe';
import { colors, shared } from '../constants/theme';
import { RecipeCard } from '../components/RecipeCard';
import { CategoryPicker } from '../components/CategoryPicker';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
export function RecipeListScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Recipes'>) {
  const { recipes, loading, error, refresh } = useRecipes();
  const [categoryId, setCategoryId] = useState('all');
  const { width } = useWindowDimensions();
  const columns = width >= 700 ? 2 : 1;
  const visible = useMemo(
    () => recipes.filter((r) => categoryId === 'all' || r.categoryId === categoryId),
    [recipes, categoryId],
  );
  return (
    <SafeAreaView style={shared.page} edges={['top', 'left', 'right', 'bottom']}>
      <FlatList
        key={columns}
        numColumns={columns}
        data={visible}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        columnWrapperStyle={columns > 1 ? styles.row : undefined}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Text style={styles.brand}>
                savour<Text style={styles.brandDot}>.</Text>
              </Text>
              <Text style={styles.eyebrow}>YOUR RECIPE BOOK</Text>
            </View>
            <Text style={shared.title}>Good food.{'\n'}Kept close.</Text>
            <Text style={shared.muted}>Little favourites, worth making again.</Text>
            <View style={styles.sectionRow}>
              <Text style={shared.heading}>Your collection</Text>
              <Text style={shared.muted}>
                {visible.length} {visible.length === 1 ? 'recipe' : 'recipes'}
              </Text>
            </View>
            <CategoryPicker value={categoryId} onChange={setCategoryId} all />
            {error && (
              <View accessibilityRole="alert" style={styles.error}>
                <Text style={shared.error}>{error}</Text>
                <Button label="Retry loading" variant="secondary" onPress={() => void refresh()} />
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.cell, columns > 1 && styles.half]}>
            <RecipeCard
              recipe={item}
              onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
            />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              style={styles.loading}
              size="large"
              color={colors.primary}
              accessibilityLabel="Loading recipes"
            />
          ) : error ? undefined : (
            <EmptyState
              title={categoryId === 'all' ? 'A fresh page awaits' : 'Nothing here just yet'}
              message={
                categoryId === 'all'
                  ? 'Your favourite recipes belong here.'
                  : 'Try another category to find something delicious.'
              }
              actionLabel={categoryId !== 'all' ? 'Show all recipes' : undefined}
              onAction={() => setCategoryId('all')}
            />
          )
        }
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  list: { padding: 24, paddingBottom: 32, width: '100%', maxWidth: 1060, alignSelf: 'center' },
  header: { gap: 20, marginBottom: 24 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  brand: { fontSize: 38, fontWeight: '800', letterSpacing: -2, color: colors.primary },
  brandDot: { color: colors.accent },
  eyebrow: { color: colors.muted, fontSize: 10, letterSpacing: 2, fontWeight: '600' },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  row: { gap: 20 },
  cell: { marginBottom: 20 },
  half: { flex: 1, maxWidth: '49%' },
  loading: { margin: 40 },
  error: { gap: 12 },
});
