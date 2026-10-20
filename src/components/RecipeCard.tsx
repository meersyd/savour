import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Recipe } from '../types/recipe';
import categories from '../data/recipetypes.json';
import { colors } from '../constants/theme';
import { RecipeImage } from './RecipeImage';
export function RecipeCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const category = categories.find((c) => c.id === recipe.categoryId)?.name ?? recipe.categoryId;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${recipe.name}, ${category}, preparation ${recipe.prepTime} minutes. View recipe.`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
    >
      <RecipeImage uri={recipe.imageUri} label={recipe.name} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.category}>{category.toUpperCase()}</Text>
        <Text style={styles.title}>{recipe.name}</Text>
        <View style={styles.footer}>
          <Ionicons name="time-outline" size={16} color={colors.muted} />
          <Text style={styles.meta}>{recipe.prepTime} min prep</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.meta}>{recipe.servings} servings</Text>
        </View>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    backgroundColor: colors.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EAE7E0',
    shadowColor: '#383D2F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  image: { width: '100%', height: 160 },
  content: { padding: 18, gap: 10 },
  category: { fontSize: 11, fontWeight: '800', letterSpacing: 1.6, color: colors.primary },
  title: { fontSize: 21, lineHeight: 27, fontWeight: '600', color: colors.text },
  footer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  meta: { color: colors.muted, fontSize: 13 },
  dot: { color: colors.accent },
});
