import {
  ALTERNATE_COVER_CONFIG,
  DB_TABLES,
  STORAGE_BUCKETS,
} from '@/constants/database';
import { DEADLINE_STATUS, VALID_STATUS_TRANSITIONS } from '@/constants/status';
import { analytics } from '@/lib/analytics/client';
import { dayjs } from '@/lib/dayjs';
import { generateId, supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
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
  bookData?: {
    api_id: string;
    book_id?: string;
    api_source?: string;
    google_volume_id?: string;
    isbn?: string;
  };
}

export interface UpdateDeadlineParams {
  deadlineDetails: ReadingDeadlineInsert;
  progressDetails: ReadingDeadlineProgressInsert;
  status?: string;
  bookData?: {
    api_id: string;
    book_id?: string;
    api_source?: string;
    google_volume_id?: string;
    isbn?: string;
  };
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
        try {
          let bookResponse;

          // Use appropriate identifier based on api_source
          if (bookData.api_source === 'google_books') {
            // For Google Books, use google_volume_id or isbn
            if (bookData.isbn) {
              bookResponse = await booksService.fetchBookData({
                isbn: bookData.isbn,
              });
            } else if (bookData.google_volume_id) {
              bookResponse = await booksService.fetchBookData({
                google_volume_id: bookData.google_volume_id,
              });
            } else {
              // Fallback to api_id for Google Books
              bookResponse = await booksService.fetchBookData({
                google_volume_id: bookData.api_id,
              });
            }
          } else {
            // For Goodreads or legacy sources, use api_id
            bookResponse = await booksService.fetchBookData(bookData.api_id);
          }

          if (bookResponse) {
            const finalNewBookId = generateId('book');
            try {
              await booksService.insertBook(finalNewBookId, bookResponse);
              finalBookId = finalNewBookId;
            } catch (insertError: any) {
              if (insertError?.code === '23505' && bookData.google_volume_id) {
                const { data: existingBookByVolumeIdResults } = await supabase
                  .from(DB_TABLES.BOOKS)
                  .select('id')
                  .eq('google_volume_id', bookData.google_volume_id)
                  .limit(1);

                const existingBookByVolumeId =
                  existingBookByVolumeIdResults?.[0];

                if (existingBookByVolumeId) {
                  finalBookId = existingBookByVolumeId.id;
                }
              } else {
                throw insertError;
              }
            }
          }
        } catch (bookError) {
          console.warn('Failed to fetch/insert book data:', bookError);
        }
      }
    } else if (bookData?.book_id) {
      finalBookId = bookData.book_id;
    }

    const { data: deadlineDataResults, error: deadlineError } = await supabase
      .from(DB_TABLES.DEADLINES)
      .insert({
        ...deadlineDetails,
        book_id: finalBookId || null,
        user_id: userId,
      })
      .select()
      .limit(1);

    const deadlineData = deadlineDataResults?.[0];

    if (deadlineError) throw deadlineError;

    // Set to yesterday to exclude from today's reading goal calculations
    if (progressDetails.ignore_in_calcs) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      progressDetails.created_at = yesterday.toISOString();
      progressDetails.updated_at = yesterday.toISOString();
    }

    const { data: progressDataResults, error: progressError } = await supabase
      .from(DB_TABLES.DEADLINE_PROGRESS)
      .insert(progressDetails)
      .select()
      .limit(1);

    const progressData = progressDataResults?.[0];

    if (progressError) throw progressError;

    const { data: statusDataResults, error: statusError } = await supabase
      .from(DB_TABLES.DEADLINE_STATUS)
      .insert({
        deadline_id: finalDeadlineId,
        status: (status || DEADLINE_STATUS.READING) as 'reading' | 'pending',
        updated_at: new Date().toISOString(),
      })
      .select()
      .limit(1);

    const statusData = statusDataResults?.[0];

    if (statusError) throw statusError;

    activityService.trackUserActivity(
      'deadline_created',
      {
        id: finalDeadlineId,
        book_title: deadlineDetails.book_title,
        dueDate: deadlineDetails.deadline_date,
        startingProgress: progressDetails.current_progress,
      },
      userId
    );

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

    const { data: deadlineDataResults, error: deadlineError } = await supabase
      .from(DB_TABLES.DEADLINES)
      .update({
        ...deadlineDetails,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deadlineDetails.id!)
      .eq('user_id', userId)
      .select()
      .limit(1);

    const deadlineData = deadlineDataResults?.[0];

    if (!deadlineData) {
      return null;
    }

    if (deadlineError) throw deadlineError;

    let progressData;
    if (progressDetails.id) {
      const { data: existingProgressResults } = await supabase
        .from(DB_TABLES.DEADLINE_PROGRESS)
        .select('*')
        .eq('id', progressDetails.id)
        .limit(1);

      const existingProgress = existingProgressResults?.[0];

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

      const { data: updateResults, error } = await supabase
        .from(DB_TABLES.DEADLINE_PROGRESS)
        .update(updatePayload)
        .eq('id', progressDetails.id)
        .select()
        .limit(1);

      if (error) throw error;
      progressData = updateResults?.[0];
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

      const { data: insertResults, error } = await supabase
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
        .limit(1);

      if (error) throw error;
      progressData = insertResults?.[0];
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
        .limit(1);

      if (statusError) {
        console.warn('Failed to insert status:', statusError);
      }
    }

    activityService.trackUserActivity(
      'deadline_updated',
      {
        id: deadlineDetails.id,
      },
      userId
    );

    return { ...deadlineData, progress: progressData };
  }

  async updateDeadlineDate(
    userId: string,
    deadlineId: string,
    newDate: string
  ) {
    const { data: updateResults, error } = await supabase
      .from(DB_TABLES.DEADLINES)
      .update({
        deadline_date: newDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deadlineId)
      .eq('user_id', userId)
      .select()
      .limit(1);

    const data = updateResults?.[0];

    if (error) throw error;

    activityService.trackUserActivity(
      'deadline_date_updated',
      {
        id: deadlineId,
        newDate,
      },
      userId
    );
    return data;
  }

  /**
   * Delete a deadline
   */
  async deleteDeadline(userId: string, deadlineId: string) {
    // Fetch deadline to get cover_image_url before deletion
    const { data: deadlineResults } = await supabase
      .from(DB_TABLES.DEADLINES)
      .select('cover_image_url')
      .eq('id', deadlineId)
      .eq('user_id', userId)
      .limit(1);

    const deadline = deadlineResults?.[0];

    // Clean up cover image from storage if exists
    if (deadline?.cover_image_url) {
      try {
        // Only delete if it's in the alternate-covers bucket (not external URLs)
        if (
          deadline.cover_image_url.includes(STORAGE_BUCKETS.ALTERNATE_COVERS)
        ) {
          const { error: deleteError } = await supabase.storage
            .from(STORAGE_BUCKETS.ALTERNATE_COVERS)
            .remove([deadline.cover_image_url]);

          if (deleteError) {
            console.warn('Failed to delete cover image:', deleteError);
          }
        }
      } catch (error) {
        console.warn('Error cleaning up cover image:', error);
      }
    }

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

    activityService.trackUserActivity(
      'deadline_deleted',
      {
        id: deadlineId,
      },
      userId
    );

    return deadlineId;
  }

  /**
   * Update deadline progress
   */
  async updateDeadlineProgress(params: UpdateProgressParams) {
    const finalProgressId = generateId('rdp');

    const { data: insertResults, error } = await supabase
      .from(DB_TABLES.DEADLINE_PROGRESS)
      .insert({
        id: finalProgressId,
        deadline_id: params.deadlineId,
        current_progress: params.currentProgress,
        time_spent_reading: params.timeSpentReading || null,
      })
      .select()
      .limit(1);

    const data = insertResults?.[0];

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
        status:deadline_status(*),
        books(publisher)
      ` as any
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const deadlines = data as unknown as ReadingDeadlineWithProgress[];
    return deadlines.map(d => {
      const normalized = {
        ...d,
        type: (d as any).deadline_type || 'Personal',
      };
      return sortDeadlineArrays(normalized);
    });
  }

  /**
   * Get unique type values used by the user
   */
  async getUniqueDeadlineTypes(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from(DB_TABLES.DEADLINES)
      .select('deadline_type')
      .eq('user_id', userId);

    if (error) throw error;

    const uniqueTypes = [
      ...new Set(
        data
          ?.map(d => d.deadline_type)
          .filter((s): s is string => s !== null) || []
      ),
    ];
    return uniqueTypes.sort();
  }

  /**
   * Get unique acquisition source values used by the user
   */
  async getUniqueAcquisitionSources(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from(DB_TABLES.DEADLINES)
      .select('acquisition_source')
      .eq('user_id', userId);

    if (error) throw error;

    const uniqueSources = [
      ...new Set(
        data
          ?.map(d => d.acquisition_source)
          .filter((s): s is string => s !== null) || []
      ),
    ];
    return uniqueSources.sort();
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
    const { data: results, error } = await supabase
      .from(DB_TABLES.DEADLINES)
      .select(
        `
        *,
        progress:deadline_progress(*),
        status:deadline_status(*),
        books(publisher)
      ` as any
      )
      .eq('user_id', userId)
      .eq('id', deadlineId)
      .limit(1);

    const data = results?.[0];

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    const deadline = data as unknown as ReadingDeadlineWithProgress;
    const normalizedDeadline = {
      ...deadline,
      type: (deadline as any).deadline_type || 'Personal',
    };
    return sortDeadlineArrays(normalizedDeadline);
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
   * @param options - Optional configuration for optimization
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
   * - Logs activity event for status changes
   */
  async updateDeadlineStatus(
    userId: string,
    deadlineId: string,
    status: Database['public']['Enums']['deadline_status_enum'],
    options?: { skipValidation?: boolean; skipRefetch?: boolean }
  ) {
    if (!options?.skipValidation) {
      const { data: deadlineResults } = await supabase
        .from(DB_TABLES.DEADLINES)
        .select(
          `
        id,
        status:deadline_status(status,created_at)
      ` as any
        )
        .eq('id', deadlineId)
        .eq('user_id', userId)
        .limit(1);

      const deadline = deadlineResults?.[0];

      if (!deadline) {
        throw new Error('Deadline not found or access denied');
      }

      const deadlineData = deadline as unknown as {
        id: string;
        status: { status: string }[];
      };
      const currentStatusArray = deadlineData.status;
      const currentStatusData =
        currentStatusArray && currentStatusArray.length > 0
          ? currentStatusArray[currentStatusArray.length - 1]
          : null;

      if (currentStatusData && currentStatusData.status) {
        const currentStatus = currentStatusData.status;
        const allowedTransitions =
          VALID_STATUS_TRANSITIONS[
            currentStatus as keyof typeof VALID_STATUS_TRANSITIONS
          ] || [];

        if (!allowedTransitions.includes(status) && currentStatus !== status) {
          throw new Error(
            `Invalid status transition from ${currentStatus} to ${status}`
          );
        }
      }
    }

    const insertQuery = supabase.from(DB_TABLES.DEADLINE_STATUS).insert({
      deadline_id: deadlineId,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const { error } = options?.skipRefetch
      ? await insertQuery
      : await insertQuery.select().limit(1);

    if (error) throw error;

    activityService.trackUserActivity(
      'status_updated',
      {
        deadlineId,
        status,
      },
      userId
    );

    if (options?.skipRefetch) {
      return null as any;
    }

    const { data: updatedDeadlineResults } = await supabase
      .from(DB_TABLES.DEADLINES)
      .select(
        `
        *,
        progress:deadline_progress(*),
        status:deadline_status(*),
        books(publisher)
      ` as any
      )
      .eq('id', deadlineId)
      .eq('user_id', userId)
      .limit(1);

    const updatedDeadline = updatedDeadlineResults?.[0];

    return sortDeadlineArrays(
      updatedDeadline as unknown as ReadingDeadlineWithProgress
    );
  }

  /**
   * Complete a deadline (sets progress to max if needed)
   */
  async completeDeadline(
    userId: string,
    deadlineId: string,
    existingDeadline?: {
      total_quantity: number;
      progress?: { current_progress: number }[];
    }
  ) {
    let deadline: {
      total_quantity: number;
      progress?: { current_progress: number }[];
    };

    if (existingDeadline) {
      deadline = existingDeadline;
    } else {
      const { data: deadlineResults, error: deadlineError } = await supabase
        .from(DB_TABLES.DEADLINES)
        .select(
          'id, total_quantity, progress:deadline_progress(current_progress)'
        )
        .eq('id', deadlineId)
        .eq('user_id', userId)
        .limit(1);

      const fetchedDeadline = deadlineResults?.[0];

      if (deadlineError || !fetchedDeadline) {
        throw new Error('Deadline not found or access denied');
      }

      deadline = fetchedDeadline;
    }

    const latestProgress =
      deadline.progress && deadline.progress.length > 0
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

    const result = await this.updateDeadlineStatus(
      userId,
      deadlineId,
      DEADLINE_STATUS.COMPLETE,
      {
        skipValidation: true,
        skipRefetch: true,
      }
    );

    return result;
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
        deadline_type,
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

    return (
      deadlines?.map((d: any) => ({
        ...d,
        type: d.deadline_type,
      })) || []
    );
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

  /**
   * Get daily activities for calendar view
   * Fetches all activity types (deadlines due, created, progress, status, notes, reviews) for a date range
   * @param userId - User ID
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @returns Array of daily activities grouped by date
   */
  async getDailyActivities(userId: string, startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase.rpc('get_daily_activities', {
        p_user_id: userId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) {
        console.error('Error fetching daily activities:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get daily activities:', error);
      analytics.track('daily_activities_fetch_failed', {
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Upload a cover image for a deadline
   * @param userId - User ID
   * @param uri - Local file URI
   * @param oldCoverPath - Optional path to existing cover to delete
   * @returns Storage path of uploaded image
   */
  async uploadCoverImage(
    userId: string,
    uri: string,
    oldCoverPath?: string | null
  ) {
    try {
      // Clean up old cover if path provided
      if (oldCoverPath) {
        try {
          await supabase.storage
            .from(STORAGE_BUCKETS.ALTERNATE_COVERS)
            .remove([oldCoverPath]);
        } catch (cleanupError) {
          console.warn('Failed to delete old cover:', cleanupError);
          // Continue with upload even if cleanup fails
        }
      }

      // Convert URI to ArrayBuffer
      const arraybuffer = await fetch(uri).then(res => res.arrayBuffer());

      // Extract file extension
      const fileExt = uri.split('.').pop()?.toLowerCase() ?? 'jpeg';

      // Generate unique filename with timestamp
      const fileName = `${ALTERNATE_COVER_CONFIG.FILE_PREFIX}${Date.now()}.${fileExt}`;
      const path = `${userId}/deadline-covers/${fileName}`;

      // Upload to storage
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.ALTERNATE_COVERS)
        .upload(path, arraybuffer, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (error) throw error;

      return { path: data.path };
    } catch (err) {
      console.error('Cover image upload error:', err);
      throw err;
    }
  }

  /**
   * Delete a cover image from storage
   * @param coverPath - Storage path to the cover image
   */
  async deleteCoverImage(coverPath: string) {
    try {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKETS.ALTERNATE_COVERS)
        .remove([coverPath]);

      if (error) throw error;
    } catch (err) {
      console.error('Cover image deletion error:', err);
      throw err;
    }
  }
}

export const deadlinesService = new DeadlinesService();
