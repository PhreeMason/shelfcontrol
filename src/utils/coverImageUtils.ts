/**
 * Cover image mode type definition
 */
export type CoverImageMode = 'upload' | 'url' | 'none';

/**
 * Determines which image URI to display in the preview
 *
 * Priority order:
 * 1. Upload mode with value -> show uploaded image
 * 2. URL mode with value -> show URL image
 * 3. None mode with default -> show default image
 * 4. Otherwise -> show nothing (null)
 *
 * @param mode - Current cover image mode
 * @param value - User-provided image value (file URI or URL)
 * @param defaultPreviewUrl - Default image URL (e.g., from book metadata)
 * @returns Image URI to display, or null if no image to show
 *
 * @example
 * ```typescript
 * const previewUri = getPreviewImageUri('upload', 'file://local.jpg', null);
 * // Returns: 'file://local.jpg'
 *
 * const previewUri = getPreviewImageUri('none', null, 'https://default.jpg');
 * // Returns: 'https://default.jpg'
 * ```
 */
export const getPreviewImageUri = (
  mode: CoverImageMode,
  value: string | null,
  defaultPreviewUrl: string | null
): string | null => {
  // Upload mode with user-selected image
  if (mode === 'upload' && value) {
    return getCoverImageUrl(value);
  }

  // URL mode with user-provided URL
  if (mode === 'url' && value) {
    return value;
  }

  // None mode with default image available
  if (mode === 'none' && defaultPreviewUrl) {
    return defaultPreviewUrl;
  }

  // No image to show
  return null;
};

/**
 * Determines if the preview is showing the default image
 *
 * Used to conditionally show/hide the "Default Book Cover" label
 * and to determine if the remove button should be shown
 *
 * @param mode - Current cover image mode
 * @param defaultPreviewUrl - Default image URL
 * @returns True if showing default image (mode is 'none' and default exists)
 *
 * @example
 * ```typescript
 * const showingDefault = isShowingDefaultImage('none', 'https://default.jpg');
 * // Returns: true
 *
 * const showingDefault = isShowingDefaultImage('upload', 'https://default.jpg');
 * // Returns: false
 * ```
 */
export const isShowingDefaultImage = (
  mode: CoverImageMode,
  defaultPreviewUrl: string | null
): boolean => {
  return mode === 'none' && Boolean(defaultPreviewUrl);
};

/**
 * Gets the public URL for a cover image
 *
 * Handles both full URLs (from external sources), local file URIs (from picker),
 * and storage paths (from internal uploads).
 *
 * @param pathOrUrl - The stored cover image value (URL, file URI, or path)
 * @returns The public URL to display, or null if input is empty
 */
import { STORAGE_BUCKETS } from '@/constants/database';
import { supabase } from '@/lib/supabase';

export const getCoverImageUrl = (
  pathOrUrl: string | null | undefined
): string | null => {
  if (!pathOrUrl) return null;

  // If it's already a full URL (http/https) or local file (file://), return it as is
  if (pathOrUrl.startsWith('http') || pathOrUrl.startsWith('file://')) {
    return pathOrUrl;
  }

  // Otherwise, assume it's a storage path and generate public URL
  const { data } = supabase.storage
    .from(STORAGE_BUCKETS.ALTERNATE_COVERS)
    .getPublicUrl(pathOrUrl);

  return data.publicUrl;
};
