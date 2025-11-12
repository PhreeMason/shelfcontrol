import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme, useThemedStyles } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * Pace data for reading or listening activities
 *
 * @property {number} averagePace - Average pages/day for reading or minutes/day for listening
 * @property {boolean} isReliable - Whether the pace calculation is based on sufficient data
 * @property {number} [readingDaysCount] - Optional number of reading days used in calculation
 * @property {number} [listeningDaysCount] - Optional number of listening days used in calculation
 *
 * @example
 * const paceData: PaceData = {
 *   averagePace: 25.5,
 *   isReliable: true,
 *   readingDaysCount: 10
 * };
 */
export interface PaceData {
  averagePace: number;
  isReliable: boolean;
  readingDaysCount?: number;
  listeningDaysCount?: number;
}

/**
 * Props for the ReadingPaceSection component
 *
 * @property {PaceData} readingPaceData - Pace data for reading activities
 * @property {PaceData} listeningPaceData - Pace data for listening activities
 * @property {function} formatPaceForFormat - Function to format pace based on media type
 *
 * @example
 * <ReadingPaceSection
 *   readingPaceData={{ averagePace: 25, isReliable: true, readingDaysCount: 10 }}
 *   listeningPaceData={{ averagePace: 45, isReliable: true, listeningDaysCount: 8 }}
 *   formatPaceForFormat={(pace, format) => `${pace} ${format === 'audio' ? 'min/day' : 'pages/day'}`}
 * />
 */
export interface ReadingPaceSectionProps {
  readingPaceData: PaceData;
  listeningPaceData: PaceData;
  formatPaceForFormat: (
    pace: number,
    format: 'audio' | 'physical' | 'eBook'
  ) => string;
}

/**
 * Displays reading and listening pace statistics in a side-by-side layout
 *
 * Shows average pages per day for reading and minutes per day for listening,
 * based on recent activity. Includes visual indicators and data point counts.
 *
 * @param {ReadingPaceSectionProps} props - Component props
 * @returns {JSX.Element} Rendered reading pace section
 *
 * @example
 * <ReadingPaceSection
 *   readingPaceData={{ averagePace: 25, isReliable: true, readingDaysCount: 10 }}
 *   listeningPaceData={{ averagePace: 45, isReliable: false }}
 *   formatPaceForFormat={(pace, format) => `${pace} ${format === 'audio' ? 'min' : 'pages'}/day`}
 * />
 */
export function ReadingPaceSection({
  readingPaceData,
  listeningPaceData,
  formatPaceForFormat,
}: ReadingPaceSectionProps) {
  const { colors } = useTheme();

  const paceStyles = useThemedStyles(theme => ({
    section: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: 20,
      marginBottom: 20,
    },
    paceColumnRight: {
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.border,
      paddingLeft: 16,
      marginLeft: 4,
    },
    paceDescription: {
      fontSize: 13,
      textAlign: 'center',
      marginBottom: 12,
      lineHeight: 18,
      color: theme.colors.textMuted,
    },
    dataPointsTextSmall: {
      fontSize: 12,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 16,
      color: theme.colors.textMuted,
    },
  }));

  return (
    <ThemedView style={paceStyles.section}>
      <View style={styles.paceSectionHeader}>
        <ThemedText
          variant="defaultSemiBold"
          style={[styles.paceSectionTitle, { fontSize: 20, lineHeight: 24 }]}
        >
          Reading & Listening Pace
        </ThemedText>
      </View>

      <View style={styles.paceRow}>
        {/* Reading Pace */}
        <View style={styles.paceColumn}>
          <View style={styles.paceHeader}>
            <IconSymbol name="book.fill" size={20} color={colors.primary} />
            <ThemedText style={styles.paceColumnTitle}>Reading</ThemedText>
          </View>
          <ThemedText style={styles.paceValue}>
            {readingPaceData.averagePace > 0
              ? formatPaceForFormat(readingPaceData.averagePace, 'physical')
              : '0 pages/day'}
          </ThemedText>
          <ThemedText style={paceStyles.paceDescription}>
            Based on recent reading activity
          </ThemedText>
          {readingPaceData.isReliable && (
            <ThemedText style={paceStyles.dataPointsTextSmall}>
              {readingPaceData.readingDaysCount} reading days
            </ThemedText>
          )}
        </View>

        {/* Listening Pace */}
        <View style={[styles.paceColumn, paceStyles.paceColumnRight]}>
          <View style={styles.paceHeader}>
            <IconSymbol name="headphones" size={20} color={colors.accent} />
            <ThemedText style={styles.paceColumnTitle}>Listening</ThemedText>
          </View>
          <ThemedText style={styles.paceValue}>
            {listeningPaceData.averagePace > 0
              ? formatPaceForFormat(listeningPaceData.averagePace, 'audio')
              : '0m/day'}
          </ThemedText>
          <ThemedText style={paceStyles.paceDescription}>
            Based on recent listening activity
          </ThemedText>
          {listeningPaceData.isReliable && (
            <ThemedText style={paceStyles.dataPointsTextSmall}>
              {listeningPaceData.listeningDaysCount} listening days
            </ThemedText>
          )}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  paceSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'center',
  },
  paceSectionTitle: {
    fontSize: 18,
    marginLeft: 12,
    fontWeight: '600',
  },
  paceRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 4,
  },
  paceColumn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  paceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  paceColumnTitle: {
    fontSize: 15,
    marginLeft: 8,
    fontWeight: '600',
  },
  paceValue: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
});
