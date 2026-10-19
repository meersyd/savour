import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, shared } from '../constants/theme';
interface Props {
  value: string;
  index: number;
  count: number;
  onChange: (value: string) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  disabled?: boolean;
}
export function StepInput({ value, index, count, onChange, onRemove, onMove, disabled }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>STEP {String(index + 1).padStart(2, '0')}</Text>
        <View style={styles.controls}>
          {([-1, 1] as const).map((direction) => {
            const unavailable = disabled || (direction === -1 ? index === 0 : index === count - 1);
            return (
              <Pressable
                key={direction}
                accessibilityRole="button"
                accessibilityLabel={`Move step ${index + 1} ${direction === -1 ? 'up' : 'down'}`}
                accessibilityState={{ disabled: unavailable }}
                disabled={unavailable}
                onPress={() => onMove(direction)}
                style={[styles.control, unavailable && styles.disabled]}
              >
                <Ionicons
                  name={direction === -1 ? 'arrow-up' : 'arrow-down'}
                  size={19}
                  color={colors.primary}
                />
              </Pressable>
            );
          })}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove step ${index + 1}`}
            disabled={disabled}
            onPress={onRemove}
            style={styles.control}
          >
            <Ionicons name="close-outline" size={24} color={colors.danger} />
          </Pressable>
        </View>
      </View>
      <TextInput
        accessibilityLabel={`Cooking step ${index + 1}`}
        placeholder="What happens next?"
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChange}
        editable={!disabled}
        multiline
        textAlignVertical="top"
        style={[shared.input, styles.input]}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: colors.primary, fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  controls: { flexDirection: 'row' },
  control: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.25 },
  input: { minHeight: 100 },
});
