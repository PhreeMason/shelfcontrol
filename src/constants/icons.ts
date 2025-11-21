/**
 * Icon Constants
 *
 * Centralized SF Symbols icon names for consistent icon usage across the app.
 * Using constants ensures typo-free icon names and enables easy icon updates.
 *
 * @see https://developer.apple.com/sf-symbols/
 */

/**
 * Deadline card action icons
 */
export const DEADLINE_CARD_ICONS = {
  /** Status change icon (bidirectional arrows) */
  CHANGE_STATUS: 'arrow.left.arrow.right',

  /** Calendar with clock badge for due date updates */
  UPDATE_DATE: 'calendar.badge.clock',

  /** Edit/pencil icon for editing deadlines */
  EDIT: 'pencil',

  /** Notes icon */
  NOTES: 'note.text',
} as const;

/**
 * Status-related icons
 */
export const STATUS_ICONS = {
  /** Reading/book icon */
  READING: 'book.fill',

  /** Pause icon */
  PAUSED: 'pause.circle.fill',

  /** Checkmark for completion */
  COMPLETE: 'checkmark.seal.fill',

  /** Checkmark circle for review */
  TO_REVIEW: 'checkmark.circle.fill',

  /** X mark for did not finish */
  DID_NOT_FINISH: 'xmark.circle.fill',

  /** Thumbs down for rejection */
  REJECTED: 'hand.thumbsdown.fill',

  /** Back arrow for withdrawal */
  WITHDREW: 'arrow.uturn.backward.circle.fill',

  /** Archive box for terminal states */
  ARCHIVED: 'archivebox.fill',

  /** Chevron right for navigation */
  CHEVRON_RIGHT: 'chevron.right',
} as const;

export type DeadlineCardIcon = typeof DEADLINE_CARD_ICONS[keyof typeof DEADLINE_CARD_ICONS];
export type StatusIcon = typeof STATUS_ICONS[keyof typeof STATUS_ICONS];
