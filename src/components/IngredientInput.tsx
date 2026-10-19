import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, shared } from '../constants/theme';
export interface IngredientInputProps {
  value: string;
  index: number;
  onChange: (value: string) => void;
  onRemove: () => void;
  disabled?: boolean;
}
export function IngredientInput({
  value,
  index,
  onChange,
  onRemove,
  disabled,
}: IngredientInputProps) {
  return (
    <View style={styles.row}>
      <TextInput
        accessibilityLabel={`Ingredient ${index + 1}`}
        placeholder="e.g. 2 tbsp olive oil"
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChange}
        editable={!disabled}
        multiline
        style={[shared.input, styles.input]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove ingredient ${index + 1}`}
        disabled={disabled}
        onPress={onRemove}
        style={styles.remove}
      >
        <Ionicons name="close-outline" size={24} color={colors.danger} />
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: { flex: 1 },
  remove: { minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
});
