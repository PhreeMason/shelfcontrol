import { WeeklyStats } from '@/types/stats.types';
import { formatAudioTime } from '@/utils/statsUtils';
import React from 'react';
import { WeeklyStatsCard } from './WeeklyStatsCard';

interface WeeklyListeningCardProps {
  stats: WeeklyStats;
}

/**
 * WeeklyListeningCard displays weekly listening statistics for audio format books.
 *
 * Shows progress including:
 * - Time listened this week vs needed
 * - Ahead/behind status
 * - Progress percentage
 * - Average listening time per day
 * - Days active this week
 *
 * @component
 * @param {WeeklyListeningCardProps} props - Component props
 * @param {WeeklyStats} props.stats - Weekly statistics calculated from active and completed deadlines
 *
 * @returns {JSX.Element | null} Rendered card or null if no listening activity
 *
 * @example
 * ```tsx
 * const stats = calculateWeeklyListeningStats(activeDeadlines, completedDeadlines);
 * <WeeklyListeningCard stats={stats} />
 * ```
 */
export function WeeklyListeningCard({ stats }: WeeklyListeningCardProps) {
  return (
    <WeeklyStatsCard
      stats={stats}
      type="listening"
      headerLabel="Audiobooks This Week"
      unitsReadLabel="listened"
      unitsNeededLabel="needed"
      daysActivityLabel="Listened"
      formatValue={formatAudioTime}
    />
  );
}
