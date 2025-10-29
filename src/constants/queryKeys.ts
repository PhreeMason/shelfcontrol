export const QUERY_KEYS = {
  DEADLINES: {
    ALL: (userId: string) => ['deadlines', userId] as const,
    DETAIL: (userId: string, deadlineId: string) =>
      ['deadline', userId, deadlineId] as const,
    TYPES: (userId: string) => ['deadline', 'types', userId] as const,
    PROGRESS: (userId: string) => ['deadline_progress', userId] as const,
  },
  NOTES: {
    BY_DEADLINE: (userId: string, deadlineId: string) =>
      ['notes', userId, deadlineId] as const,
  },
  CONTACTS: {
    BY_DEADLINE: (userId: string, deadlineId: string) =>
      ['contacts', userId, deadlineId] as const,
  },
  TAGS: {
    ALL: (userId: string) => ['tags', userId] as const,
    BY_DEADLINE: (userId: string, deadlineId: string) =>
      ['tags', userId, deadlineId] as const,
    ALL_DEADLINE_TAGS: (userId: string) =>
      ['deadline_tags', userId] as const,
  },
  DISCLOSURE_TEMPLATES: {
    ALL: (userId: string) => ['disclosure_templates', userId] as const,
    BY_SOURCE: (userId: string, sourceName?: string) =>
      ['disclosure_templates', userId, sourceName] as const,
    BY_ID: (userId: string, templateId: string) =>
      ['disclosure_template', userId, templateId] as const,
  },
  BOOKS: {
    SEARCH: (query: string) => ['books', 'search', query] as const,
    BY_API_ID: (apiId: string) => ['book', apiId] as const,
    BY_ID: (bookId: string) => ['book', 'id', bookId] as const,
  },
  PROFILE: {
    DETAIL: (userId: string) => ['profile', userId] as const,
  },
  REVIEW_TRACKING: {
    BY_DEADLINE: (userId: string, deadlineId: string) =>
      ['review_tracking', userId, deadlineId] as const,
  },
  AVATAR: {
    URL: (userId: string) => ['avatar', 'url', userId] as const,
    SIGNED_URL: (avatarPath: string) =>
      ['avatar', 'signedUrl', avatarPath] as const,
    BASE: () => ['avatar'] as const,
    SIGNED_BASE: () => ['avatar', 'signedUrl'] as const,
  },
} as const;

export const MUTATION_KEYS = {
  DEADLINES: {
    ADD: 'addDeadline',
    UPDATE: 'updateDeadline',
    UPDATE_DATE: 'updateDeadlineDate',
    DELETE: 'deleteDeadline',
    UPDATE_PROGRESS: 'updateDeadlineProgress',
    COMPLETE: 'completeDeadline',
    DID_NOT_FINISH: 'didNotFinishDeadline',
    UPDATE_STATUS: 'updateDeadlineStatus',
    DELETE_FUTURE_PROGRESS: 'deleteFutureProgress',
  },
  NOTES: {
    ADD: 'addNote',
    UPDATE: 'updateNote',
    DELETE: 'deleteNote',
  },
  CONTACTS: {
    ADD: 'addContact',
    UPDATE: 'updateContact',
    DELETE: 'deleteContact',
  },
  TAGS: {
    CREATE: 'createTag',
    ADD_TO_DEADLINE: 'addTagToDeadline',
    REMOVE_FROM_DEADLINE: 'removeTagFromDeadline',
    UPDATE: 'updateTag',
    DELETE: 'deleteTag',
  },
  DISCLOSURE_TEMPLATES: {
    CREATE: 'createDisclosureTemplate',
    UPDATE: 'updateDisclosureTemplate',
    DELETE: 'deleteDisclosureTemplate',
    UPDATE_DEADLINE: 'updateDeadlineDisclosure',
  },
  PROFILE: {
    UPDATE: 'updateProfile',
    UPDATE_FROM_APPLE: 'updateProfileFromApple',
  },
  AVATAR: {
    UPLOAD: 'uploadAvatar',
  },
} as const;
