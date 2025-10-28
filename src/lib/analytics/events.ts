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

  apple_sso_started: Record<string, never>;

  apple_sso_completed: Record<string, never>;

  apple_sso_failed: {
    error_message: string;
  };

  apple_sso_cancelled: Record<string, never>;

  user_signed_out: Record<string, never>;

  deadline_creation_started: Record<string, never>;

  deadline_creation_step_viewed: {
    step_number: number;
    step_name: string;
  };

  book_search_performed: {
    query_length: number;
  };

  book_search_results_loaded: {
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

  manual_book_entry_started: Record<string, never>;

  deadline_format_selected: {
    format: ReadingFormat;
  };

  priority_set: {
    priority_level: string | number;
  };

  deadline_date_set: {
    days_from_now: number;
    is_future: boolean;
  };

  deadline_creation_abandoned: {
    last_step: number;
    time_spent: number;
    book_selected: boolean;
  };

  deadline_creation_completed: {
    time_spent_seconds: number;
    total_steps: number;
    book_source: BookSource;
    format: ReadingFormat;
    status: DeadlineStatus;
  };

  deadline_created: {
    format: ReadingFormat;
    status: DeadlineStatus;
    type: string;
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

  contact_field_copied: {
    field_type: 'name' | 'email' | 'username';
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

  deadline_disclosure_copied: {
    deadline_id: string;
    deadline_status: DeadlineStatus;
    character_count: number;
  };

  deadline_disclosure_template_selected: {
    deadline_id: string;
    template_name: string;
  };

  deadline_disclosure_saved_as_template: {
    template_name: string;
    character_count: number;
  };

  completion_flow_started: {
    format: ReadingFormat;
    status: DeadlineStatus;
    days_to_complete: number;
    is_dnf: boolean;
  };

  completion_step_viewed: {
    step_number: number;
    step_name: 'celebration' | 'review_question' | 'review_form';
  };

  celebration_screen_viewed: {
    book_title: string;
    format: ReadingFormat;
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

  review_link_copied: {
    platform_name: string;
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

  review_webview_loaded: {
    platform_name: string;
    load_time: number;
    url_domain: string;
  };

  review_webview_error: {
    platform_name: string;
    error_message: string;
    url_domain: string;
  };

  notes_screen_viewed: {
    deadline_id: string;
    existing_notes_count: number;
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

  note_copied: Record<string, never>;

  home_screen_viewed: {
    deadlines_count: number;
    active_filters: string[];
  };

  filter_changed: {
    filter_type: string;
  };

  filter_cleared: Record<string, never>;

  filter_combination_applied: {
    filter_types: string[];
  };

  sort_changed: {
    previous_sort: string;
    new_sort: string;
  };

  deadlines_refreshed: Record<string, never>;

  profile_viewed: Record<string, never>;

  profile_updated: {
    avatar_changed: boolean;
  };

  avatar_uploaded: Record<string, never>;

  export_data_initiated: Record<string, never>;

  export_completed: {
    record_count: number;
  };

  export_failed: {
    error_message: string;
  };

  export_rate_limited: Record<string, never>;
}

export type EventName = keyof EventPropertiesMap;

export type EventProperties<T extends EventName> = EventPropertiesMap[T];
