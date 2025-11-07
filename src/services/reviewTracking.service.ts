import { DB_TABLES } from '@/constants/database';
import { generateId, supabase } from '@/lib/supabase';
import { notesService } from './notes.service';

export interface CreateReviewTrackingParams {
  deadline_id: string;
  review_due_date?: string;
  needs_link_submission: boolean;
  review_notes?: string;
  platforms: { name: string }[];
}

export interface UpdateReviewPlatformsParams {
  platforms: {
    id: string;
    posted: boolean;
    review_url?: string | null;
  }[];
}

export interface UpdateReviewTrackingParams {
  review_tracking_id: string;
  review_due_date?: string | null;
  needs_link_submission: boolean;
  platforms: { name: string }[];
  review_notes?: string;
}

export interface ReviewTrackingResponse {
  review_tracking: {
    id: string;
    deadline_id: string;
    review_due_date: string | null;
    needs_link_submission: boolean;
    all_reviews_complete: boolean;
  };
  platforms: {
    id: string;
    platform_name: string;
    posted: boolean;
    posted_date: string | null;
    review_url: string | null;
  }[];
  completion_percentage: number;
}

class ReviewTrackingService {
  /**
   * Initializes review tracking for a deadline
   *
   * Creates review_tracking record, review_platforms records for all selected platforms,
   * and optionally creates a deadline_notes entry if review notes are provided.
   *
   * @param userId - The authenticated user's ID
   * @param params - Review tracking configuration
   * @param params.deadline_id - ID of the deadline to track reviews for
   * @param params.review_due_date - Optional ISO date string for review deadline
   * @param params.needs_link_submission - Whether user needs to submit review URLs
   * @param params.review_notes - Optional review thoughts (saved to deadline_notes table)
   * @param params.platforms - Array of platforms (min 1 required). Can include preset
   *                           platforms (NetGalley, Goodreads, etc.) or custom strings
   *
   * @returns Object containing the created review_tracking_id
   *
   * @throws {Error} "At least one platform must be selected" - Empty platforms array
   * @throws {Error} "Deadline not found or access denied" - Invalid deadline or wrong user
   * @throws {Error} "Review tracking already exists for this deadline" - Duplicate attempt
   *
   * @example
   * const result = await reviewTrackingService.createReviewTracking(userId, {
   *   deadline_id: 'rd_123',
   *   review_due_date: '2025-10-30',
   *   needs_link_submission: true,
   *   review_notes: 'Great romantic tension!',
   *   platforms: [
   *     { name: 'NetGalley' },
   *     { name: 'Goodreads' },
   *     { name: 'My Blog' }
   *   ]
   * });
   *
   * @remarks
   * - If review_notes provided, fetches current progress from deadline_progress table
   *   and stores it in deadline_notes.deadline_progress field as a percentage (0-100)
   * - All platforms treated equally for completion tracking (no required/optional)
   * - Creates unique review_tracking record per deadline (enforced by DB constraint)
   */
  async createReviewTracking(
    userId: string,
    params: CreateReviewTrackingParams
  ) {
    const {
      deadline_id,
      review_due_date,
      needs_link_submission,
      review_notes,
      platforms,
    } = params;

    if (!platforms || platforms.length === 0) {
      throw new Error('At least one platform must be selected');
    }

    const { data: deadlineResults, error: deadlineError } = await supabase
      .from(DB_TABLES.DEADLINES)
      .select('id, user_id, total_quantity')
      .eq('id', deadline_id)
      .eq('user_id', userId)
      .limit(1);

    const deadline = deadlineResults?.[0];

    if (deadlineError || !deadline) {
      throw new Error('Deadline not found or access denied');
    }

    const { data: existingTrackingResults } = await supabase
      .from(DB_TABLES.REVIEW_TRACKING)
      .select('id')
      .eq('deadline_id', deadline_id)
      .limit(1);

    const existingTracking = existingTrackingResults?.[0];

    if (existingTracking) {
      throw new Error('Review tracking already exists for this deadline');
    }

    const reviewTrackingId = generateId('rt');

    const { error: reviewTrackingError } = await supabase
      .from(DB_TABLES.REVIEW_TRACKING)
      .insert({
        id: reviewTrackingId,
        deadline_id,
        review_due_date: review_due_date || null,
        needs_link_submission,
        all_reviews_complete: false,
      })
      .select()
      .limit(1);

    if (reviewTrackingError) throw reviewTrackingError;

    const platformRecords = platforms.map(platform => ({
      id: generateId('rp'),
      review_tracking_id: reviewTrackingId,
      platform_name: platform.name,
      posted: false,
      posted_date: null,
      review_url: null,
    }));

    const { error: platformsError } = await supabase
      .from(DB_TABLES.REVIEW_PLATFORMS)
      .insert(platformRecords)
      .select();

    if (platformsError) throw platformsError;

    if (review_notes) {
      // Use notesService to create note - it handles progress calculation and hashtag sync automatically
      try {
        await notesService.addNote(userId, deadline_id, review_notes);
      } catch (noteError) {
        console.warn('Failed to create review note:', noteError);
      }
    }

    return { review_tracking_id: reviewTrackingId };
  }

