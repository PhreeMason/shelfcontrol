export type AuthMethod = 'email' | 'apple';
export type ReadingFormat = 'physical' | 'eBook' | 'audio';
export type DeadlineStatus =
  | 'pending'
  | 'reading'
  | 'completed'
  | 'paused'
  | 'dnf';
export type BookSource = 'search' | 'manual';
export type ErrorType =
  | 'user_exists'
  | 'weak_password'
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'unexpected'
  | 'other';
export type RefreshTrigger = 'error_retry' | 'manual_refresh';
export type WebViewClosedVia = 'button' | 'back_button' | 'close_button';

export interface EventPropertiesMap {
  user_signed_up: {
    method: AuthMethod;
  };

  sign_up_failed: {
    error_type: ErrorType;
    error_message: string;
  };

  user_signed_in: {
    method: AuthMethod;
  };

  sign_in_failed: {
    error_type: ErrorType;
    error_message: string;
  };

  password_reset_requested: Record<string, never>;

  password_reset_request_failed: {
    error_type: string;
    error_message: string;
  };

  password_updated: Record<string, never>;

  password_update_failed: {
    error_type: string;
    error_message: string;
  };

  user_signed_out: Record<string, never>;

  book_search_completed: {
    query_length: number;
    results_count: number;
    search_term: string;
    load_time_ms: number;
  };

  book_search_failed: {
    error_message: string;
    search_term: string;
  };

  book_selected: {
    source: 'search';
    has_cover: boolean;
    has_isbn: boolean;
    has_publication_date: boolean;
  };

  deadline_creation_abandoned: {
    last_step: number;
    time_spent: number;
    book_selected: boolean;
  };

  deadline_created: {
    format: ReadingFormat;
    status: DeadlineStatus;
    type: string;
    book_source: BookSource;
    has_deadline_date: boolean;
    creation_duration_seconds: number;
    total_steps: number;
  };

  deadline_updated: {
    format: ReadingFormat;
  };

  deadline_date_updated: Record<string, never>;

  deadline_deleted: Record<string, never>;

  deadline_completed: Record<string, never>;

  deadline_started: Record<string, never>;

  deadline_marked_did_not_finish: Record<string, never>;

  deadline_paused: Record<string, never>;

  deadline_resumed: Record<string, never>;

  deadline_rejected: Record<string, never>;

  deadline_withdrew: Record<string, never>;

  deadline_card_clicked: {
    deadline_status: DeadlineStatus;
    deadline_format: ReadingFormat;
    deadline_title: string;
  };

  backward_progress_warning_shown: {
    current_progress: number;
    new_progress: number;
    format: ReadingFormat;
  };

  deadline_contact_added: {
    deadline_id: string;
    deadline_status: DeadlineStatus;
    has_email: boolean;
    has_username: boolean;
    has_name: boolean;
  };

  deadline_contact_edited: {
    deadline_id: string;
    deadline_status: DeadlineStatus;
    has_email: boolean;
    has_username: boolean;
    has_name: boolean;
  };

  deadline_contact_deleted: {
    deadline_id: string;
    deadline_status: DeadlineStatus;
  };

  deadline_disclosure_added: {
    deadline_id: string;
    deadline_status: DeadlineStatus;
    source: string;
    character_count: number;
    was_template_used: boolean;
  };

  deadline_disclosure_edited: {
    deadline_id: string;
    deadline_status: DeadlineStatus;
    source: string;
    character_count: number;
  };

  deadline_disclosure_deleted: {
    deadline_id: string;
    deadline_status: DeadlineStatus;
  };

  deadline_disclosure_template_selected: {
    deadline_id: string;
    template_name: string;
  };

  deadline_disclosure_saved_as_template: {
    template_name: string;
    character_count: number;
  };

  tag_added_to_deadline: {
    tag_name: string;
    is_new_tag: boolean;
  };

  tag_removed_from_deadline: {
    tag_name: string;
  };

  did_not_finish_selected: {
    format: ReadingFormat;
    book_title: string;
  };

  completion_flow_abandoned: {
    last_step: number;
    time_spent: number;
  };

  review_platform_toggled: {
    platform_name: string;
    toggled_on: boolean;
  };

