import { QUERY_KEYS } from '@/constants/queryKeys';
import { useAuth } from '@/providers/AuthProvider';
import { reviewTrackingService } from '@/services/reviewTracking.service';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export const useReviewTracking = (deadlineId: string, enabled: boolean = true) => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const query = useQuery({
    queryKey: userId
      ? QUERY_KEYS.REVIEW_TRACKING.BY_DEADLINE(userId, deadlineId)
      : ['review_tracking', 'null', deadlineId],
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      return reviewTrackingService.getReviewTrackingByDeadline(userId, deadlineId);
    },
    staleTime: 1000 * 60 * 5,
    enabled: enabled && !!userId && !!deadlineId,
  });

  const reviewData = useMemo(() => {
    if (!query.data) {
      return {
        reviewDueDate: null,
        unpostedCount: 0,
        totalPlatformCount: 0,
      };
    }

    const unpostedPlatforms = query.data.platforms.filter(p => !p.posted);

    return {
      reviewDueDate: query.data.review_tracking.review_due_date,
      unpostedCount: unpostedPlatforms.length,
      totalPlatformCount: query.data.platforms.length,
    };
  }, [query.data]);

  return {
    ...reviewData,
    isLoading: query.isLoading,
    error: query.error,
  };
};
