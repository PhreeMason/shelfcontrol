import LinearProgressBar from '@/components/shared/LinearProgressBar';
import { ThemedText } from '@/components/themed';
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import { STATS_CONSTANTS } from '@/constants/statsConstants';
import { useTheme } from '@/hooks/useTheme';
import { WeeklyStats } from '@/types/stats.types';
import {
  formatAheadBehindText,
  getAheadBehindLabel,
  getWeeklyStatusColors,
} from '@/utils/statsUtils';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * Gets the icon name for the status indicator
 * @param status - The overall status
 * @returns Icon name for the status
 */
const getStatusIcon = (status: 'ahead' | 'onTrack' | 'behind'): IconSymbolName => {
  if (status === 'ahead') return 'checkmark';
  if (status === 'onTrack') return 'arrow.up.right';
  return 'exclamationmark.triangle';
};

/**
 * Gets the accessibility label for the status icon
 * @param status - The overall status
 * @returns Descriptive text for screen readers
 */
const getStatusIconLabel = (status: 'ahead' | 'onTrack' | 'behind'): string => {
  if (status === 'ahead') return 'Ahead of pace';
  if (status === 'onTrack') return 'On track';
  return 'More to go';
};

/**
 * Props for WeeklyStatsCard component
 */
interface WeeklyStatsCardProps {
  /** Weekly statistics data */
  stats: WeeklyStats;
  /** Type of stats ('reading' for pages, 'listening' for audio time) */
  type: 'reading' | 'listening';
  /** Label for the card header */
  headerLabel: string;
  /** Label for units read (e.g., 'read', 'listened') */
  unitsReadLabel: string;
  /** Label for units needed (e.g., 'needed') */
  unitsNeededLabel: string;
  /** Label for average activity (e.g., 'Reading', 'Listening') */
  averageActivityLabel: string;
  /** Label for daily activity (e.g., 'Read', 'Listened') */
  daysActivityLabel: string;
  /** Function to format unit values (pages or time) */
  formatValue: (value: number) => string;
}

/**
 * WeeklyStatsCard - Shared base component for weekly reading and listening statistics
 *
 * This component provides a consistent layout and behavior for displaying weekly
 * progress statistics. It shows:
 * - Total units read this week vs needed
 * - Ahead/behind status with color coding
 * - Progress percentage bar
 * - Average daily pace and required pace
 * - Days active this week
 *
 * @component
 * @example
 * ```tsx
 * <WeeklyStatsCard
 *   stats={weeklyReadingStats}
 *   type="reading"
 *   headerLabel="Books This Week"
 *   unitsReadLabel="read"
 *   unitsNeededLabel="needed"
 *   averageActivityLabel="Reading"
 *   daysActivityLabel="Read"
 *   formatValue={(value) => `${value} pages`}
 * />
 * ```
 */
