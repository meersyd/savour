import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, shared } from '../constants/theme';
import { Button } from './Button';
interface Props {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}
export function EmptyState({ title, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Ionicons name="leaf-outline" size={36} color={colors.primary} />
      </View>
      <Text style={[shared.heading, styles.center]}>{title}</Text>
      <Text style={[shared.muted, styles.center]}>{message}</Text>
      {actionLabel && onAction && <Button label={actionLabel} onPress={onAction} />}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { padding: 32, gap: 16, alignItems: 'center' },
  icon: { padding: 24, borderRadius: 50, backgroundColor: colors.pale },
  center: { textAlign: 'center' },
});
