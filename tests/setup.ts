import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';
jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);
jest.mock('@expo/vector-icons/Ionicons', () => 'Icon');
jest.mock('../src/utils/images', () => ({ recipeImage: (uri: string) => ({ uri }) }));
