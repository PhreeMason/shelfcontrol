import { QUERY_KEYS } from '@/constants/queryKeys';
import { useAuth } from '@/providers/AuthProvider';
import {
  reviewTrackingService,
  ReviewTrackingResponse,
} from '@/services/reviewTracking.service';
import { useQuery } from '@tanstack/react-query';

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

  return {
    reviewTracking: query.data?.review_tracking ?? null,
    platforms: query.data?.platforms ?? [],
    completionPercentage: query.data?.completion_percentage ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
