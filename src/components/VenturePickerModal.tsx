import { Modal, Pressable, StyleSheet, Text, View, FlatList } from 'react-native';
import type { Venture } from '../types/database';
import { colors } from '../lib/theme';

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
          <Text style={styles.title}>Move to venture</Text>
          <FlatList
            data={ventures}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isCurrent = item.id === currentVentureId;
              return (
                <Pressable
                  style={styles.row}
                  onPress={() => {
                    onSelect(item.id);
                    onClose();
                  }}
                >
                  <Text style={styles.rowText}>{item.name}</Text>
                  {isCurrent ? <Text style={styles.currentBadge}>Current</Text> : null}
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowText: {
    fontSize: 16,
    color: colors.text,
  },
  currentBadge: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.textMuted,
    fontWeight: '500',
  },
});
