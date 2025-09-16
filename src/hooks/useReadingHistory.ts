import { useAuth } from '@/providers/AuthProvider';
import { deadlinesService } from '@/services';
import { utcToLocalDate } from '@/utils/dateUtils';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

// Helper function to get status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'requested': return '#6366F1'; // Indigo (changed from blue)
    case 'approved': return '#10B981'; // Green
    case 'reading': return '#F59E0B'; // Yellow
    case 'complete': return '#059669'; // Dark Green
    case 'set_aside': return '#FB923C'; // Orange
    case 'rejected': return '#EF4444'; // Red
    case 'withdrew': return '#9CA3AF'; // Gray
    default: return '#8E8E93'; // Default gray
  }
};

export interface DeadlineStatusChange {
  deadline_id: string;
  status_id: string;
  book_title: string;
  author?: string;
  format: 'physical' | 'eBook' | 'audio';
  status: 'requested' | 'approved' | 'reading' | 'rejected' | 'withdrew' | 'complete' | 'set_aside';
  deadline_date: string;
  source: string;
  flexibility: string;
  created_at: string;
}

export interface DailyDeadlineEntry {
  date: string;
  deadlines: {
    id: string;
    book_title: string;
    author?: string;
    format: 'physical' | 'eBook' | 'audio';
    progress_made: number; // progress made on this specific day
    total_progress: number; // cumulative progress as of this day
    total_quantity: number; // total pages/minutes to read
    deadline_date: string;
    source: string;
    flexibility: string;
  }[];
  statusChanges: DeadlineStatusChange[]; // status changes that occurred on this day
  totalProgressMade: number; // total progress made across all deadlines this day
  deadlineInfo?: { // deadline info for deadline-due dates
    id: string;
    book_title: string;
    author?: string;
    format: 'physical' | 'eBook' | 'audio';
    deadline_date: string;
    source: string;
    flexibility: string;
    total_quantity: number;
  };
}

export interface DeadlineHistoryData {
  entries: DailyDeadlineEntry[];
  summary: {
    totalDays: number;
    totalDeadlines: number;
    ArchivedDeadlines: number;
  };
}

export type DateRange = '7d' | '30d' | '90d' | '1y' | 'all';
export type FormatFilter = 'reading' | 'listening' | 'combined' | 'all';

interface UseReadingHistoryOptions {
  dateRange?: DateRange;
  formatFilter?: FormatFilter;
}

const getDateRangeStart = (range: DateRange): Date | null => {
  const now = new Date();
  switch (range) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '1y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case 'all':
    default:
      return null;
  }
};

// Helper to convert UTC date string to local date string (YYYY-MM-DD)
const getLocalDateString = (utcDateString: string): string => {
  return utcToLocalDate(utcDateString);
};

const getFormatFilter = (filter: FormatFilter): string[] => {
  switch (filter) {
    case 'reading':
      return ['physical', 'eBook'];
    case 'listening':
      return ['audio'];
    case 'combined':
    case 'all':
    default:
      return ['physical', 'eBook', 'audio'];
  }
};

