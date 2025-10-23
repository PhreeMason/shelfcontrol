import { QUERY_KEYS } from '@/constants/queryKeys';
import { useAuth } from '@/providers/AuthProvider';
import {
  reviewTrackingService,
  ReviewTrackingResponse,
} from '@/services/reviewTracking.service';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

// Constant empty array to prevent creating new array references on every render
// Using a constant ensures stable reference identity when no platforms exist
const EMPTY_PLATFORMS: any[] = [];

export const useReviewTrackingData = (
  deadlineId: string,
  enabled: boolean = true
) => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const query = useQuery<ReviewTrackingResponse | null>({
    queryKey: userId
      ? QUERY_KEYS.REVIEW_TRACKING.BY_DEADLINE(userId, deadlineId)
      : ['review_tracking', 'null', deadlineId],
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      return reviewTrackingService.getReviewTrackingByDeadline(
        userId,
        deadlineId
      );
    },
    staleTime: 1000 * 60 * 5,
    enabled: enabled && !!userId && !!deadlineId,
  });

  // Memoize the entire return object to prevent unnecessary re-renders in consuming components
  // Without this, every render would create a new object reference, triggering effects
  // that depend on these values even when the actual data hasn't changed
  return useMemo(
    () => ({
      reviewTracking: query.data?.review_tracking ?? null,
      platforms: query.data?.platforms ?? EMPTY_PLATFORMS,
      completionPercentage: query.data?.completion_percentage ?? 0,
      isLoading: query.isLoading,
      error: query.error,
      refetch: query.refetch,
    }),
    [query.data, query.isLoading, query.error, query.refetch]
  );
};
