// Helper functions for deadline calculations

// Functions for processing form data (where totalQuantity is in hours for audio)

/**
 * Calculates the total quantity from form data, converting audio hours to minutes.
 * For audio books, converts hours to minutes and adds any additional minutes.
 * For physical/eBook formats, returns the quantity as-is (pages/chapters).
 *
 * @param format - The book format ('physical', 'eBook', or 'audio')
 * @param totalQuantity - The main quantity value (hours for audio, pages/chapters for others)
 * @param totalMinutes - Additional minutes for audio format (optional)
 * @returns The total quantity in appropriate units (minutes for audio, pages/chapters for others)
 */
export const calculateTotalQuantityFromForm = (
  format: 'physical' | 'eBook' | 'audio',
  totalQuantity: number | string,
  totalMinutes?: number | string
): number => {
  const quantity =
    typeof totalQuantity === 'string' ? parseInt(totalQuantity) : totalQuantity;
  const minutes =
    typeof totalMinutes === 'string'
      ? parseInt(totalMinutes)
      : totalMinutes || 0;

  if (format === 'audio') {
    return quantity * 60 + minutes; // Convert hours to minutes, then add extra minutes
  }
  return quantity;
};

/**
 * Calculates the current progress from form data, converting audio hours to minutes.
 * For audio books, converts hours to minutes and adds any additional minutes.
 * For physical/eBook formats, returns the progress as-is (pages/chapters).
 *
 * @param format - The book format ('physical', 'eBook', or 'audio')
 * @param currentProgress - The main progress value (hours for audio, pages/chapters for others)
 * @param currentMinutes - Additional minutes for audio format (optional)
 * @returns The current progress in appropriate units (minutes for audio, pages/chapters for others)
 */
export const calculateCurrentProgressFromForm = (
  format: 'physical' | 'eBook' | 'audio',
  currentProgress: number | string,
  currentMinutes?: number | string
): number => {
  const progress =
    typeof currentProgress === 'string'
      ? parseInt(currentProgress)
      : currentProgress || 0;
  const minutes =
    typeof currentMinutes === 'string'
      ? parseInt(currentMinutes)
      : currentMinutes || 0;

  if (format === 'audio') {
    return progress * 60 + minutes; // Convert hours to minutes, then add extra minutes
  }
  return progress;
};

// Functions for processing database data (where totalQuantity is already in minutes for audio)

/**
 * Calculates the total quantity from database data.
 * For audio books, totalQuantity is already in minutes, so just adds additional minutes.
 * For physical/eBook formats, returns the quantity as-is (pages/chapters).
 *
 * @param format - The book format ('physical', 'eBook', or 'audio')
 * @param totalQuantity - The main quantity value (minutes for audio, pages/chapters for others)
 * @param totalMinutes - Additional minutes for audio format (optional)
 * @returns The total quantity in appropriate units (minutes for audio, pages/chapters for others)
 */
export const calculateTotalQuantity = (
  format: 'physical' | 'eBook' | 'audio',
  totalQuantity: number | string,
  totalMinutes?: number | string
): number => {
  const quantity =
    typeof totalQuantity === 'string' ? parseInt(totalQuantity) : totalQuantity;
  const minutes =
    typeof totalMinutes === 'string'
      ? parseInt(totalMinutes)
      : totalMinutes || 0;

  if (format === 'audio') {
    return quantity + minutes; // totalQuantity is already in minutes, just add extra minutes
  }
  return quantity;
};

/**
 * Calculates the current progress from database data.
 * For audio books, currentProgress is already in minutes, so just adds additional minutes.
 * For physical/eBook formats, returns the progress as-is (pages/chapters).
 *
 * @param format - The book format ('physical', 'eBook', or 'audio')
 * @param currentProgress - The main progress value (minutes for audio, pages/chapters for others)
 * @param currentMinutes - Additional minutes for audio format (optional)
 * @returns The current progress in appropriate units (minutes for audio, pages/chapters for others)
 */
export const calculateCurrentProgress = (
  format: 'physical' | 'eBook' | 'audio',
  currentProgress: number | string,
  currentMinutes?: number | string
): number => {
  const progress =
    typeof currentProgress === 'string'
      ? parseInt(currentProgress)
      : currentProgress || 0;
  const minutes =
    typeof currentMinutes === 'string'
      ? parseInt(currentMinutes)
      : currentMinutes || 0;

  if (format === 'audio') {
    return progress + minutes; // currentProgress is already in minutes, just add extra minutes
  }
  return progress;
};

/**
 * Calculates the remaining content to be consumed from database data.
 * Uses database-specific calculation functions that handle minutes correctly for audio.
 *
 * @param format - The book format ('physical', 'eBook', or 'audio')
 * @param totalQuantity - The total quantity (minutes for audio, pages/chapters for others)
 * @param totalMinutes - Additional minutes for audio format (optional)
 * @param currentProgress - The current progress (minutes for audio, pages/chapters for others)
 * @param currentMinutes - Additional minutes for current progress in audio format (optional)
 * @returns The remaining content in appropriate units (minutes for audio, pages/chapters for others)
 */
