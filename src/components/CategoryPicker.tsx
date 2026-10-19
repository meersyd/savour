import { Picker } from '@react-native-picker/picker';
import { StyleSheet, View } from 'react-native';
import categories from '../data/recipetypes.json';
import { colors } from '../constants/theme';
export function CategoryPicker({
  value,
  onChange,
  all = false,
  enabled = true,
}: {
  value: string;
  onChange: (value: string) => void;
  all?: boolean;
  enabled?: boolean;
}) {
  return (
    <View style={styles.container}>
      <Picker
        accessibilityLabel={all ? 'Filter recipes by category' : 'Recipe category, required'}
        selectedValue={value}
        onValueChange={onChange}
        enabled={enabled}
        style={styles.picker}
        itemStyle={styles.item}
      >
        {all ? (
          <Picker.Item label="All Recipes" value="all" />
        ) : (
          <Picker.Item label="Choose a category" value="" />
        )}
        {categories.map((c) => (
          <Picker.Item key={c.id} label={c.name} value={c.id} />
        ))}
      </Picker>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  picker: { color: colors.text },
  item: { fontSize: 16, height: 110 },
});
