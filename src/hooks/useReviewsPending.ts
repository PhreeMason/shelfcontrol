import { QUERY_KEYS } from '@/constants/queryKeys';
import { dayjs } from '@/lib/dayjs';
import { useAuth } from '@/providers/AuthProvider';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { reviewTrackingService } from '@/services/reviewTracking.service';
import { DailyActivity } from '@/types/calendar.types';
import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

export interface ReviewsPendingResult {
  activities: DailyActivity[];
  isLoading: boolean;
}

/**
 * Hook to get synthetic "reviews pending" activities for today's date.
 * These are deadlines in "to review" status that have at least one un-posted review platform.
 */
export const useReviewsPendingActivities = (): ReviewsPendingResult => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { toReviewDeadlines } = useDeadlines();

  // Fetch review tracking for all to_review deadlines
  const reviewQueries = useQueries({
    queries: toReviewDeadlines.map(deadline => ({
      queryKey: userId
        ? QUERY_KEYS.REVIEW_TRACKING.BY_DEADLINE(userId, deadline.id)
        : ['review_tracking', 'null', deadline.id],
      queryFn: async () => {
        if (!userId) return null;
        return reviewTrackingService.getReviewTrackingByDeadline(
          userId,
          deadline.id
        );
      },
      staleTime: 1000 * 60 * 5,
      enabled: !!userId && !!deadline.id,
    })),
  });

  const isLoading = reviewQueries.some(q => q.isLoading);
  // Extract stable data references from queries to avoid dependency array instability
  const reviewData = reviewQueries.map(q => q.data);

  const activities = useMemo(() => {
    if (isLoading || !userId) return [];

    const today = dayjs().format('YYYY-MM-DD');
    const todayTimestamp = dayjs().toISOString();

    const pendingActivities: DailyActivity[] = [];

    reviewData.forEach((tracking, index) => {
      const deadline = toReviewDeadlines[index];

      if (!tracking || !deadline) return;

      // Check for un-posted platforms
      const unpostedPlatforms = tracking.platforms.filter(p => !p.posted);
      if (unpostedPlatforms.length === 0) return;

      // Create synthetic activity for today
      pendingActivities.push({
        activity_date: today,
        activity_type: 'reviews_pending',
        deadline_id: deadline.id,
        book_title: deadline.book_title,
        activity_timestamp: todayTimestamp,
        metadata: {
          format: deadline.format,
          author: deadline.author,
          cover_image_url: deadline.cover_image_url,
          unposted_count: unpostedPlatforms.length,
          total_platforms: tracking.platforms.length,
          platform_names: unpostedPlatforms.map(p => p.platform_name),
        },
      });
    });

    return pendingActivities;
  }, [reviewData, toReviewDeadlines, isLoading, userId]);

  return { activities, isLoading };
};
