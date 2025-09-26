import { formatProgressDisplay } from './deadlineUtils';

/**
 * Calculates the new progress value after applying an increment
 */
export const calculateNewProgress = (
  currentFormValue: string | number | undefined,
  increment: number,
  currentProgress: number,
  totalQuantity: number
): number => {
  let numericValue: number;

  if (typeof currentFormValue === 'number' && !isNaN(currentFormValue)) {
    numericValue = currentFormValue;
  } else if (typeof currentFormValue === 'string') {
    const parsed = parseFloat(currentFormValue.trim());
    numericValue = isNaN(parsed) ? currentProgress : parsed;
  } else {
    numericValue = currentProgress;
  }

  const newProgress = numericValue + increment;
  return Math.max(0, Math.min(totalQuantity, newProgress));
};

/**
 * Determines if backward progress warning should be shown
 */
export const shouldShowBackwardProgressWarning = (
  newProgress: number,
  currentProgress: number
): boolean => {
  return newProgress < currentProgress;
};

/**
 * Checks if the book is complete based on progress
 */
export const isBookComplete = (
  newProgress: number,
  totalQuantity: number
): boolean => {
  return newProgress >= totalQuantity;
};

/**
 * Formats the progress update success message
 */
export const formatProgressUpdateMessage = (
  format: 'physical' | 'eBook' | 'audio',
  newProgress: number
): string => {
  return `Updated to ${formatProgressDisplay(format, newProgress)}`;
};

/**
 * Formats the completion dialog message
 */
export const formatCompletionMessage = (
  format: 'physical' | 'eBook' | 'audio',
  newProgress: number,
  bookTitle: string
): string => {
  return `Progress updated to ${formatProgressDisplay(format, newProgress)}.\n\nYou've reached the end of "${bookTitle}". Would you like to mark this book as complete?`;
};

/**
 * Formats the backward progress warning message
 */
export const formatBackwardProgressWarning = (
  format: 'physical' | 'eBook' | 'audio',
  currentProgress: number,
  newProgress: number
): { unit: string; message: string } => {
  const progressUnit = format === 'audio' ? 'time' : 'page';
  const currentDisplay = formatProgressDisplay(format, currentProgress);
  const newDisplay = formatProgressDisplay(format, newProgress);

  return {
    unit: progressUnit,
    message: `You're updating from ${currentDisplay} to ${newDisplay}. This will delete all progress entries greater than the new ${progressUnit}. Are you sure?`,
  };
};

/**
 * Validates if progress value has changed
 */
export const hasProgressChanged = (
  newProgress: number,
  currentProgress: number
): boolean => {
  return newProgress !== currentProgress;
};

/**
 * Gets the appropriate toast message for book completion
 */
export const getCompletionToastMessage = (
  bookTitle: string
): {
  title: string;
  message: string;
} => {
  return {
    title: 'Deadline completed!',
    message: `Congratulations on finishing "${bookTitle}"!`,
  };
};

/**
 * Gets the appropriate error toast message
 */
export const getErrorToastMessage = (
  action: 'update' | 'complete' | 'deleteFuture',
  error?: Error | null
): {
  title: string;
  message: string;
} => {
  switch (action) {
    case 'update':
      return {
        title: 'Update Failed',
        message: 'Please try again',
      };
    case 'complete':
      return {
        title: 'Failed to complete deadline',
        message: error?.message || 'Please try again',
      };
    case 'deleteFuture':
      return {
        title: 'Failed to Delete Future Progress',
        message: 'Please try again',
      };
    default:
      return {
        title: 'Operation Failed',
        message: 'Please try again',
      };
  }
};
