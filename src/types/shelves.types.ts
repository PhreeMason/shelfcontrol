/**
 * Type definitions for Custom Shelves feature
 * Phase 1: System shelves only
 * Phase 2+: Custom user-created shelves
 */

/**
 * System shelf IDs - fixed set of pre-defined shelves
 * Maps to existing deadline status filters
 */
export type SystemShelfId =
  | 'all'
  | 'applied'
  | 'pending'
  | 'active'
  | 'overdue'
  | 'paused'
  | 'toReview'
  | 'completed'
  | 'didNotFinish'
  | 'rejected'
  | 'withdrew';

/**
 * System shelf definition
 * These are pre-defined and cannot be edited/deleted by users
 */
export interface SystemShelf {
  /** Unique identifier matching status filter */
  id: SystemShelfId;
  /** Display name shown in UI */
  name: string;
  /** SF Symbol icon name */
  icon: string;
  /** Only show shelf if count > 0 (e.g., Rejected, Withdrew) */
  isConditional: boolean;
  /** Whether shelf is pinned to tab bar by default */
  defaultPinned: boolean;
}

/**
 * Generic shelf ID type for Phase 2 extensibility
 * System shelves use SystemShelfId, custom shelves use prefixed IDs (e.g., 'shf_abc123')
 */
export type ShelfId = SystemShelfId | string;

/**
 * Shelf counts record - maps shelf IDs to deadline counts
 */
export type ShelfCounts = Record<SystemShelfId, number>;

/**
 * Shelf storage keys for AsyncStorage
 */
export const SHELF_STORAGE_KEYS = {
  SELECTED_SHELF: '@shelves/selectedShelf',
  PINNED_SHELVES: '@shelves/pinnedShelves',
} as const;
