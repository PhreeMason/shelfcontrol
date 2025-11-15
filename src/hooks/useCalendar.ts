import { QUERY_KEYS } from '@/constants/queryKeys';
import { useAuth } from '@/providers/AuthProvider';
import { deadlinesService } from '@/services';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to fetch daily activities for calendar view
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns React Query result with daily activities
 */
export const useGetDailyActivities = (startDate: string, endDate: string) => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: userId
      ? QUERY_KEYS.DEADLINES.DAILY_ACTIVITIES(userId, `${startDate}_${endDate}`)
      : ['daily_activities', undefined, undefined],
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      return deadlinesService.getDailyActivities(userId, startDate, endDate);
    },
    enabled: !!userId && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    placeholderData: previousData => previousData, // Keep previous data visible while loading
  });
};
