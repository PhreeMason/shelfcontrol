import { DB_TABLES } from '@/constants/database';
import { DEADLINE_STATUS } from '@/constants/status';
import { dayjs } from '@/lib/dayjs';
import { generateId, supabase } from '@/lib/supabase';
import {
  ReadingDeadlineInsert,
  ReadingDeadlineProgressInsert,
  ReadingDeadlineWithProgress,
} from '@/types/deadline.types';
import { normalizeServerDate } from '@/utils/dateNormalization';
import { activityService } from './activity.service';
import { booksService } from './books.service';

const sortByCreatedAtAsc = <T extends { created_at?: string | null }>(
  array: T[]
): T[] => {
  return [...array].sort((a, b) => {
    const dateA = normalizeServerDate(a.created_at || '1970-01-01').valueOf();
    const dateB = normalizeServerDate(b.created_at || '1970-01-01').valueOf();
    return dateA - dateB;
  });
};

const sortDeadlineArrays = (
  deadline: ReadingDeadlineWithProgress
): ReadingDeadlineWithProgress => {
  return {
    ...deadline,
    progress: deadline.progress ? sortByCreatedAtAsc(deadline.progress) : [],
    status: deadline.status ? sortByCreatedAtAsc(deadline.status) : [],
  };
};

export interface AddDeadlineParams {
  deadlineDetails: Omit<ReadingDeadlineInsert, 'user_id'>;
  progressDetails: ReadingDeadlineProgressInsert;
  status?: string;
  bookData?: { api_id: string; book_id?: string };
}

export interface UpdateDeadlineParams {
  deadlineDetails: ReadingDeadlineInsert;
  progressDetails: ReadingDeadlineProgressInsert;
  status?: string;
  bookData?: { api_id: string; book_id?: string };
}

export interface UpdateProgressParams {
  deadlineId: string;
  currentProgress: number;
  timeSpentReading?: number;
}

export interface DeadlineHistoryParams {
  userId: string;
  dateRange?: Date | null;
  formats?: ('physical' | 'eBook' | 'audio')[];
}

class DeadlinesService {
  /**
   * Add a new deadline
   */
  async addDeadline(userId: string, params: AddDeadlineParams) {
    const { deadlineDetails, progressDetails, status, bookData } = params;

    const finalDeadlineId = generateId('rd');
    const finalProgressId = generateId('rdp');

    deadlineDetails.id = finalDeadlineId;
    progressDetails.id = finalProgressId;
    progressDetails.deadline_id = finalDeadlineId;

    let finalBookId = deadlineDetails.book_id;
    if (bookData?.api_id && !bookData.book_id) {
      const existingBook = await booksService.getBookByApiId(bookData.api_id);

      if (existingBook) {
        finalBookId = existingBook.id;
      } else {
        // Need to fetch and insert book data
        try {
          const bookResponse = await booksService.fetchBookData(
            bookData.api_id
          );
          if (bookResponse) {
            const finalNewBookId = generateId('book');
            await booksService.insertBook(finalNewBookId, bookResponse);
            finalBookId = finalNewBookId;
          }
        } catch (bookError) {
          console.warn('Failed to fetch/insert book data:', bookError);
        }
      }
    } else if (bookData?.book_id) {
      finalBookId = bookData.book_id;
    }

    const { data: deadlineData, error: deadlineError } = await supabase
      .from(DB_TABLES.DEADLINES)
      .insert({
        ...deadlineDetails,
        book_id: finalBookId || null,
        user_id: userId,
      })
      .select()
      .single();

    if (deadlineError) throw deadlineError;

    // Set to yesterday to exclude from today's reading goal calculations
    if (progressDetails.ignore_in_calcs) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      progressDetails.created_at = yesterday.toISOString();
      progressDetails.updated_at = yesterday.toISOString();
    }

    const { data: progressData, error: progressError } = await supabase
      .from(DB_TABLES.DEADLINE_PROGRESS)
      .insert(progressDetails)
      .select()
      .single();

    if (progressError) throw progressError;

