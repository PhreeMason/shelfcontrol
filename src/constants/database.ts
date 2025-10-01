export const DB_TABLES = {
  PROFILES: 'profiles',
  BOOKS: 'books',
  DEADLINES: 'deadlines',
  DEADLINE_PROGRESS: 'deadline_progress',
  DEADLINE_STATUS: 'deadline_status',
} as const;

export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
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

export const APPLE_AUTH = {
  PRIVATE_RELAY_DOMAIN: '@privaterelay.appleid.com',
} as const;
