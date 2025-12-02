import { SystemShelf, SystemShelfId } from '@/types/shelves.types';

/**
 * System shelves - pre-defined shelves that map to deadline statuses
 * Order here determines display order in panel and tab bar
 */
export const SYSTEM_SHELVES: SystemShelf[] = [
  {
    id: 'all',
    name: 'All',
    icon: 'tray.full',
    isConditional: false,
    defaultPinned: true,
  },
  {
    id: 'applied',
    name: 'Applied',
    icon: 'paperplane',
    isConditional: false,
    defaultPinned: true,
  },
  {
    id: 'pending',
    name: 'Pending',
    icon: 'clock',
    isConditional: false,
    defaultPinned: true,
  },
  {
    id: 'active',
    name: 'Active',
    icon: 'book',
    isConditional: false,
    defaultPinned: true,
  },
  {
    id: 'overdue',
    name: 'Past Due',
    icon: 'exclamationmark.circle',
    isConditional: false,
    defaultPinned: true,
  },
  {
    id: 'paused',
    name: 'Paused',
    icon: 'pause.circle',
    isConditional: false,
    defaultPinned: true,
  },
  {
    id: 'toReview',
    name: 'To Review',
    icon: 'star',
    isConditional: false,
    defaultPinned: true,
  },
  {
    id: 'completed',
    name: 'Completed',
    icon: 'checkmark.circle',
    isConditional: false,
    defaultPinned: true,
  },
  {
    id: 'didNotFinish',
    name: 'DNF',
    icon: 'xmark.circle',
    isConditional: false,
    defaultPinned: true,
  },
  {
    id: 'rejected',
    name: 'Rejected',
    icon: 'hand.thumbsdown',
    isConditional: true,
    defaultPinned: false,
  },
  {
    id: 'withdrew',
    name: 'Withdrew',
    icon: 'arrow.uturn.left',
    isConditional: true,
    defaultPinned: false,
  },
];

/**
 * Default pinned shelves for new users
 * All core system shelves except conditional ones (Rejected, Withdrew)
 */
export const DEFAULT_PINNED_SHELVES: SystemShelfId[] = [
  'all',
  'applied',
  'pending',
  'active',
  'overdue',
  'paused',
  'toReview',
  'completed',
  'didNotFinish',
];

/**
 * Get a system shelf by ID
 */
export const getSystemShelf = (id: SystemShelfId): SystemShelf | undefined => {
  return SYSTEM_SHELVES.find((shelf) => shelf.id === id);
};

/**
 * Get shelf index for maintaining fixed order
 */
export const getShelfIndex = (id: SystemShelfId): number => {
  return SYSTEM_SHELVES.findIndex((shelf) => shelf.id === id);
};

/**
 * Sort shelf IDs by their fixed order
 */
export const sortShelfIds = (ids: SystemShelfId[]): SystemShelfId[] => {
  return [...ids].sort((a, b) => getShelfIndex(a) - getShelfIndex(b));
};
