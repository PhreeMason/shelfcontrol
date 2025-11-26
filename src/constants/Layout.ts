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

  /**
   * Cover image preview width (book cover aspect ratio)
   * Used in CoverImagePicker component
   */
  COVER_IMAGE_PREVIEW_WIDTH: 160,

  /**
   * Cover image preview height (book cover aspect ratio 2:3)
   * Used in CoverImagePicker component
   */
  COVER_IMAGE_PREVIEW_HEIGHT: 240,

  /**
   * Standard input field height
   * Used for consistent input sizing across forms
   */
  INPUT_HEIGHT: 44,

  /**
   * Input icon offset for absolute positioned icons
   * Matches INPUT_HEIGHT for proper alignment
   */
  INPUT_ICON_OFFSET: 44,

  /**
   * Remove/close button size (circular)
   * Used for overlay close buttons
   */
  REMOVE_BUTTON_SIZE: 32,
} as const;

export type LayoutKey = keyof typeof Layout;
