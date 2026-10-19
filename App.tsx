import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RecipeProvider } from './src/context/RecipeContext';
import { AppNavigator } from './src/navigation/AppNavigator';
export default function App() {
  return (
    <SafeAreaProvider>
      <RecipeProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </RecipeProvider>
    </SafeAreaProvider>
  );
}
