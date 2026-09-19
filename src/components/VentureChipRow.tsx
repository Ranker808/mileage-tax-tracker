import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import type { Venture } from '../types/database';
import { colors } from '../lib/theme';

interface Props {
  ventures: Venture[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  includeAllOption?: boolean;
  onSelectAll?: () => void;
}

export function VentureChipRow({ ventures, selectedId, onSelect, includeAllOption, onSelectAll }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {includeAllOption ? (
        <Pressable
          style={[styles.chip, selectedId === null && styles.chipSelected]}
          onPress={onSelectAll}
        >
          <Text style={[styles.chipText, selectedId === null && styles.chipTextSelected]}>All</Text>
        </Pressable>
      ) : null}
      {ventures.map((venture) => {
        const selected = venture.id === selectedId;
        return (
          <Pressable
            key={venture.id}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => onSelect(venture.id)}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{venture.name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
  },
});
