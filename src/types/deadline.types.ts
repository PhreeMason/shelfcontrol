import {
    Tables,
    TablesInsert,
    TablesUpdate
} from '@/types/database.types';

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
};

export type ReadingDeadlineInsertWithProgress = ReadingDeadlineInsert & {
    progress?: ReadingDeadlineProgressInsert[];
};
