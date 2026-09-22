import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVentures } from '../../src/hooks/useVentures';
import { EmptyState } from '../../src/components/EmptyState';
import { colors, radius, shadow, shadowSm, spacing, type, ventureAccent } from '../../src/lib/theme';

export default function VenturesScreen() {
  const router = useRouter();
  const [showArchived, setShowArchived] = useState(false);
  const { ventures, loading, refresh } = useVentures(showArchived);

  const visible = showArchived ? ventures : ventures.filter((v) => v.active);

  return (
    <View style={styles.container}>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Show archived</Text>
        <Switch
          value={showArchived}
          onValueChange={setShowArchived}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={visible.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="briefcase-outline"
            title="No ventures yet"
            message="Add a venture (e.g. DoorDash, Notary, IT Support) to start logging trips and expenses against it."
          />
        }
        renderItem={({ item }) => {
          const accent = ventureAccent(item.name);
          return (
            <Pressable style={styles.card} onPress={() => router.push(`/venture/${item.id}`)}>
              <View style={[styles.avatar, { backgroundColor: accent.bg }]}>
                <Text style={[styles.avatarLetter, { color: accent.fg }]}>{item.name[0]?.toUpperCase()}</Text>
              </View>
              <View style={styles.cardMain}>
                <Text style={styles.name}>{item.name}</Text>
                {!item.active ? <Text style={styles.archivedLabel}>Archived</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </Pressable>
          );
        }}
      />

      <Pressable style={styles.fab} onPress={() => router.push('/venture/new')}>
        <Ionicons name="add" size={28} color={colors.white} />
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 4,
  },
  toggleLabel: {
    ...type.body,
    color: colors.textMuted,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.lg,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadowSm,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 17,
    fontWeight: '800',
  },
  cardMain: {
    flex: 1,
  },
  name: {
    ...type.headline,
  },
  archivedLabel: {
    fontSize: 12,
    color: colors.textFaint,
    marginTop: 2,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 58,
    height: 58,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
});
