import { useState } from 'react';
import { Image, View, Text, StyleSheet, type StyleProp, type ImageStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { recipeImage } from '../utils/images';
export function RecipeImage({
  uri,
  label,
  style,
}: {
  uri: string;
  label: string;
  style?: StyleProp<ImageStyle>;
}) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  if (!uri || failedUri === uri)
    return (
      <View accessibilityLabel={`${label}: photo unavailable`} style={[style, styles.fallback]}>
        <Ionicons name="restaurant-outline" color={colors.primary} size={32} />
        <Text style={styles.text}>Photo unavailable</Text>
      </View>
    );
  return (
    <Image
      source={recipeImage(uri)}
      accessibilityLabel={label}
      style={style}
      resizeMode="cover"
      onError={() => setFailedUri(uri)}
    />
  );
}
const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pale,
    gap: 8,
  },
  text: { color: colors.primary, fontSize: 14 },
});
