/**
 * Shared test utilities and mock factories for testing
 */

import { ReadingDeadlineWithProgress } from '@/types/deadline.types';

/**
 * Creates a mock deadline for testing
 *
 * @param id - Unique identifier for the deadline
 * @param format - Book format ('physical', 'eBook', or 'audio')
 * @param totalQuantity - Total pages (physical/eBook) or minutes (audio)
 * @param deadlineDate - Deadline date string
 * @param progress - Array of progress entries
 * @param status - Array of status entries
 * @returns Mock ReadingDeadlineWithProgress object
 *
 * @example
 * ```typescript
 * const deadline = createMockDeadline(
 *   '1',
 *   'physical',
 *   300,
 *   '2024-01-31',
 *   [{ current_progress: 50, created_at: '2024-01-09' }],
 *   [{ status: 'reading', created_at: '2024-01-01' }]
 * );
 * ```
 */
export function createMockDeadline(
  id: string,
  format: 'physical' | 'eBook' | 'audio',
  totalQuantity: number,
  deadlineDate: string,
  progress: {
    current_progress: number;
    created_at: string;
    ignore_in_calcs?: boolean;
  }[] = [],
  status: {
    status:
      | 'pending'
      | 'reading'
      | 'paused'
      | 'to_review'
      | 'complete'
      | 'did_not_finish';
    created_at: string;
  }[] = []
): ReadingDeadlineWithProgress {
  return {
    id,
    user_id: 'user-123',
    book_id: 'book-123',
    book_title: 'Test Book',
    author: 'Test Author',
    acquisition_source: null,
    type: 'Personal',
    publishers: null,
    deadline_date: deadlineDate,
    total_quantity: totalQuantity,
    format,
    flexibility: 'flexible',
    cover_image_url: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    progress: progress.map((p, index) => ({
      id: `progress-${id}-${index}`,
      deadline_id: id,
      current_progress: p.current_progress,
      created_at: p.created_at,
      updated_at: p.created_at,
      time_spent_reading: null,
      ignore_in_calcs: p.ignore_in_calcs || false,
    })),
    status: status.map((s, index) => ({
      id: `status-${id}-${index}`,
      deadline_id: id,
      status: s.status,
      created_at: s.created_at,
      updated_at: s.created_at,
    })),
  };
}

/**
 * Common mock theme colors for testing
 */
export const mockThemeColors = {
  background: '#ffffff',
  border: '#e5e7eb',
  textMuted: '#9ca3af',
  successGreen: '#86b468',
  warningOrange: '#f97316',
  errorRed: '#dc2626',
} as const;

/**
 * Mock implementation of normalizeServerDate for testing
 * Simply returns a dayjs instance from the date string
 */
export const mockNormalizeServerDate = (date: string) => {
  const dayjs = require('@/lib/dayjs').dayjs;
  return dayjs(date);
};

/**
 * Sets up fake timers for a specific date
 * Useful for testing time-dependent functionality
 *
 * @param dateString - Date string to set as current time
 *
 * @example
 * ```typescript
 * beforeEach(() => {
 *   setupFakeTimers('2024-01-10');
 * });
 *
 * afterEach(() => {
 *   jest.useRealTimers();
 * });
 * ```
 */
export function setupFakeTimers(dateString: string) {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(dateString));
}

/**
 * Restores real timers
 * Should be called in afterEach when using setupFakeTimers
 */
export function teardownFakeTimers() {
  jest.useRealTimers();
}
