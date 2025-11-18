import { useProductivityData } from '@/hooks/useProductivity';
import { ProductiveDaysStats } from '@/types/stats.types';
import {
  calculateProductiveDaysFromService,
  formatAudioTime,
} from '@/utils/statsUtils';
import React from 'react';
import { MostProductiveDaysCard } from './MostProductiveDaysCard';

/**
 * MostProductiveListeningDaysCard displays the top 3 most productive days for audiobook listening.
 *
 * Analyzes listening patterns over the last 2 weeks (excluding current week) to show
 * which days of the week are typically most productive for listening to audiobooks.
 *
 * **Optimization**: Uses dedicated productivity service that queries only minimal data
 * from the database (progress entries + baseline), reducing data transfer by 70-90%
 * compared to fetching all deadlines.
 *
 * Features:
 * - Top 3 days ranked by total minutes listened
 * - Horizontal progress bars showing relative productivity
 * - Actionable insight text suggesting best listening days
 * - Data attribution showing analysis timeframe
 *
 * @component
 * @returns {JSX.Element | null} Rendered card or null if insufficient data
 *
 * @example
 * ```tsx
 * <MostProductiveListeningDaysCard />
 * ```
 */
export function MostProductiveListeningDaysCard() {
  // Fetch productivity data for audio format only
  const { data: audioData } = useProductivityData('audio');

  // Calculate stats from service data
  const stats: ProductiveDaysStats = React.useMemo(
    () => calculateProductiveDaysFromService(audioData),
    [audioData]
  );

  return (
    <MostProductiveDaysCard
      stats={stats}
      title="Days You Listen Most"
      formatValue={formatAudioTime}
    />
  );
}
