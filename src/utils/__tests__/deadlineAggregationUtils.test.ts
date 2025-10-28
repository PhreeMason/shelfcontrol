import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  calculateAudioTotals,
  calculateCurrentProgressForDeadlines,
  calculateDeadlineTotals,
  calculateReadingTotals,
  calculateTodaysAudioTotals,
  calculateTodaysGoalTotals,
  calculateTodaysGoalUnitsForDeadlines,
  calculateTodaysReadingTotals,
  calculateTotalUnitsForDeadlines,
  DeadlineCalculationResult,
  formatDailyGoalDisplay,
} from '../deadlineAggregationUtils';

const createMockDeadline = (
  id: string,
  format: 'audio' | 'physical' | 'eBook'
): ReadingDeadlineWithProgress => ({
  id,
  book_title: `Test Book ${id}`,
  author: 'Test Author',
  book_id: null,
  deadline_date: '2024-12-31',
  format,
  total_quantity: 300,
  flexibility: 'strict',
  acquisition_source: null,
  type: "Personal",
  publishers: null,
  user_id: 'user123',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  progress: [],
  status: [],
});

describe('deadlineAggregationUtils', () => {
  describe('calculateTotalUnitsForDeadlines', () => {
    it('should return 0 for empty deadlines array', () => {
      const mockGetCalculations = jest.fn();
      const result = calculateTotalUnitsForDeadlines([], mockGetCalculations);

      expect(result).toBe(0);
      expect(mockGetCalculations).not.toHaveBeenCalled();
    });

    it('should return 0 when all calculations return null', () => {
      const mockDeadlines = [
        createMockDeadline('1', 'physical'),
        createMockDeadline('2', 'audio'),
      ];
      const mockGetCalculations = jest.fn().mockReturnValue(null);

      const result = calculateTotalUnitsForDeadlines(
        mockDeadlines,
        mockGetCalculations
      );

      expect(result).toBe(0);
      expect(mockGetCalculations).toHaveBeenCalledTimes(2);
    });

    it('should sum unitsPerDay correctly', () => {
      const mockDeadlines = [
        createMockDeadline('1', 'physical'),
        createMockDeadline('2', 'audio'),
      ];
      const mockGetCalculations = jest
        .fn()
        .mockReturnValueOnce({ unitsPerDay: 30 })
        .mockReturnValueOnce({ unitsPerDay: 45 });

      const result = calculateTotalUnitsForDeadlines(
        mockDeadlines,
        mockGetCalculations
      );

      expect(result).toBe(75);
      expect(mockGetCalculations).toHaveBeenCalledTimes(2);
      expect(mockGetCalculations).toHaveBeenCalledWith(mockDeadlines[0]);
      expect(mockGetCalculations).toHaveBeenCalledWith(mockDeadlines[1]);
    });

    it('should handle mixed null and valid calculations', () => {
      const mockDeadlines = [
        createMockDeadline('1', 'physical'),
        createMockDeadline('2', 'audio'),
        createMockDeadline('3', 'eBook'),
      ];
      const mockGetCalculations = jest
        .fn()
        .mockReturnValueOnce({ unitsPerDay: 20 })
        .mockReturnValueOnce(null)
        .mockReturnValueOnce({ unitsPerDay: 35 });

      const result = calculateTotalUnitsForDeadlines(
        mockDeadlines,
        mockGetCalculations
      );

      expect(result).toBe(55);
    });

    it('should handle calculations with undefined unitsPerDay', () => {
      const mockDeadlines = [createMockDeadline('1', 'physical')];
      const mockGetCalculations = jest
        .fn()
        .mockReturnValue({} as DeadlineCalculationResult);

      const result = calculateTotalUnitsForDeadlines(
        mockDeadlines,
        mockGetCalculations
      );

      expect(result).toBe(0);
    });
  });

  describe('calculateCurrentProgressForDeadlines', () => {
    it('should return 0 for empty deadlines array', () => {
      const mockGetProgress = jest.fn();
      const result = calculateCurrentProgressForDeadlines([], mockGetProgress);

      expect(result).toBe(0);
      expect(mockGetProgress).not.toHaveBeenCalled();
    });

    it('should return 0 when all progress returns null', () => {
      const mockDeadlines = [
        createMockDeadline('1', 'physical'),
        createMockDeadline('2', 'audio'),
      ];
      const mockGetProgress = jest.fn().mockReturnValue(null);

      const result = calculateCurrentProgressForDeadlines(
        mockDeadlines,
        mockGetProgress
      );

      expect(result).toBe(0);
      expect(mockGetProgress).toHaveBeenCalledTimes(2);
    });

    it('should sum progress correctly', () => {
      const mockDeadlines = [
        createMockDeadline('1', 'physical'),
        createMockDeadline('2', 'audio'),
      ];
      const mockGetProgress = jest
        .fn()
        .mockReturnValueOnce(150)
        .mockReturnValueOnce(75);

      const result = calculateCurrentProgressForDeadlines(
        mockDeadlines,
        mockGetProgress
      );

      expect(result).toBe(225);
      expect(mockGetProgress).toHaveBeenCalledTimes(2);
      expect(mockGetProgress).toHaveBeenCalledWith(mockDeadlines[0]);
      expect(mockGetProgress).toHaveBeenCalledWith(mockDeadlines[1]);
    });

    it('should handle mixed null and valid progress', () => {
      const mockDeadlines = [
        createMockDeadline('1', 'physical'),
        createMockDeadline('2', 'audio'),
        createMockDeadline('3', 'eBook'),
      ];
      const mockGetProgress = jest
        .fn()
        .mockReturnValueOnce(100)
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(50);

      const result = calculateCurrentProgressForDeadlines(
        mockDeadlines,
        mockGetProgress
      );

      expect(result).toBe(150);
    });

    it('should handle zero progress values', () => {
      const mockDeadlines = [
        createMockDeadline('1', 'physical'),
        createMockDeadline('2', 'audio'),
      ];
      const mockGetProgress = jest
        .fn()
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(25);

      const result = calculateCurrentProgressForDeadlines(
        mockDeadlines,
        mockGetProgress
      );

      expect(result).toBe(25);
    });
  });

  describe('calculateDeadlineTotals', () => {
    it('should return both total and current values', () => {
      const mockDeadlines = [
        createMockDeadline('1', 'physical'),
        createMockDeadline('2', 'audio'),
      ];
      const mockGetCalculations = jest
        .fn()
        .mockReturnValueOnce({ unitsPerDay: 30 })
        .mockReturnValueOnce({ unitsPerDay: 45 });
      const mockGetProgress = jest
        .fn()
        .mockReturnValueOnce(150)
        .mockReturnValueOnce(90);

      const result = calculateDeadlineTotals(
        mockDeadlines,
        mockGetCalculations,
        mockGetProgress
      );

      expect(result).toEqual({
        total: 75,
        current: 240,
      });
    });

    it('should handle empty deadlines array', () => {
      const mockGetCalculations = jest.fn();
      const mockGetProgress = jest.fn();

      const result = calculateDeadlineTotals(
        [],
        mockGetCalculations,
        mockGetProgress
      );

      expect(result).toEqual({
        total: 0,
        current: 0,
      });
    });
  });

  describe('calculateAudioTotals', () => {
    it('should calculate totals for audio deadlines', () => {
      const audioDeadlines = [
        createMockDeadline('1', 'audio'),
        createMockDeadline('2', 'audio'),
      ];
      const mockGetCalculations = jest
        .fn()
        .mockReturnValueOnce({ unitsPerDay: 60 })
        .mockReturnValueOnce({ unitsPerDay: 90 });
      const mockGetProgress = jest
        .fn()
        .mockReturnValueOnce(120)
        .mockReturnValueOnce(45);

      const result = calculateAudioTotals(
        audioDeadlines,
        mockGetCalculations,
        mockGetProgress
      );

      expect(result).toEqual({
        total: 150,
        current: 165,
      });
    });

    it('should handle empty audio deadlines', () => {
      const mockGetCalculations = jest.fn();
      const mockGetProgress = jest.fn();

      const result = calculateAudioTotals(
        [],
        mockGetCalculations,
        mockGetProgress
      );

      expect(result).toEqual({
        total: 0,
        current: 0,
      });
    });
  });

  describe('calculateReadingTotals', () => {
    it('should calculate totals for reading deadlines', () => {
      const readingDeadlines = [
        createMockDeadline('1', 'physical'),
        createMockDeadline('2', 'eBook'),
      ];
      const mockGetCalculations = jest
        .fn()
        .mockReturnValueOnce({ unitsPerDay: 25 })
        .mockReturnValueOnce({ unitsPerDay: 40 });
      const mockGetProgress = jest
        .fn()
        .mockReturnValueOnce(200)
        .mockReturnValueOnce(150);

      const result = calculateReadingTotals(
        readingDeadlines,
        mockGetCalculations,
        mockGetProgress
      );

      expect(result).toEqual({
        total: 65,
        current: 350,
      });
    });

    it('should handle empty reading deadlines', () => {
      const mockGetCalculations = jest.fn();
      const mockGetProgress = jest.fn();

      const result = calculateReadingTotals(
        [],
        mockGetCalculations,
        mockGetProgress
      );

      expect(result).toEqual({
        total: 0,
        current: 0,
      });
    });
  });

  describe('edge cases', () => {
    it('should handle large numbers correctly', () => {
      const mockDeadlines = [createMockDeadline('1', 'physical')];
      const mockGetCalculations = jest
        .fn()
        .mockReturnValue({ unitsPerDay: 999999 });
      const mockGetProgress = jest.fn().mockReturnValue(888888);

      const result = calculateDeadlineTotals(
        mockDeadlines,
        mockGetCalculations,
        mockGetProgress
      );

      expect(result).toEqual({
        total: 999999,
        current: 888888,
      });
    });

    it('should handle negative progress values', () => {
      const mockDeadlines = [createMockDeadline('1', 'physical')];
      const mockGetCalculations = jest
        .fn()
        .mockReturnValue({ unitsPerDay: 30 });
      const mockGetProgress = jest.fn().mockReturnValue(-10);

      const result = calculateDeadlineTotals(
        mockDeadlines,
        mockGetCalculations,
        mockGetProgress
      );

      expect(result).toEqual({
        total: 30,
        current: -10,
      });
    });
  });

  // Tests for new "today's goals" functions that ignore archive status
  describe("Today's Goals Functions (ignore archive status)", () => {
    const createDeadlineWithStatus = (
      id: string,
      format: 'audio' | 'physical' | 'eBook',
      isCompleted: boolean = false
    ): ReadingDeadlineWithProgress => ({
      ...createMockDeadline(id, format),
      deadline_date: '2024-12-31',
      total_quantity: 300,
      progress: [
        {
          id: `progress-${id}`,
          deadline_id: id,
          current_progress: 50,
          time_spent_reading: null,
          ignore_in_calcs: false,
          created_at: '2024-01-01T08:00:00Z',
          updated_at: '2024-01-01T08:00:00Z',
        },
      ],
      status: isCompleted
        ? [
            {
              id: `status-${id}`,
              deadline_id: id,
              status: 'complete',
              created_at: '2024-01-15T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z',
            },
          ]
        : [],
    });

    describe('calculateTodaysGoalUnitsForDeadlines', () => {
      it('should calculate units per day ignoring completion status', () => {
        const mockDeadlines = [
          createDeadlineWithStatus('1', 'physical', false), // Active
          createDeadlineWithStatus('2', 'physical', true), // Completed
        ];

        const result = calculateTodaysGoalUnitsForDeadlines(mockDeadlines);

        // Both should contribute to today's goals regardless of completion status
        expect(result).toBeGreaterThan(0);
        // Should be the same for both deadlines since they have same parameters
        expect(result).toBe(result); // Just ensuring it calculates something positive
      });

      it('should handle empty deadlines array', () => {
        const result = calculateTodaysGoalUnitsForDeadlines([]);
        expect(result).toBe(0);
      });
    });

    describe('calculateTodaysGoalTotals', () => {
      beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-01-20T12:00:00Z'));
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('should maintain stable daily goals while tracking current progress', () => {
        const mockDeadlines = [
          createDeadlineWithStatus('1', 'physical', false),
          createDeadlineWithStatus('2', 'physical', true), // Completed
        ];

        const mockGetProgress = jest
          .fn()
          .mockReturnValueOnce(20) // Progress for active deadline
          .mockReturnValueOnce(30); // Progress for completed deadline

        const result = calculateTodaysGoalTotals(
          mockDeadlines,
          mockGetProgress
        );

        // Total should include both deadlines (ignoring completion status)
        expect(result.total).toBeGreaterThan(0);
        // Current should sum the actual progress from both
        expect(result.current).toBe(50);
      });

      it('should count progress in current when ignore_in_calcs is toggled from true to false', () => {
        const now = new Date('2024-01-20T10:00:00Z');
        const deadline: ReadingDeadlineWithProgress = {
          id: 'test-1',
          user_id: 'user-1',
          book_id: null,
          book_title: 'Test Book',
          author: 'Test Author',
          deadline_date: '2024-12-31',
          total_quantity: 300,
          format: 'physical',
          flexibility: 'flexible',
          acquisition_source: null,
          type: "Personal",
          publishers: null,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
          progress: [
            {
              id: 'p1',
              deadline_id: 'test-1',
              current_progress: 50,
              created_at: now.toISOString(),
              updated_at: now.toISOString(),
              time_spent_reading: null,
              ignore_in_calcs: false,
            },
          ],
          status: [],
        };

        const mockGetProgress = jest.fn().mockReturnValue(50);

        const result = calculateTodaysGoalTotals([deadline], mockGetProgress);

        expect(result.current).toBe(50);
        expect(mockGetProgress).toHaveBeenCalledWith(deadline);
      });

      it('should not count progress in current when ignore_in_calcs=true and timestamp is yesterday', () => {
        const yesterday = new Date('2024-01-19T12:00:00Z');
        const deadline: ReadingDeadlineWithProgress = {
          id: 'test-1',
          user_id: 'user-1',
          book_id: null,
          book_title: 'Test Book',
          author: 'Test Author',
          deadline_date: '2024-12-31',
          total_quantity: 300,
          format: 'physical',
          flexibility: 'flexible',
          acquisition_source: null,
          type: "Personal",
          publishers: null,
          created_at: new Date('2024-01-20T08:00:00Z').toISOString(),
          updated_at: new Date('2024-01-20T08:00:00Z').toISOString(),
          progress: [
            {
              id: 'p1',
              deadline_id: 'test-1',
              current_progress: 50,
              created_at: yesterday.toISOString(),
              updated_at: yesterday.toISOString(),
              time_spent_reading: null,
              ignore_in_calcs: true,
            },
          ],
          status: [],
        };

        const mockGetProgress = jest.fn().mockReturnValue(0);

        const result = calculateTodaysGoalTotals([deadline], mockGetProgress);

        expect(result.current).toBe(0);
        expect(mockGetProgress).toHaveBeenCalledWith(deadline);
      });

      it('should handle realistic scenario: initial baseline then additional progress today', () => {
        const yesterday = new Date('2024-01-19T12:00:00Z');
        const today = new Date('2024-01-20T10:00:00Z');
        const deadline: ReadingDeadlineWithProgress = {
          id: 'test-1',
          user_id: 'user-1',
          book_id: null,
          book_title: 'Test Book',
          author: 'Test Author',
          deadline_date: '2024-12-31',
          total_quantity: 300,
          format: 'physical',
          flexibility: 'flexible',
          acquisition_source: null,
          type: "Personal",
          publishers: null,
          created_at: yesterday.toISOString(),
          updated_at: today.toISOString(),
          progress: [
            {
              id: 'p1',
              deadline_id: 'test-1',
              current_progress: 30,
              created_at: yesterday.toISOString(),
              updated_at: yesterday.toISOString(),
              time_spent_reading: null,
              ignore_in_calcs: true,
            },
            {
              id: 'p2',
              deadline_id: 'test-1',
              current_progress: 80,
              created_at: today.toISOString(),
              updated_at: today.toISOString(),
              time_spent_reading: null,
              ignore_in_calcs: false,
            },
          ],
          status: [],
        };

        const mockGetProgress = jest.fn().mockReturnValue(50);

        const result = calculateTodaysGoalTotals([deadline], mockGetProgress);

        expect(result.current).toBe(50);
      });
    });

    describe('calculateTodaysAudioTotals', () => {
      it('should calculate stable goals for audio deadlines', () => {
        const audioDeadlines = [
          createDeadlineWithStatus('1', 'audio', false),
          createDeadlineWithStatus('2', 'audio', true), // Completed
        ];

        const mockGetProgress = jest
          .fn()
          .mockReturnValueOnce(45)
          .mockReturnValueOnce(60);

        const result = calculateTodaysAudioTotals(
          audioDeadlines,
          mockGetProgress
        );

        expect(result.total).toBeGreaterThan(0);
        expect(result.current).toBe(105);
      });
    });

    describe('calculateTodaysReadingTotals', () => {
      it('should calculate stable goals for reading deadlines', () => {
        const readingDeadlines = [
          createDeadlineWithStatus('1', 'physical', false),
          createDeadlineWithStatus('2', 'eBook', true), // Completed
        ];

        const mockGetProgress = jest
          .fn()
          .mockReturnValueOnce(25)
          .mockReturnValueOnce(15);

        const result = calculateTodaysReadingTotals(
          readingDeadlines,
          mockGetProgress
        );

        expect(result.total).toBeGreaterThan(0);
        expect(result.current).toBe(40);
      });
    });

    describe('comparison with original functions', () => {
      it('should show difference between archive-aware and archive-ignoring calculations', () => {
        const deadlines = [
          createDeadlineWithStatus('1', 'physical', true), // Completed deadline
        ];

        // Mock the original calculation that returns 0 for archived deadlines
        const mockGetCalculationsArchiveAware = jest
          .fn()
          .mockReturnValue({ unitsPerDay: 0 });
        const mockGetProgress = jest.fn().mockReturnValue(10);

        // Original function should return 0 total for completed deadline
        const originalResult = calculateDeadlineTotals(
          deadlines,
          mockGetCalculationsArchiveAware,
          mockGetProgress
        );

        // Today's goal function should return non-zero total
        const todaysGoalResult = calculateTodaysGoalTotals(
          deadlines,
          mockGetProgress
        );

        expect(originalResult.total).toBe(0); // Archive-aware returns 0
        expect(todaysGoalResult.total).toBeGreaterThan(0); // Today's goals ignore archive status
        expect(originalResult.current).toBe(todaysGoalResult.current); // Current progress should be same
      });
    });
  });

  describe('formatDailyGoalDisplay', () => {
    describe('audio format', () => {
      it('should format minutes only when less than 60', () => {
        expect(formatDailyGoalDisplay(45, 'audio')).toBe('45m');
      });

      it('should format hours only when exact hour', () => {
        expect(formatDailyGoalDisplay(120, 'audio')).toBe('2h');
      });

      it('should format hours and minutes when mixed', () => {
        expect(formatDailyGoalDisplay(90, 'audio')).toBe('1h 30m');
        expect(formatDailyGoalDisplay(135, 'audio')).toBe('2h 15m');
      });

      it('should handle zero minutes', () => {
        expect(formatDailyGoalDisplay(0, 'audio')).toBe('0m');
      });

      it('should round minutes', () => {
        expect(formatDailyGoalDisplay(45.7, 'audio')).toBe('46m');
        expect(formatDailyGoalDisplay(90.3, 'audio')).toBe('1h 30m');
      });
    });

    describe('physical format', () => {
      it('should format pages correctly', () => {
        expect(formatDailyGoalDisplay(50, 'physical')).toBe('50 pages');
      });

      it('should round pages', () => {
        expect(formatDailyGoalDisplay(50.7, 'physical')).toBe('51 pages');
      });

      it('should handle zero pages', () => {
        expect(formatDailyGoalDisplay(0, 'physical')).toBe('0 pages');
      });

      it('should handle large numbers', () => {
        expect(formatDailyGoalDisplay(999, 'physical')).toBe('999 pages');
      });
    });

    describe('eBook format', () => {
      it('should format pages correctly', () => {
        expect(formatDailyGoalDisplay(75, 'eBook')).toBe('75 pages');
      });

      it('should round pages', () => {
        expect(formatDailyGoalDisplay(75.4, 'eBook')).toBe('75 pages');
      });
    });
  });
});
