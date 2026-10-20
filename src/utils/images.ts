import { resolveImageUri } from '../services/recipeImages';
import type { ImageSourcePropType } from 'react-native';
const sampleImages: Record<string, ImageSourcePropType> = {
  'sample:nasi-lemak': require('../../assets/images/nasi-lemak.jpeg'),
  'sample:nasi-ayam': require('../../assets/images/nasi-ayam.jpeg'),
  'sample:char-kuey-teow': require('../../assets/images/char-kuey-teow.jpeg'),
  'sample:kuih-seri-muka': require('../../assets/images/kuih-seri-muka.jpeg'),
  'sample:cucur-udang': require('../../assets/images/cucur-udang.jpeg'),
  'sample:teh-tarik': require('../../assets/images/teh-tarik.jpeg'),
};
export function recipeImage(uri: string): ImageSourcePropType | undefined {
  if (!uri) return undefined;
  if (uri.startsWith('sample:')) return sampleImages[uri];
  return { uri: resolveImageUri(uri) };
}
