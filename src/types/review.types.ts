export interface ReviewTracking {
  id: string;
  deadline_id: string;
  review_due_date: string | null;
  needs_link_submission: boolean;
  all_reviews_complete: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface ReviewTrackingInsert {
  id?: string;
  deadline_id: string;
  review_due_date?: string | null;
  needs_link_submission?: boolean;
  all_reviews_complete?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ReviewTrackingUpdate {
  id?: string;
  deadline_id?: string;
  review_due_date?: string | null;
  needs_link_submission?: boolean;
  all_reviews_complete?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ReviewPlatform {
  id: string;
  review_tracking_id: string;
  platform_name: string;
  posted: boolean;
  posted_date: string | null;
  review_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ReviewPlatformInsert {
  id?: string;
  review_tracking_id: string;
  platform_name: string;
  posted?: boolean;
  posted_date?: string | null;
  review_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ReviewPlatformUpdate {
  id?: string;
  review_tracking_id?: string;
  platform_name?: string;
  posted?: boolean;
  posted_date?: string | null;
  review_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type ReviewTrackingWithPlatforms = ReviewTracking & {
  platforms: ReviewPlatform[];
};

export interface CreateReviewTrackingParams {
  deadlineId: string;
  reviewDueDate?: string | null;
  needsLinkSubmission: boolean;
  reviewNotes?: string;
  platforms: { name: string }[];
}

export interface UpdateReviewPlatformsParams {
  platforms: {
    id: string;
    posted: boolean;
    reviewUrl?: string;
  }[];
}

export interface ReviewTrackingProgress {
  totalPlatforms: number;
  postedPlatforms: number;
  completionPercentage: number;
}
