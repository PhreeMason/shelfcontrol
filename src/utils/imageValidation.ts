import * as ImagePicker from 'expo-image-picker';

/**
 * Image validation error types
 */
export type ImageValidationErrorType =
  | 'FILE_TOO_LARGE'
  | 'PERMISSION_DENIED'
  | 'INVALID_FORMAT'
  | 'SELECTION_CANCELED';

/**
 * Image validation error structure
 */
export interface ImageValidationError {
  type: ImageValidationErrorType;
  message: string;
}

/**
 * Successful validation result
 */
export interface ImageValidationSuccess {
  valid: true;
  uri: string;
}

/**
 * Failed validation result
 */
export interface ImageValidationFailure {
  valid: false;
  error: ImageValidationError;
}

/**
 * Image validation result (discriminated union)
 */
export type ImageValidationResult =
  | ImageValidationSuccess
  | ImageValidationFailure;

/**
 * Safely extracts file size from image asset, defaulting to 0 if undefined
 *
 * @param fileSize - File size from ImagePicker asset
 * @returns File size in bytes, or 0 if undefined
 */
export const getFileSizeOrDefault = (fileSize?: number): number => {
  return fileSize || 0;
};

/**
 * Validates file size against maximum allowed size
 *
 * @param fileSize - File size in bytes
 * @param maxSize - Maximum allowed size in bytes
 * @returns True if file size is within limit
 */
export const validateImageSize = (
  fileSize: number,
  maxSize: number
): boolean => {
  return fileSize <= maxSize;
};

/**
 * Validates an ImagePicker result for file size and format
 *
 * @param result - Result from ImagePicker selection
 * @param maxFileSize - Maximum allowed file size in bytes
 * @returns Validation result with uri or error
 *
 * @example
 * ```typescript
 * const result = await ImagePicker.launchImageLibraryAsync({...});
 * const validation = validateImageResult(result, 5 * 1024 * 1024); // 5MB limit
 *
 * if (validation.valid) {
 *   onImageChange(validation.uri);
 * } else {
 *   Alert.alert('Error', validation.error.message);
 * }
 * ```
 */
export const validateImageResult = (
  result: ImagePicker.ImagePickerResult,
  maxFileSize: number
): ImageValidationResult => {
  // User canceled selection
  if (result.canceled) {
    return {
      valid: false,
      error: {
        type: 'SELECTION_CANCELED',
        message: 'Image selection was canceled.',
      },
    };
  }

  // No assets returned
  if (!result.assets || result.assets.length === 0) {
    return {
      valid: false,
      error: {
        type: 'INVALID_FORMAT',
        message: 'No image was selected.',
      },
    };
  }

  const asset = result.assets[0];

  // No URI in asset
  if (!asset.uri) {
    return {
      valid: false,
      error: {
        type: 'INVALID_FORMAT',
        message: 'Selected image has no URI.',
      },
    };
  }

  // Validate file size
  const fileSize = getFileSizeOrDefault(asset.fileSize);
  if (!validateImageSize(fileSize, maxFileSize)) {
    return {
      valid: false,
      error: {
        type: 'FILE_TOO_LARGE',
        message: 'Please select an image smaller than 5MB.',
      },
    };
  }

  // Validation successful
  return {
    valid: true,
    uri: asset.uri,
  };
};
