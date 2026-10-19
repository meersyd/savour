import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Keyboard,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { FormErrors, RecipeFormValues, RecipeInput } from '../types/recipe';
import { colors, shared } from '../constants/theme';
import { validateRecipe, toRecipeInput } from '../utils/validation';
import { Button } from './Button';
import { CategoryPicker } from './CategoryPicker';
import { RecipeImage } from './RecipeImage';
import { IngredientInput } from './IngredientInput';
import { StepInput } from './StepInput';
interface Props {
  initialValues: RecipeFormValues;
  editing: boolean;
  onSubmit: (input: RecipeInput) => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
  onBusyChange: (busy: boolean) => void;
  onInvalid: () => void;
}
export function RecipeForm({
  initialValues,
  editing,
  onSubmit,
  onDirtyChange,
  onBusyChange,
  onInvalid,
}: Props) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);
  const submitting = useRef(false);
  const initial = useRef(JSON.stringify(initialValues));
  const counter = useRef(0);
  const [ingredientKeys, setIngredientKeys] = useState(() =>
    initialValues.ingredients.map((_, index) => `initial-ingredient-${index}`),
  );
  const [stepKeys, setStepKeys] = useState(() =>
    initialValues.steps.map((_, index) => `initial-step-${index}`),
  );
  useEffect(
    () => onDirtyChange(JSON.stringify(values) !== initial.current),
    [values, onDirtyChange],
  );
  function change<K extends keyof RecipeFormValues>(field: K, value: RecipeFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }
  async function chooseImage() {
    if (picking || submitting.current) return;
    setPicking(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Photo access needed',
          'Allow photo access in Settings to add a recipe image.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open settings',
              onPress: () => {
                void Linking.openSettings().catch(() =>
                  Alert.alert(
                    'Unable to open Settings',
                    'Open your device Settings and allow photo access for Savour.',
                  ),
                );
              },
            },
          ],
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) change('imageUri', result.assets[0].uri);
    } catch (cause) {
      Alert.alert(
        'Could not open photos',
        cause instanceof Error ? cause.message : 'Please try again.',
      );
    } finally {
      setPicking(false);
    }
  }
  async function submit() {
    if (submitting.current || picking) return;
    const validation = validateRecipe(values);
    setErrors(validation);
    if (Object.keys(validation).length) {
      onInvalid();
      AccessibilityInfo.announceForAccessibility('Please check the highlighted fields.');
      return;
    }
    submitting.current = true;
    setSaving(true);
    onBusyChange(true);
    setSaveError(null);
    Keyboard.dismiss();
    try {
      await onSubmit(toRecipeInput(values));
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Unable to save. Please try again.');
      onInvalid();
    } finally {
      submitting.current = false;
      setSaving(false);
      onBusyChange(false);
    }
  }
  const busy = saving || picking;
  function field(
    label: string,
    name: 'name' | 'description' | 'prepTime' | 'cookTime' | 'servings',
    placeholder: string,
    numeric = false,
  ) {
    return (
      <View style={styles.field}>
        <Text style={shared.label}>{label}</Text>
        <TextInput
          accessibilityLabel={label}
          value={values[name]}
          onChangeText={(value) => change(name, value)}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={numeric ? 'number-pad' : 'default'}
          multiline={name === 'description'}
          maxLength={name === 'name' ? 100 : name === 'description' ? 2000 : 3}
          editable={!busy}
          style={[
            shared.input,
            name === 'description' && styles.description,
            errors[name] && styles.invalid,
          ]}
        />
        {errors[name] && (
          <Text accessibilityRole="alert" style={shared.error}>
            {errors[name]}
          </Text>
        )}
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {Object.values(errors).some(Boolean) && (
        <Text accessibilityRole="alert" style={styles.errorBanner}>
          A few details need your attention. Check the fields below.
        </Text>
      )}
      {saveError && (
        <Text accessibilityRole="alert" style={styles.errorBanner}>
          {saveError}
        </Text>
      )}
      <View>
        <Text style={shared.label}>Recipe photo *</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={values.imageUri ? 'Change recipe photo' : 'Choose recipe photo'}
          disabled={busy}
          onPress={() => void chooseImage()}
          style={styles.photo}
        >
          {values.imageUri ? (
            <RecipeImage
              uri={values.imageUri}
              label="Selected recipe photo"
              style={styles.preview}
            />
          ) : (
            <View style={styles.photoPrompt}>
              <Ionicons name="camera-outline" size={32} color={colors.primary} />
              <Text style={styles.photoTitle}>Give it a delicious first impression</Text>
              <Text style={shared.muted}>Choose a photo from your gallery</Text>
            </View>
          )}
        </Pressable>
        {values.imageUri ? (
          <Button
            label="Change photo"
            icon="image-outline"
            variant="secondary"
            disabled={busy}
            onPress={() => void chooseImage()}
          />
        ) : null}
        {picking && <Text style={shared.muted}>Opening your photos…</Text>}
        {errors.imageUri && <Text style={shared.error}>{errors.imageUri}</Text>}
      </View>
      {field('Recipe name *', 'name', 'e.g. Mum’s Sunday pasta')}
      <View>
        <Text style={shared.label}>Category *</Text>
        <CategoryPicker
          value={values.categoryId}
          onChange={(value) => change('categoryId', value)}
          enabled={!busy}
        />
        {errors.categoryId && <Text style={shared.error}>{errors.categoryId}</Text>}
      </View>
      {field(
        'A little about this recipe',
        'description',
        'The story, the flavour, or what makes it special…',
      )}
      <View style={styles.numbers}>
        {field('Prep (min) *', 'prepTime', '10', true)}
        {field('Cook (min) *', 'cookTime', '20', true)}
        {field('Servings *', 'servings', '2', true)}
      </View>
      <View style={styles.section}>
        <Text style={shared.heading}>Ingredients *</Text>
        <Text style={shared.muted}>One ingredient per line, including the amount.</Text>
        {values.ingredients.map((value, index) => (
          <IngredientInput
            key={ingredientKeys[index]}
            value={value}
            index={index}
            disabled={busy}
            onChange={(text) =>
              change(
                'ingredients',
                values.ingredients.map((s, i) => (i === index ? text : s)),
              )
            }
            onRemove={() => {
              change(
                'ingredients',
                values.ingredients.filter((_, i) => i !== index),
              );
              setIngredientKeys((keys) => keys.filter((_, i) => i !== index));
            }}
          />
        ))}
        {errors.ingredients && <Text style={shared.error}>{errors.ingredients}</Text>}
        <Button
          label="Add ingredient"
          icon="add"
          variant="secondary"
          disabled={busy}
          onPress={() => {
            change('ingredients', [...values.ingredients, '']);
            setIngredientKeys((keys) => [...keys, `ingredient-${counter.current++}`]);
          }}
        />
      </View>
      <View style={styles.section}>
        <Text style={shared.heading}>Cooking steps *</Text>
        <Text style={shared.muted}>Make it easy to follow. Use the arrows to reorder.</Text>
        {values.steps.map((value, index) => (
          <StepInput
            key={stepKeys[index]}
            value={value}
            index={index}
            count={values.steps.length}
            disabled={busy}
            onChange={(text) =>
              change(
                'steps',
                values.steps.map((s, i) => (i === index ? text : s)),
              )
            }
            onRemove={() => {
              change(
                'steps',
                values.steps.filter((_, i) => i !== index),
              );
              setStepKeys((keys) => keys.filter((_, i) => i !== index));
            }}
            onMove={(direction) => {
              const next = [...values.steps];
              const keys = [...stepKeys];
              const target = index + direction;
              [next[index], next[target]] = [next[target], next[index]];
              [keys[index], keys[target]] = [keys[target], keys[index]];
              change('steps', next);
              setStepKeys(keys);
            }}
          />
        ))}
        {errors.steps && <Text style={shared.error}>{errors.steps}</Text>}
        <Button
          label="Add step"
          icon="add"
          variant="secondary"
          disabled={busy}
          onPress={() => {
            change('steps', [...values.steps, '']);
            setStepKeys((keys) => [...keys, `step-${counter.current++}`]);
          }}
        />
      </View>
      <Text style={shared.muted}>* Required fields · Saved on this device</Text>
      <Button
        label={saving ? 'Saving your recipe…' : editing ? 'Save changes' : 'Save recipe'}
        icon="checkmark"
        loading={saving}
        disabled={picking}
        onPress={() => void submit()}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 24 },
  field: { flexGrow: 1, flexBasis: 100 },
  description: { minHeight: 100, textAlignVertical: 'top' },
  invalid: { borderColor: colors.danger },
  errorBanner: {
    backgroundColor: '#F7E8E2',
    color: colors.danger,
    padding: 16,
    borderRadius: 12,
    lineHeight: 22,
  },
  photo: { borderRadius: 18, overflow: 'hidden', backgroundColor: colors.pale, marginBottom: 12 },
  preview: { width: '100%', aspectRatio: 1.6 },
  photoPrompt: {
    padding: 28,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  photoTitle: { fontSize: 16, color: colors.primary, fontWeight: '600', textAlign: 'center' },
  numbers: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  section: { gap: 12 },
});
