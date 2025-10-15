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
      .select()
      .single();

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
