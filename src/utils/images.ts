import { resolveImageUri } from '../services/recipeImages';
import type { ImageSourcePropType } from 'react-native';
const sampleImages: Record<string, ImageSourcePropType> = {
  'sample:avocado-toast': require('../../assets/images/avocado-toast.jpg'),
  'sample:summer-salad': require('../../assets/images/summer-salad.jpg'),
  'sample:tomato-pasta': require('../../assets/images/tomato-pasta.jpg'),
  'sample:berry-pancakes': require('../../assets/images/berry-pancakes.jpg'),
  'sample:chocolate-shake': require('../../assets/images/chocolate-shake.jpg'),
  'sample:iced-latte': require('../../assets/images/iced-latte.jpg'),
};
export function recipeImage(uri: string): ImageSourcePropType {
  return sampleImages[uri] ?? { uri: resolveImageUri(uri) };
}
