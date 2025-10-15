import { DB_TABLES } from '@/constants/database';
import { generateId, supabase } from '@/lib/supabase';
import {
  CreateReviewTrackingParams,
  ReviewPlatform,
  ReviewTrackingProgress,
  ReviewTrackingWithPlatforms,
  UpdateReviewPlatformsParams,
} from '@/types/review.types';
import { activityService } from './activity.service';
import { notesService } from './notes.service';

class ReviewService {
  async createReviewTracking(
    userId: string,
    params: CreateReviewTrackingParams
  ): Promise<ReviewTrackingWithPlatforms> {
    const {
      deadlineId,
      reviewDueDate,
      needsLinkSubmission,
      reviewNotes,
      platforms,
    } = params;

    const reviewTrackingId = generateId('rt');

    const { data: reviewTrackingData, error: reviewTrackingError } =
      await supabase
        .from(DB_TABLES.REVIEW_TRACKING)
        .insert({
          id: reviewTrackingId,
          deadline_id: deadlineId,
          review_due_date: reviewDueDate || null,
          needs_link_submission: needsLinkSubmission,
          all_reviews_complete: false,
        })
        .select()
        .single();

    if (reviewTrackingError) throw reviewTrackingError;

    const platformInserts = platforms.map(platform => ({
      id: generateId('rp'),
      review_tracking_id: reviewTrackingId,
      platform_name: platform.name,
      posted: false,
    }));

    const { data: platformsData, error: platformsError } = await supabase
      .from(DB_TABLES.REVIEW_PLATFORMS)
      .insert(platformInserts)
      .select();

    if (platformsError) throw platformsError;

    if (reviewNotes && reviewNotes.trim()) {
      const { data: deadline } = await supabase
        .from(DB_TABLES.DEADLINES)
        .select('user_id')
        .eq('id', deadlineId)
        .single();

      if (deadline?.user_id !== userId) {
        throw new Error('Unauthorized: deadline does not belong to user');
      }

      const { data: latestProgress } = await supabase
        .from(DB_TABLES.DEADLINE_PROGRESS)
        .select('current_progress')
        .eq('deadline_id', deadlineId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      await notesService.addNote(
        userId,
        deadlineId,
        reviewNotes,
        latestProgress?.current_progress || 0
      );
    }

    activityService.trackUserActivity('review_tracking_created', {
      deadlineId,
      platformCount: platforms.length,
    });

    return {
      ...reviewTrackingData,
      needs_link_submission:
        reviewTrackingData.needs_link_submission ?? false,
      all_reviews_complete: reviewTrackingData.all_reviews_complete ?? false,
      platforms: (platformsData || []).map(p => ({
        ...p,
        posted: p.posted ?? false,
      })) as ReviewPlatform[],
    };
  }

  async getReviewTrackingByDeadlineId(
    userId: string,
    deadlineId: string
  ): Promise<ReviewTrackingWithPlatforms | null> {
    const { data: deadline } = await supabase
      .from(DB_TABLES.DEADLINES)
      .select('user_id')
      .eq('id', deadlineId)
      .single();

    if (!deadline || deadline.user_id !== userId) {
      return null;
    }

    const { data: reviewTracking, error: trackingError } = await supabase
      .from(DB_TABLES.REVIEW_TRACKING)
      .select(
        `
        *,
        platforms:review_platforms(*)
      `
      )
      .eq('deadline_id', deadlineId)
      .single();

    if (trackingError) {
      if (trackingError.code === 'PGRST116') {
        return null;
      }
      throw trackingError;
    }

    return {
      ...reviewTracking,
      needs_link_submission: reviewTracking.needs_link_submission ?? false,
      all_reviews_complete: reviewTracking.all_reviews_complete ?? false,
      platforms: (reviewTracking.platforms || []).map(p => ({
        ...p,
        posted: p.posted ?? false,
      })),
    } as ReviewTrackingWithPlatforms;
  }

  async updateReviewPlatforms(
    userId: string,
    reviewTrackingId: string,
    params: UpdateReviewPlatformsParams
  ): Promise<{ platforms: ReviewPlatform[]; progress: ReviewTrackingProgress }> {
    const { data: reviewTracking } = await supabase
      .from(DB_TABLES.REVIEW_TRACKING)
      .select('deadline_id, deadline:deadlines(user_id)')
      .eq('id', reviewTrackingId)
      .single();

    if (
      !reviewTracking ||
      (reviewTracking.deadline as any)?.user_id !== userId
    ) {
      throw new Error('Unauthorized: review tracking not found or not owned');
    }

    const updatedPlatforms: ReviewPlatform[] = [];

    for (const platform of params.platforms) {
      const updateData: any = {
        posted: platform.posted,
        posted_date: platform.posted ? new Date().toISOString() : null,
      };

      if (platform.reviewUrl) {
        updateData.review_url = platform.reviewUrl;
      }

      const { data, error } = await supabase
        .from(DB_TABLES.REVIEW_PLATFORMS)
        .update(updateData)
        .eq('id', platform.id)
        .eq('review_tracking_id', reviewTrackingId)
        .select()
        .single();

      if (error) throw error;
      updatedPlatforms.push(data as ReviewPlatform);
    }

    const { data: allPlatforms } = await supabase
      .from(DB_TABLES.REVIEW_PLATFORMS)
      .select('*')
      .eq('review_tracking_id', reviewTrackingId);

    const progress = this.calculateProgress(allPlatforms || []);

    activityService.trackUserActivity('review_platforms_updated', {
      reviewTrackingId,
      completionPercentage: progress.completionPercentage,
    });

    return { platforms: updatedPlatforms, progress };
  }

  calculateProgress(
    platforms: { posted: boolean | null }[]
  ): ReviewTrackingProgress {
    const totalPlatforms = platforms.length;
    const postedPlatforms = platforms.filter(p => p.posted === true).length;
    const completionPercentage =
      totalPlatforms > 0 ? (postedPlatforms / totalPlatforms) * 100 : 0;

    return {
      totalPlatforms,
      postedPlatforms,
      completionPercentage: Math.round(completionPercentage),
    };
  }
}

export const reviewService = new ReviewService();
