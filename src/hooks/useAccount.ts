import { MUTATION_KEYS } from '@/constants/queryKeys';
import { posthog } from '@/lib/posthog';
import { useAuth } from '@/providers/AuthProvider';
import { authService } from '@/services/auth.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useDeleteAllData = () => {
  const { session, refreshProfile } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.ACCOUNT.DELETE_ALL_DATA],
    mutationFn: async () => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return authService.deleteAllUserData(userId);
    },
    onSuccess: async () => {
      // Clear all cached data since it's been deleted
      queryClient.clear();
      // Refresh profile to reflect cleared data (avatar, name, etc.)
      await refreshProfile();
    },
    onError: (error: Error) => {
      console.error('Error deleting all user data:', error);
      posthog.captureException(error);
    },
  });
};

export const useDeleteAccount = () => {
  const { session, signOut } = useAuth();
  const userId = session?.user?.id;

  return useMutation({
    mutationKey: [MUTATION_KEYS.ACCOUNT.DELETE_ACCOUNT],
    mutationFn: async () => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return authService.deleteAccount(userId);
    },
    onSuccess: async () => {
      // Sign out after account deletion
      await signOut();
    },
    onError: (error: Error) => {
      console.error('Error deleting account:', error);
      posthog.captureException(error);
    },
  });
};
