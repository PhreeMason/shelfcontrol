import { dayjs } from '@/lib/dayjs';
import { generateId, supabase } from '@/lib/supabase';
import {
  ReadingDeadlineInsert,
  ReadingDeadlineProgressInsert,
  ReadingDeadlineWithProgress,
} from '@/types/deadline.types';
import { booksService } from './books.service';

export interface AddDeadlineParams {
  deadlineDetails: Omit<ReadingDeadlineInsert, 'user_id'>;
  progressDetails: ReadingDeadlineProgressInsert;
  bookData?: { api_id: string; book_id?: string };
}

export interface UpdateDeadlineParams {
  deadlineDetails: ReadingDeadlineInsert;
  progressDetails: ReadingDeadlineProgressInsert;
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
    const { deadlineDetails, progressDetails, bookData } = params;

    // Generate IDs
    const finalDeadlineId = generateId('rd');
    const finalProgressId = generateId('rdp');

    deadlineDetails.id = finalDeadlineId;
    progressDetails.id = finalProgressId;
    progressDetails.deadline_id = finalDeadlineId;

    // Handle book linking if bookData is provided
    let finalBookId = deadlineDetails.book_id;
    if (bookData?.api_id && !bookData.book_id) {
      // Check if book exists first
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

    // Insert deadline
    const { data: deadlineData, error: deadlineError } = await supabase
      .from('deadlines')
      .insert({
        ...deadlineDetails,
        book_id: finalBookId || null,
        user_id: userId,
      })
      .select()
      .single();

    if (deadlineError) throw deadlineError;

    // Insert progress
    const { data: progressData, error: progressError } = await supabase
      .from('deadline_progress')
      .insert(progressDetails)
      .select()
      .single();

    if (progressError) throw progressError;

    // Create initial status
    const { data: statusData, error: statusError } = await supabase
      .from('deadline_status')
      .insert({
        deadline_id: finalDeadlineId,
        status: 'reading',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (statusError) throw statusError;

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
    const { deadlineDetails, progressDetails } = params;

    // Update deadline
    const { data: deadlineData, error: deadlineError } = await supabase
      .from('deadlines')
      .update({
        ...deadlineDetails,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deadlineDetails.id!)
      .eq('user_id', userId)
      .select()
      .single();

    if (deadlineError) throw deadlineError;

    // Update or create progress entry
    let progressData;
    if (progressDetails.id) {
      // Update existing progress
      const { data, error } = await supabase
        .from('deadline_progress')
        .update({
          current_progress: progressDetails.current_progress!,
          updated_at: new Date().toISOString(),
        })
        .eq('id', progressDetails.id)
        .select()
        .single();

      if (error) throw error;
      progressData = data;
    } else {
      // Create new progress entry
      const finalProgressId = generateId('rdp');
      const { data, error } = await supabase
        .from('deadline_progress')
        .insert({
          id: finalProgressId,
          deadline_id: deadlineDetails.id!,
          current_progress: progressDetails.current_progress!,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      progressData = data;
    }

    return { ...deadlineData, progress: progressData };
  }

  /**
   * Delete a deadline
   */
  async deleteDeadline(userId: string, deadlineId: string) {
    // Delete associated progress entries first
    const { error: progressError } = await supabase
      .from('deadline_progress')
      .delete()
      .eq('deadline_id', deadlineId);

    if (progressError) throw progressError;

    // Delete the deadline
    const { error: deadlineError } = await supabase
      .from('deadlines')
      .delete()
      .eq('id', deadlineId)
      .eq('user_id', userId);

    if (deadlineError) throw deadlineError;

    return deadlineId;
  }

  /**
   * Update deadline progress
   */
  async updateDeadlineProgress(params: UpdateProgressParams) {
    const finalProgressId = generateId('rdp');

    const { data, error } = await supabase
      .from('deadline_progress')
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
    return data;
  }

  /**
   * Get all deadlines for a user
   */
  async getDeadlines(userId: string): Promise<ReadingDeadlineWithProgress[]> {
    const { data, error } = await supabase
      .from('deadlines')
      .select(
        `
        *,
        progress:deadline_progress(*),
        status:deadline_status(*)
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ReadingDeadlineWithProgress[];
  }


  /**
   * Get unique source values used by the user
   */
  async getUniqueSources(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('deadlines')
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
   */
  async getDeadlineById(
    userId: string,
    deadlineId: string
  ): Promise<ReadingDeadlineWithProgress | null> {
    const { data, error } = await supabase
      .from('deadlines')
      .select(
        `
        *,
        progress:deadline_progress(*),
        status:deadline_status(*)
      `
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

    return data as ReadingDeadlineWithProgress;
  }

  /**
   * Update deadline status (complete, set_aside, reading)
   */
  async updateDeadlineStatus(
    deadlineId: string,
    status: 'complete' | 'set_aside' | 'reading'
  ) {
    const { data, error } = await supabase
      .from('deadline_status')
      .insert({
        deadline_id: deadlineId,
        status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Complete a deadline (sets progress to max if needed)
   */
  async completeDeadline(userId: string, deadlineId: string) {
    // First, get the deadline details
    const { data: deadline, error: deadlineError } = await supabase
      .from('deadlines')
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

    // Calculate current progress
    const latestProgress =
      deadline.progress?.length > 0
        ? Math.max(...deadline.progress.map(p => p.current_progress))
        : 0;

    // If current progress is not at max, update it
    if (latestProgress < deadline.total_quantity) {
      const finalProgressId = generateId('rdp');
      const { error: progressError } = await supabase
        .from('deadline_progress')
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
    return this.updateDeadlineStatus(deadlineId, 'complete');
  }

  /**
   * Delete future progress entries
   */
  async deleteFutureProgress(deadlineId: string, newProgress: number) {
    const { error } = await supabase
      .from('deadline_progress')
      .delete()
      .eq('deadline_id', deadlineId)
      .gt('current_progress', newProgress);

    if (error) throw error;
    return { deadlineId, newProgress };
  }

  /**
   * Get deadline history for calendar view
   */
  async getDeadlineHistory(params: DeadlineHistoryParams) {
    const { userId, formats } = params;

    let query = supabase
      .from('deadlines')
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
      `
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
      .from('deadline_progress')
      .select('*, deadline:deadlines(format, total_quantity)')
      .eq('user_id', userId)
      .eq('created_at', today);

    if (error) throw error;
    return data;
  }
}

export const deadlinesService = new DeadlinesService();
