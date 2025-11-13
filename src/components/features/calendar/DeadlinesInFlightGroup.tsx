import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/hooks/useTheme';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  aggregateTargetsByFormat,
  getDeadlinesInFlightOnDate,
  getProgressAsOfDate,
} from '@/utils/chartDataUtils';
import { parseServerDateOnly } from '@/utils/dateNormalization';
import { formatAveragePace } from '@/utils/readingStatsUtils';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { DeadlineInFlightItem } from './DeadlineInFlightItem';

interface DeadlinesInFlightGroupProps {
  selectedDate: string;
  deadlines: ReadingDeadlineWithProgress[];
}

/**
 * Container component for deadlines in flight
 * Shows which books were actively being read on the selected date
 * Helps users understand why their daily targets spiked
 */
export const DeadlinesInFlightGroup: React.FC<DeadlinesInFlightGroupProps> = ({
  selectedDate,
  deadlines,
}) => {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter to get deadlines that were in-flight on the selected date
  const inFlightDeadlines = getDeadlinesInFlightOnDate(deadlines, selectedDate);

  // Sort by remaining amount - least remaining first
  const sortedDeadlines = [...inFlightDeadlines].sort((a, b) => {
    const selectedDateDayjs = parseServerDateOnly(selectedDate);
    const previousDay = selectedDateDayjs
      .subtract(1, 'day')
      .format('YYYY-MM-DD');

    const progressA = getProgressAsOfDate(a.progress, previousDay);
    const remainingA = Math.max(0, a.total_quantity - progressA);

    const progressB = getProgressAsOfDate(b.progress, previousDay);
    const remainingB = Math.max(0, b.total_quantity - progressB);

    return remainingA - remainingB; // Ascending order (least remaining first)
  });

  // Don't render if no in-flight deadlines
  if (sortedDeadlines.length === 0) {
    return null;
  }

  // Calculate aggregate targets for header
  const { targetPages, targetMinutes } = aggregateTargetsByFormat(
    deadlines,
    selectedDate
  );

  // Format target text for display
  const targetParts = [];
  if (targetPages > 0) {
    targetParts.push(`${Math.round(targetPages)} pg/day`);
  }
  if (targetMinutes > 0) {
    targetParts.push(formatAveragePace(Math.round(targetMinutes), 'audio'));
  }
  const targetText = targetParts.join(', ');

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View
      style={[
        styles.container,
        { borderColor: colors.border, backgroundColor: colors.background },
      ]}
    >
      {/* Header */}
      <Pressable
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
        onPress={handleToggle}
      >
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <IconSymbol name="books.vertical.fill" size={20} color="#6366F1" />
          </View>
          <View style={styles.headerTextContent}>
            <ThemedText style={styles.headerTitle}>
              Books in progress ({sortedDeadlines.length})
            </ThemedText>
            {targetText && (
              <ThemedText
                style={[styles.headerSubtitle, { color: colors.textMuted }]}
              >
                Total: {targetText}
              </ThemedText>
            )}
          </View>
        </View>

        <IconSymbol
          name="chevron.down"
          size={20}
          color="#64748B"
          style={{
            transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
          }}
        />
      </Pressable>

      {/* Expanded Content - Show all in-flight deadlines (sorted by remaining amount) */}
      {isExpanded && (
        <View
          style={[styles.expandedContent, { borderTopColor: colors.border }]}
        >
          {sortedDeadlines.map((deadline, index) => (
            <React.Fragment key={deadline.id}>
              <DeadlineInFlightItem
                deadline={deadline}
                selectedDate={selectedDate}
              />
              {/* Divider between items (not after last one) */}
              {index < sortedDeadlines.length - 1 && (
                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />
              )}
            </React.Fragment>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressed: {
    backgroundColor: '#F7FAFC',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  headerTextContent: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
  },
  expandedContent: {
    borderTopWidth: 1,
    padding: 12,
  },
  divider: {
    height: 1,
    marginHorizontal: 8,
  },
});