  review_url_added: {
    platform_name: string;
  };

  review_submitted: {
    platform_count: number;
    has_custom_note: boolean;
  };

  review_link_viewed: {
    platform_name: string;
    has_url: boolean;
    source: string;
  };

  review_webview_opened: {
    platform_name: string;
    url_domain: string;
  };

  review_webview_refresh: {
    platform_name: string;
    trigger: RefreshTrigger;
    url_domain: string;
  };

  review_webview_closed: {
    platform_name: string;
    duration: number;
    closed_via: WebViewClosedVia;
  };

  note_created: {
    note_length: number;
    progress_percentage: number;
  };

  note_edited: {
    note_id: string;
    length_delta: number;
  };

  note_deleted: {
    note_id: string;
  };

  note_creation_cancelled: Record<string, never>;

  filters_applied: {
    active_tab: string;
    active_filters: {
      time_range?: string;
      formats?: string[];
      page_ranges?: string[];
      types?: string[];
      tags?: string[];
      excluded_statuses?: string[];
    };
    filter_count: number;
  };

  sort_changed: {
    previous_sort: string;
    new_sort: string;
  };

  session_started: Record<string, never>;

  reading_progress_updated: {
    deadline_id: string;
    progress_type: 'pages' | 'percentage' | 'time';
    previous_progress: number;
    new_progress: number;
    delta: number;
  };

  tab_switched: {
    from_tab: string;
    to_tab: string;
  };

  deadline_viewed: {
    deadline_id: string;
    deadline_status: DeadlineStatus;
    deadline_format: ReadingFormat;
  };

  engagement_milestone: {
    milestone_type:
      | 'deadlines_completed'
      | 'reading_streak'
      | 'total_pages_read'
      | 'books_reviewed';
    count: number;
  };

  profile_updated: {
    avatar_changed: boolean;
  };

  export_data_initiated: Record<string, never>;

  export_completed: {
    record_count: number;
  };

  export_failed: {
    error_message: string;
  };

  export_rate_limited: Record<string, never>;

  // Deadline failure events
  deadline_creation_failed: {
    error_message: string;
    book_source: BookSource;
  };

  deadline_update_failed: {
    error_message: string;
    deadline_id: string;
  };

  deadline_deletion_failed: {
    error_message: string;
    deadline_id: string;
  };

  deadline_status_update_failed: {
    error_message: string;
    deadline_id: string;
    current_status: DeadlineStatus;
    attempted_status: DeadlineStatus;
    invalid_transition: boolean;
  };

  deadline_progress_update_failed: {
    error_message: string;
    deadline_id: string;
    progress_type: 'pages' | 'percentage' | 'time';
  };

  deadline_date_update_failed: {
    error_message: string;
    deadline_id: string;
  };

  deadline_completion_failed: {
    error_message: string;
    deadline_id: string;
  };

  deadline_start_failed: {
    error_message: string;
    deadline_id: string;
  };

  deadline_pause_failed: {
    error_message: string;
    deadline_id: string;
  };

  deadline_resume_failed: {
    error_message: string;
    deadline_id: string;
  };

  deadline_dnf_failed: {
    error_message: string;
    deadline_id: string;
  };

  cover_image_upload_failed: {
    error_message: string;
    deadline_id: string;
    failure_stage: 'fetch' | 'upload';
  };

  cover_image_deletion_failed: {
    error_message: string;
    deadline_id: string;
  };

  daily_activities_fetch_failed: {
    error_message: string;
  };

  // Review tracking failure events
  review_tracking_creation_failed: {
    error_message: string;
    deadline_id: string;
    platform_count: number;
  };

  review_platforms_update_failed: {
    error_message: string;
    deadline_id: string;
    platform_name: string;
  };

  review_tracking_fetch_failed: {
    error_message: string;
    deadline_id: string;
  };

  user_platforms_fetch_failed: {
    error_message: string;
  };

  review_url_update_failed: {
    error_message: string;
    deadline_id: string;
    platform_name: string;
  };
}

export type EventName = keyof EventPropertiesMap;

export type EventProperties<T extends EventName> = EventPropertiesMap[T];
