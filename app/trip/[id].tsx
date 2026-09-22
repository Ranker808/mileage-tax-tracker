import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TripForm } from '../../src/components/TripForm';
import { VenturePickerModal } from '../../src/components/VenturePickerModal';
import { fetchTrip, useTrips } from '../../src/hooks/useTrips';
import { useVentures } from '../../src/hooks/useVentures';
import { colors, radius, spacing } from '../../src/lib/theme';
import type { Trip } from '../../src/types/database';

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { updateTrip, deleteTrip, reassignVenture } = useTrips();
  const { ventures } = useVentures();
  const [trip, setTrip] = useState<Trip | null | undefined>(undefined);
  const [pickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchTrip(id).then(setTrip);
  }, [id]);

  if (trip === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (trip === null) {
    return (
      <View style={styles.center}>
        <Text>Trip not found.</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert('Delete trip?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await deleteTrip(trip.id);
          if (!error) router.back();
        },
      },
    ]);
  };

  const currentVenture = ventures.find((v) => v.id === trip.venture_id);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.quickBar}>
        <Pressable style={styles.reassignButton} onPress={() => setPickerVisible(true)}>
          <Ionicons name="swap-horizontal" size={16} color={colors.primary} />
          <Text style={styles.reassignText}>{currentVenture?.name ?? 'Unknown'} · tap to move</Text>
        </Pressable>
      </View>

      <TripForm
        initial={{
          date: trip.date,
          venture_id: trip.venture_id,
          start_location: trip.start_location,
          end_location: trip.end_location,
          business_purpose: trip.business_purpose,
          miles: String(trip.miles),
        }}
        submitLabel="Save Changes"
        onSubmit={async (values) => {
          const result = await updateTrip(trip.id, values);
          if (!result.error) router.back();
          return result;
        }}
      />

      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={16} color={colors.danger} />
        <Text style={styles.deleteText}>Delete Trip</Text>
      </Pressable>

      <VenturePickerModal
        visible={pickerVisible}
        ventures={ventures}
        currentVentureId={trip.venture_id}
        onSelect={async (ventureId) => {
          const { error } = await reassignVenture(trip.id, ventureId);
          if (!error) setTrip({ ...trip, venture_id: ventureId });
        }}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  reassignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.pill,
    paddingVertical: 9,
    paddingHorizontal: spacing.md,
  },
  reassignText: {
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 13,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: 32,
    paddingVertical: 14,
  },
  deleteText: {
    color: colors.danger,
    fontWeight: '700',
  },
});
