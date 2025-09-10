import dayjs from 'dayjs';

/**
 * Convert UTC date string to local date string (YYYY-MM-DD)
 * This ensures dates display correctly in user's timezone
 */
export const utcToLocalDate = (utcDateString: string): string => {
  return dayjs(utcDateString).format('YYYY-MM-DD');
};

/**
 * Format a UTC date string for display
 * @param utcDateString - UTC date string from database
 * @param format - Day.js format string (default: 'MMM D, YYYY')
 */
export const formatDisplayDate = (utcDateString: string, format: string = 'MMM D, YYYY'): string => {
  return dayjs(utcDateString).format(format);
};

/**
 * Check if date1 is before date2 (comparing just dates, not times)
 * @param date1 - First date (can be string or Date)
 * @param date2 - Second date (defaults to today)
 */
export const isDateBefore = (date1: string | Date, date2: string | Date = new Date()): boolean => {
  return dayjs(date1).startOf('day').isBefore(dayjs(date2).startOf('day'));
};

/**
 * Calculate days difference between two dates
 * @param deadlineDate - The deadline date
 * @param fromDate - Starting date (defaults to today)
 * @returns Number of days (negative if deadline is in past)
 */
export const calculateDaysLeft = (deadlineDate: string, fromDate: Date = new Date()): number => {
  const deadline = dayjs(deadlineDate).startOf('day');
  const from = dayjs(fromDate).startOf('day');
  return deadline.diff(from, 'day');
};