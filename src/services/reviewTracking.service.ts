import { DB_TABLES } from '@/constants/database';
import { generateId, supabase } from '@/lib/supabase';

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
    review_url?: string;
  }[];
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
   *   and stores it in deadline_notes.deadline_progress field as a numeric snapshot
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

    const { data: deadline, error: deadlineError } = await supabase
      .from(DB_TABLES.DEADLINES)
      .select('id, user_id')
      .eq('id', deadline_id)
      .eq('user_id', userId)
      .single();

    if (deadlineError || !deadline) {
      throw new Error('Deadline not found or access denied');
    }

    const { data: existingTracking } = await supabase
      .from(DB_TABLES.REVIEW_TRACKING)
      .select('id')
      .eq('deadline_id', deadline_id)
      .single();

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
      .single();

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
      const { data: progressData } = await supabase
        .from(DB_TABLES.DEADLINE_PROGRESS)
        .select('current_progress')
        .eq('deadline_id', deadline_id)
        .order('created_at', { ascending: false })
        .single();

      const currentProgress = progressData?.current_progress || 0;

      const { error: noteError } = await supabase
        .from(DB_TABLES.DEADLINE_NOTES)
        .insert({
          id: generateId('note'),
          deadline_id,
          note_text: review_notes,
          deadline_progress: currentProgress,
          user_id: userId,
        })
        .select()
        .single();

      if (noteError) {
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
    const { data: reviewTracking, error: trackingError } = await supabase
      .from(DB_TABLES.REVIEW_TRACKING)
      .select('id, deadline_id')
      .eq('id', reviewTrackingId)
      .single();

    if (trackingError || !reviewTracking) {
      throw new Error('Review tracking not found');
    }

    const { data: deadline, error: deadlineError } = await supabase
      .from(DB_TABLES.DEADLINES)
      .select('id, user_id')
      .eq('id', reviewTracking.deadline_id)
      .eq('user_id', userId)
      .single();

    if (deadlineError || !deadline) {
      throw new Error('Review tracking not found or access denied');
    }

    for (const platform of params.platforms) {
      const updatePayload: any = {
        posted: platform.posted,
        updated_at: new Date().toISOString(),
      };

      if (platform.posted) {
        updatePayload.posted_date = new Date().toISOString();
      }

      if (platform.review_url) {
        updatePayload.review_url = platform.review_url;
      }

      const { error: updateError } = await supabase
        .from(DB_TABLES.REVIEW_PLATFORMS)
        .update(updatePayload)
        .eq('id', platform.id)
        .single();

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
      totalPlatforms > 0 ? Math.round((postedPlatforms / totalPlatforms) * 100) : 0;

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
   * if (!tracking) {
   *   console.log('No review tracking set up');
   * } else {
   *   console.log(`${tracking.completion_percentage}% complete`);
   *   const postedCount = tracking.platforms.filter(p => p.posted).length;
   *   console.log(`Posted to ${postedCount} of ${tracking.platforms.length} platforms`);
   * }
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
    const { data: deadline, error: deadlineError } = await supabase
      .from(DB_TABLES.DEADLINES)
      .select('id, user_id')
      .eq('id', deadlineId)
      .eq('user_id', userId)
      .single();

    if (deadlineError || !deadline) {
      throw new Error('Deadline not found or access denied');
    }

    const { data: reviewTracking, error: trackingError } = await supabase
      .from(DB_TABLES.REVIEW_TRACKING)
      .select('*')
      .eq('deadline_id', deadlineId)
      .single();

    if (trackingError) {
      if (trackingError.code === 'PGRST116') {
        return null;
      }
      throw trackingError;
    }

    const { data: platforms } = await supabase
      .from(DB_TABLES.REVIEW_PLATFORMS)
      .select('*')
      .eq('review_tracking_id', reviewTracking.id);

    const totalPlatforms = platforms?.length || 0;
    const postedPlatforms = platforms?.filter(p => p.posted).length || 0;
    const completion_percentage =
      totalPlatforms > 0 ? Math.round((postedPlatforms / totalPlatforms) * 100) : 0;

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
}

export const reviewTrackingService = new ReviewTrackingService();
