import { formatNumber } from '@/utils/formatters';
import { WeeklyStats } from '@/types/stats.types';
import React from 'react';
import { WeeklyStatsCard } from './WeeklyStatsCard';

interface WeeklyReadingCardProps {
  stats: WeeklyStats;
}

/**
 * WeeklyReadingCard displays weekly reading statistics for physical and eBook formats.
 *
 * Shows progress including:
 * - Pages read this week vs needed
 * - Ahead/behind status
 * - Progress percentage
 * - Average pages per day
 * - Days active this week
 *
 * @component
 * @param {WeeklyReadingCardProps} props - Component props
 * @param {WeeklyStats} props.stats - Weekly statistics calculated from active and completed deadlines
 *
 * @returns {JSX.Element | null} Rendered card or null if no reading activity
 *
 * @example
 * ```tsx
 * const stats = calculateWeeklyReadingStats(activeDeadlines, completedDeadlines);
 * <WeeklyReadingCard stats={stats} />
 * ```
 */
export function WeeklyReadingCard({ stats }: WeeklyReadingCardProps) {
  return (
    <WeeklyStatsCard
      stats={stats}
      headerLabel="Books This Week"
      unitsReadLabel="read"
      unitsNeededLabel="needed"
      daysActivityLabel="Read"
      formatValue={value => formatNumber(value, { unit: 'pages' })}
    />
  );
}
