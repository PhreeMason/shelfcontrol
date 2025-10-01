export const DEADLINE_STATUS = {
  COMPLETE: 'complete',
  PAUSED: 'paused',
  READING: 'reading',
  DID_NOT_FINISH: 'did_not_finish',
  PENDING: 'pending',
} as const;

export const ACTIVITY_STATE = {
  ACTIVE: 'active',
  PENDING: 'pending',
} as const;

export const BOOK_FORMAT = {
  AUDIO: 'audio',
} as const;

export const PROGRESS_TYPE = {
  LISTENING: 'listening',
} as const;

export type DeadlineStatus =
  (typeof DEADLINE_STATUS)[keyof typeof DEADLINE_STATUS];
export type ActivityState =
  (typeof ACTIVITY_STATE)[keyof typeof ACTIVITY_STATE];
export type BookFormat = (typeof BOOK_FORMAT)[keyof typeof BOOK_FORMAT];
export type ProgressType = (typeof PROGRESS_TYPE)[keyof typeof PROGRESS_TYPE];
