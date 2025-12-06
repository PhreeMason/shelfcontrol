import { Database } from '@/types/database.types';

type DeadlineStatusEnum = Database['public']['Enums']['deadline_status_enum'];

export const DEADLINE_STATUS: Record<
  Uppercase<DeadlineStatusEnum>,
  DeadlineStatusEnum
> = {
  APPLIED: 'applied',
  COMPLETE: 'complete',
  READING: 'reading',
  DID_NOT_FINISH: 'did_not_finish',
  PENDING: 'pending',
  TO_REVIEW: 'to_review',
  PAUSED: 'paused',
  REJECTED: 'rejected',
  WITHDREW: 'withdrew',
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

/**
 * Valid status transitions map
 *
 * Defines which status changes are allowed from each current status.
 * Used by both the service layer (for validation) and UI (for displaying options).
 *
 * Terminal states (complete, did_not_finish, rejected, withdrew) have no valid transitions.
 */
export const VALID_STATUS_TRANSITIONS: Record<
  DeadlineStatusEnum,
  DeadlineStatusEnum[]
> = {
  applied: ['pending', 'rejected', 'withdrew'],
  pending: ['applied', 'reading', 'rejected', 'withdrew'],
  reading: ['applied', 'paused', 'to_review', 'complete', 'did_not_finish'],
  paused: ['reading', 'complete', 'did_not_finish'],
  to_review: ['complete', 'did_not_finish'],
  complete: [],
  did_not_finish: [],
  rejected: [],
  withdrew: [],
};

/**
 * Statuses that should be treated as "completed" for calendar filtering.
 * These bypass urgency calculation and show in the Completed filter.
 *
 * Note: did_not_finish is NOT included because it already gets 'good' urgency
 * from getDeadlineCalculations (via isArchived check).
 */
export const CALENDAR_COMPLETED_STATUSES: readonly DeadlineStatusEnum[] = [
  'complete',
  'withdrew',
  'rejected',
] as const;

export type DeadlineStatus = DeadlineStatusEnum;
export type ActivityState =
  (typeof ACTIVITY_STATE)[keyof typeof ACTIVITY_STATE];
export type BookFormat = (typeof BOOK_FORMAT)[keyof typeof BOOK_FORMAT];
export type ProgressType = (typeof PROGRESS_TYPE)[keyof typeof PROGRESS_TYPE];
