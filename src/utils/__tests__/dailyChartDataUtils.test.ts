/**
 * Tests for daily chart data utilities
 */

import { dayjs } from '@/lib/dayjs';
import {
  ReadingDeadlineProgress,
  ReadingDeadlineStatus,
  ReadingDeadlineWithProgress,
} from '@/types/deadline.types';
import {
  calculateDailyCumulativeProgress,
  calculateIntradayProgress,
  calculateProgressStatus,
  calculateRequiredDailyPace,
  getFirstProgressDate,
  getProgressAsOfDate,
  getReadingStartDate,
  hasDailyActivity,
  transformToDailyChartData,
} from '../dailyChartDataUtils';

// Mock the dateNormalization module
jest.mock('../dateNormalization', () => {
  const { dayjs: mockDayjs } = jest.requireActual('@/lib/dayjs');
  return {
    normalizeServerDate: (date: string) => mockDayjs(date),
  };
});

// Helper to create a mock deadline
const createMockDeadline = (
  overrides?: Partial<ReadingDeadlineWithProgress>
): ReadingDeadlineWithProgress =>
  ({
    id: 'deadline-1',
    user_id: 'user-1',
    book_id: 'book-1',
    deadline_date: '2025-01-31',
    total_quantity: 310,
    format: 'physical' as const,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    progress: [],
    status: [],
    type: 'deadline',
    ...overrides,
  }) as ReadingDeadlineWithProgress;

// Helper to create mock status
const createMockStatus = (
  status: ReadingDeadlineStatus['status'],
  created_at: string
): ReadingDeadlineStatus => ({
  id: `status-${status}`,
  deadline_id: 'deadline-1',
  status,
  created_at,
  updated_at: created_at,
});

// Helper to create mock progress
const createMockProgress = (
  current_progress: number,
  created_at: string
): ReadingDeadlineProgress => ({
  id: `progress-${current_progress}`,
  deadline_id: 'deadline-1',
  current_progress,
  ignore_in_calcs: false,
  time_spent_reading: null,
  created_at,
  updated_at: created_at,
});

