import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { UrgencyLevel } from '@/types/deadline.types';
import { formatPaceDisplay } from '@/utils/paceCalculations';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

export interface ImpactPreviewData {
  format: 'physical' | 'eBook' | 'audio';
  thisBookPacePerDay: number;

  // Active books impact
  activeBookCount: number;
  activeTotalPacePerDay: number;
  activeWithThisPacePerDay: number;
  activeUrgency: UrgencyLevel;

  // Pending books scenario
  pendingBookCount: number;
  pendingTotalPacePerDay: number;
  pendingUrgency: UrgencyLevel;
}

interface ImpactPreviewSectionProps {
  impactData: ImpactPreviewData;
  mode: 'new' | 'edit';
}

const getUrgencyLabel = (urgency: UrgencyLevel): string | null => {
  if (!urgency) return null; // Hide label when unknown (no pace data)

  const labelMap: Record<string, string> = {
    good: 'Comfortable',
    approaching: 'Tight',
    urgent: 'Tight',
    overdue: 'Past due', // Deadline has passed
    impossible: 'Tough', // Still time but pace is very challenging
  };
  return labelMap[urgency] ?? null;
};

export const ImpactPreviewSection: React.FC<ImpactPreviewSectionProps> = ({
  impactData,
  mode,
}) => {
  const { colors } = useTheme();
  const [showPending, setShowPending] = useState(false);

  const {
    format,
    activeBookCount,
    activeWithThisPacePerDay,
    activeUrgency,
    pendingBookCount,
    pendingTotalPacePerDay,
    pendingUrgency,
  } = impactData;

  // Get urgency color from theme
  const getUrgencyThemeColor = (urgency: UrgencyLevel): string => {
    if (!urgency) return colors.textMuted;

    const colorMap: Record<string, string> = {
      good: colors.good,
      approaching: colors.approaching,
      urgent: colors.urgent,
      overdue: colors.overdue,
      impossible: colors.impossible,
    };
    return colorMap[urgency] ?? colors.textMuted;
  };

  const activeLabel = getUrgencyLabel(activeUrgency);
  const pendingLabel = getUrgencyLabel(pendingUrgency);
  const hasActiveUrgencyLevel = activeUrgency !== null;
  const hasPendingUrgencyLevel = pendingUrgency !== null;

  // Don't show if there's no meaningful data
  if (activeWithThisPacePerDay <= 0) {
    return null;
  }

  const bookCountLabel =
    mode === 'edit'
      ? `${activeBookCount} book${activeBookCount !== 1 ? 's' : ''} (includes this one)`
      : `${activeBookCount + 1} book${activeBookCount !== 0 ? 's' : ''}`;

  const pendingBookCountLabel = `+${pendingBookCount} pending book${pendingBookCount !== 1 ? 's' : ''}`;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <ThemedText
        typography="bodyMedium"
        color="secondary"
      >
        If you add this book:
      </ThemedText>

      {/* Active Books Row */}
      <View style={[styles.row, { borderBottomColor: colors.border }]}>
        <View>
          <ThemedText typography="titleMedium">With your active books</ThemedText>
          <ThemedText typography="bodySmall" color="textMuted">
            {bookCountLabel}
          </ThemedText>
        </View>
        <View style={styles.rightColumn}>
          <ThemedText
            typography="titleMediumPlus"
            style={{ color: getUrgencyThemeColor(activeUrgency) }}
          >
            {formatPaceDisplay(activeWithThisPacePerDay, format)}
          </ThemedText>
          {hasActiveUrgencyLevel && (
            <ThemedText
              typography="bodySmall"
              style={{ color: getUrgencyThemeColor(activeUrgency) }}
            >
              {activeLabel}
            </ThemedText>
          )}
        </View>
      </View>

      {/* Pending Toggle - only show if there are pending books */}
      {pendingBookCount > 0 && (
        <>
          <Pressable
            onPress={() => setShowPending(!showPending)}
            style={styles.expandButton}
            accessibilityRole="button"
            accessibilityState={{ expanded: showPending }}
            accessibilityLabel="Show impact if pending books start"
          >
            <ThemedText typography="bodyMedium" color="primary">
              What if my pending books start?
            </ThemedText>
            <IconSymbol
              name={showPending ? 'chevron.down' : 'chevron.right'}
              size={12}
              color={colors.primary}
            />
          </Pressable>

          {/* Pending Expanded Section */}
          {showPending && (
            <View style={styles.pendingRow}>
              <View>
                <ThemedText typography="titleMedium">
                  If all pending become active
                </ThemedText>
                <ThemedText typography="bodySmall" color="textMuted">
                  {pendingBookCountLabel}
                </ThemedText>
              </View>
              <View style={styles.rightColumn}>
                <ThemedText
                  typography="titleMediumPlus"
                  style={{ color: getUrgencyThemeColor(pendingUrgency) }}
                >
                  {formatPaceDisplay(pendingTotalPacePerDay, format)}
                </ThemedText>
                {hasPendingUrgencyLevel && (
                  <ThemedText
                    typography="bodySmall"
                    style={{ color: getUrgencyThemeColor(pendingUrgency) }}
                  >
                    {pendingLabel}
                  </ThemedText>
                )}
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  rightColumn: {
    alignItems: 'flex-end',
  },
  expandButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
  pendingRow: {
    paddingTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
