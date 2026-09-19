import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useVentures } from '../../src/hooks/useVentures';
import { EmptyState } from '../../src/components/EmptyState';
import { colors } from '../../src/lib/theme';

export default function VenturesScreen() {
  const router = useRouter();
  const [showArchived, setShowArchived] = useState(false);
  const { ventures, loading, refresh } = useVentures(showArchived);

  const visible = showArchived ? ventures : ventures.filter((v) => v.active);

  return (
    <View style={styles.container}>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Show archived</Text>
        <Switch value={showArchived} onValueChange={setShowArchived} />
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={visible.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        ListEmptyComponent={
          <EmptyState
            title="No ventures yet"
            message="Add a venture (e.g. DoorDash, Notary, IT Support) to start logging trips and expenses against it."
          />
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/venture/${item.id}`)}>
            <Text style={styles.name}>{item.name}</Text>
            {!item.active ? <Text style={styles.archivedBadge}>Archived</Text> : null}
          </Pressable>
        )}
      />

      <Pressable style={styles.fab} onPress={() => router.push('/venture/new')}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  toggleLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  archivedBadge: {
    fontSize: 12,
    color: colors.textMuted,
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '400',
  },
});
