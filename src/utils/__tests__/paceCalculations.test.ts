import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  calculateCutoffTime,
  calculateRequiredPace,
  calculateUserListeningPace,
  calculateUserPace,
  formatListeningPaceDisplay,
  formatPaceDisplay,
  getPaceBasedStatus,
  getPaceStatusMessage,
  getRecentListeningDays,
  getRecentReadingDays,
  minimumUnitsPerDayFromDeadline,
  PaceBasedStatus,
  processBookProgress,
  UserPaceData,
} from '../paceCalculations';

const createMockDeadline = (
  id: string,
  format: 'physical' | 'eBook' | 'audio',
  progress: {
    current_progress: number;
    created_at: string;
    updated_at?: string;
    ignore_in_calcs?: boolean;
  }[] = [],
  createdAt = '2024-01-01T00:00:00Z'
): ReadingDeadlineWithProgress => ({
  id,
  user_id: 'user-123',
  book_id: 'book-123',
  book_title: 'Test Book',
  author: 'Test Author',
  source: 'test',
  deadline_date: '2024-12-31',
  total_quantity: 300,
  format,
  flexibility: 'flexible',
  created_at: createdAt,
  updated_at: createdAt,
  progress: progress.map(p => ({
    id: `progress-${Date.now()}-${Math.random()}`,
    deadline_id: id,
    current_progress: p.current_progress,
    created_at: p.created_at,
    updated_at: p.updated_at || p.created_at,
    time_spent_reading: null,
    ignore_in_calcs: p.ignore_in_calcs ?? false,
  })),
  status: [],
});

