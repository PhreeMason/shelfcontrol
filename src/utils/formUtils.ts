/**
 * Transform text input to numeric value for progress input
 * @param text - Input text from user
 * @returns Parsed integer or 0 if invalid
 */
export const transformProgressInputText = (text: string): number => {
  if (!text) return 0;
  const parsed = parseInt(text, 10);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Transform numeric value to string for display in input
 * @param value - Numeric value
 * @returns String representation or empty string if falsy
 */
export const transformProgressValueToText = (value: number | null | undefined): string => {
  return value?.toString() || '';
};

/**
 * Determine if format requires special input component
 * @param format - Book format type
 * @returns true if format needs AudiobookProgressInput
 */
export const requiresAudiobookInput = (format: 'physical' | 'eBook' | 'audio'): boolean => {
  return format === 'audio';
};