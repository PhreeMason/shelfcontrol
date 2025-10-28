import { Tables, TablesInsert, TablesUpdate } from '@/types/database.types';

export type ReadingDeadline = Tables<'deadlines'>;
export type ReadingDeadlineInsert = TablesInsert<'deadlines'>;
export type ReadingDeadlineUpdate = TablesUpdate<'deadlines'>;

export type ReadingDeadlineProgressInsert = TablesInsert<'deadline_progress'>;
export type ReadingDeadlineProgress = Tables<'deadline_progress'>;

export type ReadingDeadlineStatus = Tables<'deadline_status'>;
export type ReadingDeadlineStatusInsert = TablesInsert<'deadline_status'>;

// Type for reading deadline with progress - matches the actual data structure from useGetDeadlines
export type ReadingDeadlineWithProgress = ReadingDeadline & {
  progress: ReadingDeadlineProgress[];
  status?: ReadingDeadlineStatus[];
  books?: {
    publisher: string | null;
  } | null;
  publishers?: string[] | null;
};

export type ReadingDeadlineInsertWithProgress = ReadingDeadlineInsert & {
  progress?: ReadingDeadlineProgressInsert[];
};

export type FilterType =
  | 'active'
  | 'overdue'
  | 'pending'
  | 'paused'
  | 'toReview'
  | 'completed'
  | 'didNotFinish'
  | 'all';

export type TimeRangeFilter = 'all' | 'thisWeek' | 'thisMonth';

export type PageRangeFilter = 'under300' | '300to500' | 'over500';

export type BookFormat = 'physical' | 'eBook' | 'audio';

export type SortOrder =
  | 'default'
  | 'soonest'
  | 'latest'
  | 'lowestPace'
  | 'highestPace';
