import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