  /**
   * Batch updates platform posted status and review URLs
   *
   * Updates multiple review platforms in a single operation, recalculates completion
   * percentage, and returns the updated progress.
   *
   * @param userId - The authenticated user's ID
   * @param reviewTrackingId - ID of the review_tracking record
   * @param params - Platform updates to apply
   * @param params.platforms - Array of platform updates
   * @param params.platforms[].id - Platform record ID to update
   * @param params.platforms[].posted - New posted status
   * @param params.platforms[].review_url - Optional review URL (only if posted)
   *
   * @returns Object containing recalculated completion_percentage (0-100)
   *
   * @throws {Error} "Review tracking not found" - Invalid reviewTrackingId
   * @throws {Error} "Review tracking not found or access denied" - Wrong user
   *
   * @example
   * const result = await reviewTrackingService.updateReviewPlatforms(
   *   userId,
   *   'rt_456',
   *   {
   *     platforms: [
   *       { id: 'rp_001', posted: true, review_url: 'https://netgalley.com/review/123' },
   *       { id: 'rp_002', posted: true }
   *     ]
   *   }
   * );
   * // Returns: { completion_percentage: 67 }
   *
   * @remarks
   * - Sets posted_date to current timestamp when posted: true
   * - Completion calculated as: Math.round((posted / total) * 100)
   * - Updates are not atomic; individual failures logged but don't halt batch
   * - Validates ownership via deadline → user_id relationship
   */
  async updateReviewPlatforms(
    userId: string,
    reviewTrackingId: string,
    params: UpdateReviewPlatformsParams
  ) {
    const { data: reviewTrackingResults, error: trackingError } = await supabase
      .from(DB_TABLES.REVIEW_TRACKING)
      .select('id, deadline_id')
      .eq('id', reviewTrackingId)
      .limit(1);

    const reviewTracking = reviewTrackingResults?.[0];

    if (trackingError || !reviewTracking) {
      throw new Error('Review tracking not found');
    }

    const { data: deadlineResults, error: deadlineError } = await supabase
      .from(DB_TABLES.DEADLINES)
      .select('id, user_id')
      .eq('id', reviewTracking.deadline_id)
      .eq('user_id', userId)
      .limit(1);

    const deadline = deadlineResults?.[0];

    if (deadlineError || !deadline) {
      throw new Error('Review tracking not found or access denied');
    }

    for (const platform of params.platforms) {
      const { data: currentPlatformResults } = await supabase
        .from(DB_TABLES.REVIEW_PLATFORMS)
        .select('posted, posted_date')
        .eq('id', platform.id)
        .limit(1);

      const currentPlatform = currentPlatformResults?.[0];

      const updatePayload: any = {
        posted: platform.posted,
        updated_at: new Date().toISOString(),
      };

      // Only set posted_date when changing from false to true
      if (platform.posted && currentPlatform && !currentPlatform.posted) {
        updatePayload.posted_date = new Date().toISOString();
      }

      if (platform.review_url !== undefined) {
        updatePayload.review_url = platform.review_url;
      }

      const { error: updateError } = await supabase
        .from(DB_TABLES.REVIEW_PLATFORMS)
        .update(updatePayload)
        .eq('id', platform.id)
        .limit(1);

      if (updateError) {
        console.warn(`Failed to update platform ${platform.id}:`, updateError);
      }
    }

    const { data: allPlatforms } = await supabase
      .from(DB_TABLES.REVIEW_PLATFORMS)
      .select('*')
      .eq('review_tracking_id', reviewTrackingId);

    const totalPlatforms = allPlatforms?.length || 0;
    const postedPlatforms = allPlatforms?.filter(p => p.posted).length || 0;
    const completion_percentage =
      totalPlatforms > 0
        ? Math.round((postedPlatforms / totalPlatforms) * 100)
        : 0;

    return { completion_percentage };
  }

