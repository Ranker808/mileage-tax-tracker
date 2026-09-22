import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '../lib/theme';

export interface BarChartItem {
  label: string;
  value: number;
  displayValue: string;
}

interface Props {
  items: BarChartItem[];
  orientation: 'vertical' | 'horizontal';
  barColor?: string;
  emptyMessage: string;
}

const VERTICAL_TRACK_HEIGHT = 110;

/** A small, dependency-free bar chart -- plain Views sized proportionally
 * to the max value, no charting library. Keeps Reports usable in Expo Go
 * without a native charting dependency. */
export function BarChart({ items, orientation, barColor = colors.primary, emptyMessage }: Props) {
  if (items.length === 0) {
    return <Text style={styles.empty}>{emptyMessage}</Text>;
  }

  const max = Math.max(...items.map((i) => i.value), 0.01);

  if (orientation === 'horizontal') {
    return (
      <View style={styles.hContainer}>
        {items.map((item) => (
          <View key={item.label} style={styles.hRow}>
            <Text style={styles.hLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <View style={styles.hTrack}>
              <View
                style={[
                  styles.hBar,
                  { width: `${Math.max((item.value / max) * 100, 4)}%`, backgroundColor: barColor },
                ]}
              />
            </View>
            <Text style={styles.hValue}>{item.displayValue}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.vContainer}>
      {items.map((item) => (
        <View key={item.label} style={styles.vColumn}>
          <Text style={styles.vValue} numberOfLines={1}>
            {item.displayValue}
          </Text>
          <View style={styles.vTrackWrap}>
            <View
              style={[
                styles.vBar,
                { height: Math.max((item.value / max) * VERTICAL_TRACK_HEIGHT, 4), backgroundColor: barColor },
              ]}
            />
          </View>
          <Text style={styles.vLabel} numberOfLines={1}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    ...type.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  // vertical (monthly trend)
  vContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  vColumn: {
    flex: 1,
    alignItems: 'center',
  },
  vValue: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
  },
  vTrackWrap: {
    width: '100%',
    height: VERTICAL_TRACK_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  vBar: {
    width: '60%',
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  vLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
    fontWeight: '600',
  },
  // horizontal (category breakdown)
  hContainer: {
    gap: spacing.sm,
  },
  hRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hLabel: {
    width: 110,
    fontSize: 12,
    color: colors.ink,
    fontWeight: '600',
  },
  hTrack: {
    flex: 1,
    height: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  hBar: {
    height: '100%',
    borderRadius: radius.sm,
  },
  hValue: {
    width: 62,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
  },
});