    const { data: statusData, error: statusError } = await supabase
      .from(DB_TABLES.DEADLINE_STATUS)
      .insert({
        deadline_id: finalDeadlineId,
        status: (status || DEADLINE_STATUS.READING) as 'reading' | 'pending',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (statusError) throw statusError;

    activityService.trackUserActivity('deadline_created', {
      id: finalDeadlineId,
      book_title: deadlineDetails.book_title,
      dueDate: deadlineDetails.deadline_date,
      startingProgress: progressDetails.current_progress,
    });

    return {
      ...deadlineData,
      id: finalDeadlineId,
      user_id: userId,
      progress: progressData,
      status: [statusData],
    };
  }

  /**
   * Update an existing deadline
   */
  async updateDeadline(userId: string, params: UpdateDeadlineParams) {
    const { deadlineDetails, progressDetails, status } = params;

    const { data: deadlineData, error: deadlineError } = await supabase
      .from(DB_TABLES.DEADLINES)
      .update({
        ...deadlineDetails,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deadlineDetails.id!)
      .eq('user_id', userId)
      .select()
      .single();

    if (deadlineError) throw deadlineError;

    let progressData;
    if (progressDetails.id) {
      const { data: existingProgress } = await supabase
        .from(DB_TABLES.DEADLINE_PROGRESS)
        .select('*')
        .eq('id', progressDetails.id)
        .single();

      const updatePayload: any = {
        current_progress: progressDetails.current_progress!,
        ignore_in_calcs: progressDetails.ignore_in_calcs ?? true,
        updated_at: new Date().toISOString(),
      };

      if (
        existingProgress &&
        existingProgress.ignore_in_calcs === true &&
        progressDetails.ignore_in_calcs === false
      ) {
        updatePayload.created_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from(DB_TABLES.DEADLINE_PROGRESS)
        .update(updatePayload)
        .eq('id', progressDetails.id)
        .select()
        .single();

      if (error) throw error;
      progressData = data;
    } else {
      const finalProgressId = generateId('rdp');

      let timestamp: string;
      if (progressDetails.ignore_in_calcs) {
        const deadlineCreatedAt = new Date(deadlineData.created_at);
        deadlineCreatedAt.setDate(deadlineCreatedAt.getDate() - 1);
        timestamp = deadlineCreatedAt.toISOString();
      } else {
        timestamp = deadlineData.created_at;
      }

      const { data, error } = await supabase
        .from(DB_TABLES.DEADLINE_PROGRESS)
        .insert({
          id: finalProgressId,
          deadline_id: deadlineDetails.id!,
          current_progress: progressDetails.current_progress!,
          ignore_in_calcs: progressDetails.ignore_in_calcs ?? false,
          created_at: timestamp,
          updated_at: timestamp,
        })
        .select()
        .single();

      if (error) throw error;
      progressData = data;
    }

    if (status) {
      const { error: statusError } = await supabase
        .from(DB_TABLES.DEADLINE_STATUS)
        .insert({
          deadline_id: deadlineDetails.id!,
          status: status as 'reading' | 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (statusError) {
        console.warn('Failed to insert status:', statusError);
      }
    }

    activityService.trackUserActivity('deadline_updated', {
      id: deadlineDetails.id,
    });

    return { ...deadlineData, progress: progressData };
  }

  async updateDeadlineDate(
    userId: string,
    deadlineId: string,
    newDate: string
  ) {
    const { data, error } = await supabase
      .from(DB_TABLES.DEADLINES)
      .update({
        deadline_date: newDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deadlineId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    activityService.trackUserActivity('deadline_date_updated', {
      id: deadlineId,
      newDate,
    });
    return data;
  }

  /**
   * Delete a deadline
   */
  async deleteDeadline(userId: string, deadlineId: string) {
    const { error: progressError } = await supabase
      .from(DB_TABLES.DEADLINE_PROGRESS)
      .delete()
      .eq('deadline_id', deadlineId);

    if (progressError) throw progressError;

    const { error: deadlineError } = await supabase
      .from(DB_TABLES.DEADLINES)
      .delete()
      .eq('id', deadlineId)
      .eq('user_id', userId);

    if (deadlineError) throw deadlineError;

    activityService.trackUserActivity('deadline_deleted', {
      id: deadlineId,
    });

    return deadlineId;
  }

  /**
   * Update deadline progress
   */
  async updateDeadlineProgress(params: UpdateProgressParams) {
    const finalProgressId = generateId('rdp');

    const { data, error } = await supabase
      .from(DB_TABLES.DEADLINE_PROGRESS)
      .insert({
        id: finalProgressId,
        deadline_id: params.deadlineId,
        current_progress: params.currentProgress,
        time_spent_reading: params.timeSpentReading || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    activityService.trackUserActivity('progress_updated', {
      deadlineId: params.deadlineId,
      progress: params.currentProgress,
    });

    return data;
  }

  /**
   * Get all deadlines for a user
   *
   * @returns Deadlines with status and progress arrays ordered by created_at asc (oldest first, newest last)
   */
  async getDeadlines(userId: string): Promise<ReadingDeadlineWithProgress[]> {
    const { data, error } = await supabase
      .from(DB_TABLES.DEADLINES)
      .select(
        `
        *,
        progress:deadline_progress(*),
        status:deadline_status(*)
      ` as any
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const deadlines = data as unknown as ReadingDeadlineWithProgress[];
    return deadlines.map(sortDeadlineArrays);
  }

  /**
   * Get unique source values used by the user
   */
  async getUniqueSources(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from(DB_TABLES.DEADLINES)
      .select('source')
      .eq('user_id', userId)
      .order('source', { ascending: true });

    if (error) throw error;

    // Extract unique sources
    const uniqueSources = [...new Set(data?.map(d => d.source) || [])];
    return uniqueSources.filter(Boolean).sort();
  }

  /**
   * Get a single deadline by ID
   *
   * @returns Deadline with status and progress arrays ordered by created_at asc (oldest first, newest last)
   */
  async getDeadlineById(
    userId: string,
    deadlineId: string
  ): Promise<ReadingDeadlineWithProgress | null> {
    const { data, error } = await supabase
      .from(DB_TABLES.DEADLINES)
      .select(
        `
        *,
        progress:deadline_progress(*),
        status:deadline_status(*)
      ` as any
      )
      .eq('user_id', userId)
      .eq('id', deadlineId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    const deadline = data as unknown as ReadingDeadlineWithProgress;
    return sortDeadlineArrays(deadline);
  }

  /**
   * Updates deadline status with validation of allowed transitions
   *
   * Status is stored in the deadline_status table (NOT on deadlines table directly).
   * All status queries require a JOIN with deadline_status.
   * Status changes INSERT new records to maintain complete history.
   *
   * Valid transitions are enforced to maintain data integrity:
   * - pending → reading
   * - reading → to_review | complete | did_not_finish
   * - to_review → complete | did_not_finish
   * - complete → (terminal, no transitions)
   * - did_not_finish → (terminal, no transitions)
   *
   * @param userId - The authenticated user's ID
   * @param deadlineId - ID of the deadline to update
   * @param status - New status to transition to
   *
   * @returns Updated deadline with status and progress arrays ordered by created_at asc (oldest first, newest last)
   *
   * @throws {Error} "Deadline not found or access denied" - Invalid deadline or wrong user
   * @throws {Error} "Invalid status transition from {current} to {new}" - Blocked transition
   *
   * @example
   * // Valid: Move from reading to to_review
   * const deadline = await deadlinesService.updateDeadlineStatus(
   *   userId,
   *   'rd_123',
   *   'to_review'
   * );
   *
   * // Invalid: Would throw error
   * await deadlinesService.updateDeadlineStatus(userId, 'rd_123', 'pending');
   * // Error: "Invalid status transition from to_review to pending"
   *
   * @remarks
   * Critical architecture notes:
   * - Status field lives in deadline_status table, accessed via deadline_id foreign key
   * - Status changes INSERT new records to maintain complete history
   * - Query pattern: `SELECT d.*, ds.status FROM deadlines d JOIN deadline_status ds ON d.id = ds.deadline_id`
   * - Latest status determined by most recent created_at timestamp
   * - Status and progress arrays ordered by created_at asc (oldest first, newest last, last index is current)
   * - Overdue is NOT a status - it's a runtime calculation: `status = 'reading' AND deadline_date < CURRENT_DATE`
   * - 'paused' status was removed from the system and migrated to 'reading'
   * - Logs activity event for status changes
   */
  async updateDeadlineStatus(
    userId: string,
    deadlineId: string,
    status: 'complete' | 'to_review' | 'reading' | 'did_not_finish' | 'pending'
  ) {
    const validTransitions: Record<string, string[]> = {
      pending: ['reading'],
      reading: ['to_review', 'complete', 'did_not_finish'],
      to_review: ['complete', 'did_not_finish'],
      complete: [],
      did_not_finish: [],
    };

    const { data: deadline } = await supabase
      .from(DB_TABLES.DEADLINES)
      .select(
        `
        id,
        status:deadline_status(status,created_at)
      ` as any
      )
      .eq('id', deadlineId)
      .eq('user_id', userId)
      .single();

    if (!deadline) {
      throw new Error('Deadline not found or access denied');
    }

    const deadlineData = deadline as unknown as { id: string; status: { status: string }[] };
    const currentStatusArray = deadlineData.status;
    const currentStatusData =
      currentStatusArray && currentStatusArray.length > 0
        ? currentStatusArray[currentStatusArray.length - 1]
        : null;

    if (currentStatusData && currentStatusData.status) {
      const currentStatus = currentStatusData.status;
      const allowedTransitions = validTransitions[currentStatus as string] || [];

      if (!allowedTransitions.includes(status) && currentStatus !== status) {
        throw new Error(
          `Invalid status transition from ${currentStatus} to ${status}`
        );
      }
    }

    const { error } = await supabase
      .from(DB_TABLES.DEADLINE_STATUS)
      .insert({
        deadline_id: deadlineId,
        status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    activityService.trackUserActivity('status_updated', {
      deadlineId,
      status,
    });

    const { data: updatedDeadline } = await supabase
      .from(DB_TABLES.DEADLINES)
      .select(
        `
        *,
        progress:deadline_progress(*),
        status:deadline_status(*)
      ` as any
      )
      .eq('id', deadlineId)
      .eq('user_id', userId)
      .single();

    return sortDeadlineArrays(updatedDeadline as unknown as ReadingDeadlineWithProgress);
  }

  /**
   * Complete a deadline (sets progress to max if needed)
   */
  async completeDeadline(userId: string, deadlineId: string) {
    const { data: deadline, error: deadlineError } = await supabase
      .from(DB_TABLES.DEADLINES)
      .select(
        `
        *,
        progress:deadline_progress(*)
      `
      )
      .eq('id', deadlineId)
      .eq('user_id', userId)
      .single();

    if (deadlineError) throw deadlineError;

    const latestProgress =
      deadline.progress?.length > 0
        ? Math.max(...deadline.progress.map(p => p.current_progress))
        : 0;

    if (latestProgress < deadline.total_quantity) {
      const finalProgressId = generateId('rdp');
      const { error: progressError } = await supabase
        .from(DB_TABLES.DEADLINE_PROGRESS)
        .insert({
          id: finalProgressId,
          deadline_id: deadlineId,
          current_progress: deadline.total_quantity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (progressError) throw progressError;
    }

    // Now mark as complete
    return this.updateDeadlineStatus(
      userId,
      deadlineId,
      DEADLINE_STATUS.COMPLETE
    );
  }

  /**
   * Delete future progress entries
   */
  async deleteFutureProgress(deadlineId: string, newProgress: number) {
    const { error } = await supabase
      .from(DB_TABLES.DEADLINE_PROGRESS)
      .delete()
      .eq('deadline_id', deadlineId)
      .gt('current_progress', newProgress);

    if (error) throw error;

    activityService.trackUserActivity('future_progress_deleted', {
      deadlineId,
    });

    return { deadlineId, newProgress };
  }

  /**
   * Get deadline history for calendar view
   *
   * @returns Deadlines with status and progress arrays ordered by created_at asc (oldest first, newest last)
   */
  async getDeadlineHistory(params: DeadlineHistoryParams) {
    const { userId, formats } = params;

    let query = supabase
      .from(DB_TABLES.DEADLINES)
      .select(
        `
        id,
        book_title,
        author,
        format,
        total_quantity,
        deadline_date,
        source,
        flexibility,
        created_at,
        deadline_progress (
          id,
          current_progress,
          created_at,
          updated_at
        ),
        deadline_status (
          id,
          status,
          created_at
        )
      ` as any
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (formats && formats.length > 0) {
      query = query.in('format', formats);
    }

    const { data: deadlines, error } = await query;

    if (error) throw error;
    return deadlines;
  }

  async getUserProgressForToday(userId: string) {
    const today = dayjs().startOf('day').toISOString();
    const { data, error } = await supabase
      .from(DB_TABLES.DEADLINE_PROGRESS)
      .select('*, deadline:deadlines(format, total_quantity)')
      .eq('user_id', userId)
      .eq('created_at', today);

    if (error) throw error;
    return data;
  }
}

export const deadlinesService = new DeadlinesService();
