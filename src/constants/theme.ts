import { StyleSheet } from 'react-native';
export const colors = {
  background: '#FAF8F5',
  primary: '#46543C',
  accent: '#C97755',
  text: '#252525',
  muted: '#68675F',
  card: '#FFFFFF',
  border: '#DEDCD3',
  pale: '#ECEFE6',
  danger: '#A3362D',
};
export const shared = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, gap: 20, width: '100%', maxWidth: 760, alignSelf: 'center' },
  title: { fontSize: 32, fontWeight: '700', color: colors.text, letterSpacing: -1 },
  heading: { fontSize: 22, fontWeight: '700', color: colors.text },
  body: { fontSize: 16, lineHeight: 25, color: colors.text },
  muted: { fontSize: 14, lineHeight: 22, color: colors.muted },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
    minHeight: 50,
  },
  error: { color: colors.danger, fontSize: 14, lineHeight: 21, marginTop: 6 },
});
