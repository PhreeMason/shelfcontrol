import { useAuth } from '@/providers/AuthProvider';
import { deadlinesService } from '@/services';
import { useQuery } from '@tanstack/react-query';

// Default source options to always include
const DEFAULT_SOURCES = ['ARC', 'Library', 'Personal', 'Book Club'];

export const useDeadlineSources = () => {
  const { profile, session } = useAuth();
  const userId = profile?.id || session?.user?.id;

  const result = useQuery({
    queryKey: ['deadline', 'sources', userId],
    queryFn: async () => {
      try {
        if (!userId) {
          return DEFAULT_SOURCES;
        }
        const userSources = await deadlinesService.getUniqueSources(userId);

        const allSources = [...DEFAULT_SOURCES];

        userSources.forEach(source => {
          if (
            !DEFAULT_SOURCES.some(
              defaultSource =>
                defaultSource.toLowerCase() === source.toLowerCase()
            )
          ) {
            allSources.push(source);
          }
        });

        const sortedDefaults = DEFAULT_SOURCES;
        const sortedUserSources = allSources
          .filter(s => !DEFAULT_SOURCES.includes(s))
          .sort((a, b) => a.localeCompare(b));

        return [...sortedDefaults, ...sortedUserSources];
      } catch (error) {
        console.error('Error fetching deadline sources:', error);
        return DEFAULT_SOURCES;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (!userId) {
    return {
      ...result,
      data: DEFAULT_SOURCES,
    };
  }

  return result;
};
