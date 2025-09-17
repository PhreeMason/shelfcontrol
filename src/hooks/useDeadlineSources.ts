import { useAuth } from '@/providers/AuthProvider';
import { deadlinesService } from '@/services';
import { useQuery } from '@tanstack/react-query';

// Default source options to always include
const DEFAULT_SOURCES = ['ARC', 'Library', 'Personal', 'Book Club'];

export const useDeadlineSources = () => {
  const { profile, session } = useAuth();
  const userId = profile?.id || session?.user?.id;

  const result = useQuery({
    queryKey: ['deadline-sources', userId],
    queryFn: async () => {
      try {

        if (!userId) {
          return DEFAULT_SOURCES;
        }
        // Fetch unique sources from the database
        const userSources = await deadlinesService.getUniqueSources(userId);

        // Combine defaults with user sources, removing duplicates
        const allSources = [...DEFAULT_SOURCES];

        userSources.forEach(source => {
          // Add user source if it's not already in defaults (case-insensitive)
          if (!DEFAULT_SOURCES.some(defaultSource =>
            defaultSource.toLowerCase() === source.toLowerCase()
          )) {
            allSources.push(source);
          }
        });

        // Sort alphabetically, but keep defaults at the top
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
    initialData: DEFAULT_SOURCES, // Ensure data is always defined
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // If no user ID, always return default sources
  if (!userId) {
    return {
      ...result,
      data: DEFAULT_SOURCES,
    };
  }

  return result;
};