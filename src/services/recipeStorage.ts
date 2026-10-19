import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { RecipeRepository } from './recipeRepository';
export const recipeStorage = new RecipeRepository(AsyncStorage, randomUUID);