export const useDeadlineHistory = (options: UseReadingHistoryOptions = {}) => {
  const { session } = useAuth();
    const userId = session?.user?.id;
  const { dateRange = '90d', formatFilter = 'all' } = options;

  const query = useQuery({
    queryKey: ['deadlineHistory', userId, dateRange, formatFilter],
    queryFn: async (): Promise<DeadlineHistoryData> => {
      if (!userId) throw new Error('User not authenticated');

      const startDate = getDateRangeStart(dateRange);
      const formats = getFormatFilter(formatFilter);

      // Query reading deadlines with their progress and status changes
      const deadlines = await deadlinesService.getDeadlineHistory({
        userId: userId,
        dateRange: startDate,
        formats: formats as ('physical' | 'eBook' | 'audio')[],
      });

      // Process deadline progress data to extract daily activity
      const dailyEntries: { [date: string]: DailyDeadlineEntry } = {};

      deadlines?.forEach((deadline: any) => {
        const progress = deadline.deadline_progress || [];
        const deadlineCreatedDate = getLocalDateString(deadline.created_at);

        // Check if deadline creation date is within our date range
        if (!startDate || new Date(deadlineCreatedDate) >= startDate) {
          // If deadline has no progress entries, still show it on creation date
          if (progress.length === 0) {
            if (!dailyEntries[deadlineCreatedDate]) {
              dailyEntries[deadlineCreatedDate] = {
                date: deadlineCreatedDate,
                deadlines: [],
                statusChanges: [],
                totalProgressMade: 0,
              };
            }

            dailyEntries[deadlineCreatedDate].deadlines.push({
              id: deadline.id,
              book_title: deadline.book_title,
              author: deadline.author,
              format: deadline.format,
              progress_made: 0,
              total_progress: 0,
              total_quantity: deadline.total_quantity,
              deadline_date: deadline.deadline_date,
              source: deadline.source,
              flexibility: deadline.flexibility,
            });
          }
        }

        // Sort progress by date to calculate daily differences
        const sortedProgress = progress.sort(
          (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        // Group progress entries by date to handle same-day updates properly
        const progressByDate: { [date: string]: any[] } = {};
        sortedProgress.forEach((prog: any) => {
          const date = getLocalDateString(prog.created_at);
          if (!progressByDate[date]) progressByDate[date] = [];
          progressByDate[date].push(prog);
        });

        // Check if deadline was created on the same day as first progress
        const firstProgressDate = sortedProgress.length > 0
          ? getLocalDateString(sortedProgress[0].created_at)
          : null;

        const showDeadlineCreation = deadlineCreatedDate === firstProgressDate;

        // Process each date for this deadline
        const dates = Object.keys(progressByDate).sort();
        for (let dateIndex = 0; dateIndex < dates.length; dateIndex++) {
          const date = dates[dateIndex];

          // Apply date filter
          if (!date || (startDate && new Date(date) < startDate)) continue;

          const dayProgress = progressByDate[date];
          if (!dayProgress || dayProgress.length === 0) continue;

          // Use the last (most recent) progress entry for the day
          const currentProgress = dayProgress[dayProgress.length - 1];

          let progressMade = 0;

          if (dateIndex === 0) {
            // First date - if deadline was created this day, apply progress threshold logic
            if (showDeadlineCreation) {
              // For deadline creation day, apply progress threshold logic:
              // If initial progress > 50, treat as starting point (progress made = 0)
              // If initial progress <= 50, count it as progress made
              progressMade = currentProgress.current_progress > 50 ? 0 : currentProgress.current_progress;
            } else {
              // If first entry is not on creation date, it means progress was made
              progressMade = currentProgress.current_progress;
            }
          } else {
            // Subsequent dates - difference from previous day's final progress
            const prevDate = dates[dateIndex - 1];
            if (prevDate) {
              const prevDayProgress = progressByDate[prevDate];
              if (prevDayProgress && prevDayProgress.length > 0) {
                const prevProgress = prevDayProgress[prevDayProgress.length - 1];
                progressMade = Math.max(0, currentProgress.current_progress - prevProgress.current_progress);
              }
            }
          }

          // Add entries only where actual progress was made
          if (progressMade > 0) {
            if (!dailyEntries[date]) {
              dailyEntries[date] = {
                date,
                deadlines: [],
                statusChanges: [],
                totalProgressMade: 0,
              };
            }

            dailyEntries[date].deadlines.push({
              id: deadline.id,
              book_title: deadline.book_title,
              author: deadline.author,
              format: deadline.format,
              progress_made: progressMade,
              total_progress: currentProgress.current_progress,
              total_quantity: deadline.total_quantity,
              deadline_date: deadline.deadline_date,
              source: deadline.source,
              flexibility: deadline.flexibility,
            });

            dailyEntries[date].totalProgressMade += progressMade;
          }
        }
      });

      // Process status changes for each deadline
      deadlines?.forEach((deadline: any) => {
        const statusChanges = deadline.deadline_status || [];

        statusChanges.forEach((statusChange: any) => {
          const statusDate = getLocalDateString(statusChange.created_at);

          // Apply date filter
          if (startDate && new Date(statusDate) < startDate) return;

          if (!dailyEntries[statusDate]) {
            dailyEntries[statusDate] = {
              date: statusDate,
              deadlines: [],
              statusChanges: [],
              totalProgressMade: 0,
            };
          }

          dailyEntries[statusDate].statusChanges.push({
            deadline_id: deadline.id,
            status_id: statusChange.id,
            book_title: deadline.book_title,
            author: deadline.author,
            format: deadline.format,
            status: statusChange.status,
            deadline_date: deadline.deadline_date,
            source: deadline.source,
            flexibility: deadline.flexibility,
            created_at: statusChange.created_at,
          });
        });

      });

      // Add entries for deadline dates that don't already exist
      // Force create entries for ALL deadline dates to ensure they're clickable
      deadlines?.forEach((deadline: any) => {
        const deadlineDate = getLocalDateString(deadline.deadline_date);

        // Apply date filter for deadline dates
        if (!startDate || new Date(deadlineDate) >= startDate) {
          // Always create entry if it doesn't exist, regardless of completion status
          if (!dailyEntries[deadlineDate]) {
            dailyEntries[deadlineDate] = {
              date: deadlineDate,
              deadlines: [],
              statusChanges: [],
              totalProgressMade: 0,
              deadlineInfo: {
                id: deadline.id,
                book_title: deadline.book_title,
                author: deadline.author,
                format: deadline.format,
                deadline_date: deadline.deadline_date,
                source: deadline.source,
                flexibility: deadline.flexibility,
                total_quantity: deadline.total_quantity,
              }
            };
          }
        }
      });

      // Convert to array and sort by date
      const entries = Object.values(dailyEntries).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Calculate summary stats
      const totalDays = entries.length;

      // Count active vs completed deadlines
      const activeDeadlines = deadlines?.filter(d => {
        const progress = d.deadline_progress || [];
        if (progress.length === 0) return true; // No progress yet, so it's active
        const latestProgress = progress[progress.length - 1];
        return latestProgress ? latestProgress.current_progress < d.total_quantity : true;
      }).length || 0;

      const ArchivedDeadlines = (deadlines?.length || 0) - activeDeadlines;

      return {
        entries,
        summary: {
          totalDays,
          totalDeadlines: deadlines?.length || 0,
          ArchivedDeadlines,
        },
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Memoize calendar data for performance
  const calendarData = useMemo(() => {
    if (!query.data?.entries) return {};

    const markedDates: { [date: string]: any } = {};

    query.data.entries.forEach((entry: DailyDeadlineEntry) => {
      const hasProgress = entry.deadlines.length > 0;
      const hasStatusChanges = (entry.statusChanges || []).length > 0;

      if (hasProgress || hasStatusChanges) {
        const dots: { key: string; color: string }[] = [];

        // Add progress dot if there's progress
        if (hasProgress) {
          const hasReadingDeadlines = entry.deadlines.some(d => d.format === 'physical' || d.format === 'eBook');
          const hasListeningDeadlines = entry.deadlines.some(d => d.format === 'audio');

          let dotColor = '#8E8E93';
          if (hasReadingDeadlines && hasListeningDeadlines) {
            dotColor = '#AF52DE'; // Both reading and listening deadlines
          } else if (hasReadingDeadlines) {
            dotColor = '#007AFF'; // Reading deadlines only
          } else if (hasListeningDeadlines) {
            dotColor = '#FF9500'; // Listening deadlines only
          }

          dots.push({ key: 'progress', color: dotColor });
        }

        // Add status dots for status changes (limit to 3 to avoid crowding)
        if (hasStatusChanges) {
          (entry.statusChanges || []).slice(0, 3).forEach((change) => {
            dots.push({
              key: `status_${change.status_id}`,
              color: getStatusColor(change.status)
            });
          });
        }

        markedDates[entry.date] = {
          dots,
          selected: false,
          selectedColor: '#007AFF',
          selectedTextColor: 'white',
        };
      }
    });

    // Add deadline markers for entries that have deadlineInfo
    query.data.entries.forEach((entry: DailyDeadlineEntry) => {
      if (entry.deadlineInfo) {
        if (!markedDates[entry.date]) {
          markedDates[entry.date] = {
            dots: [],
            selected: false,
            selectedColor: '#007AFF',
            selectedTextColor: 'white',
          };
        }

        // Add deadline marker dot
        markedDates[entry.date].dots.push({
          key: 'deadline',
          color: '#DC2626' // Red for deadline dates
        });
      }
    });

    return markedDates;
  }, [query.data?.entries]);

  return {
    ...query,
    calendarData,
  };
};