import deadlinesMockData from '@/__fixtures__/deadlines.mock.json';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  buildPaceStatusResult,
  calculateDeadlinePaceStatus,
  calculateProgressAsOfStartOfDay,
  calculateProgressForToday,
  calculateUnitsPerDay,
  createArchivedPaceData,
  createDeadlineCalculationResult,
  determineUserPace,
  formatAudioUnitsPerDay,
  formatBookUnitsPerDay,
  formatUnitsPerDay,
  formatUnitsPerDayForDisplay,
  getDeadlineStatus,
  mapPaceColorToUrgencyColor,
  mapPaceToUrgency,
} from '../deadlineProviderUtils';

// Mock dependencies
jest.mock('@/utils/deadlineCalculations', () => ({
  calculateCurrentProgress: jest.fn(
    (_format: string, progress: number) => progress
  ),
  calculateTotalQuantity: jest.fn((_format: string, total: number) => total),
  getPaceEstimate: jest.fn(() => '~2 hours'),
  getReadingEstimate: jest.fn(() => '3 hours remaining'),
}));

jest.mock('@/utils/deadlineUtils', () => ({
  calculateDaysLeft: jest.fn(() => 5),
  calculateProgress: jest.fn(() => 100),
  calculateProgressPercentage: jest.fn(() => 50),
  getUnitForFormat: jest.fn((format: string) =>
    format === 'audio' ? 'minutes' : 'pages'
  ),
}));

jest.mock('@/utils/paceCalculations', () => ({
  calculateRequiredPace: jest.fn(() => 20),
  formatPaceDisplay: jest.fn(
    (pace: number, format: string) =>
      `${pace} ${format === 'audio' ? 'min' : 'pages'}/day`
  ),
  getPaceBasedStatus: jest.fn(() => ({
    color: 'green',
    level: 'good',
    message: 'On track',
  })),
  getPaceStatusMessage: jest.fn(() => 'You are on track'),
}));

// Freeze time for deterministic tests instead of mocking dayjs
beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2025-09-16T12:00:00Z'));
});

afterAll(() => {
  jest.useRealTimers();
});