export function WeeklyStatsCard({
  stats,
  headerLabel,
  unitsReadLabel,
  unitsNeededLabel,
  averageActivityLabel,
  daysActivityLabel,
  formatValue,
}: WeeklyStatsCardProps) {
  const { colors } = useTheme();

  // Memoize status colors to avoid recalculation on every render
  const statusColors = useMemo(
    () => getWeeklyStatusColors(stats.overallStatus, colors),
    [stats.overallStatus, colors]
  );

  // Memoize formatted ahead/behind text
  const aheadBehindText = useMemo(
    () => formatAheadBehindText(stats.unitsAheadBehind, formatValue),
    [stats.unitsAheadBehind, formatValue]
  );

  // Memoize ahead/behind label
  const aheadBehindLabel = useMemo(
    () => getAheadBehindLabel(stats.unitsAheadBehind),
    [stats.unitsAheadBehind]
  );

  // Memoize comprehensive accessibility label
  // NOTE: Uses raw numbers for screen readers, not abbreviated versions
  const accessibilityLabel = useMemo(() => {
    const baseStatus = `${headerLabel}: ${stats.unitsReadThisWeek} ${unitsReadLabel} out of ${stats.unitsNeededThisWeek} ${unitsNeededLabel}`;
    const statusDetail = `You are ${Math.abs(stats.unitsAheadBehind)} ${aheadBehindLabel}, at ${stats.progressPercentage}% of your weekly goal`;
    const activityDetail = `Active ${stats.daysWithActivity} out of ${stats.daysElapsedThisWeek} days this week`;
    const paceDetail = `Averaging ${stats.averagePerDay} per day`;

    return `${baseStatus}. ${statusDetail}. ${activityDetail}. ${paceDetail}.`;
  }, [
    headerLabel,
    stats.unitsReadThisWeek,
    stats.unitsNeededThisWeek,
    stats.unitsAheadBehind,
    stats.progressPercentage,
    stats.daysWithActivity,
    stats.daysElapsedThisWeek,
    stats.averagePerDay,
    unitsReadLabel,
    unitsNeededLabel,
    aheadBehindLabel,
  ]);

  // Don't render if there's no activity
  if (
    stats.unitsReadThisWeek === 0 &&
    stats.unitsNeededThisWeek === 0 &&
    stats.daysWithActivity === 0
  ) {
    return null;
  }

  // Create dynamic styles with theme colors
  const dynamicStyles = {
    container: {
      backgroundColor: statusColors.background,
      borderColor: statusColors.border,
    },
    detailsSection: {
      borderTopColor: colors.border,
    },
    bullet: {
      color: colors.textMuted,
    },
  };

  const statusIcon = getStatusIcon(stats.overallStatus)

  return (
    <View
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel}
      style={[styles.container, dynamicStyles.container]}
    >
      <View style={styles.content}>
        <ThemedText style={styles.label}>{headerLabel}</ThemedText>

        {/* Big Numbers Section */}
        <View style={styles.numbersSection}>
          <View style={styles.numberRow}>
            <ThemedText
              style={[styles.bigNumber, { color: statusColors.text }]}
            >
              {formatValue(stats.unitsReadThisWeek)}
            </ThemedText>
            <ThemedText style={styles.numberLabel}>{unitsReadLabel}</ThemedText>
          </View>

          <View style={styles.numberRow}>
            <ThemedText style={styles.mediumNumber}>
              {formatValue(stats.unitsNeededThisWeek)}
            </ThemedText>
            <ThemedText style={styles.numberLabel}>
              {unitsNeededLabel}
            </ThemedText>
          </View>

          <View style={styles.numberRow}>
            <ThemedText
              style={[styles.aheadBehindNumber, { color: statusColors.text }]}
            >
              {aheadBehindText}
            </ThemedText>
            <View style={styles.statusLabelContainer}>
              {statusIcon !== "exclamationmark.triangle" ? <IconSymbol
                name={getStatusIcon(stats.overallStatus)}
                size={18}
                color={statusColors.text}
                accessibilityLabel={getStatusIconLabel(stats.overallStatus)}
              /> : null}
              <ThemedText
                style={[styles.numberLabel, { color: statusColors.text }]}
              >
                {aheadBehindLabel}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <LinearProgressBar
            progressPercentage={stats.progressPercentage}
            gradientColors={[
              statusColors.progressBar,
              statusColors.progressBar,
            ]}
            height={STATS_CONSTANTS.PROGRESS_BAR_HEIGHT}
          />
          <ThemedText
            style={[
              styles.percentageText,
              { color: statusColors.text, alignSelf: 'flex-end' },
            ]}
          >
            {stats.progressPercentage}%
          </ThemedText>
        </View>

        {/* Breakdown Details */}
        <View style={[styles.detailsSection, dynamicStyles.detailsSection]}>
          <View style={styles.detailRow}>
            <ThemedText style={[styles.bullet, dynamicStyles.bullet]}>
              •
            </ThemedText>
            <ThemedText style={styles.detailText}>
              {averageActivityLabel}{' '}
              <ThemedText style={styles.detailBold}>
                {formatValue(stats.averagePerDay)}/day
              </ThemedText>{' '}
              average
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={[styles.bullet, dynamicStyles.bullet]}>
              •
            </ThemedText>
            <ThemedText style={styles.detailText}>
              {daysActivityLabel}{' '}
              <ThemedText style={styles.detailBold}>
                {stats.daysWithActivity} out of {stats.daysElapsedThisWeek} days
              </ThemedText>{' '}
              this week
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 20,
    marginBottom: 16,
  },
  content: {
    gap: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  numbersSection: {
    gap: 5,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  bigNumber: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
  },
  mediumNumber: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 30,
  },
  aheadBehindNumber: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  numberLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressSection: {
    gap: 8,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 4,
  },
  detailsSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  detailBold: {
    fontWeight: 'bold',
  },
});
