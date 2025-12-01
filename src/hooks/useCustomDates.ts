import { MUTATION_KEYS, QUERY_KEYS } from '@/constants/queryKeys';
import { posthog } from '@/lib/posthog';
import { useAuth } from '@/providers/AuthProvider';
import { customDatesService } from '@/services/customDates.service';
import {
  DeadlineCustomDate,
  DeadlineCustomDateUpdate,
} from '@/types/customDates.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useGetCustomDates = (deadlineId: string | undefined) => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery<DeadlineCustomDate[]>({
    queryKey:
      userId && deadlineId
        ? QUERY_KEYS.CUSTOM_DATES.BY_DEADLINE(userId, deadlineId)
        : ['custom_dates', undefined, undefined],
    queryFn: async () => {
      if (!userId || !deadlineId) return [];
      return customDatesService.getCustomDates(userId, deadlineId);
    },
    enabled: !!userId && !!deadlineId,
  });
};

export const useGetAllCustomDateNames = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery<string[]>({
    queryKey: userId
      ? QUERY_KEYS.CUSTOM_DATES.ALL_NAMES(userId)
      : ['custom_dates', 'names', undefined],
    queryFn: async () => {
      if (!userId) return [];
      return customDatesService.getAllCustomDateNames(userId);
    },
    enabled: !!userId,
  });
};

export const useAddCustomDate = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.CUSTOM_DATES.ADD],
    mutationFn: async ({
      deadlineId,
      customDateData,
    }: {
      deadlineId: string;
      customDateData: { name: string; date: string };
    }) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return customDatesService.addCustomDate(
        userId,
        deadlineId,
        customDateData
      );
    },
    onSuccess: (_, variables) => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CUSTOM_DATES.BY_DEADLINE(
            userId,
            variables.deadlineId
          ),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CUSTOM_DATES.ALL_NAMES(userId),
        });
        // Invalidate calendar activities
        queryClient.invalidateQueries({
          queryKey: ['deadline', 'daily_activities'],
        });
      }
    },
    onError: (error: Error) => {
      console.error('Error adding custom date:', error);
      posthog.captureException(error);
    },
  });
};

export const useUpdateCustomDate = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.CUSTOM_DATES.UPDATE],
    mutationFn: async ({
      customDateId,
      customDateData,
    }: {
      customDateId: string;
      deadlineId: string;
      customDateData: DeadlineCustomDateUpdate;
    }) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return customDatesService.updateCustomDate(
        customDateId,
        userId,
        customDateData
      );
    },
    onSuccess: (_, variables) => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CUSTOM_DATES.BY_DEADLINE(
            userId,
            variables.deadlineId
          ),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CUSTOM_DATES.ALL_NAMES(userId),
        });
        // Invalidate calendar activities
        queryClient.invalidateQueries({
          queryKey: ['deadline', 'daily_activities'],
        });
      }
    },
    onError: (error: Error) => {
      console.error('Error updating custom date:', error);
      posthog.captureException(error);
    },
  });
};

export const useDeleteCustomDate = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.CUSTOM_DATES.DELETE],
    mutationFn: async ({
      customDateId,
    }: {
      customDateId: string;
      deadlineId: string;
    }) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return customDatesService.deleteCustomDate(customDateId, userId);
    },
    onSuccess: (_, variables) => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CUSTOM_DATES.BY_DEADLINE(
            userId,
            variables.deadlineId
          ),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CUSTOM_DATES.ALL_NAMES(userId),
        });
        // Invalidate calendar activities
        queryClient.invalidateQueries({
          queryKey: ['deadline', 'daily_activities'],
        });
      }
    },
    onError: (error: Error) => {
      console.error('Error deleting custom date:', error);
      posthog.captureException(error);
    },
  });
};
