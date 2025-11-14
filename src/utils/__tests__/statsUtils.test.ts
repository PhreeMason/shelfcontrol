import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  calculateWeeklyReadingStats,
  calculateWeeklyListeningStats,
  formatAudioTime,
  getWeekDateRange,
  getCompletionDateThisWeek,
  getWeeklyStatusColors,
  formatAheadBehindText,
  getAheadBehindLabel,
  type ThemeColors,
} from '../statsUtils';
import { createMockDeadline, mockThemeColors } from './testHelpers';

// Mock the dateNormalization module
jest.mock('../dateNormalization', () => ({
  normalizeServerDate: (date: string) => {
    const dayjs = require('@/lib/dayjs').dayjs;
    return dayjs(date);
  },
}));

// Mock the deadlineCore module
jest.mock('../deadlineCore', () => ({
  calculateProgress: (deadline: ReadingDeadlineWithProgress) => {
    if (!deadline.progress || deadline.progress.length === 0) return 0;
    const latest = deadline.progress.reduce((latest, current) =>
      new Date(current.created_at) > new Date(latest.created_at)
        ? current
        : latest
    );
    return latest.current_progress || 0;
  },
}));

describe('statsUtils', () => {
  describe('formatAudioTime', () => {
    it('should format minutes under 60 as just minutes', () => {
      expect(formatAudioTime(27)).toBe('27m');
      expect(formatAudioTime(45)).toBe('45m');
      expect(formatAudioTime(1)).toBe('1m');
      expect(formatAudioTime(59)).toBe('59m');
    });

    it('should format exactly 60 minutes as 1h', () => {
      expect(formatAudioTime(60)).toBe('1h');
    });

    it('should format minutes 60+ with hours and minutes', () => {
      expect(formatAudioTime(75)).toBe('1h 15m');
      expect(formatAudioTime(90)).toBe('1h 30m');
      expect(formatAudioTime(135)).toBe('2h 15m');
      expect(formatAudioTime(185)).toBe('3h 5m');
    });

    it('should format hours evenly divisible by 60', () => {
      expect(formatAudioTime(120)).toBe('2h');
      expect(formatAudioTime(180)).toBe('3h');
    });

    it('should handle negative values', () => {
      expect(formatAudioTime(-27)).toBe('27m');
      expect(formatAudioTime(-75)).toBe('1h 15m');
    });

    it('should round minutes to nearest integer', () => {
      expect(formatAudioTime(27.4)).toBe('27m');
      expect(formatAudioTime(27.6)).toBe('28m');
      expect(formatAudioTime(75.3)).toBe('1h 15m');
    });

    it('should handle exactly 0 minutes', () => {
      expect(formatAudioTime(0)).toBe('0m');
    });
  });

  describe('getWeeklyStatusColors', () => {
    const mockColors: ThemeColors = {
      background: '#FFFFFF',
      border: '#E5E7EB',
      textMuted: '#9CA3AF',
      successGreen: '#10B981',
      errorRed: '#EF4444',
      warningOrange: '#F59E0B',
    };

    it('should return success colors for ahead status', () => {
      const result = getWeeklyStatusColors('ahead', mockColors);

      expect(result.background).toBe(mockColors.background);
      expect(result.border).toBe(mockColors.border);
      expect(result.text).toBe(mockColors.successGreen);
      expect(result.progressBar).toBe(mockColors.successGreen);
    });

    it('should return error colors for behind status', () => {
      const result = getWeeklyStatusColors('behind', mockColors);

      expect(result.background).toBe(mockColors.background);
      expect(result.border).toBe(mockColors.border);
      expect(result.text).toBe(mockColors.errorRed);
      expect(result.progressBar).toBe(mockColors.errorRed);
    });

    it('should return warning colors for onTrack status', () => {
      const result = getWeeklyStatusColors('onTrack', mockColors);

      expect(result.background).toBe(mockColors.background);
      expect(result.border).toBe(mockColors.border);
      expect(result.text).toBe(mockColors.warningOrange);
      expect(result.progressBar).toBe(mockColors.warningOrange);
    });

    it('should use theme colors not hardcoded values', () => {
      const customColors: ThemeColors = {
        background: '#000000',
        border: '#111111',
        textMuted: '#222222',
        successGreen: '#00FF00',
        errorRed: '#FF0000',
        warningOrange: '#FFA500',
      };

      const result = getWeeklyStatusColors('ahead', customColors);

      expect(result.text).toBe(customColors.successGreen);
      expect(result.border).toBe(customColors.border);
      expect(result.background).toBe(customColors.background);
    });
  });

  describe('formatAheadBehindText', () => {
    it('should format positive values with + prefix', () => {
      const formatValue = (value: number) => `${value} pages`;

      expect(formatAheadBehindText(50, formatValue)).toBe('+50 pages');
      expect(formatAheadBehindText(100, formatValue)).toBe('+100 pages');
      expect(formatAheadBehindText(1, formatValue)).toBe('+1 pages');
    });

    it('should format negative values with - prefix', () => {
      const formatValue = (value: number) => `${value} pages`;

      expect(formatAheadBehindText(-50, formatValue)).toBe('-50 pages');
      expect(formatAheadBehindText(-100, formatValue)).toBe('-100 pages');
      expect(formatAheadBehindText(-1, formatValue)).toBe('-1 pages');
    });

    it('should format zero without prefix', () => {
      const formatValue = (value: number) => `${value} pages`;

      expect(formatAheadBehindText(0, formatValue)).toBe('0 pages');
    });

    it('should work with formatAudioTime for audio stats', () => {
      expect(formatAheadBehindText(75, formatAudioTime)).toBe('+1h 15m');
      expect(formatAheadBehindText(-45, formatAudioTime)).toBe('-45m');
      expect(formatAheadBehindText(0, formatAudioTime)).toBe('0m');
    });

    it('should use absolute value for negative numbers', () => {
      const formatValue = (value: number) => `${value}x`;

      const result = formatAheadBehindText(-123, formatValue);

      expect(result).toBe('-123x');
      expect(result).not.toContain('--'); // No double negative
    });
  });

  describe('getAheadBehindLabel', () => {
    it('should return "ahead" for positive values', () => {
      expect(getAheadBehindLabel(1)).toBe('ahead');
      expect(getAheadBehindLabel(50)).toBe('ahead');
      expect(getAheadBehindLabel(100)).toBe('ahead');
      expect(getAheadBehindLabel(0.1)).toBe('ahead');
    });

    it('should return "behind" for negative values', () => {
      expect(getAheadBehindLabel(-1)).toBe('behind');
      expect(getAheadBehindLabel(-50)).toBe('behind');
      expect(getAheadBehindLabel(-100)).toBe('behind');
      expect(getAheadBehindLabel(-0.1)).toBe('behind');
    });

    it('should return "on track" for zero', () => {
      expect(getAheadBehindLabel(0)).toBe('on track');
    });
  });

  describe('getWeekDateRange', () => {
    it('should return start of week as Sunday', () => {
      const { start } = getWeekDateRange();
      expect(start.day()).toBe(0); // 0 = Sunday
    });

    it('should return end of week as Saturday', () => {
      const { end } = getWeekDateRange();
      expect(end.day()).toBe(6); // 6 = Saturday
    });

    it('should have end after start', () => {
      const { start, end } = getWeekDateRange();
      expect(end.isAfter(start)).toBe(true);
    });
  });

  describe('getCompletionDateThisWeek', () => {
    beforeEach(() => {
      // Mock current date to be 2024-01-10 (Wednesday)
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-10'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return null when no status history', () => {
      const deadline = createMockDeadline(
        '1',
        'physical',
        300,
        '2024-01-20',
        [],
        []
      );
      expect(getCompletionDateThisWeek(deadline)).toBeNull();
    });

    it('should return null when no completion status', () => {
      const deadline = createMockDeadline(
        '1',
        'physical',
        300,
        '2024-01-20',
        [],
        [{ status: 'reading', created_at: '2024-01-08' }]
      );
      expect(getCompletionDateThisWeek(deadline)).toBeNull();
    });

    it('should return null when completed before this week', () => {
      const deadline = createMockDeadline(
        '1',
        'physical',
        300,
        '2024-01-20',
        [],
        [
          { status: 'reading', created_at: '2024-01-01' },
          { status: 'complete', created_at: '2024-01-06' }, // Saturday before this week
        ]
      );
      expect(getCompletionDateThisWeek(deadline)).toBeNull();
    });

    it('should return date when completed this week', () => {
      const completionDate = '2024-01-09'; // Tuesday this week
      const deadline = createMockDeadline(
        '1',
        'physical',
        300,
        '2024-01-20',
        [],
        [
          { status: 'reading', created_at: '2024-01-01' },
          { status: 'complete', created_at: completionDate },
        ]
      );
      expect(getCompletionDateThisWeek(deadline)).toBe(completionDate);
    });

    it('should return date when moved to review this week', () => {
      const reviewDate = '2024-01-11'; // Thursday this week
      const deadline = createMockDeadline(
        '1',
        'physical',
        300,
        '2024-01-20',
        [],
        [
          { status: 'reading', created_at: '2024-01-01' },
          { status: 'to_review', created_at: reviewDate },
        ]
      );
      expect(getCompletionDateThisWeek(deadline)).toBe(reviewDate);
    });

    it('should find first completion status in history', () => {
      const firstCompletion = '2024-01-08'; // Monday this week
      const deadline = createMockDeadline(
        '1',
        'physical',
        300,
        '2024-01-20',
        [],
        [
          { status: 'reading', created_at: '2024-01-01' },
          { status: 'complete', created_at: firstCompletion },
          { status: 'to_review', created_at: '2024-01-09' },
        ]
      );
      expect(getCompletionDateThisWeek(deadline)).toBe(firstCompletion);
    });
  });

  describe('calculateWeeklyReadingStats', () => {
    beforeEach(() => {
      // Mock current date to be 2024-01-10 (Wednesday)
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-10'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return zero stats when no reading books', () => {
      const result = calculateWeeklyReadingStats([], []);

      expect(result.unitsReadThisWeek).toBe(0);
      expect(result.unitsNeededThisWeek).toBe(0);
      expect(result.unitsAheadBehind).toBe(0);
      expect(result.averagePerDay).toBe(0);
      expect(result.requiredDailyPace).toBe(0);
      expect(result.daysWithActivity).toBe(0);
      expect(result.progressPercentage).toBe(0);
      expect(result.overallStatus).toBe('onTrack');
    });

    it('should calculate pages read this week from progress entries', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-31',
          [
            { current_progress: 50, created_at: '2024-01-08' }, // Monday - in week
            { current_progress: 80, created_at: '2024-01-09' }, // Tuesday - in week
          ],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateWeeklyReadingStats(deadlines, []);

      // Progress is cumulative, so we read 80 pages total this week
      expect(result.unitsReadThisWeek).toBe(80);
    });

    it('should exclude progress entries with ignore_in_calcs=true', () => {
      const deadline = createMockDeadline(
        '1',
        'physical',
        300,
        '2024-01-31',
        [],
        [{ status: 'reading', created_at: '2024-01-01' }]
      );

      // Manually add progress with ignore_in_calcs
      deadline.progress = [
        {
          id: 'p1',
          deadline_id: '1',
          current_progress: 50,
          created_at: '2024-01-08',
          updated_at: '2024-01-08',
          time_spent_reading: null,
          ignore_in_calcs: true, // Should be excluded
        },
        {
          id: 'p2',
          deadline_id: '1',
          current_progress: 30,
          created_at: '2024-01-09',
          updated_at: '2024-01-09',
          time_spent_reading: null,
          ignore_in_calcs: false,
        },
      ];

      const result = calculateWeeklyReadingStats([deadline], []);

      expect(result.unitsReadThisWeek).toBe(30); // Only the non-ignored entry
    });

    it('should exclude progress entries from previous weeks', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-31',
          [
            { current_progress: 50, created_at: '2024-01-06' }, // Last week - 50 pages
            { current_progress: 80, created_at: '2024-01-09' }, // This week - 80 pages total
          ],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateWeeklyReadingStats(deadlines, []);

      // Pages read THIS WEEK = 80 (end) - 50 (start) = 30 pages
      expect(result.unitsReadThisWeek).toBe(30);
    });

    it('should calculate required pages based on daily pace', () => {
      // Book with 300 pages, started Jan 1, deadline Jan 31 (30 days)
      // Daily pace = 300 / 30 = 10 pages/day
      // Weekly goal = 10 * 7 = 70 pages
      const deadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-31',
          [{ current_progress: 50, created_at: '2024-01-09' }],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateWeeklyReadingStats(deadlines, []);

      expect(result.requiredDailyPace).toBe(10);
      expect(result.unitsNeededThisWeek).toBe(70);
    });

    it('should calculate ahead/behind correctly', () => {
      // Need 70 pages, read 100 pages = +30 ahead
      const deadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-31',
          [{ current_progress: 100, created_at: '2024-01-09' }],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateWeeklyReadingStats(deadlines, []);

      expect(result.unitsAheadBehind).toBe(30);
      expect(result.overallStatus).toBe('ahead');
    });

    it('should calculate average pages per day', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-31',
          [
            { current_progress: 30, created_at: '2024-01-08' }, // Monday
            { current_progress: 60, created_at: '2024-01-09' }, // Tuesday
            { current_progress: 90, created_at: '2024-01-10' }, // Wednesday
          ],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateWeeklyReadingStats(deadlines, []);

      // 90 pages / 3 days = 30 pages/day
      expect(result.averagePerDay).toBe(30);
      expect(result.daysWithActivity).toBe(3);
    });

    it('should count unique days with activity', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-31',
          [
            { current_progress: 20, created_at: '2024-01-08T10:00:00' }, // Monday AM
            { current_progress: 40, created_at: '2024-01-08T18:00:00' }, // Monday PM
            { current_progress: 60, created_at: '2024-01-09T10:00:00' }, // Tuesday
          ],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateWeeklyReadingStats(deadlines, []);

      // Only 2 unique days even though 3 entries
      expect(result.daysWithActivity).toBe(2);
    });

    it('should calculate progress percentage', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-31',
          [{ current_progress: 35, created_at: '2024-01-09' }],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateWeeklyReadingStats(deadlines, []);

      // Read 35, need 70 = 50%
      expect(result.progressPercentage).toBe(50);
    });

    it('should determine ahead status when >= 100%', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-31',
          [{ current_progress: 80, created_at: '2024-01-09' }],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateWeeklyReadingStats(deadlines, []);

      expect(result.progressPercentage).toBeGreaterThanOrEqual(100);
      expect(result.overallStatus).toBe('ahead');
    });

    it('should determine onTrack status when 95-99%', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-31',
          [{ current_progress: 67, created_at: '2024-01-09' }],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateWeeklyReadingStats(deadlines, []);

      // 67 / 70 = ~96%
      expect(result.progressPercentage).toBeGreaterThanOrEqual(95);
      expect(result.progressPercentage).toBeLessThan(100);
      expect(result.overallStatus).toBe('onTrack');
    });

    it('should determine behind status when < 95%', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-31',
          [{ current_progress: 30, created_at: '2024-01-09' }],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateWeeklyReadingStats(deadlines, []);

      // 30 / 70 = ~43%
      expect(result.progressPercentage).toBeLessThan(95);
      expect(result.overallStatus).toBe('behind');
    });

    it('should aggregate multiple books correctly', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-31',
          [{ current_progress: 50, created_at: '2024-01-09' }],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
        createMockDeadline(
          '2',
          'eBook',
          200,
          '2024-01-21',
          [{ current_progress: 40, created_at: '2024-01-09' }],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateWeeklyReadingStats(deadlines, []);

      // Book 1: 10 pages/day * 7 = 70 pages needed
      // Book 2: 10 pages/day * 7 = 70 pages needed
      // Total: 140 pages needed, 90 pages read
      expect(result.unitsReadThisWeek).toBe(90);
      expect(result.unitsNeededThisWeek).toBe(140);
    });

    it('should exclude audiobooks', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'audio',
          600,
          '2024-01-31',
          [{ current_progress: 100, created_at: '2024-01-09' }],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateWeeklyReadingStats(deadlines, []);

      expect(result.unitsReadThisWeek).toBe(0);
      expect(result.unitsNeededThisWeek).toBe(0);
    });

    it('should exclude non-reading status books', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-31',
          [{ current_progress: 50, created_at: '2024-01-09' }],
          [{ status: 'paused', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateWeeklyReadingStats(deadlines, []);

      expect(result.unitsReadThisWeek).toBe(0);
    });

    it('should include books completed this week', () => {
      const completedDeadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-31',
          [
            { current_progress: 30, created_at: '2024-01-08' },
            { current_progress: 60, created_at: '2024-01-09' },
          ],
          [
            { status: 'reading', created_at: '2024-01-01' },
            { status: 'complete', created_at: '2024-01-09' },
          ]
        ),
      ];

      const result = calculateWeeklyReadingStats([], completedDeadlines);

      expect(result.unitsReadThisWeek).toBe(60);
    });

    it('should include books moved to review this week', () => {
      const completedDeadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-31',
          [{ current_progress: 50, created_at: '2024-01-09' }],
          [
            { status: 'reading', created_at: '2024-01-01' },
            { status: 'to_review', created_at: '2024-01-10' },
          ]
        ),
      ];

      const result = calculateWeeklyReadingStats([], completedDeadlines);

      expect(result.unitsReadThisWeek).toBe(50);
    });

    it('should exclude books completed last week', () => {
      const completedDeadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-31',
          [{ current_progress: 50, created_at: '2024-01-06' }],
          [
            { status: 'reading', created_at: '2024-01-01' },
            { status: 'complete', created_at: '2024-01-06' }, // Last Saturday
          ]
        ),
      ];

      const result = calculateWeeklyReadingStats([], completedDeadlines);

      expect(result.unitsReadThisWeek).toBe(0);
    });

    it('should only count progress before completion date', () => {
      const completedDeadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-31',
          [
            { current_progress: 30, created_at: '2024-01-08' },
            { current_progress: 60, created_at: '2024-01-09T10:00:00' },
            { current_progress: 90, created_at: '2024-01-09T18:00:00' }, // After completion
          ],
          [
            { status: 'reading', created_at: '2024-01-01' },
            { status: 'complete', created_at: '2024-01-09T12:00:00' },
          ]
        ),
      ];

      const result = calculateWeeklyReadingStats([], completedDeadlines);

      // Should only count the first two entries (before noon)
      expect(result.unitsReadThisWeek).toBe(60);
    });

    it('should adjust weekly goal for books completed mid-week', () => {
      // Book completed on Tuesday (day 3 of week: Sun-Mon-Tue)
      // Daily pace = 10 pages/day, goal should be 10 * 3 = 30 pages
      const completedDeadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-31',
          [{ current_progress: 30, created_at: '2024-01-09' }],
          [
            { status: 'reading', created_at: '2024-01-01' },
            { status: 'complete', created_at: '2024-01-09' }, // Tuesday
          ]
        ),
      ];

      const result = calculateWeeklyReadingStats([], completedDeadlines);

      // Goal should be 3 days (Sun-Mon-Tue) * 10 = 30 pages
      expect(result.unitsNeededThisWeek).toBe(30);
      expect(result.progressPercentage).toBeGreaterThanOrEqual(100);
    });

    it('should aggregate active and completed books correctly', () => {
      const activeDeadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-31',
          [{ current_progress: 50, created_at: '2024-01-09' }],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const completedDeadlines = [
        createMockDeadline(
          '2',
          'eBook',
          200,
          '2024-01-21',
          [{ current_progress: 40, created_at: '2024-01-09' }],
          [
            { status: 'reading', created_at: '2024-01-01' },
            { status: 'complete', created_at: '2024-01-09' },
          ]
        ),
      ];

      const result = calculateWeeklyReadingStats(
        activeDeadlines,
        completedDeadlines
      );

      // Active: 50 pages, Completed: 40 pages
      expect(result.unitsReadThisWeek).toBe(90);
    });

    describe('Week Boundary Edge Cases', () => {
      beforeEach(() => {
        // Set to Wednesday, Jan 10, 2024
        // Week: Sunday Jan 7 00:00:00 - Saturday Jan 13 23:59:59
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-01-10T12:00:00'));
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('should include progress entry exactly at Sunday (week start)', () => {
        const deadlines = [
          createMockDeadline(
            '1',
            'physical',
            300,
            '2024-01-31',
            [
              // Exactly at week start (Sunday Jan 7)
              { current_progress: 50, created_at: '2024-01-07' },
            ],
            [{ status: 'reading', created_at: '2024-01-01' }]
          ),
        ];

        const result = calculateWeeklyReadingStats(deadlines, []);

        // Should include the progress entry at exact week boundary
        expect(result.unitsReadThisWeek).toBe(50);
      });

      it('should include progress entry exactly at Saturday (week end)', () => {
        const deadlines = [
          createMockDeadline(
            '1',
            'physical',
            300,
            '2024-01-31',
            [
              // Exactly at week end (Saturday Jan 13)
              { current_progress: 75, created_at: '2024-01-13' },
            ],
            [{ status: 'reading', created_at: '2024-01-01' }]
          ),
        ];

        const result = calculateWeeklyReadingStats(deadlines, []);

        // Should include the progress entry at exact week boundary
        expect(result.unitsReadThisWeek).toBe(75);
      });

      it('should exclude progress entry from previous Saturday', () => {
        const deadlines = [
          createMockDeadline(
            '1',
            'physical',
            300,
            '2024-01-31',
            [
              // Previous Saturday (Jan 6)
              { current_progress: 30, created_at: '2024-01-06' },
              // This week Sunday (Jan 7)
              { current_progress: 80, created_at: '2024-01-07' },
            ],
            [{ status: 'reading', created_at: '2024-01-01' }]
          ),
        ];

        const result = calculateWeeklyReadingStats(deadlines, []);

        // Should only count progress from Sunday onward: 80 - 30 = 50
        expect(result.unitsReadThisWeek).toBe(50);
      });

      it('should exclude progress entry from next Sunday', () => {
        const deadlines = [
          createMockDeadline(
            '1',
            'physical',
            300,
            '2024-01-31',
            [
              // This week (Wednesday)
              { current_progress: 50, created_at: '2024-01-10' },
              // Next Sunday (Jan 14)
              { current_progress: 100, created_at: '2024-01-14' },
            ],
            [{ status: 'reading', created_at: '2024-01-01' }]
          ),
        ];

        const result = calculateWeeklyReadingStats(deadlines, []);

        // Should not include next week's entry
        expect(result.unitsReadThisWeek).toBe(50);
      });

      it('should handle progress entries spanning week boundaries correctly', () => {
        const deadlines = [
          createMockDeadline(
            '1',
            'physical',
            300,
            '2024-01-31',
            [
              // Before week: Saturday Jan 6
              { current_progress: 20, created_at: '2024-01-06' },
              // Start of week: Sunday Jan 7
              { current_progress: 30, created_at: '2024-01-07' },
              // Mid-week: Wednesday Jan 10
              { current_progress: 60, created_at: '2024-01-10' },
              // End of week: Saturday Jan 13
              { current_progress: 90, created_at: '2024-01-13' },
              // After week: Sunday Jan 14
              { current_progress: 100, created_at: '2024-01-14' },
            ],
            [{ status: 'reading', created_at: '2024-01-01' }]
          ),
        ];

        const result = calculateWeeklyReadingStats(deadlines, []);

        // Max this week (90) - Max before week (20) = 70 pages
        expect(result.unitsReadThisWeek).toBe(70);
      });

      it('should handle multiple entries on same day correctly', () => {
        // This test verifies that multiple progress entries on the same day
        // are handled correctly (max is used)
        const deadlines = [
          createMockDeadline(
            '1',
            'physical',
            300,
            '2024-01-31',
            [
              // Multiple entries on Sunday Jan 7
              { current_progress: 25, created_at: '2024-01-07' },
              { current_progress: 50, created_at: '2024-01-07' },
              { current_progress: 75, created_at: '2024-01-07' },
            ],
            [{ status: 'reading', created_at: '2024-01-01' }]
          ),
        ];

        const result = calculateWeeklyReadingStats(deadlines, []);

        // The max value should be used: 75
        expect(result.unitsReadThisWeek).toBe(75);
      });

      it('should handle mid-week completion with Saturday completion', () => {
        const completedDeadlines = [
          createMockDeadline(
            '1',
            'physical',
            300,
            '2024-01-31',
            [
              { current_progress: 50, created_at: '2024-01-08' },
              { current_progress: 300, created_at: '2024-01-13' }, // Completed Saturday
            ],
            [
              { status: 'reading', created_at: '2024-01-01' },
              { status: 'complete', created_at: '2024-01-13' },
            ]
          ),
        ];

        const result = calculateWeeklyReadingStats([], completedDeadlines);

        // Book completed on Saturday (day 7 of week)
        // Should count full week's progress
        expect(result.unitsReadThisWeek).toBe(300);
      });

      it('should handle mid-week completion with Sunday completion', () => {
        const completedDeadlines = [
          createMockDeadline(
            '1',
            'physical',
            300,
            '2024-01-31',
            [
              { current_progress: 300, created_at: '2024-01-07' }, // Completed Sunday
            ],
            [
              { status: 'reading', created_at: '2024-01-01' },
              { status: 'complete', created_at: '2024-01-07' },
            ]
          ),
        ];

        const result = calculateWeeklyReadingStats([], completedDeadlines);

        // Book completed on Sunday (day 1 of week)
        // Should still count the progress
        expect(result.unitsReadThisWeek).toBe(300);
        // Weekly goal should be adjusted to just 1 day
        expect(result.daysElapsedThisWeek).toBeGreaterThan(0);
      });
    });
  });

  describe('calculateWeeklyListeningStats', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-10'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return zero stats when no audio books', () => {
      const result = calculateWeeklyListeningStats([], []);

      expect(result.unitsReadThisWeek).toBe(0);
      expect(result.overallStatus).toBe('onTrack');
    });

    it('should calculate minutes listened this week', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'audio',
          600,
          '2024-01-31',
          [
            { current_progress: 100, created_at: '2024-01-08' },
            { current_progress: 200, created_at: '2024-01-09' },
          ],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateWeeklyListeningStats(deadlines, []);

      expect(result.unitsReadThisWeek).toBe(200);
    });

    it('should exclude physical and eBook formats', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-31',
          [{ current_progress: 50, created_at: '2024-01-09' }],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
        createMockDeadline(
          '2',
          'eBook',
          200,
          '2024-01-31',
          [{ current_progress: 40, created_at: '2024-01-09' }],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateWeeklyListeningStats(deadlines, []);

      expect(result.unitsReadThisWeek).toBe(0);
    });

    it('should include audio books completed this week', () => {
      const completedDeadlines = [
        createMockDeadline(
          '1',
          'audio',
          600,
          '2024-01-31',
          [{ current_progress: 150, created_at: '2024-01-09' }],
          [
            { status: 'reading', created_at: '2024-01-01' },
            { status: 'complete', created_at: '2024-01-09' },
          ]
        ),
      ];

      const result = calculateWeeklyListeningStats([], completedDeadlines);

      expect(result.unitsReadThisWeek).toBe(150);
    });

    it('should calculate required minutes based on daily pace', () => {
      // 600 minutes, 30 days = 20 min/day
      // Weekly goal = 20 * 7 = 140 minutes
      const deadlines = [
        createMockDeadline(
          '1',
          'audio',
          600,
          '2024-01-31',
          [{ current_progress: 100, created_at: '2024-01-09' }],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateWeeklyListeningStats(deadlines, []);

      expect(result.requiredDailyPace).toBe(20);
      expect(result.unitsNeededThisWeek).toBe(140);
    });

    it('should determine ahead status correctly', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'audio',
          600,
          '2024-01-31',
          [{ current_progress: 200, created_at: '2024-01-09' }],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateWeeklyListeningStats(deadlines, []);

      // 200 > 140 needed
      expect(result.overallStatus).toBe('ahead');
      expect(result.unitsAheadBehind).toBeGreaterThan(0);
    });

    it('should aggregate multiple audio books', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'audio',
          600,
          '2024-01-31',
          [{ current_progress: 150, created_at: '2024-01-09' }],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
        createMockDeadline(
          '2',
          'audio',
          400,
          '2024-01-21',
          [{ current_progress: 100, created_at: '2024-01-09' }],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateWeeklyListeningStats(deadlines, []);

      expect(result.unitsReadThisWeek).toBe(250);
    });
  });
});
