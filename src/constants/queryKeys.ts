export const QUERY_KEYS = {
  DEADLINES: {
    ALL: (userId: string) => ['deadlines', userId] as const,
    DETAIL: (userId: string, deadlineId: string) => ['deadline', userId, deadlineId] as const,
    SOURCES: (userId: string) => ['deadline', 'sources', userId] as const,
    PROGRESS: (userId: string) => ['deadline_progress', userId] as const,
  },
  BOOKS: {
    SEARCH: (query: string) => ['books', 'search', query] as const,
    BY_API_ID: (apiId: string) => ['book', apiId] as const,
    BY_ID: (bookId: string) => ['book', 'id', bookId] as const,
  },
  PROFILE: {
    DETAIL: (userId: string) => ['profile', userId] as const,
  },
  AVATAR: {
    URL: (userId: string) => ['avatar', 'url', userId] as const,
    SIGNED_URL: (avatarPath: string) => ['avatar', 'signedUrl', avatarPath] as const,
    BASE: () => ['avatar'] as const,
    SIGNED_BASE: () => ['avatar', 'signedUrl'] as const,
  },
} as const;

export const MUTATION_KEYS = {
  DEADLINES: {
    ADD: 'addDeadline',
    UPDATE: 'updateDeadline',
    DELETE: 'deleteDeadline',
    UPDATE_PROGRESS: 'updateDeadlineProgress',
    COMPLETE: 'completeDeadline',
    PAUSE: 'pauseDeadline',
    DID_NOT_FINISH: 'didNotFinishDeadline',
    REACTIVATE: 'reactivateDeadline',
    UPDATE_STATUS: 'updateDeadlineStatus',
    DELETE_FUTURE_PROGRESS: 'deleteFutureProgress',
  },
  PROFILE: {
    UPDATE: 'updateProfile',
    UPDATE_FROM_APPLE: 'updateProfileFromApple',
  },
  AVATAR: {
    UPLOAD: 'uploadAvatar',
  },
} as const;
