import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Venture } from '../types/database';
import { colors, radius, spacing, ventureAccent } from '../lib/theme';

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
        const accent = ventureAccent(venture.name);
        return (
          <Pressable
            key={venture.id}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => onSelect(venture.id)}
          >
            {!selected ? <View style={[styles.dot, { backgroundColor: accent.fg }]} /> : null}
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{venture.name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  chipText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13.5,
  },
  chipTextSelected: {
    color: colors.white,
  },
});
