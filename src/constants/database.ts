export const DB_TABLES = {
  PROFILES: 'profiles',
  BOOKS: 'books',
  DEADLINES: 'deadlines',
  DEADLINE_PROGRESS: 'deadline_progress',
  DEADLINE_STATUS: 'deadline_status',
  DEADLINE_NOTES: 'deadline_notes',
  DEADLINE_CONTACTS: 'deadline_contacts',
  DEADLINE_CUSTOM_DATES: 'deadline_custom_dates',
  TAGS: 'tags',
  DEADLINE_TAGS: 'deadline_tags',
  HASHTAGS: 'hashtags',
  NOTE_HASHTAGS: 'note_hashtags',
  DISCLOSURE_TEMPLATES: 'disclosure_templates',
  USER_ACTIVITIES: 'user_activities',
  REVIEW_TRACKING: 'review_tracking',
  REVIEW_PLATFORMS: 'review_platforms',
  USER_SETTINGS: 'user_settings',
} as const;

export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  ALTERNATE_COVERS: 'alternate-covers',
} as const;

export const AVATAR_CONFIG = {
  FILE_PREFIX: 'avatar-',
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ] as string[],
  MAX_FILE_SIZE: 5242880,
  SIGNED_URL_EXPIRY: 90 * 24 * 60 * 60,
} as const;

export const ALTERNATE_COVER_CONFIG = {
  FILE_PREFIX: 'cover-',
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as string[],
  MAX_FILE_SIZE: 5242880,
  SIGNED_URL_EXPIRY: 90 * 24 * 60 * 60,
} as const;

export const APPLE_AUTH = {
  PRIVATE_RELAY_DOMAIN: '@privaterelay.appleid.com',
} as const;
