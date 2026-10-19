import App from '../App';
import { recipeStorage } from '../src/services/recipeStorage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { RecipeForm } from '../src/components/RecipeForm';
import { RecipeListScreen } from '../src/screens/RecipeListScreen';
import { RecipeDetailScreen } from '../src/screens/RecipeDetailScreen';
import { RecipeContext, type RecipesContextValue } from '../src/context/RecipeContext';
import type { RecipeFormValues, RootStackParamList } from '../src/types/recipe';
import samples from '../src/data/sampleRecipes.json';
import categories from '../src/data/recipetypes.json';

jest.mock('../src/services/recipeStorage', () => ({ recipeStorage: { load: jest.fn() } }));
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
const valid: RecipeFormValues = { ...samples[0], prepTime: '10', cookTime: '5', servings: '2' };
const navigation = { navigate: jest.fn(), popToTop: jest.fn() };
const listProps = {
  navigation,
  route: { key: 'Recipes', name: 'Recipes' },
} as unknown as NativeStackScreenProps<RootStackParamList, 'Recipes'>;
const detailProps = {
  navigation,
  route: { key: 'RecipeDetail', name: 'RecipeDetail', params: { recipeId: samples[0].id } },
} as unknown as NativeStackScreenProps<RootStackParamList, 'RecipeDetail'>;
function context(overrides: Partial<RecipesContextValue> = {}): RecipesContextValue {
  return {
    recipes: samples,
    loading: false,
    error: null,
    refresh: jest.fn(),
    createRecipe: jest.fn(),
    updateRecipe: jest.fn(),
    deleteRecipe: jest.fn(),
    ...overrides,
  };
}
function formProps() {
  return {
    initialValues: valid,
    editing: false,
    onSubmit: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined),
    onDirtyChange: jest.fn(),
    onBusyChange: jest.fn(),
    onInvalid: jest.fn(),
  };
}
beforeEach(() => jest.clearAllMocks());
describe('recipe browsing and deletion', () => {
  it('renders recipes, filters by JSON category, and navigates to details', async () => {
    await render(
      <RecipeContext.Provider value={context()}>
        <RecipeListScreen {...listProps} />
      </RecipeContext.Provider>,
    );
    expect(screen.getByText(samples[0].name)).toBeTruthy();
    await fireEvent(
      screen.getByLabelText('Filter recipes by category'),
      'valueChange',
      categories[1].id,
    );
    expect(screen.queryByText(samples[0].name)).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: new RegExp(samples[1].name) }));
    expect(navigation.navigate).toHaveBeenCalledWith('RecipeDetail', { recipeId: samples[1].id });
  });
  it('shows a useful empty state', async () => {
    await render(
      <RecipeContext.Provider value={context({ recipes: [] })}>
        <RecipeListScreen {...listProps} />
      </RecipeContext.Provider>,
    );
    expect(screen.getByText('A fresh page awaits')).toBeTruthy();
  });
  it('does not delete until the destructive confirmation is chosen', async () => {
    const deleteRecipe = jest.fn().mockResolvedValue(undefined);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await render(
      <RecipeContext.Provider value={context({ deleteRecipe })}>
        <RecipeDetailScreen {...detailProps} />
      </RecipeContext.Provider>,
    );
    expect(screen.getByText(samples[0].ingredients[0])).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Delete recipe' }));
    expect(deleteRecipe).not.toHaveBeenCalled();
    const buttons = alert.mock.calls[0][2];
    await act(async () => {
      buttons?.find((b) => b.style === 'destructive')?.onPress?.();
    });
    await waitFor(() => expect(deleteRecipe).toHaveBeenCalledWith(samples[0].id));
    expect(navigation.popToTop).toHaveBeenCalled();
    alert.mockRestore();
  });
  it('handles a previously removed recipe', async () => {
    await render(
      <RecipeContext.Provider value={context({ recipes: [] })}>
        <RecipeDetailScreen {...detailProps} />
      </RecipeContext.Provider>,
    );
    expect(screen.getByText('Recipe not found')).toBeTruthy();
  });
});
describe('shared recipe editor', () => {
  it('blocks invalid input and shows clear errors', async () => {
    const props = formProps();
    await render(<RecipeForm {...props} initialValues={{ ...valid, name: '', imageUri: '' }} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Save recipe' }));
    expect(props.onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Give your recipe a name.')).toBeTruthy();
    expect(screen.getByText('Choose a photo for your recipe.')).toBeTruthy();
  });
  it('edits, adds, removes, and reorders individual rows', async () => {
    const props = formProps();
    await render(<RecipeForm {...props} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Add ingredient' }));
    const index = valid.ingredients.length + 1;
    await fireEvent.changeText(screen.getByLabelText(`Ingredient ${index}`), 'Fresh basil');
    await fireEvent.press(screen.getByRole('button', { name: 'Remove ingredient 1' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Move step 2 up' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save recipe' }));
    expect(props.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        ingredients: [...valid.ingredients.slice(1), 'Fresh basil'],
        steps: [valid.steps[1], valid.steps[0], ...valid.steps.slice(2)],
      }),
    );
  });
  it('prevents duplicate submissions while persistence is pending', async () => {
    let finish: () => void = () => undefined;
    const props = formProps();
    props.onSubmit.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    await render(<RecipeForm {...props} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Save recipe' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Saving your recipe…' }));
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
    await act(async () => finish());
  });
  it('replaces an image with a gallery selection', async () => {
    jest
      .mocked(ImagePicker.requestMediaLibraryPermissionsAsync)
      .mockResolvedValue({ granted: true } as ImagePicker.MediaLibraryPermissionResponse);
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///cache/new.jpg', width: 100, height: 100 }],
    });
    const props = formProps();
    await render(<RecipeForm {...props} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Change photo' }));
    await waitFor(() => expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled());
    await fireEvent.press(screen.getByRole('button', { name: 'Save recipe' }));
    expect(props.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ imageUri: 'file:///cache/new.jpg' }),
    );
  });
  it('shows persistence errors and allows a retry', async () => {
    const props = formProps();
    props.onSubmit.mockRejectedValueOnce(new Error('Disk full'));
    await render(<RecipeForm {...props} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Save recipe' }));
    expect(await screen.findByText('Disk full')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Save recipe' }));
    expect(props.onSubmit).toHaveBeenCalledTimes(2);
  });
});

describe('application shell', () => {
  it('initializes the provider and opens a recipe through the native stack', async () => {
    jest.mocked(recipeStorage.load).mockResolvedValue(samples);
    await render(<App />);
    await screen.findByText(samples[0].name);
    await fireEvent.press(screen.getByRole('button', { name: new RegExp(samples[0].name) }));
    await screen.findByText('Let’s make it');
    expect(screen.getByText(samples[0].ingredients[0])).toBeTruthy();
  });
});