describe('dailyChartDataUtils', () => {
  describe('getReadingStartDate', () => {
    it('should return null when status array is empty', () => {
      const deadline = createMockDeadline({ status: [] });
      expect(getReadingStartDate(deadline)).toBeNull();
    });

    it('should return null when status is missing', () => {
      const deadline: ReadingDeadlineWithProgress = {
        ...createMockDeadline(),
        status: undefined as any,
      };
      expect(getReadingStartDate(deadline)).toBeNull();
    });

    it('should return the created_at of the first reading status', () => {
      const deadline = createMockDeadline({
        status: [createMockStatus('reading', '2025-01-01T10:00:00Z')],
      });
      expect(getReadingStartDate(deadline)).toBe('2025-01-01T10:00:00Z');
    });

    it('should find the earliest reading status when multiple exist', () => {
      const deadline = createMockDeadline({
        status: [
          createMockStatus('reading', '2025-01-05T00:00:00Z'),
          createMockStatus('paused', '2025-01-03T00:00:00Z'),
          createMockStatus('reading', '2025-01-01T00:00:00Z'),
          createMockStatus('reading', '2025-01-10T00:00:00Z'),
        ],
      });
      expect(getReadingStartDate(deadline)).toBe('2025-01-01T00:00:00Z');
    });

    it('should return null when no reading status exists', () => {
      const deadline = createMockDeadline({
        status: [
          createMockStatus('pending', '2025-01-01T00:00:00Z'),
          createMockStatus('paused', '2025-01-05T00:00:00Z'),
        ],
      });
      expect(getReadingStartDate(deadline)).toBeNull();
    });
  });

  describe('getFirstProgressDate', () => {
    it('should return null when progress array is empty', () => {
      const deadline = createMockDeadline({ progress: [] });
      expect(getFirstProgressDate(deadline)).toBeNull();
    });

    it('should return null when progress is missing', () => {
      const deadline: ReadingDeadlineWithProgress = {
        ...createMockDeadline(),
        progress: undefined as any,
      };
      expect(getFirstProgressDate(deadline)).toBeNull();
    });

    it('should return the created_at of the first progress entry', () => {
      const deadline = createMockDeadline({
        progress: [createMockProgress(50, '2025-01-05T10:00:00Z')],
      });
      expect(getFirstProgressDate(deadline)).toBe('2025-01-05T10:00:00Z');
    });

    it('should find the earliest progress entry when multiple exist', () => {
      const deadline = createMockDeadline({
        progress: [
          createMockProgress(100, '2025-01-10T00:00:00Z'),
          createMockProgress(50, '2025-01-05T00:00:00Z'),
          createMockProgress(150, '2025-01-15T00:00:00Z'),
        ],
      });
      expect(getFirstProgressDate(deadline)).toBe('2025-01-05T00:00:00Z');
    });

    it('should exclude ignored progress entries', () => {
      const deadline = createMockDeadline({
        progress: [
          {
            ...createMockProgress(999, '2025-01-01T00:00:00Z'),
            ignore_in_calcs: true,
          },
          createMockProgress(50, '2025-01-05T00:00:00Z'),
          createMockProgress(100, '2025-01-10T00:00:00Z'),
        ],
      });
      expect(getFirstProgressDate(deadline)).toBe('2025-01-05T00:00:00Z');
    });

    it('should return null when all progress entries are ignored', () => {
      const deadline = createMockDeadline({
        progress: [
          {
            ...createMockProgress(50, '2025-01-05T00:00:00Z'),
            ignore_in_calcs: true,
          },
          {
            ...createMockProgress(100, '2025-01-10T00:00:00Z'),
            ignore_in_calcs: true,
          },
        ],
      });
      expect(getFirstProgressDate(deadline)).toBeNull();
    });
  });

  describe('calculateRequiredDailyPace', () => {
    it('should return null when there is no progress data', () => {
      const deadline = createMockDeadline({ progress: [] });
      expect(calculateRequiredDailyPace(deadline)).toBeNull();
    });

    it('should calculate correct pace using first progress date', () => {
      // Start: Jan 5 (first progress), End: Jan 31, Total: 310 pages
      // dayjs diff calculates days between Jan 5 and Jan 31
      const deadline = createMockDeadline({
        deadline_date: '2025-01-31',
        total_quantity: 310,
        status: [createMockStatus('reading', '2025-01-01T00:00:00Z')],
        progress: [createMockProgress(50, '2025-01-05T00:00:00Z')],
      });

      const pace = calculateRequiredDailyPace(deadline);
      // Actual calculation: 310 pages / diff days
      expect(pace).toBeCloseTo(11.48, 2);
    });

    it('should return null when deadline is before first progress date', () => {
      const deadline = createMockDeadline({
        deadline_date: '2025-01-01',
        progress: [createMockProgress(50, '2025-01-15T00:00:00Z')],
      });
      expect(calculateRequiredDailyPace(deadline)).toBeNull();
    });

    it('should handle same-day completion (progress and deadline on same day)', () => {
      // Book added and completed on the same day (Jan 15)
      // This should use at least 1 day for pace calculation
      const deadline = createMockDeadline({
        deadline_date: '2025-01-15',
        total_quantity: 310,
        progress: [
          createMockProgress(100, '2025-01-15T10:00:00Z'),
          createMockProgress(310, '2025-01-15T20:00:00Z'),
        ],
      });

      const pace = calculateRequiredDailyPace(deadline);
      // Should use Math.max(1, 0) = 1 day
      // Required pace: 310/1 = 310 pages/day
      expect(pace).toBe(310);
    });

    it('should calculate correct pace for audio format from first progress', () => {
      // Start: Jan 5 (first progress), End: Jan 21, Total: 420 minutes
      const deadline = createMockDeadline({
        deadline_date: '2025-01-21',
        total_quantity: 420,
        format: 'audio',
        status: [createMockStatus('reading', '2025-01-01T00:00:00Z')],
        progress: [createMockProgress(100, '2025-01-05T00:00:00Z')],
      });

      const pace = calculateRequiredDailyPace(deadline);
      // Actual calculation: 420 minutes / diff days
      expect(pace).toBeCloseTo(24.71, 2);
    });
  });

  describe('getProgressAsOfDate', () => {
    it('should return 0 when progress array is empty', () => {
      const deadline = createMockDeadline({ progress: [] });
      const date = dayjs('2025-01-15');
      expect(getProgressAsOfDate(deadline, date)).toBe(0);
    });

    it('should return highest progress on or before date', () => {
      const deadline = createMockDeadline({
        progress: [
          createMockProgress(50, '2025-01-05T00:00:00Z'),
          createMockProgress(100, '2025-01-10T00:00:00Z'),
          createMockProgress(150, '2025-01-15T00:00:00Z'),
          createMockProgress(200, '2025-01-20T00:00:00Z'),
        ],
      });

      const date = dayjs('2025-01-15');
      expect(getProgressAsOfDate(deadline, date)).toBe(150);
    });

    it('should exclude progress after the date', () => {
      const deadline = createMockDeadline({
        progress: [
          createMockProgress(50, '2025-01-05T00:00:00Z'),
          createMockProgress(100, '2025-01-10T00:00:00Z'),
          createMockProgress(200, '2025-01-20T00:00:00Z'),
        ],
      });

      const date = dayjs('2025-01-12');
      expect(getProgressAsOfDate(deadline, date)).toBe(100);
    });

    it('should exclude ignored progress entries', () => {
      const deadline = createMockDeadline({
        progress: [
          createMockProgress(50, '2025-01-05T00:00:00Z'),
          {
            ...createMockProgress(999, '2025-01-10T00:00:00Z'),
            ignore_in_calcs: true,
          },
          createMockProgress(100, '2025-01-12T00:00:00Z'),
        ],
      });

      const date = dayjs('2025-01-15');
      expect(getProgressAsOfDate(deadline, date)).toBe(100);
    });

    it('should return 0 when all progress is after the date', () => {
      const deadline = createMockDeadline({
        progress: [
          createMockProgress(100, '2025-01-20T00:00:00Z'),
          createMockProgress(150, '2025-01-25T00:00:00Z'),
        ],
      });

      const date = dayjs('2025-01-10');
      expect(getProgressAsOfDate(deadline, date)).toBe(0);
    });

    it('should handle progress on the exact date', () => {
      const deadline = createMockDeadline({
        progress: [
          createMockProgress(50, '2025-01-10T08:00:00Z'),
          createMockProgress(100, '2025-01-10T20:00:00Z'),
        ],
      });

      const date = dayjs('2025-01-10');
      expect(getProgressAsOfDate(deadline, date)).toBe(100);
    });
  });

  describe('hasDailyActivity', () => {
    it('should return false when progress array is empty', () => {
      const date = dayjs('2025-01-10');
      expect(hasDailyActivity(date, [])).toBe(false);
    });

    it('should return true when there is progress on the date', () => {
      const progress = [createMockProgress(50, '2025-01-10T10:00:00Z')];
      const date = dayjs('2025-01-10');
      expect(hasDailyActivity(date, progress)).toBe(true);
    });

    it('should return false when there is no progress on the date', () => {
      const progress = [
        createMockProgress(50, '2025-01-05T00:00:00Z'),
        createMockProgress(100, '2025-01-15T00:00:00Z'),
      ];
      const date = dayjs('2025-01-10');
      // Check for a date with no activity between two progress entries
      expect(hasDailyActivity(date, progress)).toBe(false);
    });

    it('should exclude ignored progress entries', () => {
      const progress = [
        {
          ...createMockProgress(50, '2025-01-10T00:00:00Z'),
          ignore_in_calcs: true,
        },
      ];
      const date = dayjs('2025-01-10');
      expect(hasDailyActivity(date, progress)).toBe(false);
    });

    it('should match activity regardless of time within the day', () => {
      const progress = [createMockProgress(50, '2025-01-10T23:59:59Z')];
      const date = dayjs('2025-01-10');
      expect(hasDailyActivity(date, progress)).toBe(true);
    });
  });

  describe('calculateIntradayProgress', () => {
    it('should generate time-based points for same-day progress', () => {
      const deadline = createMockDeadline({
        total_quantity: 256,
        progress: [
          createMockProgress(100, '2025-01-15T09:00:00Z'),
          createMockProgress(256, '2025-01-15T15:30:00Z'),
        ],
      });
      const startDate = dayjs('2025-01-15');
      const requiredDailyPace = 36; // 256 / 7 days

      const result = calculateIntradayProgress(deadline, startDate, requiredDailyPace);

      expect(result.length).toBe(3); // Start (midnight) + 2 progress entries
      expect(result[0].actual).toBe(0); // Starts at 0
      expect(result[0].date).toMatch(/\d{1,2}:\d{2} (AM|PM)/); // Time format
      expect(result[0].hasActivity).toBe(false); // Midnight start has no activity
      expect(result[1].actual).toBe(100);
      expect(result[1].date).toMatch(/\d{1,2}:\d{2} (AM|PM)/); // Time format
      expect(result[1].hasActivity).toBe(true);
      expect(result[2].actual).toBe(256);
      expect(result[2].date).toMatch(/\d{1,2}:\d{2} (AM|PM)/); // Time format
      expect(result[2].hasActivity).toBe(true);
    });

    it('should use local time format h:mm A', () => {
      const deadline = createMockDeadline({
        total_quantity: 256,
        progress: [createMockProgress(256, '2025-01-15T15:30:00Z')],
      });
      const startDate = dayjs('2025-01-15');
      const requiredDailyPace = 36; // 256 / 7 days

      const result = calculateIntradayProgress(deadline, startDate, requiredDailyPace);

      // First point should be midnight
      expect(result[0].date).toBe('12:00 AM');
      // Second point should have time format
      expect(result[1].date).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
    });

    it('should handle single progress entry', () => {
      const deadline = createMockDeadline({
        total_quantity: 256,
        progress: [createMockProgress(256, '2025-01-15T20:00:00Z')],
      });
      const startDate = dayjs('2025-01-15');
      const requiredDailyPace = 36; // 256 / 7 days

      const result = calculateIntradayProgress(deadline, startDate, requiredDailyPace);

      expect(result.length).toBe(2); // Start + 1 entry
      expect(result[0].actual).toBe(0);
      expect(result[1].actual).toBe(256);
      expect(result[1].dailyActual).toBe(256); // Full progress in one jump
    });

    it('should sort progress entries by timestamp', () => {
      const deadline = createMockDeadline({
        total_quantity: 300,
        progress: [
          createMockProgress(300, '2025-01-15T20:00:00Z'), // Latest first
          createMockProgress(100, '2025-01-15T09:00:00Z'), // Earliest
          createMockProgress(200, '2025-01-15T14:00:00Z'), // Middle
        ],
      });
      const startDate = dayjs('2025-01-15');
      const requiredDailyPace = 43; // 300 / 7 days

      const result = calculateIntradayProgress(deadline, startDate, requiredDailyPace);

      expect(result.length).toBe(4); // Start + 3 entries
      expect(result[0].actual).toBe(0); // Midnight
      expect(result[1].actual).toBe(100); // 9am (sorted correctly)
      expect(result[2].actual).toBe(200); // 2pm
      expect(result[3].actual).toBe(300); // 8pm
    });

    it('should filter out entries with ignore_in_calcs', () => {
      const deadline = createMockDeadline({
        total_quantity: 300,
        progress: [
          createMockProgress(100, '2025-01-15T09:00:00Z'),
          {
            ...createMockProgress(999, '2025-01-15T12:00:00Z'),
            ignore_in_calcs: true, // Should be excluded
          },
          createMockProgress(200, '2025-01-15T15:00:00Z'),
        ],
      });
      const startDate = dayjs('2025-01-15');
      const requiredDailyPace = 43; // 300 / 7 days

      const result = calculateIntradayProgress(deadline, startDate, requiredDailyPace);

      expect(result.length).toBe(3); // Start + 2 valid entries (ignoring 999)
      expect(result[1].actual).toBe(100);
      expect(result[2].actual).toBe(200);
      // Should not include 999
      expect(result.some(p => p.actual === 999)).toBe(false);
    });

    it('should filter entries to only include the specified day', () => {
      const deadline = createMockDeadline({
        total_quantity: 300,
        progress: [
          createMockProgress(50, '2025-01-14T23:00:00Z'), // Day before
          createMockProgress(100, '2025-01-15T09:00:00Z'), // Target day
          createMockProgress(200, '2025-01-15T15:00:00Z'), // Target day
          createMockProgress(250, '2025-01-16T10:00:00Z'), // Day after
        ],
      });
      const startDate = dayjs('2025-01-15');
      const requiredDailyPace = 43; // 300 / 7 days

      const result = calculateIntradayProgress(deadline, startDate, requiredDailyPace);

      expect(result.length).toBe(3); // Start + 2 entries from Jan 15 only
      expect(result[1].actual).toBe(100);
      expect(result[2].actual).toBe(200);
      // Should not include entries from other days
      expect(result.some(p => p.actual === 50)).toBe(false);
      expect(result.some(p => p.actual === 250)).toBe(false);
    });

    it('should calculate incremental dailyActual correctly', () => {
      const deadline = createMockDeadline({
        total_quantity: 300,
        progress: [
          createMockProgress(100, '2025-01-15T09:00:00Z'),
          createMockProgress(180, '2025-01-15T14:00:00Z'),
          createMockProgress(300, '2025-01-15T20:00:00Z'),
        ],
      });
      const startDate = dayjs('2025-01-15');
      const requiredDailyPace = 43; // 300 / 7 days

      const result = calculateIntradayProgress(deadline, startDate, requiredDailyPace);

      expect(result[0].dailyActual).toBe(0); // Midnight start
      expect(result[1].dailyActual).toBe(100); // 0 → 100
      expect(result[2].dailyActual).toBe(80); // 100 → 180
      expect(result[3].dailyActual).toBe(120); // 180 → 300
    });

    it('should set required as daily required pace', () => {
      const deadline = createMockDeadline({
        total_quantity: 256,
        progress: [
          createMockProgress(100, '2025-01-15T09:00:00Z'),
          createMockProgress(256, '2025-01-15T15:30:00Z'),
        ],
      });
      const startDate = dayjs('2025-01-15');
      const requiredDailyPace = 36; // 256 / 7 days

      const result = calculateIntradayProgress(deadline, startDate, requiredDailyPace);

      // All points should have required = requiredDailyPace
      expect(result.every(p => p.required === 36)).toBe(true);
    });

    it('should add starting point at midnight with 0 progress', () => {
      const deadline = createMockDeadline({
        total_quantity: 256,
        progress: [createMockProgress(256, '2025-01-15T20:00:00Z')],
      });
      const startDate = dayjs('2025-01-15');
      const requiredDailyPace = 36; // 256 / 7 days

      const result = calculateIntradayProgress(deadline, startDate, requiredDailyPace);

      // First point should be at midnight
      expect(result[0].date).toBe('12:00 AM');
      expect(result[0].actual).toBe(0);
      expect(result[0].required).toBe(36);
      expect(result[0].hasActivity).toBe(false);
      expect(result[0].fullDate.format('YYYY-MM-DD HH:mm:ss')).toBe(
        '2025-01-15 00:00:00'
      );
    });

    it('should handle empty progress array for the day', () => {
      const deadline = createMockDeadline({
        total_quantity: 256,
        progress: [], // No progress
      });
      const startDate = dayjs('2025-01-15');
      const requiredDailyPace = 36; // 256 / 7 days

      const result = calculateIntradayProgress(deadline, startDate, requiredDailyPace);

      // Should only have the midnight starting point
      expect(result.length).toBe(1);
      expect(result[0].date).toBe('12:00 AM');
      expect(result[0].actual).toBe(0);
    });

    it('should handle all progress entries ignored for the day', () => {
      const deadline = createMockDeadline({
        total_quantity: 256,
        progress: [
          {
            ...createMockProgress(100, '2025-01-15T09:00:00Z'),
            ignore_in_calcs: true,
          },
          {
            ...createMockProgress(256, '2025-01-15T20:00:00Z'),
            ignore_in_calcs: true,
          },
        ],
      });
      const startDate = dayjs('2025-01-15');
      const requiredDailyPace = 36; // 256 / 7 days

      const result = calculateIntradayProgress(deadline, startDate, requiredDailyPace);

      // Should only have the midnight starting point
      expect(result.length).toBe(1);
      expect(result[0].date).toBe('12:00 AM');
      expect(result[0].actual).toBe(0);
    });

    it('should handle multiple progress entries at different times throughout day', () => {
      const deadline = createMockDeadline({
        total_quantity: 500,
        progress: [
          createMockProgress(50, '2025-01-15T08:00:00Z'), // 8am
          createMockProgress(120, '2025-01-15T10:30:00Z'), // 10:30am
          createMockProgress(200, '2025-01-15T13:00:00Z'), // 1pm
          createMockProgress(350, '2025-01-15T17:15:00Z'), // 5:15pm
          createMockProgress(500, '2025-01-15T21:45:00Z'), // 9:45pm
        ],
      });
      const startDate = dayjs('2025-01-15');
      const requiredDailyPace = 71; // 500 / 7 days

      const result = calculateIntradayProgress(deadline, startDate, requiredDailyPace);

      expect(result.length).toBe(6); // Start + 5 entries
      expect(result[0].actual).toBe(0);
      expect(result[1].actual).toBe(50);
      expect(result[2].actual).toBe(120);
      expect(result[3].actual).toBe(200);
      expect(result[4].actual).toBe(350);
      expect(result[5].actual).toBe(500);
      // Verify all have time format labels
      expect(result.every(p => p.date.match(/\d{1,2}:\d{2} (AM|PM)/))).toBe(
        true
      );
    });

    it('should preserve fullDate as Dayjs object for each point', () => {
      const deadline = createMockDeadline({
        total_quantity: 256,
        progress: [createMockProgress(256, '2025-01-15T15:30:00Z')],
      });
      const startDate = dayjs('2025-01-15');
      const requiredDailyPace = 36; // 256 / 7 days

      const result = calculateIntradayProgress(deadline, startDate, requiredDailyPace);

      // All fullDate values should be Dayjs objects
      expect(result.every(p => dayjs.isDayjs(p.fullDate))).toBe(true);
      // All should be on the same day
      expect(
        result.every(p => p.fullDate.format('YYYY-MM-DD') === '2025-01-15')
      ).toBe(true);
    });
  });

  describe('calculateDailyCumulativeProgress', () => {
    it('should return empty array when no progress data', () => {
      const deadline = createMockDeadline({ progress: [] });
      const result = calculateDailyCumulativeProgress(deadline, 7);
      expect(result).toEqual([]);
    });

    it('should return empty array when cannot calculate required pace', () => {
      const deadline = createMockDeadline({
        deadline_date: '2025-01-01', // Before start
        progress: [createMockProgress(50, '2025-01-15T00:00:00Z')],
      });
      const result = calculateDailyCumulativeProgress(deadline, 7);
      expect(result).toEqual([]);
    });

    it('should calculate cumulative progress using first progress date', () => {
      const deadline = createMockDeadline({
        deadline_date: '2025-01-31',
        total_quantity: 310,
        status: [createMockStatus('reading', '2025-01-01T00:00:00Z')],
        progress: [
          createMockProgress(50, '2025-01-05T00:00:00Z'),
          createMockProgress(100, '2025-01-08T00:00:00Z'),
          createMockProgress(120, '2025-01-10T00:00:00Z'),
        ],
      });

      const result = calculateDailyCumulativeProgress(deadline, 7);

      // Should return data starting from first progress date (Jan 5)
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('required');
      expect(result[0]).toHaveProperty('actual');
      expect(result[0]).toHaveProperty('hasActivity');
      // First point should be on or after Jan 5 (first progress)
      expect(
        result.every(p => dayjs(p.fullDate).isSameOrAfter('2025-01-05'))
      ).toBe(true);
    });

    it('should exclude days before first progress', () => {
      const deadline = createMockDeadline({
        deadline_date: '2025-12-31',
        total_quantity: 310,
        status: [createMockStatus('reading', '2025-01-01T00:00:00Z')],
        progress: [createMockProgress(50, '2025-01-03T00:00:00Z')],
      });

      const result = calculateDailyCumulativeProgress(deadline, 7);

      // Should only include days after first progress (Jan 3)
      expect(
        result.every(p => dayjs(p.fullDate).isSameOrAfter('2025-01-03'))
      ).toBe(true);
    });

    it('should use intraday calculation for single-day progress', () => {
      // Book added and completed on the same day
      const deadline = createMockDeadline({
        deadline_date: '2025-01-15',
        total_quantity: 310,
        progress: [
          createMockProgress(100, '2025-01-15T10:00:00Z'),
          createMockProgress(310, '2025-01-15T20:00:00Z'),
        ],
      });

      // Pass the completion date as endDate to simulate completed book
      const endDate = dayjs('2025-01-15');
      const result = calculateDailyCumulativeProgress(deadline, 7, endDate);

      // Should return time-based points, not day-based
      expect(result.length).toBeGreaterThan(1);
      // Should use time format (h:mm A) instead of date format (M/DD)
      expect(result[0].date).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
      expect(result[0].date).toBe('12:00 AM'); // Midnight start
      // All points should be on Jan 15
      expect(
        result.every(p => dayjs(p.fullDate).isSame('2025-01-15', 'day'))
      ).toBe(true);
      // Should have progression: 0 → 100 → 310
      expect(result[0].actual).toBe(0);
      expect(result[1].actual).toBe(100);
      expect(result[2].actual).toBe(310);
    });
  });

  describe('calculateProgressStatus', () => {
    it('should calculate ahead status correctly', () => {
      const result = calculateProgressStatus(100, 80, 'physical');

      expect(result.difference).toBe(20);
      expect(result.isAhead).toBe(true);
      expect(result.displayText).toBe('+20 pages ahead');
      expect(result.color).toBe('#86b468'); // Green
    });

    it('should calculate behind status correctly', () => {
      const result = calculateProgressStatus(80, 100, 'physical');

      expect(result.difference).toBe(-20);
      expect(result.isAhead).toBe(false);
      expect(result.displayText).toBe('20 pages behind');
      expect(result.color).toBe('#f97316'); // Orange
    });

    it('should calculate on track status correctly', () => {
      const result = calculateProgressStatus(100, 100, 'physical');

      expect(result.difference).toBe(0);
      expect(result.isAhead).toBe(false);
      expect(result.displayText).toBe('On track');
      expect(result.color).toBe('#f97316'); // Orange (not ahead)
    });

    it('should use minutes for audio format', () => {
      const result = calculateProgressStatus(120, 100, 'audio');

      // formatAudiobookTime returns "20m" not "20 min"
      expect(result.displayText).toBe('+20m ahead');
    });

    it('should use pages for eBook format', () => {
      const result = calculateProgressStatus(150, 200, 'eBook');

      expect(result.displayText).toBe('50 pages behind');
    });

    it('should round difference values', () => {
      const result = calculateProgressStatus(100.7, 95.3, 'physical');

      expect(result.displayText).toBe('+5 pages ahead');
    });
  });

  describe('transformToDailyChartData', () => {
    it('should return empty data when input arrays are empty', () => {
      const result = transformToDailyChartData([], [], 'physical');

      expect(result.actualLineData).toEqual([]);
      expect(result.requiredLineData).toEqual([]);
      expect(result.maxValue).toBe(0);
      expect(result.status.displayText).toBe('No data');
    });

    it('should transform actual data with activity indicators', () => {
      const actualData = [
        {
          date: '1/5',
          fullDate: dayjs('2025-01-05'),
          required: 50,
          actual: 60,
          dailyActual: 60,
          hasActivity: true,
        },
        {
          date: '1/6',
          fullDate: dayjs('2025-01-06'),
          required: 60,
          actual: 60,
          dailyActual: 0,
          hasActivity: false,
        },
      ];

      const requiredData = [
        {
          date: '1/5',
          fullDate: dayjs('2025-01-05'),
          required: 50,
          actual: 60,
          dailyActual: 60,
          hasActivity: true,
        },
        {
          date: '1/6',
          fullDate: dayjs('2025-01-06'),
          required: 60,
          actual: 60,
          dailyActual: 0,
          hasActivity: false,
        },
      ];

      const result = transformToDailyChartData(
        actualData,
        requiredData,
        'physical'
      );

      expect(result.actualLineData).toHaveLength(2);
      expect(result.actualLineData[0].dataPointColor).toBe('#B8A9D9'); // CHART_COLORS.PRIMARY
      expect(result.actualLineData[0].dataPointRadius).toBe(6); // hasActivity: true
      expect(result.actualLineData[1].dataPointColor).toBe('#B8A9D9'); // CHART_COLORS.PRIMARY (same for all)
      expect(result.actualLineData[1].dataPointRadius).toBe(2); // hasActivity: false
    });

    it('should transform required data without activity indicators', () => {
      const actualData = [
        {
          date: '1/5',
          fullDate: dayjs('2025-01-05'),
          required: 50,
          actual: 40,
          dailyActual: 40,
          hasActivity: true,
        },
      ];

      const requiredData = [
        {
          date: '1/5',
          fullDate: dayjs('2025-01-05'),
          required: 50,
          actual: 40,
          dailyActual: 40,
          hasActivity: true,
        },
      ];

      const result = transformToDailyChartData(
        actualData,
        requiredData,
        'physical'
      );

      expect(result.requiredLineData).toHaveLength(1);
      expect(result.requiredLineData[0].value).toBe(50);
      expect(result.requiredLineData[0].label).toBe('1/5');
      // Required line doesn't have color/radius
      expect(result.requiredLineData[0].dataPointColor).toBeUndefined();
    });

    it('should calculate correct max value', () => {
      const actualData = [
        {
          date: '1/5',
          fullDate: dayjs('2025-01-05'),
          required: 50,
          actual: 100,
          dailyActual: 100,
          hasActivity: true,
        },
        {
          date: '1/6',
          fullDate: dayjs('2025-01-06'),
          required: 60,
          actual: 150,
          dailyActual: 50,
          hasActivity: true,
        },
      ];

      const requiredData = [
        {
          date: '1/5',
          fullDate: dayjs('2025-01-05'),
          required: 50,
          actual: 100,
          dailyActual: 100,
          hasActivity: true,
        },
        {
          date: '1/6',
          fullDate: dayjs('2025-01-06'),
          required: 60,
          actual: 150,
          dailyActual: 50,
          hasActivity: true,
        },
      ];

      const result = transformToDailyChartData(
        actualData,
        requiredData,
        'physical'
      );

      expect(result.maxValue).toBe(150); // Max of all actual and required values
    });

    it('should calculate status from latest data points', () => {
      const actualData = [
        {
          date: '1/5',
          fullDate: dayjs('2025-01-05'),
          required: 50,
          actual: 40,
          dailyActual: 40,
          hasActivity: true,
        },
        {
          date: '1/6',
          fullDate: dayjs('2025-01-06'),
          required: 60,
          actual: 70,
          dailyActual: 30,
          hasActivity: true,
        },
      ];

      const requiredData = [
        {
          date: '1/5',
          fullDate: dayjs('2025-01-05'),
          required: 50,
          actual: 40,
          dailyActual: 40,
          hasActivity: true,
        },
        {
          date: '1/6',
          fullDate: dayjs('2025-01-06'),
          required: 60,
          actual: 70,
          dailyActual: 30,
          hasActivity: true,
        },
      ];

      const result = transformToDailyChartData(
        actualData,
        requiredData,
        'physical'
      );

      // Latest: actual=70, required=60, difference=+10
      expect(result.status.difference).toBe(10);
      expect(result.status.isAhead).toBe(true);
      expect(result.status.displayText).toBe('+10 pages ahead');
    });

    it('should handle audio format correctly', () => {
      const actualData = [
        {
          date: '1/5',
          fullDate: dayjs('2025-01-05'),
          required: 100,
          actual: 80,
          dailyActual: 80,
          hasActivity: true,
        },
      ];

      const requiredData = [
        {
          date: '1/5',
          fullDate: dayjs('2025-01-05'),
          required: 100,
          actual: 80,
          dailyActual: 80,
          hasActivity: true,
        },
      ];

      const result = transformToDailyChartData(
        actualData,
        requiredData,
        'audio'
      );

      // formatAudiobookTime returns "20m" not "20 min"
      expect(result.status.displayText).toBe('20m behind');
    });
  });
});