  /**
   * Fetches all unique platform names used by a user across all their reviews
   *
   * Returns a list of distinct platform names, ordered by most recently used.
   * Useful for populating platform suggestions based on user history.
   *
   * @param userId - The authenticated user's ID
   *
   * @returns Array of unique platform names ordered by most recent usage
   *
   * @example
   * const platforms = await reviewTrackingService.getUserPlatforms(userId);
   * // Returns: ["NetGalley", "Goodreads", "Blog: https://myblog.com", "Instagram"]
   *
   * @remarks
   * - Platforms are deduplicated (case-sensitive)
   * - Includes all platform types: presets, custom, and blog URLs
   * - Blog entries stored as "Blog: <url>" format
   * - Returns empty array if user has no review history
   */
  async getUserPlatforms(userId: string): Promise<string[]> {
    const { data: deadlines } = await supabase
      .from(DB_TABLES.DEADLINES)
      .select('id')
      .eq('user_id', userId);

    if (!deadlines || deadlines.length === 0) {
      return [];
    }

    const deadlineIds = deadlines.map(d => d.id);

    const { data: reviewTracking } = await supabase
      .from(DB_TABLES.REVIEW_TRACKING)
      .select('id')
      .in('deadline_id', deadlineIds);

    if (!reviewTracking || reviewTracking.length === 0) {
      return [];
    }

    const reviewTrackingIds = reviewTracking.map(rt => rt.id);

    const { data: platforms, error } = await supabase
      .from(DB_TABLES.REVIEW_PLATFORMS)
      .select('platform_name, created_at')
      .in('review_tracking_id', reviewTrackingIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching user platforms:', error);
      return [];
    }

    if (!platforms || platforms.length === 0) {
      return [];
    }

    const uniquePlatforms = Array.from(
      new Set(platforms.map(p => p.platform_name))
    );

    return uniquePlatforms;
  }

  /**
   * Fetches review tracking data for a specific deadline
   *
   * Returns complete review tracking information including all platforms and
   * calculated completion percentage. Returns null if no review tracking exists
   * for the deadline (not an error condition).
   *
   * @param userId - The authenticated user's ID
   * @param deadlineId - ID of the deadline to fetch review tracking for
   *
   * @returns ReviewTrackingResponse object or null if no tracking exists
   *
   * @throws {Error} "Deadline not found or access denied" - Invalid deadline or wrong user
   *
   * @example
   * const tracking = await reviewTrackingService.getReviewTrackingByDeadline(
   *   userId,
   *   'rd_123'
   * );
   *
   * @remarks
   * - Returns null for PGRST116 error (not found) - this is expected behavior
   * - Completion percentage calculated as: Math.round((posted / total) * 100)
   * - Validates user owns deadline before fetching tracking data
   * - Includes all platform records with posted status and optional URLs
   */
  async getReviewTrackingByDeadline(
    userId: string,
    deadlineId: string
  ): Promise<ReviewTrackingResponse | null> {
    const { data: deadlineResults, error: deadlineError } = await supabase
      .from(DB_TABLES.DEADLINES)
      .select('id, user_id')
      .eq('id', deadlineId)
      .eq('user_id', userId)
      .limit(1);

    const deadline = deadlineResults?.[0];

    if (deadlineError || !deadline) {
      throw new Error('Deadline not found or access denied');
    }

    const { data: reviewTrackingResults, error: trackingError } = await supabase
      .from(DB_TABLES.REVIEW_TRACKING)
      .select('*')
      .eq('deadline_id', deadlineId)
      .limit(1);

    const reviewTracking = reviewTrackingResults?.[0];

    if (trackingError) {
      if (trackingError.code === 'PGRST116') {
        return null;
      }
      throw trackingError;
    }

    if (!reviewTracking) {
      return null;
    }

    const { data: platforms } = await supabase
      .from(DB_TABLES.REVIEW_PLATFORMS)
      .select('*')
      .eq('review_tracking_id', reviewTracking.id);

    const totalPlatforms = platforms?.length || 0;
    const postedPlatforms = platforms?.filter(p => p.posted).length || 0;
    const completion_percentage =
      totalPlatforms > 0
        ? Math.round((postedPlatforms / totalPlatforms) * 100)
        : 0;

    return {
      review_tracking: {
        id: reviewTracking.id,
        deadline_id: reviewTracking.deadline_id,
        review_due_date: reviewTracking.review_due_date,
        needs_link_submission: reviewTracking.needs_link_submission || false,
        all_reviews_complete: reviewTracking.all_reviews_complete || false,
      },
      platforms:
        platforms?.map(p => ({
          id: p.id,
          platform_name: p.platform_name,
          posted: p.posted || false,
          posted_date: p.posted_date,
          review_url: p.review_url,
        })) || [],
      completion_percentage,
    };
  }

