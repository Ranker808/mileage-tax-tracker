import { Modal, Pressable, StyleSheet, Text, View, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Venture } from '../types/database';
import { colors, radius, spacing, type, ventureAccent } from '../lib/theme';

interface Props {
  visible: boolean;
  ventures: Venture[];
  currentVentureId: string;
  onSelect: (ventureId: string) => void;
  onClose: () => void;
}

/** One-tap venture reassignment: tapping a row selects it and closes immediately. */
export function VenturePickerModal({ visible, ventures, currentVentureId, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Move to venture</Text>
          <FlatList
            data={ventures}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isCurrent = item.id === currentVentureId;
              const accent = ventureAccent(item.name);
              return (
                <Pressable
                  style={styles.row}
                  onPress={() => {
                    onSelect(item.id);
                    onClose();
                  }}
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.dot, { backgroundColor: accent.fg }]} />
                    <Text style={styles.rowText}>{item.name}</Text>
                  </View>
                  {isCurrent ? (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                  )}
                </Pressable>
              );
            }}
          />
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,25,23,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  title: {
    ...type.headline,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  rowText: {
    ...type.body,
    fontSize: 16,
  },
  currentBadge: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  currentBadgeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: spacing.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
});
