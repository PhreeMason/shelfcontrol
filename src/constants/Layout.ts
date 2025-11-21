/**
 * Layout Constants
 *
 * Semantic constants for special layout values that don't fit the standard spacing scale.
 * Use these for component-specific sizes, offsets, and dimensions.
 */

export const Layout = {
  /**
   * Standard icon circle size for action buttons
   * Used in DeadlineCardActions and similar components
   */
  ICON_CIRCLE_SIZE: 48,

  /**
   * iOS tab bar offset (includes safe area)
   * Used for bottom padding on scrollable content
   */
  TAB_BAR_OFFSET: 80,

  /**
   * Floating action button offset from bottom
   */
  FAB_BOTTOM_OFFSET: 45,

  /**
   * Modal vertical positioning offset
   */
  MODAL_VERTICAL_OFFSET: 100,
} as const;

export type LayoutKey = keyof typeof Layout;
