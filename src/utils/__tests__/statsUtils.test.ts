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
  getHistoricalProductivityDateRange,
  calculateMostProductiveReadingDays,
  calculateMostProductiveListeningDays,
  type ThemeColors,
} from '../statsUtils';
import { createMockDeadline } from '../testHelpers';

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
    const dayjs = require('@/lib/dayjs').dayjs;
    const latest = deadline.progress.reduce((latestEntry, current) =>
      dayjs(current.created_at).isAfter(dayjs(latestEntry.created_at))
        ? current
        : latestEntry
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

    it('should format negative values without prefix (absolute value)', () => {
      const formatValue = (value: number) => `${value} pages`;

      expect(formatAheadBehindText(-50, formatValue)).toBe('50 pages');
      expect(formatAheadBehindText(-100, formatValue)).toBe('100 pages');
      expect(formatAheadBehindText(-1, formatValue)).toBe('1 pages');
    });

    it('should format zero without prefix', () => {
      const formatValue = (value: number) => `${value} pages`;

      expect(formatAheadBehindText(0, formatValue)).toBe('0 pages');
    });

    it('should work with formatAudioTime for audio stats', () => {
      expect(formatAheadBehindText(75, formatAudioTime)).toBe('+1h 15m');
      expect(formatAheadBehindText(-45, formatAudioTime)).toBe('45m');
      expect(formatAheadBehindText(0, formatAudioTime)).toBe('0m');
    });

    it('should use absolute value for negative numbers', () => {
      const formatValue = (value: number) => `${value}x`;

      const result = formatAheadBehindText(-123, formatValue);

      expect(result).toBe('123x');
      expect(result).not.toContain('-'); // No negative sign
    });
  });

  describe('getAheadBehindLabel', () => {
    it('should return "ahead" for positive values', () => {
      expect(getAheadBehindLabel(1)).toBe('ahead');
      expect(getAheadBehindLabel(50)).toBe('ahead');
      expect(getAheadBehindLabel(100)).toBe('ahead');
      expect(getAheadBehindLabel(0.1)).toBe('ahead');
    });

    it('should return "to go" for negative values', () => {
      expect(getAheadBehindLabel(-1)).toBe('to go');
      expect(getAheadBehindLabel(-50)).toBe('to go');
      expect(getAheadBehindLabel(-100)).toBe('to go');
      expect(getAheadBehindLabel(-0.1)).toBe('to go');
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
      // Book with 300 pages, started Jan 1, deadline Jan 31
      // Week starts Jan 7, progress at start of week = 0 pages
      // Remaining at week start = 300 pages
      // Days left from Jan 7 to Jan 31 = 24 days
      // Forward-looking daily pace = 300 / 24 = 12.5 pages/day
      // Weekly goal = 12.5 * 7 = 87.5 → rounds to 88 pages
      // Required daily pace rounds to 13
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

      expect(result.requiredDailyPace).toBe(13);
      expect(result.unitsNeededThisWeek).toBe(88);
    });

    it('should calculate ahead/behind correctly', () => {
      // Week starts Jan 7, progress at start = 0 pages
      // Remaining = 300 pages, days left = 24 days
      // Daily pace = 300/24 = 12.5 pages/day
      // Weekly goal = 12.5 * 7 = 87.5 → 88 pages
      // Read 100 pages this week = +12 ahead
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

      expect(result.unitsAheadBehind).toBeGreaterThanOrEqual(12);
      expect(result.unitsAheadBehind).toBeLessThanOrEqual(13);
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

      // Weekly goal = 91 pages, read 35 = 38.5% ≈ 38-40%
      expect(result.progressPercentage).toBeGreaterThanOrEqual(38);
      expect(result.progressPercentage).toBeLessThanOrEqual(40);
    });

    it('should determine ahead status when >= 100%', () => {
      // Weekly goal = 91 pages
      // Need to read >= 91 pages to be at 100%
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

      expect(result.progressPercentage).toBeGreaterThanOrEqual(100);
      expect(result.overallStatus).toBe('ahead');
    });

    it('should determine onTrack status when 95-99%', () => {
      // Weekly goal = 88 pages
      // Need 95-99% of 88 = 84-87 pages for onTrack
      const deadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-31',
          [{ current_progress: 85, created_at: '2024-01-09' }],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateWeeklyReadingStats(deadlines, []);

      // 85 / 88 = ~97%
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

      // Book 1: 300 pages remaining / 24 days = 12.5→13 pages/day * 7 = 91 pages needed
      // Book 2: 200 pages remaining / 14 days = 14.3→14 pages/day * 7 = 98 pages needed
      // Total: ~189 pages needed, 90 pages read
      expect(result.unitsReadThisWeek).toBe(90);
      expect(result.unitsNeededThisWeek).toBeGreaterThanOrEqual(188);
      expect(result.unitsNeededThisWeek).toBeLessThanOrEqual(189);
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
      // Forward-looking pace: 300 pages / 24 days = 12.5→13 pages/day
      // Goal should be 13 * 3 = 39 pages (only counting Sun-Mon-Tue)
      const completedDeadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-31',
          [{ current_progress: 40, created_at: '2024-01-09' }],
          [
            { status: 'reading', created_at: '2024-01-01' },
            { status: 'complete', created_at: '2024-01-09' }, // Tuesday
          ]
        ),
      ];

      const result = calculateWeeklyReadingStats([], completedDeadlines);

      // Goal should be 3 days (Sun-Mon-Tue) * 13 = 39 pages
      expect(result.unitsNeededThisWeek).toBeGreaterThanOrEqual(38);
      expect(result.unitsNeededThisWeek).toBeLessThanOrEqual(39);
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

  describe('getHistoricalProductivityDateRange', () => {
    beforeEach(() => {
      // Mock current date to be 2024-01-17 (Wednesday of week 3)
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-17'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return last 2 weeks excluding current week', () => {
      const result = getHistoricalProductivityDateRange();
      const dayjs = require('@/lib/dayjs').dayjs;

      // Current week starts Jan 14 (Sunday)
      // Previous week: Jan 7-13 (Sunday-Saturday)
      // Week before that: Dec 31 - Jan 6 (Sunday-Saturday)

      // Expected start: Dec 31 00:00
      const expectedStart = dayjs('2024-01-14')
        .subtract(14, 'day')
        .startOf('day');
      // Expected end: Jan 13 23:59:59.999
      const expectedEnd = dayjs('2024-01-14').subtract(1, 'day').endOf('day');

      expect(result.start.format('YYYY-MM-DD')).toBe(
        expectedStart.format('YYYY-MM-DD')
      );
      expect(result.end.format('YYYY-MM-DD')).toBe(
        expectedEnd.format('YYYY-MM-DD')
      );
      expect(result.description).toBe('last 2 weeks');
    });

    it('should return consistent results when called multiple times', () => {
      const first = getHistoricalProductivityDateRange();
      const second = getHistoricalProductivityDateRange();

      expect(first.start.format()).toBe(second.start.format());
      expect(first.end.format()).toBe(second.end.format());
      expect(first.description).toBe(second.description);
    });

    it('should span exactly 14 days', () => {
      const result = getHistoricalProductivityDateRange();
      const daysDiff = result.end.diff(result.start, 'day');

      // Should be 13 days diff (14 days inclusive: day 0 through day 13)
      expect(daysDiff).toBe(13);
    });

    it('should end before current week starts', () => {
      const dayjs = require('@/lib/dayjs').dayjs;
      const result = getHistoricalProductivityDateRange();
      const currentWeekStart = dayjs().startOf('week');

      expect(result.end.isBefore(currentWeekStart)).toBe(true);
    });
  });

  describe('calculateMostProductiveReadingDays', () => {
    beforeEach(() => {
      // Mock current date to be 2024-01-17 (Wednesday)
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-17'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return empty stats when no reading books', () => {
      const result = calculateMostProductiveReadingDays([], []);

      expect(result.hasData).toBe(false);
      expect(result.topDays).toEqual([]);
      expect(result.totalDataPoints).toBe(0);
      expect(result.dateRangeText).toBe('last 2 weeks');
    });

    it('should return empty stats when insufficient data (< 3 entries)', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-20',
          [
            { current_progress: 50, created_at: '2024-01-01' },
            { current_progress: 100, created_at: '2024-01-05' },
          ],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateMostProductiveReadingDays(deadlines, []);

      expect(result.hasData).toBe(false);
      expect(result.topDays).toEqual([]);
    });

    it('should calculate most productive days from historical data', () => {
      // Historical period: Dec 31 - Jan 13 (last 2 weeks)
      // Create progress entries on different days of week
      const deadlines = [
        createMockDeadline(
          '1',
          'physical',
          500,
          '2024-01-30',
          [
            { current_progress: 0, created_at: '2023-12-30' }, // Before range
            { current_progress: 100, created_at: '2024-01-01' }, // Monday
            { current_progress: 150, created_at: '2024-01-03' }, // Wednesday
            { current_progress: 250, created_at: '2024-01-05' }, // Friday
            { current_progress: 300, created_at: '2024-01-08' }, // Monday
            { current_progress: 380, created_at: '2024-01-10' }, // Wednesday
            { current_progress: 500, created_at: '2024-01-12' }, // Friday
          ],
          [{ status: 'reading', created_at: '2023-12-30' }]
        ),
      ];

      const result = calculateMostProductiveReadingDays(deadlines, []);

      expect(result.hasData).toBe(true);
      expect(result.topDays).toHaveLength(3);

      // Top day should have 100% of max
      expect(result.topDays[0].percentOfMax).toBe(100);
      expect(result.topDays[0].totalUnits).toBeGreaterThan(0);

      // All top 3 days should have activity
      expect(result.topDays[0].totalUnits).toBeGreaterThan(0);
      expect(result.topDays[1].totalUnits).toBeGreaterThan(0);
      expect(result.topDays[2].totalUnits).toBeGreaterThan(0);

      // Should be sorted by totalUnits descending
      expect(result.topDays[0].totalUnits).toBeGreaterThanOrEqual(
        result.topDays[1].totalUnits
      );
      expect(result.topDays[1].totalUnits).toBeGreaterThanOrEqual(
        result.topDays[2].totalUnits
      );
    });

    it('should only include physical and eBook formats', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'audio', // Should be excluded
          300,
          '2024-01-30',
          [
            { current_progress: 0, created_at: '2024-01-01' },
            { current_progress: 100, created_at: '2024-01-05' },
            { current_progress: 200, created_at: '2024-01-10' },
          ],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
        createMockDeadline(
          '2',
          'eBook', // Should be included
          200,
          '2024-01-30',
          [
            { current_progress: 0, created_at: '2024-01-01' },
            { current_progress: 100, created_at: '2024-01-05' },
            { current_progress: 150, created_at: '2024-01-10' },
          ],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateMostProductiveReadingDays(deadlines, []);

      // Only eBook entries should be counted
      expect(result.hasData).toBe(true);
      expect(result.totalDataPoints).toBe(3); // All 3 entries from eBook (including initial progress)
    });

    it('should exclude progress entries outside date range', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-30',
          [
            { current_progress: 50, created_at: '2023-12-20' }, // Too old
            { current_progress: 100, created_at: '2024-01-05' }, // In range
            { current_progress: 150, created_at: '2024-01-10' }, // In range
            { current_progress: 200, created_at: '2024-01-15' }, // Current week (excluded)
          ],
          [{ status: 'reading', created_at: '2023-12-20' }]
        ),
      ];

      const result = calculateMostProductiveReadingDays(deadlines, []);

      // Only 2 entries should be in the historical range
      expect(result.totalDataPoints).toBe(2);
    });

    it('should calculate percentOfMax correctly', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-30',
          [
            { current_progress: 0, created_at: '2024-01-01' },
            { current_progress: 100, created_at: '2024-01-02' }, // Tuesday: 100 pages
            { current_progress: 150, created_at: '2024-01-03' }, // Wednesday: 50 pages
          ],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateMostProductiveReadingDays(deadlines, []);

      expect(result.topDays[0].percentOfMax).toBe(100); // Max day = 100%
      expect(result.topDays[1].percentOfMax).toBe(50); // Half of max = 50%
    });

    it('should exclude days with 0 activity from top days', () => {
      // Only has activity on 2 days - should only show 2 days, not pad with 0-activity days
      const deadlines = [
        createMockDeadline(
          '1',
          'physical',
          300,
          '2024-01-30',
          [
            { current_progress: 0, created_at: '2024-01-01' },
            { current_progress: 100, created_at: '2024-01-02' }, // Tuesday: 100 pages
            { current_progress: 150, created_at: '2024-01-05' }, // Friday: 50 pages
            // No other days have activity
          ],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateMostProductiveReadingDays(deadlines, []);

      // Should only return 2 days, not 3 (excluding days with 0 pages)
      expect(result.topDays).toHaveLength(2);
      expect(result.topDays[0].totalUnits).toBeGreaterThan(0);
      expect(result.topDays[1].totalUnits).toBeGreaterThan(0);

      // Verify no 0-activity days are included
      const hasZeroActivityDay = result.topDays.some(
        day => day.totalUnits === 0
      );
      expect(hasZeroActivityDay).toBe(false);
    });
  });

  describe('calculateMostProductiveListeningDays', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-17'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return empty stats when no audio books', () => {
      const result = calculateMostProductiveListeningDays([], []);

      expect(result.hasData).toBe(false);
      expect(result.topDays).toEqual([]);
      expect(result.totalDataPoints).toBe(0);
    });

    it('should calculate most productive days for audio format', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'audio',
          600,
          '2024-01-30',
          [
            { current_progress: 0, created_at: '2023-12-30' },
            { current_progress: 120, created_at: '2024-01-01' }, // Monday: 120 min
            { current_progress: 180, created_at: '2024-01-03' }, // Wednesday: 60 min
            { current_progress: 300, created_at: '2024-01-05' }, // Friday: 120 min
            { current_progress: 400, created_at: '2024-01-08' }, // Monday: 100 min
          ],
          [{ status: 'reading', created_at: '2023-12-30' }]
        ),
      ];

      const result = calculateMostProductiveListeningDays(deadlines, []);

      expect(result.hasData).toBe(true);
      expect(result.topDays).toHaveLength(3);

      // Monday should be #1 (has the most listening time with 2 entries)
      expect(result.topDays[0].dayName).toBe('Monday');
      expect(result.topDays[0].totalUnits).toBeGreaterThan(0);
    });

    it('should only include audio format', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'physical', // Should be excluded
          300,
          '2024-01-30',
          [
            { current_progress: 0, created_at: '2024-01-01' },
            { current_progress: 100, created_at: '2024-01-05' },
            { current_progress: 200, created_at: '2024-01-10' },
          ],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
        createMockDeadline(
          '2',
          'audio', // Should be included
          400,
          '2024-01-30',
          [
            { current_progress: 0, created_at: '2024-01-01' },
            { current_progress: 100, created_at: '2024-01-05' },
            { current_progress: 200, created_at: '2024-01-10' },
          ],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateMostProductiveListeningDays(deadlines, []);

      // Only audio entries should be counted
      expect(result.hasData).toBe(true);
      expect(result.totalDataPoints).toBe(3); // All 3 entries from audio (including initial progress)
    });

    it('should handle multiple books on same day', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'audio',
          300,
          '2024-01-30',
          [
            { current_progress: 0, created_at: '2024-01-01' },
            { current_progress: 100, created_at: '2024-01-05' }, // Friday: 100 min
          ],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
        createMockDeadline(
          '2',
          'audio',
          400,
          '2024-01-30',
          [
            { current_progress: 0, created_at: '2024-01-01' },
            { current_progress: 80, created_at: '2024-01-05' }, // Friday: 80 min
          ],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateMostProductiveListeningDays(deadlines, []);

      // Friday should have combined total: 100 + 80 = 180 min
      const fridayEntry = result.topDays.find(d => d.dayName === 'Friday');
      expect(fridayEntry?.totalUnits).toBe(180);
    });

    it('should exclude days with 0 activity from top days', () => {
      // Only has activity on 1 day (Friday) - should only show 1 day, not pad with 0-activity days
      const deadlines = [
        createMockDeadline(
          '1',
          'audio',
          600,
          '2024-01-30',
          [
            { current_progress: 0, created_at: '2024-01-01' },
            { current_progress: 60, created_at: '2024-01-05' }, // Friday: 60 min
            { current_progress: 120, created_at: '2024-01-05' }, // Friday: +60 min (same day)
            { current_progress: 180, created_at: '2024-01-05' }, // Friday: +60 min (same day)
            // All 3 entries on same day - other days have 0 activity
          ],
          [{ status: 'reading', created_at: '2024-01-01' }]
        ),
      ];

      const result = calculateMostProductiveListeningDays(deadlines, []);

      // Should only return 1 day, not 3 (excluding days with 0 minutes)
      expect(result.topDays).toHaveLength(1);
      expect(result.topDays[0].totalUnits).toBeGreaterThan(0);
      expect(result.topDays[0].dayName).toBe('Friday');

      // Verify no 0-activity days are included
      const hasZeroActivityDay = result.topDays.some(
        day => day.totalUnits === 0
      );
      expect(hasZeroActivityDay).toBe(false);
    });
  });
});