describe('paceCalculations', () => {
  describe('calculateCutoffTime', () => {
    it('should return null for empty deadlines array', () => {
      const result = calculateCutoffTime([]);
      expect(result).toBeNull();
    });

    it('should return null for deadlines with no progress', () => {
      const deadlines = [createMockDeadline('1', 'physical')];
      const result = calculateCutoffTime(deadlines);
      expect(result).toBeNull();
    });

    it('should calculate cutoff time based on most recent progress', () => {
      const deadlines = [
        createMockDeadline('1', 'physical', [
          { current_progress: 50, created_at: '2024-01-10T00:00:00Z' },
          { current_progress: 100, created_at: '2024-01-15T00:00:00Z' },
        ]),
      ];

      const result = calculateCutoffTime(deadlines);
      const expectedDate = new Date('2024-01-15T00:00:00Z');
      expectedDate.setDate(expectedDate.getDate() - 21);

      expect(result).toBe(expectedDate.getTime());
    });

    it('should use most recent progress across multiple deadlines', () => {
      const deadlines = [
        createMockDeadline('1', 'physical', [
          { current_progress: 50, created_at: '2024-01-10T00:00:00Z' },
        ]),
        createMockDeadline('2', 'physical', [
          { current_progress: 75, created_at: '2024-01-20T00:00:00Z' },
        ]),
      ];

      const result = calculateCutoffTime(deadlines);
      const expectedDate = new Date('2024-01-20T00:00:00Z');
      expectedDate.setDate(expectedDate.getDate() - 21);

      expect(result).toBe(expectedDate.getTime());
    });
  });

  describe('processBookProgress', () => {
    it('should handle empty progress array', () => {
      const book = createMockDeadline('1', 'physical');
      const dailyProgress: { [date: string]: number } = {};
      const cutoffTime = new Date('2024-01-01').getTime();

      processBookProgress(book, cutoffTime, dailyProgress);

      expect(Object.keys(dailyProgress)).toHaveLength(0);
    });

    it('should handle undefined progress', () => {
      const book = { ...createMockDeadline('1', 'physical') };
      book.progress = undefined as any;
      const dailyProgress: { [date: string]: number } = {};
      const cutoffTime = new Date('2024-01-01').getTime();

      processBookProgress(book, cutoffTime, dailyProgress);

      expect(Object.keys(dailyProgress)).toHaveLength(0);
    });

    it('should skip progress entries before cutoff time', () => {
      const book = createMockDeadline('1', 'physical', [
        { current_progress: 50, created_at: '2023-12-01T00:00:00Z' },
      ]);
      const dailyProgress: { [date: string]: number } = {};
      const cutoffTime = new Date('2024-01-01').getTime();

      processBookProgress(book, cutoffTime, dailyProgress);

      expect(Object.keys(dailyProgress)).toHaveLength(0);
    });

    it('should process progress entries after cutoff time', () => {
      const book = createMockDeadline(
        '1',
        'physical',
        [
          { current_progress: 50, created_at: '2024-01-05T00:00:00Z' },
          { current_progress: 100, created_at: '2024-01-10T00:00:00Z' },
        ],
        '2024-01-01T00:00:00Z'
      );
      const dailyProgress: { [date: string]: number } = {};
      const cutoffTime = new Date('2024-01-03').getTime();

      processBookProgress(book, cutoffTime, dailyProgress);

      expect(dailyProgress['2024-01-05']).toBe(50);
      expect(dailyProgress['2024-01-10']).toBe(50);
    });

    it('should handle baseline progress from deadline creation', () => {
      const createdAt = '2024-01-01T00:00:00Z';
      const book = createMockDeadline(
        '1',
        'physical',
        [
          { current_progress: 20, created_at: createdAt },
          { current_progress: 70, created_at: '2024-01-05T00:00:00Z' },
        ],
        createdAt
      );
      const dailyProgress: { [date: string]: number } = {};
      const cutoffTime = new Date('2024-01-01').getTime();

      processBookProgress(book, cutoffTime, dailyProgress);

      expect(dailyProgress['2024-01-05']).toBe(50);
    });

    it('should accumulate progress for same date', () => {
      const book1 = createMockDeadline('1', 'physical', [
        { current_progress: 30, created_at: '2024-01-05T00:00:00Z' },
      ]);
      const book2 = createMockDeadline('2', 'physical', [
        { current_progress: 20, created_at: '2024-01-05T00:00:00Z' },
      ]);
      const dailyProgress: { [date: string]: number } = {};
      const cutoffTime = new Date('2024-01-01').getTime();

      processBookProgress(book1, cutoffTime, dailyProgress);
      processBookProgress(book2, cutoffTime, dailyProgress);

      expect(dailyProgress['2024-01-05']).toBe(50);
    });

    it('should ignore progress entries with ignore_in_calcs set to true', () => {
      const createdAt = '2024-01-01T00:00:00Z';
      const book = createMockDeadline(
        '1',
        'physical',
        [
          { current_progress: 50, created_at: createdAt, ignore_in_calcs: true },
          { current_progress: 100, created_at: '2024-01-05T00:00:00Z' },
          { current_progress: 150, created_at: '2024-01-10T00:00:00Z' },
        ],
        createdAt
      );
      const dailyProgress: { [date: string]: number } = {};
      const cutoffTime = new Date('2024-01-01').getTime();

      processBookProgress(book, cutoffTime, dailyProgress);

      expect(dailyProgress['2024-01-05']).toBe(100);
      expect(dailyProgress['2024-01-10']).toBe(50);
      expect(Object.keys(dailyProgress)).toHaveLength(2);
    });

    it('should exclude baseline progress when it has ignore_in_calcs true', () => {
      const createdAt = '2024-01-01T00:00:00Z';
      const book = createMockDeadline(
        '1',
        'physical',
        [
          { current_progress: 50, created_at: createdAt, ignore_in_calcs: true },
          { current_progress: 100, created_at: '2024-01-05T00:00:00Z' },
        ],
        createdAt
      );
      const dailyProgress: { [date: string]: number } = {};
      const cutoffTime = new Date('2024-01-01').getTime();

      processBookProgress(book, cutoffTime, dailyProgress);

      expect(dailyProgress['2024-01-05']).toBe(100);
    });

    it('should handle mixed ignored and non-ignored progress entries', () => {
      const book = createMockDeadline(
        '1',
        'physical',
        [
          { current_progress: 25, created_at: '2024-01-03T00:00:00Z' },
          { current_progress: 50, created_at: '2024-01-05T00:00:00Z', ignore_in_calcs: true },
          { current_progress: 100, created_at: '2024-01-08T00:00:00Z' },
          { current_progress: 125, created_at: '2024-01-10T00:00:00Z', ignore_in_calcs: true },
          { current_progress: 150, created_at: '2024-01-12T00:00:00Z' },
        ],
        '2024-01-01T00:00:00Z'
      );
      const dailyProgress: { [date: string]: number } = {};
      const cutoffTime = new Date('2024-01-01').getTime();

      processBookProgress(book, cutoffTime, dailyProgress);

      expect(dailyProgress['2024-01-03']).toBe(25);
      expect(dailyProgress['2024-01-05']).toBeUndefined();
      expect(dailyProgress['2024-01-08']).toBe(75);
      expect(dailyProgress['2024-01-10']).toBeUndefined();
      expect(dailyProgress['2024-01-12']).toBe(50);
    });
  });

  describe('getRecentReadingDays', () => {
    it('should return empty array for no deadlines', () => {
      const result = getRecentReadingDays([]);
      expect(result).toEqual([]);
    });

    it('should filter out audio deadlines', () => {
      const deadlines = [
        createMockDeadline('1', 'audio', [
          { current_progress: 60, created_at: '2024-01-05T00:00:00Z' },
        ]),
      ];

      const result = getRecentReadingDays(deadlines);
      expect(result).toEqual([]);
    });

    it('should process physical and eBook deadlines', () => {
      const deadlines = [
        createMockDeadline('1', 'physical', [
          { current_progress: 50, created_at: '2024-01-05T00:00:00Z' },
        ]),
        createMockDeadline('2', 'eBook', [
          { current_progress: 30, created_at: '2024-01-06T00:00:00Z' },
        ]),
      ];

      const result = getRecentReadingDays(deadlines);

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2024-01-05');
      expect(result[0].pagesRead).toBe(50);
      expect(result[0].format).toBe('physical');
      expect(result[1].date).toBe('2024-01-06');
      expect(result[1].pagesRead).toBe(30);
    });

    it('should sort reading days by date', () => {
      const deadlines = [
        createMockDeadline('1', 'physical', [
          { current_progress: 50, created_at: '2024-01-10T00:00:00Z' },
          { current_progress: 100, created_at: '2024-01-05T00:00:00Z' },
        ]),
      ];

      const result = getRecentReadingDays(deadlines);

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2024-01-05');
      expect(result[1].date).toBe('2024-01-10');
    });
  });

  describe('calculateUserPace', () => {
    it('should return default fallback for no reading days', () => {
      const result = calculateUserPace([]);

      expect(result).toEqual({
        averagePace: 0,
        readingDaysCount: 0,
        isReliable: false,
        calculationMethod: 'default_fallback',
      });
    });

    it('should calculate pace for single day', () => {
      const deadlines = [
        createMockDeadline('1', 'physical', [
          { current_progress: 50, created_at: '2024-01-05T00:00:00Z' },
        ]),
      ];

      const result = calculateUserPace(deadlines);

      expect(result.averagePace).toBe(50);
      expect(result.readingDaysCount).toBe(1);
      expect(result.isReliable).toBe(true);
      expect(result.calculationMethod).toBe('recent_data');
    });

    it('should calculate pace across multiple days', () => {
      const deadlines = [
        createMockDeadline('1', 'physical', [
          { current_progress: 40, created_at: '2024-01-01T00:00:00Z' },
          { current_progress: 80, created_at: '2024-01-03T00:00:00Z' },
        ]),
      ];

      const result = calculateUserPace(deadlines);

      // Algorithm calculates total pages (80) / days between first and last (3 days) = 26.67
      // Reading days count is based on unique dates with progress
      expect(result.averagePace).toBeCloseTo(26.67, 1);
      expect(result.readingDaysCount).toBe(2);
      expect(result.isReliable).toBe(true);
    });

    it('should calculate pace when activity days are one day apart', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'physical',
          [
            { current_progress: 50, created_at: '2024-01-05T00:00:00Z' },
            { current_progress: 100, created_at: '2024-01-06T00:00:00Z' },
          ],
          '2024-01-01T00:00:00Z'
        ),
      ];

      const result = calculateUserPace(deadlines);

      expect(result.averagePace).toBe(50);
      expect(result.readingDaysCount).toBe(2);
      expect(result.isReliable).toBe(true);
    });

    it('should calculate pace when all activity is on the same day', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'physical',
          [{ current_progress: 75, created_at: '2024-01-05T12:00:00Z' }],
          '2024-01-01T00:00:00Z'
        ),
      ];

      const result = calculateUserPace(deadlines);

      expect(result.averagePace).toBe(75);
      expect(result.readingDaysCount).toBe(1);
      expect(result.isReliable).toBe(true);
    });

    it('should calculate pace with 2 progress entries on the same day', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'physical',
          [
            { current_progress: 30, created_at: '2024-01-05T10:00:00Z' },
            { current_progress: 80, created_at: '2024-01-05T18:00:00Z' },
          ],
          '2024-01-01T00:00:00Z'
        ),
        createMockDeadline(
          '3',
          'physical',
          [{ current_progress: 40, created_at: '2024-01-05T10:00:00Z' }],
          '2024-01-01T00:00:00Z'
        ),
      ];

      const result = calculateUserPace(deadlines);

      expect(result.averagePace).toBe(120);
      expect(result.readingDaysCount).toBe(1);
      expect(result.isReliable).toBe(true);
    });

    it('should calculate pace with 3 progress entries on the same day', () => {
      const deadlines = [
        createMockDeadline(
          '1',
          'physical',
          [
            { current_progress: 20, created_at: '2024-01-05T09:00:00Z' },
            { current_progress: 50, created_at: '2024-01-05T14:00:00Z' },
            { current_progress: 90, created_at: '2024-01-05T20:00:00Z' },
          ],
          '2024-01-01T00:00:00Z'
        ),
      ];

      const result = calculateUserPace(deadlines);

      expect(result.averagePace).toBe(90);
      expect(result.readingDaysCount).toBe(1);
      expect(result.isReliable).toBe(true);
    });
  });

  describe('calculateRequiredPace', () => {
    it('should calculate required pace correctly', () => {
      const result = calculateRequiredPace(300, 100, 10, 'physical');
      expect(result).toBe(20);
    });

    it('should handle zero days left', () => {
      const result = calculateRequiredPace(300, 100, 0, 'physical');
      expect(result).toBe(200);
    });

    it('should handle negative days left', () => {
      const result = calculateRequiredPace(300, 100, -5, 'physical');
      expect(result).toBe(200);
    });

    it('should round up to nearest integer', () => {
      const result = calculateRequiredPace(300, 100, 7, 'physical');
      expect(result).toBe(29);
    });

    it('should handle completed progress', () => {
      const result = calculateRequiredPace(300, 300, 10, 'physical');
      expect(result).toBe(0);
    });
  });

  describe('getPaceBasedStatus', () => {
    it('should return red for overdue deadlines', () => {
      const result = getPaceBasedStatus(20, 25, -1, 50);

      expect(result).toEqual({
        color: 'red',
        level: 'overdue',
        message: 'Return or renew',
      });
    });

    it('should return red for zero progress with less than 3 days', () => {
      const result = getPaceBasedStatus(20, 25, 2, 0);

      expect(result).toEqual({
        color: 'red',
        level: 'impossible',
        message: 'Start reading now',
      });
    });

    it('should return red for impossible pace increase', () => {
      const result = getPaceBasedStatus(10, 30, 5, 50);

      expect(result).toEqual({
        color: 'red',
        level: 'impossible',
        message: 'Pace too slow',
      });
    });

    it('should return orange for manageable pace increase', () => {
      const result = getPaceBasedStatus(20, 30, 5, 50);

      expect(result).toEqual({
        color: 'orange',
        level: 'approaching',
        message: 'Pick up the pace',
      });
    });

    it('should return green for on-track pace', () => {
      const result = getPaceBasedStatus(30, 25, 5, 50);

      expect(result).toEqual({
        color: 'green',
        level: 'good',
        message: "You're on track",
      });
    });

    it('should return green for equal pace', () => {
      const result = getPaceBasedStatus(25, 25, 5, 50);

      expect(result).toEqual({
        color: 'green',
        level: 'good',
        message: "You're on track",
      });
    });
  });

  describe('getPaceStatusMessage', () => {
    const createUserPaceData = (
      averagePace: number,
      calculationMethod: 'recent_data' | 'default_fallback' = 'recent_data'
    ): UserPaceData => ({
      averagePace,
      readingDaysCount: 5,
      isReliable: calculationMethod === 'recent_data',
      calculationMethod,
    });

    it('should return overdue message', () => {
      const userPaceData = createUserPaceData(20);
      const status: PaceBasedStatus = {
        color: 'red',
        level: 'overdue',
        message: 'Return or renew',
      };

      const result = getPaceStatusMessage(userPaceData, 25, status);
      expect(result).toBe('Return or renew');
    });

    it('should return impossible message with pace comparison', () => {
      const userPaceData = createUserPaceData(10);
      const status: PaceBasedStatus = {
        color: 'red',
        level: 'impossible',
        message: 'Pace too slow',
      };

      const result = getPaceStatusMessage(userPaceData, 30, status);
      expect(result).toBe('Current: 10 pages vs Required: 30 pages');
    });

    it('should return impossible message with required pace for default fallback', () => {
      const userPaceData = createUserPaceData(0, 'default_fallback');
      const status: PaceBasedStatus = {
        color: 'red',
        level: 'impossible',
        message: 'Pace too slow',
      };

      const result = getPaceStatusMessage(userPaceData, 30, status);
      expect(result).toBe('Required: 30 pages/day');
    });

    it('should return good message with current pace', () => {
      const userPaceData = createUserPaceData(30);
      const status: PaceBasedStatus = {
        color: 'green',
        level: 'good',
        message: "You're on track",
      };

      const result = getPaceStatusMessage(userPaceData, 25, status);
      expect(result).toBe('On track at 30 pages/day');
    });

    it('should return good message with default pace', () => {
      const userPaceData = createUserPaceData(0, 'default_fallback');
      const status: PaceBasedStatus = {
        color: 'green',
        level: 'good',
        message: "You're on track",
      };

      const result = getPaceStatusMessage(userPaceData, 25, status);
      expect(result).toBe('On track (default pace)');
    });

    it('should return approaching message with difference', () => {
      const userPaceData = createUserPaceData(20);
      const status: PaceBasedStatus = {
        color: 'orange',
        level: 'approaching',
        message: 'Pick up the pace',
      };

      const result = getPaceStatusMessage(userPaceData, 30, status);
      expect(result).toBe('Read ~10 pages/day more');
    });

    it('should handle audio format', () => {
      const userPaceData = createUserPaceData(120);
      const status: PaceBasedStatus = {
        color: 'green',
        level: 'good',
        message: "You're on track",
      };

      const result = getPaceStatusMessage(userPaceData, 100, status, 'audio');
      expect(result).toBe('On track at 2h 0m/day');
    });
  });

  describe('formatPaceDisplay', () => {
    it('should format physical book pace', () => {
      const result = formatPaceDisplay(25, 'physical');
      expect(result).toBe('25 pages/day');
    });

    it('should format eBook pace', () => {
      const result = formatPaceDisplay(30, 'eBook');
      expect(result).toBe('30 pages/day');
    });

    it('should format audio minutes only', () => {
      const result = formatPaceDisplay(45, 'audio');
      expect(result).toBe('45m/day');
    });

    it('should format audio hours and minutes', () => {
      const result = formatPaceDisplay(150, 'audio');
      expect(result).toBe('2h 30m/day');
    });

    it('should format audio hours only', () => {
      const result = formatPaceDisplay(120, 'audio');
      expect(result).toBe('2h 0m/day');
    });

    it('should round minutes', () => {
      const result = formatPaceDisplay(25.7, 'physical');
      expect(result).toBe('26 pages/day');
    });
  });

  describe('getRecentListeningDays', () => {
    it('should return empty array for no deadlines', () => {
      const result = getRecentListeningDays([]);
      expect(result).toEqual([]);
    });

    it('should filter out non-audio deadlines', () => {
      const deadlines = [
        createMockDeadline('1', 'physical', [
          { current_progress: 50, created_at: '2024-01-05T00:00:00Z' },
        ]),
      ];

      const result = getRecentListeningDays(deadlines);
      expect(result).toEqual([]);
    });

    it('should process audio deadlines', () => {
      const deadlines = [
        createMockDeadline('1', 'audio', [
          { current_progress: 60, created_at: '2024-01-05T00:00:00Z' },
        ]),
      ];

      const result = getRecentListeningDays(deadlines);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-01-05');
      expect(result[0].minutesListened).toBe(60);
      expect(result[0].format).toBe('audio');
    });
  });

  describe('calculateUserListeningPace', () => {
    it('should return default fallback for no listening days', () => {
      const result = calculateUserListeningPace([]);

      expect(result).toEqual({
        averagePace: 0,
        listeningDaysCount: 0,
        isReliable: false,
        calculationMethod: 'default_fallback',
      });
    });

    it('should calculate listening pace', () => {
      const deadlines = [
        createMockDeadline('1', 'audio', [
          { current_progress: 60, created_at: '2024-01-05T00:00:00Z' },
        ]),
      ];

      const result = calculateUserListeningPace(deadlines);

      expect(result.averagePace).toBe(60);
      expect(result.listeningDaysCount).toBe(1);
      expect(result.isReliable).toBe(true);
      expect(result.calculationMethod).toBe('recent_data');
    });
  });

  describe('formatListeningPaceDisplay', () => {
    it('should format minutes only', () => {
      const result = formatListeningPaceDisplay(45);
      expect(result).toBe('45m/day');
    });

    it('should format hours and minutes', () => {
      const result = formatListeningPaceDisplay(150);
      expect(result).toBe('2h 30m/day');
    });

    it('should format hours only', () => {
      const result = formatListeningPaceDisplay(120);
      expect(result).toBe('2h 0m/day');
    });

    it('should round minutes', () => {
      const result = formatListeningPaceDisplay(67.8);
      expect(result).toBe('1h 8m/day');
    });
  });

  describe('minimumUnitsPerDayFromDeadline', () => {
    it('should return empty array for no progress', () => {
      const deadline = createMockDeadline('1', 'physical');
      const result = minimumUnitsPerDayFromDeadline(deadline);
      expect(result).toEqual([]);
    });

    it('should calculate minimum units per day for each progress entry', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const deadline = createMockDeadline('1', 'physical', [
        { current_progress: 100, created_at: twoDaysAgo.toISOString() },
        { current_progress: 150, created_at: yesterday.toISOString() },
      ]);
      deadline.deadline_date = '2025-12-31';
      deadline.total_quantity = 300;

      const result = minimumUnitsPerDayFromDeadline(deadline);

      expect(result).toHaveLength(2);
      expect(result[0].value).toBeGreaterThan(0);
      expect(result[1].value).toBeGreaterThan(0);
      expect(result[0].label).toMatch(/\d+\/\d+/);
      expect(result[1].label).toMatch(/\d+\/\d+/);
    });

    it('should handle zero days left', () => {
      const deadline = createMockDeadline('1', 'physical', [
        { current_progress: 100, created_at: '2024-01-10T00:00:00Z' },
      ]);
      deadline.deadline_date = '2024-01-05';
      deadline.total_quantity = 300;

      const result = minimumUnitsPerDayFromDeadline(deadline);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(0);
    });

    it('should filter progress before today', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const deadline = createMockDeadline('1', 'physical', [
        { current_progress: 100, created_at: yesterday.toISOString() },
        { current_progress: 150, created_at: tomorrow.toISOString() },
      ]);

      const result = minimumUnitsPerDayFromDeadline(deadline);

      expect(result).toHaveLength(1);
    });

    it('should group progress by date and use latest for each date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const earlierYesterday = new Date(yesterday);
      earlierYesterday.setHours(10);
      const laterYesterday = new Date(yesterday);
      laterYesterday.setHours(14);

      const deadline = createMockDeadline('1', 'physical', [
        { current_progress: 100, created_at: earlierYesterday.toISOString() },
        { current_progress: 120, created_at: laterYesterday.toISOString() },
        { current_progress: 150, created_at: twoDaysAgo.toISOString() },
      ]);
      deadline.deadline_date = '2025-12-31';
      deadline.total_quantity = 300;

      const result = minimumUnitsPerDayFromDeadline(deadline);

      expect(result).toHaveLength(2);
      expect(result[0].label).toMatch(/\d+\/\d+/);
      expect(result[1].label).toMatch(/\d+\/\d+/);
    });
  });
});
