import { MUTATION_KEYS, QUERY_KEYS } from '@/constants/queryKeys';
import { posthog } from '@/lib/posthog';
import { useAuth } from '@/providers/AuthProvider';
import { userSettingsService } from '@/services/userSettings.service';
import { UserPreferences } from '@/types/userPreferences.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useGetUserSettings = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery<UserPreferences>({
    queryKey: userId
      ? QUERY_KEYS.USER_SETTINGS.DETAIL(userId)
      : ['user_settings', undefined],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return userSettingsService.getSettings(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useUpdateUserSettings = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.USER_SETTINGS.UPDATE],
    mutationFn: async (updates: Partial<UserPreferences>) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return userSettingsService.updateSettings(userId, updates);
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.USER_SETTINGS.DETAIL(userId),
        });
      }
    },
    onError: (error: Error) => {
      console.error('Error updating user settings:', error);
      posthog.captureException(error);
    },
  });
};
