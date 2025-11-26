import { QUERY_KEYS } from '@/constants/queryKeys';
import { analytics } from '@/lib/analytics/client';
import { useAuth } from '@/providers/AuthProvider';
import {
  ReviewTrackingResponse,
  reviewTrackingService,
  UpdateReviewPlatformsParams,
} from '@/services/reviewTracking.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

export const useReviewTrackingMutation = (deadlineId: string) => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const updatePlatformsMutation = useMutation({
    mutationFn: async ({
      reviewTrackingId,
      params,
    }: {
      reviewTrackingId: string;
      params: UpdateReviewPlatformsParams;
    }) => {
      if (!userId) throw new Error('User not authenticated');
      return reviewTrackingService.updateReviewPlatforms(
        userId,
        reviewTrackingId,
        params
      );
    },
    onMutate: async ({ params }) => {
      if (!userId) return;

      const queryKey = QUERY_KEYS.REVIEW_TRACKING.BY_DEADLINE(
        userId,
        deadlineId
      );

      await queryClient.cancelQueries({ queryKey });

      const previousData =
        queryClient.getQueryData<ReviewTrackingResponse | null>(queryKey);

      if (previousData) {
        const updatedPlatforms = previousData.platforms.map(platform => {
          const update = params.platforms.find(p => p.id === platform.id);
          if (update) {
            return {
              ...platform,
              posted: update.posted,
              review_url: update.review_url ?? platform.review_url,
              // Only set new posted_date when changing from false to true
              posted_date:
                update.posted && !platform.posted
                  ? new Date().toISOString()
                  : platform.posted_date,
            };
          }
          return platform;
        });

        const postedCount = updatedPlatforms.filter(p => p.posted).length;
        const totalCount = updatedPlatforms.length;
        const newPercentage =
          totalCount > 0 ? Math.round((postedCount / totalCount) * 100) : 0;

        queryClient.setQueryData<ReviewTrackingResponse>(queryKey, {
          ...previousData,
          platforms: updatedPlatforms,
          completion_percentage: newPercentage,
        });
      }

      return { previousData };
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousData && userId) {
        queryClient.setQueryData(
          QUERY_KEYS.REVIEW_TRACKING.BY_DEADLINE(userId, deadlineId),
          context.previousData
        );
      }

      // Track each failed platform update
      if (variables?.params?.platforms) {
        variables.params.platforms.forEach(platform => {
          analytics.track('review_platforms_update_failed', {
            error_message: error.message,
            deadline_id: deadlineId,
            platform_name: platform.id, // Using id since name isn't available
          });
        });
      }

      Toast.show({
        type: 'error',
        text1: 'Failed to update platforms',
        text2: error instanceof Error ? error.message : 'Please try again',
        position: 'top',
        visibilityTime: 3000,
      });
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.REVIEW_TRACKING.BY_DEADLINE(userId, deadlineId),
        });

        // Invalidate calendar queries so reviews appear immediately
        queryClient.invalidateQueries({
          queryKey: ['daily_activities', userId],
          refetchType: 'active', // Force refetch even with staleTime
        });
      }
    },
  });

  return {
    updatePlatforms: updatePlatformsMutation.mutate,
    isUpdating: updatePlatformsMutation.isPending,
  };
};
