import { QUERY_KEYS } from '@/constants/queryKeys';
import { useAuth } from '@/providers/AuthProvider';
import { deadlinesService } from '@/services';
import { useQuery } from '@tanstack/react-query';

const DEFAULT_TYPES = ['ARC', 'Library', 'Personal', 'Book Club'];

export const useDeadlineTypes = () => {
  const { profile, session } = useAuth();
  const userId = profile?.id || session?.user?.id;

  const result = useQuery({
    queryKey: userId
      ? QUERY_KEYS.DEADLINES.TYPES(userId)
      : ['deadline', 'types', undefined],
    queryFn: async () => {
      try {
        if (!userId) {
          return DEFAULT_TYPES;
        }
        const userTypes = await deadlinesService.getUniqueDeadlineTypes(userId);

        const allTypes = [...DEFAULT_TYPES];

        userTypes.forEach(type => {
          if (
            !DEFAULT_TYPES.some(
              defaultType =>
                defaultType.toLowerCase() === type.toLowerCase()
            )
          ) {
            allTypes.push(type);
          }
        });

        const sortedDefaults = DEFAULT_TYPES;
        const sortedUserTypes = allTypes
          .filter(s => !DEFAULT_TYPES.includes(s))
          .sort((a, b) => a.localeCompare(b));

        return [...sortedUserTypes, ...sortedDefaults];
      } catch (error) {
        console.error('Error fetching deadline types:', error);
        return DEFAULT_TYPES;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  if (!userId) {
    return {
      ...result,
      data: DEFAULT_TYPES,
    };
  }

  return result;
};
