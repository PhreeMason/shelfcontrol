import { Database } from '@/types/database.types';

type DeadlineStatusEnum = Database['public']['Enums']['deadline_status_enum'];

export const DEADLINE_STATUS: Record<
  Uppercase<DeadlineStatusEnum>,
  DeadlineStatusEnum
> = {
  COMPLETE: 'complete',
  READING: 'reading',
  DID_NOT_FINISH: 'did_not_finish',
  PENDING: 'pending',
  TO_REVIEW: 'to_review',
  PAUSED: 'paused',
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

export type DeadlineStatus = DeadlineStatusEnum;
export type ActivityState =
  (typeof ACTIVITY_STATE)[keyof typeof ACTIVITY_STATE];
export type BookFormat = (typeof BOOK_FORMAT)[keyof typeof BOOK_FORMAT];
export type ProgressType = (typeof PROGRESS_TYPE)[keyof typeof PROGRESS_TYPE];