  async updateReviewTracking(
    userId: string,
    params: UpdateReviewTrackingParams
  ) {
    const {
      review_tracking_id,
      review_due_date,
      needs_link_submission,
      platforms,
      review_notes,
    } = params;

    if (!platforms || platforms.length === 0) {
      throw new Error('At least one platform must be selected');
    }

    const { data: reviewTrackingResults, error: trackingError } = await supabase
      .from(DB_TABLES.REVIEW_TRACKING)
      .select('id, deadline_id')
      .eq('id', review_tracking_id)
      .limit(1);

    const reviewTracking = reviewTrackingResults?.[0];

    if (trackingError || !reviewTracking) {
      throw new Error('Review tracking not found');
    }

    const { data: deadlineResults, error: deadlineError } = await supabase
      .from(DB_TABLES.DEADLINES)
      .select('id, user_id')
      .eq('id', reviewTracking.deadline_id)
      .eq('user_id', userId)
      .limit(1);

    const deadline = deadlineResults?.[0];

    if (deadlineError || !deadline) {
      throw new Error('Review tracking not found or access denied');
    }

    const { data: existingPlatforms } = await supabase
      .from(DB_TABLES.REVIEW_PLATFORMS)
      .select('*')
      .eq('review_tracking_id', review_tracking_id);

    const postedPlatforms = existingPlatforms?.filter(p => p.posted) || [];
    const postedPlatformNames = postedPlatforms.map(p => p.platform_name);

    const newPlatformNames = platforms.map(p => p.name);
    const platformsToDelete =
      existingPlatforms?.filter(
        p => !p.posted && !newPlatformNames.includes(p.platform_name)
      ) || [];

    if (platformsToDelete.length > 0) {
      const idsToDelete = platformsToDelete.map(p => p.id);
      const { error: deleteError } = await supabase
        .from(DB_TABLES.REVIEW_PLATFORMS)
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.warn('Failed to delete platforms:', deleteError);
      }
    }

    const existingPlatformNames =
      existingPlatforms?.map(p => p.platform_name) || [];
    const platformsToAdd = platforms.filter(
      p => !existingPlatformNames.includes(p.name)
    );

    if (platformsToAdd.length > 0) {
      const platformRecords = platformsToAdd.map(platform => ({
        id: generateId('rp'),
        review_tracking_id,
        platform_name: platform.name,
        posted: false,
        posted_date: null,
        review_url: null,
      }));

      const { error: insertError } = await supabase
        .from(DB_TABLES.REVIEW_PLATFORMS)
        .insert(platformRecords)
        .select();

      if (insertError) throw insertError;
    }

    const { error: updateError } = await supabase
      .from(DB_TABLES.REVIEW_TRACKING)
      .update({
        review_due_date: review_due_date || null,
        needs_link_submission,
        updated_at: new Date().toISOString(),
      })
      .eq('id', review_tracking_id);

    if (updateError) throw updateError;

    if (review_notes) {
      // Use notesService to create note - it handles progress calculation and hashtag sync automatically
      try {
        await notesService.addNote(
          userId,
          reviewTracking.deadline_id,
          review_notes
        );
      } catch (noteError) {
        console.warn('Failed to create review note:', noteError);
      }
    }

    return {
      review_tracking_id,
      deadline_id: reviewTracking.deadline_id,
      posted_platform_names: postedPlatformNames,
    };
  }
}

export const reviewTrackingService = new ReviewTrackingService();