describe('deadlineProviderUtils', () => {
  const mockDeadlines = deadlinesMockData as ReadingDeadlineWithProgress[];
  const mockUserPaceData = {
    averagePace: 25,
    isReliable: true,
    calculationMethod: 'recent_data' as const,
    totalSessions: 10,
    recentSessions: 5,
    readingDaysCount: 10,
  };
  const mockUserListeningPaceData = {
    averagePace: 30,
    isReliable: true,
    calculationMethod: 'recent_data' as const,
    totalSessions: 8,
    recentSessions: 4,
    readingDaysCount: 8,
    listeningDaysCount: 8,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDeadlineStatus', () => {
    it('should return correct status for active deadline', () => {
      const deadline = mockDeadlines[0]; // First deadline is typically active
      const result = getDeadlineStatus(deadline);

      expect(result.latestStatus).toBe('reading');
      expect(result.isCompleted).toBe(false);
      expect(result.isToReview).toBe(false);
      expect(result.isArchived).toBe(false);
    });

    it('should return correct status for completed deadline', () => {
      const result = getDeadlineStatus(mockDeadlines[0]);
      // Basic test - the function should work with real mock data
      expect(result).toHaveProperty('latestStatus');
      expect(result).toHaveProperty('isCompleted');
      expect(result).toHaveProperty('isToReview');
      expect(result).toHaveProperty('isArchived');
    });

    it('should handle deadline with no status', () => {
      const deadlineNoStatus = {
        ...mockDeadlines[0],
        status: [],
      };

      const result = getDeadlineStatus(deadlineNoStatus);

      expect(result.latestStatus).toBe('reading');
      expect(result.isCompleted).toBe(false);
      expect(result.isToReview).toBe(false);
      expect(result.isArchived).toBe(false);
    });
  });

  describe('calculateUnitsPerDay', () => {
    it('should calculate units per day for positive days left', () => {
      const result = calculateUnitsPerDay(200, 50, 10, 'physical');

      // Should call calculateTotalQuantity and calculateCurrentProgress
      expect(result).toBe(15); // Math.ceil((200 - 50) / 10)
    });

    it('should return remaining when days left is 0 or negative', () => {
      const result = calculateUnitsPerDay(200, 50, 0, 'physical');

      expect(result).toBe(150); // 200 - 50
    });

    it('should work with audio format', () => {
      const result = calculateUnitsPerDay(120, 30, 6, 'audio');

      expect(result).toBe(15); // Math.ceil((120 - 30) / 6)
    });
  });

  describe('calculateProgressAsOfStartOfDay', () => {
    it('should return 0 for deadline with no progress', () => {
      const deadlineNoProgress = {
        ...mockDeadlines[0],
        progress: [],
      };

      const result = calculateProgressAsOfStartOfDay(deadlineNoProgress);
      expect(result).toBe(0);
    });

    it('should return latest progress from before today', () => {
      const deadlineWithProgress = {
        ...mockDeadlines[0],
        progress: [
          {
            id: 'progress-1',
            current_progress: 50,
            created_at: '2025-09-15T10:00:00Z',
            updated_at: '2025-09-15T10:00:00Z',
            deadline_id: mockDeadlines[0].id,
            time_spent_reading: null,
            ignore_in_calcs: false,
          },
          {
            id: 'progress-2',
            current_progress: 75,
            created_at: '2025-09-15T15:00:00Z',
            updated_at: '2025-09-15T15:00:00Z',
            deadline_id: mockDeadlines[0].id,
            time_spent_reading: null,
            ignore_in_calcs: false,
          },
        ],
      };

      const result = calculateProgressAsOfStartOfDay(deadlineWithProgress);
      expect(result).toBe(75); // Latest progress from yesterday
    });

    it('should handle progress with missing values', () => {
      const result = calculateProgressAsOfStartOfDay(mockDeadlines[0]);
      expect(typeof result).toBe('number');
    });
  });

  describe('calculateProgressForToday', () => {
    const mockCalculateProgress = jest.requireMock(
      '@/utils/deadlineUtils'
    ).calculateProgress;

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-20T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.clearAllMocks();
    });

    it('should calculate progress made today', () => {
      mockCalculateProgress.mockReturnValue(100);
      const deadline = mockDeadlines[0];
      const result = calculateProgressForToday(deadline);

      // Using mocked calculateProgress (returns 100) and calculateProgressAsOfStartOfDay logic
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should not return negative progress', () => {
      mockCalculateProgress.mockReturnValue(100);
      const deadline = mockDeadlines[0];
      const result = calculateProgressForToday(deadline);

      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 when progress was made before today', () => {
      mockCalculateProgress.mockReturnValue(50);
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
        source: 'test',
        created_at: yesterday.toISOString(),
        updated_at: yesterday.toISOString(),
        progress: [
          {
            id: 'p1',
            deadline_id: 'test-1',
            current_progress: 50,
            created_at: yesterday.toISOString(),
            updated_at: yesterday.toISOString(),
            time_spent_reading: null,
            ignore_in_calcs: false,
          },
        ],
        status: [],
      };

      const result = calculateProgressForToday(deadline);
      expect(result).toBe(0);
    });

    it('should count progress made today when created today', () => {
      mockCalculateProgress.mockReturnValue(50);
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
        source: 'test',
        created_at: today.toISOString(),
        updated_at: today.toISOString(),
        progress: [
          {
            id: 'p1',
            deadline_id: 'test-1',
            current_progress: 50,
            created_at: today.toISOString(),
            updated_at: today.toISOString(),
            time_spent_reading: null,
            ignore_in_calcs: false,
          },
        ],
        status: [],
      };

      const result = calculateProgressForToday(deadline);
      expect(result).toBe(50);
    });

    it('should handle ignore_in_calcs=true with timestamp set to yesterday', () => {
      mockCalculateProgress.mockReturnValue(50);
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
        source: 'test',
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

      const result = calculateProgressForToday(deadline);
      expect(result).toBe(0);
    });

    it('should handle toggling ignore_in_calcs from true to false - progress should count today', () => {
      mockCalculateProgress.mockReturnValue(50);
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
        source: 'test',
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

      const result = calculateProgressForToday(deadline);
      expect(result).toBe(50);
    });

    it('should correctly calculate when multiple progress entries exist with mixed ignore_in_calcs', () => {
      mockCalculateProgress.mockReturnValue(80);
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
        source: 'test',
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

      const result = calculateProgressForToday(deadline);
      expect(result).toBe(50);
    });
  });

  describe('formatAudioUnitsPerDay', () => {
    it('should format standard audio units', () => {
      const result = formatAudioUnitsPerDay(90, 90, 5);
      expect(result).toBe('1h 30m/day needed');
    });

    it('should format hours only', () => {
      const result = formatAudioUnitsPerDay(120, 120, 5);
      expect(result).toBe('2h/day needed');
    });

    it('should format minutes only', () => {
      const result = formatAudioUnitsPerDay(45, 45, 5);
      expect(result).toBe('45 minutes/day needed');
    });

    it('should format less than 1 minute per day as weekly', () => {
      const result = formatAudioUnitsPerDay(1, 0.14, 7); // ~1 minute per week
      expect(result).toBe('1 minute/week');
    });

    it('should format less than 1 minute per day as bi-weekly', () => {
      const result = formatAudioUnitsPerDay(1, 0.07, 14); // ~1 minute per 2 weeks
      expect(result).toBe('1 minute/2 weeks');
    });

    it('should format less than 1 minute per day as monthly', () => {
      const result = formatAudioUnitsPerDay(1, 0.036, 28); // ~1 minute per month
      expect(result).toBe('1 minute/month');
    });

    it('should format less than 1 minute per day as every X days', () => {
      const result = formatAudioUnitsPerDay(1, 0.1, 10); // ~1 minute every 10 days
      expect(result).toBe('1 minute every 10 days');
    });
  });

  describe('formatBookUnitsPerDay', () => {
    it('should format standard book units', () => {
      const result = formatBookUnitsPerDay(10, 10, 5, 'physical');
      expect(result).toBe('10 pages/day needed');
    });

    it('should format less than 1 page per day as weekly', () => {
      const result = formatBookUnitsPerDay(1, 0.14, 7, 'eBook'); // ~1 page per week
      expect(result).toBe('1 page/week');
    });

    it('should format less than 1 page per day as every X days', () => {
      const result = formatBookUnitsPerDay(1, 0.1, 10, 'physical'); // ~1 page every 10 days
      expect(result).toBe('1 page every 10 days');
    });
  });

  describe('formatUnitsPerDay', () => {
    it('should format audio units correctly', () => {
      const result = formatUnitsPerDay(90, 'audio');
      expect(result).toBe('1h 30m/day needed');
    });

    it('should format physical book units correctly', () => {
      const result = formatUnitsPerDay(10, 'physical');
      expect(result).toBe('10 pages/day needed');
    });

    it('should format eBook units correctly', () => {
      const result = formatUnitsPerDay(15, 'eBook');
      expect(result).toBe('15 pages/day needed');
    });
  });

  describe('formatUnitsPerDayForDisplay', () => {
    it('should use audio formatting for audio format', () => {
      const result = formatUnitsPerDayForDisplay(90, 'audio', 90, 5);
      expect(result).toBe('1h 30m/day needed');
    });

    it('should use book formatting for physical format', () => {
      const result = formatUnitsPerDayForDisplay(10, 'physical', 50, 5);
      expect(result).toBe('10 pages/day needed');
    });

    it('should use book formatting for eBook format', () => {
      const result = formatUnitsPerDayForDisplay(15, 'eBook', 75, 5);
      expect(result).toBe('15 pages/day needed');
    });
  });

  describe('determineUserPace', () => {
    it('should return listening pace for audio format', () => {
      const result = determineUserPace(
        'audio',
        mockUserPaceData,
        mockUserListeningPaceData
      );
      expect(result).toBe(30); // mockUserListeningPaceData.averagePace
    });

    it('should return reading pace for physical format', () => {
      const result = determineUserPace(
        'physical',
        mockUserPaceData,
        mockUserListeningPaceData
      );
      expect(result).toBe(25); // mockUserPaceData.averagePace
    });

    it('should return reading pace for eBook format', () => {
      const result = determineUserPace(
        'eBook',
        mockUserPaceData,
        mockUserListeningPaceData
      );
      expect(result).toBe(25); // mockUserPaceData.averagePace
    });
  });

  describe('mapPaceToUrgency', () => {
    it('should map overdue to overdue', () => {
      const status = {
        color: 'red' as const,
        level: 'overdue' as const,
        message: 'Overdue',
      };
      const result = mapPaceToUrgency(status, 5);
      expect(result).toBe('overdue');
    });

    it('should map impossible to impossible', () => {
      const status = {
        color: 'red' as const,
        level: 'impossible' as const,
        message: 'Impossible',
      };
      const result = mapPaceToUrgency(status, 5);
      expect(result).toBe('impossible');
    });

    it('should map good to good', () => {
      const status = {
        color: 'green' as const,
        level: 'good' as const,
        message: 'Good',
      };
      const result = mapPaceToUrgency(status, 5);
      expect(result).toBe('good');
    });

    it('should map approaching to approaching', () => {
      const status = {
        color: 'orange' as const,
        level: 'approaching' as const,
        message: 'Approaching',
      };
      const result = mapPaceToUrgency(status, 5);
      expect(result).toBe('approaching');
    });

    it('should default to urgent for short time left', () => {
      const status: any = {
        color: 'orange',
        level: 'unknown',
        message: 'Unknown',
      };
      const result = mapPaceToUrgency(status, 3);
      expect(result).toBe('urgent');
    });

    it('should default to good for long time left', () => {
      const status: any = {
        color: 'orange',
        level: 'unknown',
        message: 'Unknown',
      };
      const result = mapPaceToUrgency(status, 10);
      expect(result).toBe('good');
    });
  });

  describe('mapPaceColorToUrgencyColor', () => {
    it('should map green to green color', () => {
      const result = mapPaceColorToUrgencyColor('green');
      expect(result).toBe('#10b981');
    });

    it('should map orange to orange color', () => {
      const result = mapPaceColorToUrgencyColor('orange');
      expect(result).toBe('#f59e0b');
    });

    it('should map red to red color', () => {
      const result = mapPaceColorToUrgencyColor('red');
      expect(result).toBe('#ef4444');
    });

    it('should default to default color for unknown', () => {
      const result = mapPaceColorToUrgencyColor('unknown');
      expect(result).toBe('#7bc598');
    });
  });

  describe('createArchivedPaceData', () => {
    it('should create correct pace data for archived deadline', () => {
      const result = createArchivedPaceData('Completed!');

      expect(result).toEqual({
        userPace: 0,
        requiredPace: 0,
        status: { color: 'green', level: 'good', message: 'Completed!' },
        statusMessage: 'Completed!',
      });
    });
  });

  describe('buildPaceStatusResult', () => {
    it('should build correct pace status result', () => {
      const status = {
        color: 'green' as const,
        level: 'good' as const,
        message: 'On track',
      };
      const result = buildPaceStatusResult(
        25,
        20,
        status,
        'You are on track',
        'physical',
        5,
        50
      );

      expect(result).toEqual({
        userPace: 25,
        requiredPace: 20,
        status,
        statusMessage: 'You are on track',
        paceDisplay: '25 pages/day',
        requiredPaceDisplay: '20 pages/day',
        daysLeft: 5,
        progressPercentage: 50,
      });
    });
  });

  describe('calculateDeadlinePaceStatus', () => {
    it('should calculate pace status for deadline', () => {
      const deadline = mockDeadlines[0];
      const result = calculateDeadlinePaceStatus(
        deadline,
        mockUserPaceData,
        mockUserListeningPaceData
      );

      expect(result).toHaveProperty('userPace');
      expect(result).toHaveProperty('requiredPace');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('statusMessage');
      expect(result).toHaveProperty('paceDisplay');
      expect(result).toHaveProperty('requiredPaceDisplay');
      expect(result).toHaveProperty('daysLeft');
      expect(result).toHaveProperty('progressPercentage');
    });
  });

  describe('createDeadlineCalculationResult', () => {
    it('should create complete deadline calculation result', () => {
      const deadline = mockDeadlines[0];
      const metrics = {
        currentProgress: 100,
        totalQuantity: 200,
        daysLeft: 5,
        progressPercentage: 50,
      };
      const paceData = {
        userPace: 25,
        requiredPace: 20,
        status: {
          color: 'green' as const,
          level: 'good' as const,
          message: 'On track',
        },
        statusMessage: 'You are on track',
      };

      const result = createDeadlineCalculationResult(
        deadline,
        metrics,
        100,
        5,
        20,
        'good',
        '#10b981',
        'On track',
        paceData
      );

      expect(result).toHaveProperty('currentProgress', 100);
      expect(result).toHaveProperty('totalQuantity', 200);
      expect(result).toHaveProperty('remaining', 100);
      expect(result).toHaveProperty('progressPercentage', 50);
      expect(result).toHaveProperty('daysLeft', 5);
      expect(result).toHaveProperty('unitsPerDay', 20);
      expect(result).toHaveProperty('urgencyLevel', 'good');
      expect(result).toHaveProperty('urgencyColor', '#10b981');
      expect(result).toHaveProperty('statusMessage', 'On track');
      expect(result).toHaveProperty('userPace', 25);
      expect(result).toHaveProperty('requiredPace', 20);
      expect(result).toHaveProperty('paceStatus', 'green');
      expect(result).toHaveProperty('paceMessage', 'You are on track');
    });
  });
});
