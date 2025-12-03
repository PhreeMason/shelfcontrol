import { formatProgressDisplay } from './deadlineUtils';

/**
 * Message thresholds for progress percentage encouragement
 */
const messageForProgressPercentage = {
  10000: 'Immortal!',
  5000: 'Godlike!',
  2500: 'Mythical!',
  1000: 'Legendary!',
  500: 'Unstoppable!',
  250: 'Incredible!',
  100: 'Amazing work!',
  75: "You're doing great!",
  50: 'Great pace!',
  20: 'Keep it up!',
  0: "Let's get started!",
};

/**
 * Color thresholds for progress percentage visualization
 */
const colorProgressThresholds = {
  1000: '#4b2e83',
  900: '#6247aa',
  800: '#7251b5',
  700: '#815ac0',
  600: '#9163cb',
  500: '#a06cd5',
  400: '#b185db',
  300: '#c19ee0',
  200: '#d2b7e5',
  100: '#dac3e8',
  0: '#E8C2B9',
};

/**
 * Formats the display value for current/total progress
 * @param current - Current progress value
 * @param total - Total progress value
 * @param isListening - Whether this is listening (audio) or reading format
 * @returns Formatted display string
 */
export const getDisplayValue = (
  current: number,
  total: number,
  isListening: boolean
): string => {
  if (isListening) {
    const currentFormatted = formatProgressDisplay('audio', current);
    const totalFormatted = formatProgressDisplay('audio', total);
    return `${currentFormatted}/${totalFormatted}`;
  }
  return `${current}/${total}`;
};

/**
 * Formats the remaining progress text
 * @param current - Current progress value
 * @param total - Total progress value
 * @param isListening - Whether this is listening (audio) or reading format
 * @returns Formatted remaining text
 */
export const getRemainingText = (
  current: number,
  total: number,
  isListening: boolean
): string => {
  const remaining = total - current;
  const isNegative = remaining < 0;

  if (isNegative) {
    const extra = Math.abs(remaining);
    if (isListening) {
      const extraFormatted = formatProgressDisplay('audio', extra);
      return `+${extraFormatted} extra`;
    }
    return `+${extra} pages extra`;
  }

  if (isListening) {
    const remainingFormatted = formatProgressDisplay('audio', remaining);
    return `${remainingFormatted} left`;
  }
  return `${remaining} pages left`;
};

/**
 * Gets the encouragement message based on progress percentage
 * @param progressPercentage - Progress percentage (0-infinity)
 * @returns Encouragement message string
 */
export const getEncouragementMessage = (progressPercentage: number): string => {
  const thresholds = Object.keys(messageForProgressPercentage)
    .map(Number)
    .sort((a, b) => b - a);

  for (const threshold of thresholds) {
    if (progressPercentage >= threshold) {
      return messageForProgressPercentage[
        threshold as keyof typeof messageForProgressPercentage
      ];
    }
  }

  return messageForProgressPercentage[0];
};

/**
 * Gets the background color based on progress percentage
 * @param progressPercentage - Progress percentage (0-infinity)
 * @returns Background color with transparency
 */
export const getProgressBackgroundColor = (
  progressPercentage: number
): string => {
  const colorThresholds = Object.keys(colorProgressThresholds)
    .map(Number)
    .sort((a, b) => b - a);

  let backgroundColor = colorProgressThresholds[0];

  for (const threshold of colorThresholds) {
    if (progressPercentage >= threshold) {
      backgroundColor =
        colorProgressThresholds[
          threshold as keyof typeof colorProgressThresholds
        ];
      break;
    }
  }

  return `${backgroundColor}99`;
};

/**
 * Message thresholds for overdue Catch Up progress percentage
 */
const overdueMessageForProgressPercentage: Record<number, string> = {
  100: 'Caught up!',
  75: 'Almost there!',
  50: 'Making progress!',
  20: 'Keep going!',
  0: 'Bonus reading today',
};

/**
 * Formats the display value for overdue Catch Up current/total progress
 * @param current - Current progress value
 * @param total - Total capacity available
 * @param isListening - Whether this is listening (audio) or reading format
 * @returns Formatted display string
 */
export const getOverdueDisplayValue = (
  current: number,
  total: number,
  isListening: boolean
): string => {
  if (isListening) {
    const currentFormatted = formatProgressDisplay('audio', current);
    const totalFormatted = formatProgressDisplay('audio', total);
    return `${currentFormatted}/${totalFormatted}`;
  }
  return `${current}/${total}`;
};

/**
 * Formats the remaining capacity text for overdue Catch Up
 * @param current - Current progress value
 * @param total - Total capacity available
 * @param isListening - Whether this is listening (audio) or reading format
 * @returns Formatted remaining text
 */
export const getOverdueRemainingText = (
  current: number,
  total: number,
  isListening: boolean
): string => {
  const remaining = total - current;

  if (remaining === 0) {
    return 'Goal reached!';
  }

  if (remaining < 0) {
    const extra = Math.abs(remaining);
    if (isListening) {
      const extraFormatted = formatProgressDisplay('audio', extra);
      return `+${extraFormatted} extra`;
    }
    return `+${extra} pages extra`;
  }

  if (isListening) {
    const remainingFormatted = formatProgressDisplay('audio', remaining);
    return `${remainingFormatted} available`;
  }
  return `${remaining} pages available`;
};

/**
 * Gets the encouragement message for overdue Catch Up based on progress percentage
 * @param progressPercentage - Progress percentage (0-infinity)
 * @returns Encouragement message string
 */
export const getOverdueEncouragementMessage = (
  progressPercentage: number
): string => {
  const thresholds = Object.keys(overdueMessageForProgressPercentage)
    .map(Number)
    .sort((a, b) => b - a);

  for (const threshold of thresholds) {
    if (progressPercentage >= threshold) {
      return overdueMessageForProgressPercentage[threshold];
    }
  }

  return overdueMessageForProgressPercentage[0];
};