export const calculateRemaining = (
  format: 'physical' | 'eBook' | 'audio',
  totalQuantity: number | string,
  totalMinutes: number | string | undefined,
  currentProgress: number | string,
  currentMinutes: number | string | undefined
): number => {
  const total = calculateTotalQuantity(format, totalQuantity, totalMinutes);
  const current = calculateCurrentProgress(
    format,
    currentProgress,
    currentMinutes
  );
  return total - current;
};

/**
 * Calculates the remaining content to be consumed from form data.
 * Uses form-specific calculation functions that convert audio hours to minutes.
 *
 * @param format - The book format ('physical', 'eBook', or 'audio')
 * @param totalQuantity - The total quantity (hours for audio, pages/chapters for others)
 * @param totalMinutes - Additional minutes for audio format (optional)
 * @param currentProgress - The current progress (hours for audio, pages/chapters for others)
 * @param currentMinutes - Additional minutes for current progress in audio format (optional)
 * @returns The remaining content in appropriate units (minutes for audio, pages/chapters for others)
 */
export const calculateRemainingFromForm = (
  format: 'physical' | 'eBook' | 'audio',
  totalQuantity: number | string,
  totalMinutes: number | string | undefined,
  currentProgress: number | string,
  currentMinutes: number | string | undefined
): number => {
  const total = calculateTotalQuantityFromForm(
    format,
    totalQuantity,
    totalMinutes
  );
  const current = calculateCurrentProgressFromForm(
    format,
    currentProgress,
    currentMinutes
  );
  return total - current;
};

/**
 * Generates a human-readable estimate of the time required to finish the remaining content.
 * Provides different estimates based on the book format and remaining content.
 *
 * @param format - The book format ('physical', 'eBook', or 'audio')
 * @param remaining - The remaining content (minutes for audio, pages/chapters for others)
 * @returns A formatted string with time estimate and appropriate emoji, or empty string if no remaining content
 *
 * @example
 * // For physical/eBook
 * getReadingEstimate('physical', 80) // "📖 About 2 hours of reading time"
 *
 * @example
 * // For audio
 * getReadingEstimate('audio', 150) // "🎧 About 2 hours and 30 minutes of listening time"
 */
export const getReadingEstimate = (
  format: 'physical' | 'eBook' | 'audio',
  remaining: number
): string => {
  if (remaining <= 0) return '';

  switch (format) {
    case 'physical':
    case 'eBook':
      const hours = Math.ceil(remaining / 40); // Assuming 40 pages per hour
      return `📖 About ${hours} hours of reading time`;
    case 'audio':
      const hoursRemaining = Math.floor(remaining / 60);
      const minutesRemaining = remaining % 60;
      if (hoursRemaining > 0) {
        return `🎧 About ${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}${minutesRemaining > 0 ? ` and ${minutesRemaining} minutes` : ''} of listening time`;
      } else {
        return `🎧 About ${minutesRemaining} minutes of listening time`;
      }
    default:
      return '';
  }
};

/**
 * Calculates the daily pace required to finish the remaining content by a deadline.
 * Provides format-specific guidance on daily reading/listening goals.
 *
 * @param format - The book format ('physical', 'eBook', or 'audio')
 * @param deadline - The target completion date
 * @param remaining - The remaining content (minutes for audio, pages/chapters for others)
 * @returns A formatted string with daily pace recommendation and appropriate emoji, or warning if deadline passed
 *
 * @example
 * // For physical/eBook
 * getPaceEstimate('physical', new Date('2024-12-31'), 100) // "📅 You'll need to read 10 pages/day to finish on time"
 *
 * @example
 * // For audio
 * getPaceEstimate('audio', new Date('2024-12-31'), 300) // "📅 You'll need to listen 1 hour/day to finish on time"
 */
export const getPaceEstimate = (
  format: 'physical' | 'eBook' | 'audio',
  deadline: Date,
  remaining: number
): string => {
  // TODO: handle case where deadline is impossible such as if its 52 hours per day of listning needed
  // theres only 24 hours in a day so thats impossible
  //
  if (remaining <= 0) return '';

  const today = new Date();
  const deadlineDate = new Date(deadline);
  const daysLeft = Math.ceil(
    (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysLeft <= 0) {
    return 'This due date has already passed';
  }

  const unitsPerDay = Math.ceil(remaining / daysLeft);

  if (format === 'audio') {
    // For audio, remaining is already in minutes, so unitsPerDay is minutes per day
    const hoursPerDay = Math.floor(unitsPerDay / 60);
    const minutesPerDay = unitsPerDay % 60;
    let paceText = '';
    if (hoursPerDay > 0) {
      paceText = `${hoursPerDay} hour${hoursPerDay > 1 ? 's' : ''}${minutesPerDay > 0 ? ` ${minutesPerDay} minutes` : ''}`;
    } else {
      paceText = `${minutesPerDay} minutes`;
    }
    return `${paceText}/day`;
  } else {
    const unit = 'pages';
    return `${unitsPerDay} ${unit}/day`;
  }
};
