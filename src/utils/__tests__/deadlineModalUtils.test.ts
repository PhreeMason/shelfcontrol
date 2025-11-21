import dayjs from 'dayjs';
import {
  getQuickSelectDate,
  calculateDeadlineImpact,
  getFeasibilityConfig,
  FeasibilityLevel,
  ThemeColors,
  calculateDaysSpent,
  calculateReadingDaysCount,
  calculateAveragePace,
  calculateEarlyLateCompletion,
  formatTimeAgo,
  calculateTimeSinceAdded,
} from '../deadlineModalUtils';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';

jest.mock('../deadlineUtils', () => ({
  calculateProgress: jest.fn(),
  calculateDaysLeft: jest.fn(),
  getUnitForFormat: jest.fn(),
}));

jest.mock('../deadlineCalculations', () => ({
  calculateTotalQuantity: jest.fn(),
}));

const {
  calculateProgress,
  calculateDaysLeft,
  getUnitForFormat,
} = require('../deadlineUtils');
const { calculateTotalQuantity } = require('../deadlineCalculations');

describe('deadlineModalUtils', () => {
  describe('getQuickSelectDate', () => {
    const baseDate = new Date(2024, 0, 15);

    it('should add 7 days for week type', () => {
      const result = getQuickSelectDate(baseDate, 'week');
      expect(result.getDate()).toBe(22);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2024);
    });

    it('should add 14 days for twoWeeks type', () => {
      const result = getQuickSelectDate(baseDate, 'twoWeeks');
      expect(result.getDate()).toBe(29);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2024);
    });

    it('should add 30 days for month type', () => {
      const result = getQuickSelectDate(baseDate, 'month');
      expect(result.getDate()).toBe(14);
      expect(result.getMonth()).toBe(1);
      expect(result.getFullYear()).toBe(2024);
    });

    it('should get end of month for endOfMonth type', () => {
      const result = getQuickSelectDate(baseDate, 'endOfMonth');
      expect(result.getDate()).toBe(31);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2024);
    });

    it('should handle month boundary for week type', () => {
      const endOfMonth = new Date(2024, 0, 28);
      const result = getQuickSelectDate(endOfMonth, 'week');
      expect(result.getDate()).toBe(4);
      expect(result.getMonth()).toBe(1);
    });

    it('should handle year boundary for month type', () => {
      const endOfYear = new Date(2024, 11, 15);
      const result = getQuickSelectDate(endOfYear, 'month');
      expect(result.getDate()).toBe(14);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2025);
    });

    it('should handle leap year for endOfMonth in February', () => {
      const febDate = new Date(2024, 1, 15);
      const result = getQuickSelectDate(febDate, 'endOfMonth');
      expect(result.getDate()).toBe(29);
      expect(result.getMonth()).toBe(1);
    });

    it('should handle non-leap year for endOfMonth in February', () => {
      const febDate = new Date(2023, 1, 15);
      const result = getQuickSelectDate(febDate, 'endOfMonth');
      expect(result.getDate()).toBe(28);
      expect(result.getMonth()).toBe(1);
    });

    it('should not mutate original date', () => {
      const originalDate = new Date(2024, 0, 15);
      const originalTime = originalDate.getTime();
      getQuickSelectDate(originalDate, 'week');
      expect(originalDate.getTime()).toBe(originalTime);
    });
  });

  describe('calculateDeadlineImpact', () => {
    const mockDeadline: ReadingDeadlineWithProgress = {
      id: 'test-id',
      user_id: 'user-id',
      book_id: 'book-id',
      book_title: 'Test Book',
      author: 'Test Author',
      deadline_date: '2024-01-20T00:00:00.000Z',
      format: 'physical',
      total_quantity: 300,
      flexibility: 'flexible',
      acquisition_source: null,
      type: 'Personal',
      publishers: null,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      cover_image_url: null,
      progress: [],
      status: [],
    };

    const mockUserPaceData = {
      averagePace: 50,
      readingDaysCount: 10,
      isReliable: true,
      calculationMethod: 'recent_data' as const,
    };

    const mockUserListeningPaceData = {
      averagePace: 60,
      listeningDaysCount: 10,
      isReliable: true,
      calculationMethod: 'recent_data' as const,
    };

    const today = new Date('2024-01-15T00:00:00.000Z');

    beforeEach(() => {
      jest.clearAllMocks();
      (calculateProgress as jest.Mock).mockReturnValue(100);
      (calculateTotalQuantity as jest.Mock).mockReturnValue(300);
      (calculateDaysLeft as jest.Mock).mockReturnValue(5);
      (getUnitForFormat as jest.Mock).mockReturnValue('pages');
    });

    it('should calculate impact data correctly', () => {
      const newDate = new Date('2024-01-25T00:00:00.000Z');

      const result = calculateDeadlineImpact(
        newDate,
        mockDeadline,
        today,
        mockUserPaceData,
        mockUserListeningPaceData
      );

      expect(result.daysRemaining).toBe(10);
      expect(result.requiredPace).toBe(20);
      expect(result.currentRequiredPace).toBe(40);
      expect(result.paceChange).toBe(-20);
      expect(result.feasibility).toBe('comfortable');
      expect(result.unit).toBe('pages');
    });

    it('should determine comfortable feasibility when pace is reasonable', () => {
      const newDate = new Date('2024-01-25T00:00:00.000Z');
      (calculateProgress as jest.Mock).mockReturnValue(250);

      const result = calculateDeadlineImpact(
        newDate,
        mockDeadline,
        today,
        mockUserPaceData,
        mockUserListeningPaceData
      );

      expect(result.requiredPace).toBe(5);
      expect(result.feasibility).toBe('comfortable');
    });

    it('should determine tight feasibility when pace is 1.2x user pace', () => {
      const newDate = new Date('2024-01-16T00:00:00.000Z');
      (calculateProgress as jest.Mock).mockReturnValue(200);

      const result = calculateDeadlineImpact(
        newDate,
        mockDeadline,
        today,
        mockUserPaceData,
        mockUserListeningPaceData
      );

      expect(result.requiredPace).toBe(100);
      expect(result.feasibility).toBe('tight');
    });

    it('should determine notFeasible when pace exceeds 2x user pace', () => {
      const newDate = new Date('2024-01-16T00:00:00.000Z');
      (calculateProgress as jest.Mock).mockReturnValue(50);

      const result = calculateDeadlineImpact(
        newDate,
        mockDeadline,
        today,
        mockUserPaceData,
        mockUserListeningPaceData
      );

      expect(result.requiredPace).toBe(250);
      expect(result.feasibility).toBe('notFeasible');
    });

    it('should use listening pace for audio format', () => {
      const audioDeadline = { ...mockDeadline, format: 'audio' as const };
      const newDate = new Date('2024-01-16T00:00:00.000Z');
      (calculateProgress as jest.Mock).mockReturnValue(200);

      const result = calculateDeadlineImpact(
        newDate,
        audioDeadline,
        today,
        mockUserPaceData,
        mockUserListeningPaceData
      );

      expect(result.requiredPace).toBe(100);
      expect(result.feasibility).toBe('tight');
    });

    it('should handle zero days remaining', () => {
      const newDate = new Date('2024-01-15T00:00:00.000Z');
      (calculateProgress as jest.Mock).mockReturnValue(100);

      const result = calculateDeadlineImpact(
        newDate,
        mockDeadline,
        today,
        mockUserPaceData,
        mockUserListeningPaceData
      );

      expect(result.daysRemaining).toBe(0);
      expect(result.requiredPace).toBe(200);
    });

    it('should handle negative days remaining (past date)', () => {
      const pastDate = new Date('2024-01-10T00:00:00.000Z');
      (calculateProgress as jest.Mock).mockReturnValue(100);

      const result = calculateDeadlineImpact(
        pastDate,
        mockDeadline,
        today,
        mockUserPaceData,
        mockUserListeningPaceData
      );

      expect(result.daysRemaining).toBe(-5);
      expect(result.requiredPace).toBe(200);
    });

    it('should calculate negative pace change when extending deadline', () => {
      const newDate = new Date('2024-01-30T00:00:00.000Z');
      (calculateProgress as jest.Mock).mockReturnValue(100);
      (calculateDaysLeft as jest.Mock).mockReturnValue(5);

      const result = calculateDeadlineImpact(
        newDate,
        mockDeadline,
        today,
        mockUserPaceData,
        mockUserListeningPaceData
      );

      expect(result.paceChange).toBeLessThan(0);
    });

    it('should calculate positive pace change when shortening deadline', () => {
      const newDate = new Date('2024-01-17T00:00:00.000Z');
      (calculateProgress as jest.Mock).mockReturnValue(100);
      (calculateDaysLeft as jest.Mock).mockReturnValue(10);

      const result = calculateDeadlineImpact(
        newDate,
        mockDeadline,
        today,
        mockUserPaceData,
        mockUserListeningPaceData
      );

      expect(result.paceChange).toBeGreaterThan(0);
    });

    it('should handle deadline with zero progress', () => {
      const newDate = new Date('2024-01-25T00:00:00.000Z');
      (calculateProgress as jest.Mock).mockReturnValue(0);

      const result = calculateDeadlineImpact(
        newDate,
        mockDeadline,
        today,
        mockUserPaceData,
        mockUserListeningPaceData
      );

      expect(result.requiredPace).toBe(30);
    });

    it('should handle deadline with complete progress', () => {
      const newDate = new Date('2024-01-25T00:00:00.000Z');
      (calculateProgress as jest.Mock).mockReturnValue(300);

      const result = calculateDeadlineImpact(
        newDate,
        mockDeadline,
        today,
        mockUserPaceData,
        mockUserListeningPaceData
      );

      expect(result.requiredPace).toBe(0);
      expect(result.feasibility).toBe('comfortable');
    });
  });

  describe('getFeasibilityConfig', () => {
    const mockColors: ThemeColors = {
      good: '#00FF00',
      approaching: '#FFA500',
      error: '#FF0000',
    };

    it('should return comfortable config for comfortable level', () => {
      const result = getFeasibilityConfig('comfortable', mockColors);

      expect(result.text).toBe('✓ Comfortable pace - plenty of time');
      expect(result.color).toBe('#00FF00');
      expect(result.backgroundColor).toBe('#00FF0020');
    });

    it('should return tight config for tight level', () => {
      const result = getFeasibilityConfig('tight', mockColors);

      expect(result.text).toBe('⚠️ Tight - extra reading time needed');
      expect(result.color).toBe('#FFA500');
      expect(result.backgroundColor).toBe('#FFA50020');
    });

    it('should return notFeasible config for notFeasible level', () => {
      const result = getFeasibilityConfig('notFeasible', mockColors);

      expect(result.text).toBe('✗ Not feasible at normal reading speed');
      expect(result.color).toBe('#FF0000');
      expect(result.backgroundColor).toBe('#FF000020');
    });

    it('should append alpha value to color for backgroundColor', () => {
      const levels: FeasibilityLevel[] = [
        'comfortable',
        'tight',
        'notFeasible',
      ];

      levels.forEach(level => {
        const result = getFeasibilityConfig(level, mockColors);
        expect(result.backgroundColor).toMatch(/20$/);
      });
    });
  });

  describe('calculateDaysSpent', () => {
    it('should return 0 when no progress exists', () => {
      const deadline: ReadingDeadlineWithProgress = {
        id: 'test-id',
        user_id: 'user-id',
        book_id: 'book-id',
        book_title: 'Test Book',
        author: 'Test Author',
        deadline_date: '2024-01-20',
        format: 'physical',
        total_quantity: 300,
        flexibility: 'flexible',
        acquisition_source: null,
        type: 'Personal',
        publishers: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        cover_image_url: null,
        progress: [],
        status: [],
      };

      expect(calculateDaysSpent(deadline)).toBe(0);
    });

    it('should return 0 when all progress records are ignored', () => {
      const deadline: ReadingDeadlineWithProgress = {
        id: 'test-id',
        user_id: 'user-id',
        book_id: 'book-id',
        book_title: 'Test Book',
        author: 'Test Author',
        deadline_date: '2024-01-20',
        format: 'physical',
        total_quantity: 300,
        flexibility: 'flexible',
        acquisition_source: null,
        type: 'Personal',
        publishers: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        cover_image_url: null,
        progress: [
          {
            id: '1',
            deadline_id: 'test-id',
            current_progress: 50,
            created_at: '2024-01-05',
            updated_at: '2024-01-05',
            ignore_in_calcs: true,
            time_spent_reading: null,
          },
        ],
        status: [],
      };

      expect(calculateDaysSpent(deadline)).toBe(0);
    });

    it('should return 1 when only one progress record exists', () => {
      const deadline: ReadingDeadlineWithProgress = {
        id: 'test-id',
        user_id: 'user-id',
        book_id: 'book-id',
        book_title: 'Test Book',
        author: 'Test Author',
        deadline_date: '2024-01-20',
        format: 'physical',
        total_quantity: 300,
        flexibility: 'flexible',
        acquisition_source: null,
        type: 'Personal',
        publishers: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        cover_image_url: null,
        progress: [
          {
            id: '1',
            deadline_id: 'test-id',
            current_progress: 50,
            created_at: '2024-01-05T00:00:00.000Z',
            updated_at: '2024-01-05T00:00:00.000Z',
            ignore_in_calcs: false,
            time_spent_reading: null,
          },
        ],
        status: [],
      };

      expect(calculateDaysSpent(deadline)).toBe(1);
    });

    it('should calculate span from first to last progress record', () => {
      const deadline: ReadingDeadlineWithProgress = {
        id: 'test-id',
        user_id: 'user-id',
        book_id: 'book-id',
        book_title: 'Test Book',
        author: 'Test Author',
        deadline_date: '2024-01-20',
        format: 'physical',
        total_quantity: 300,
        flexibility: 'flexible',
        acquisition_source: null,
        type: 'Personal',
        publishers: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        cover_image_url: null,
        progress: [
          {
            id: '1',
            deadline_id: 'test-id',
            current_progress: 50,
            created_at: '2024-01-05T00:00:00.000Z',
            updated_at: '2024-01-05T00:00:00.000Z',
            ignore_in_calcs: false,
            time_spent_reading: null,
          },
          {
            id: '2',
            deadline_id: 'test-id',
            current_progress: 100,
            created_at: '2024-01-15T00:00:00.000Z',
            updated_at: '2024-01-15T00:00:00.000Z',
            ignore_in_calcs: false,
            time_spent_reading: null,
          },
        ],
        status: [],
      };

      const result = calculateDaysSpent(deadline);
      expect(result).toBe(11);
    });

    it('should filter out ignored progress records', () => {
      const deadline: ReadingDeadlineWithProgress = {
        id: 'test-id',
        user_id: 'user-id',
        book_id: 'book-id',
        book_title: 'Test Book',
        author: 'Test Author',
        deadline_date: '2024-01-20',
        format: 'physical',
        total_quantity: 300,
        flexibility: 'flexible',
        acquisition_source: null,
        type: 'Personal',
        publishers: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        cover_image_url: null,
        progress: [
          {
            id: '1',
            deadline_id: 'test-id',
            current_progress: 0,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
            ignore_in_calcs: true,
            time_spent_reading: null,
          },
          {
            id: '2',
            deadline_id: 'test-id',
            current_progress: 50,
            created_at: '2024-01-05T00:00:00.000Z',
            updated_at: '2024-01-05T00:00:00.000Z',
            ignore_in_calcs: false,
            time_spent_reading: null,
          },
          {
            id: '3',
            deadline_id: 'test-id',
            current_progress: 100,
            created_at: '2024-01-15T00:00:00.000Z',
            updated_at: '2024-01-15T00:00:00.000Z',
            ignore_in_calcs: false,
            time_spent_reading: null,
          },
        ],
        status: [],
      };

      const result = calculateDaysSpent(deadline);
      expect(result).toBe(11);
    });

    it('should handle out-of-order progress records', () => {
      const deadline: ReadingDeadlineWithProgress = {
        id: 'test-id',
        user_id: 'user-id',
        book_id: 'book-id',
        book_title: 'Test Book',
        author: 'Test Author',
        deadline_date: '2024-01-20',
        format: 'physical',
        total_quantity: 300,
        flexibility: 'flexible',
        acquisition_source: null,
        type: 'Personal',
        publishers: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        cover_image_url: null,
        progress: [
          {
            id: '2',
            deadline_id: 'test-id',
            current_progress: 100,
            created_at: '2024-01-15T00:00:00.000Z',
            updated_at: '2024-01-15T00:00:00.000Z',
            ignore_in_calcs: false,
            time_spent_reading: null,
          },
          {
            id: '1',
            deadline_id: 'test-id',
            current_progress: 50,
            created_at: '2024-01-05T00:00:00.000Z',
            updated_at: '2024-01-05T00:00:00.000Z',
            ignore_in_calcs: false,
            time_spent_reading: null,
          },
        ],
        status: [],
      };

      const result = calculateDaysSpent(deadline);
      expect(result).toBe(11);
    });
  });

  describe('calculateReadingDaysCount', () => {
    it('should return 0 when no progress exists', () => {
      const deadline: ReadingDeadlineWithProgress = {
        id: 'test-id',
        user_id: 'user-id',
        book_id: 'book-id',
        book_title: 'Test Book',
        author: 'Test Author',
        deadline_date: '2024-01-20',
        format: 'physical',
        total_quantity: 300,
        flexibility: 'flexible',
        acquisition_source: null,
        type: 'Personal',
        publishers: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        cover_image_url: null,
        progress: [],
        status: [],
      };

      expect(calculateReadingDaysCount(deadline)).toBe(0);
    });

    it('should return 0 when all progress records are ignored', () => {
      const deadline: ReadingDeadlineWithProgress = {
        id: 'test-id',
        user_id: 'user-id',
        book_id: 'book-id',
        book_title: 'Test Book',
        author: 'Test Author',
        deadline_date: '2024-01-20',
        format: 'physical',
        total_quantity: 300,
        flexibility: 'flexible',
        acquisition_source: null,
        type: 'Personal',
        publishers: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        cover_image_url: null,
        progress: [
          {
            id: '1',
            deadline_id: 'test-id',
            current_progress: 50,
            created_at: '2024-01-05',
            updated_at: '2024-01-05',
            ignore_in_calcs: true,
            time_spent_reading: null,
          },
        ],
        status: [],
      };

      expect(calculateReadingDaysCount(deadline)).toBe(0);
    });

    it('should count unique days with progress', () => {
      const deadline: ReadingDeadlineWithProgress = {
        id: 'test-id',
        user_id: 'user-id',
        book_id: 'book-id',
        book_title: 'Test Book',
        author: 'Test Author',
        deadline_date: '2024-01-20',
        format: 'physical',
        total_quantity: 300,
        flexibility: 'flexible',
        acquisition_source: null,
        type: 'Personal',
        publishers: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        cover_image_url: null,
        progress: [
          {
            id: '1',
            deadline_id: 'test-id',
            current_progress: 50,
            created_at: '2024-01-05T10:00:00.000Z',
            updated_at: '2024-01-05T10:00:00.000Z',
            ignore_in_calcs: false,
            time_spent_reading: null,
          },
          {
            id: '2',
            deadline_id: 'test-id',
            current_progress: 100,
            created_at: '2024-01-10T14:00:00.000Z',
            updated_at: '2024-01-10T14:00:00.000Z',
            ignore_in_calcs: false,
            time_spent_reading: null,
          },
          {
            id: '3',
            deadline_id: 'test-id',
            current_progress: 150,
            created_at: '2024-01-15T20:00:00.000Z',
            updated_at: '2024-01-15T20:00:00.000Z',
            ignore_in_calcs: false,
            time_spent_reading: null,
          },
        ],
        status: [],
      };

      expect(calculateReadingDaysCount(deadline)).toBe(3);
    });

    it('should count multiple progress records on same day as one day', () => {
      const deadline: ReadingDeadlineWithProgress = {
        id: 'test-id',
        user_id: 'user-id',
        book_id: 'book-id',
        book_title: 'Test Book',
        author: 'Test Author',
        deadline_date: '2024-01-20',
        format: 'physical',
        total_quantity: 300,
        flexibility: 'flexible',
        acquisition_source: null,
        type: 'Personal',
        publishers: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        cover_image_url: null,
        progress: [
          {
            id: '1',
            deadline_id: 'test-id',
            current_progress: 50,
            created_at: '2024-01-05T10:00:00.000Z',
            updated_at: '2024-01-05T10:00:00.000Z',
            ignore_in_calcs: false,
            time_spent_reading: null,
          },
          {
            id: '2',
            deadline_id: 'test-id',
            current_progress: 75,
            created_at: '2024-01-05T14:00:00.000Z',
            updated_at: '2024-01-05T14:00:00.000Z',
            ignore_in_calcs: false,
            time_spent_reading: null,
          },
          {
            id: '3',
            deadline_id: 'test-id',
            current_progress: 100,
            created_at: '2024-01-05T20:00:00.000Z',
            updated_at: '2024-01-05T20:00:00.000Z',
            ignore_in_calcs: false,
            time_spent_reading: null,
          },
          {
            id: '4',
            deadline_id: 'test-id',
            current_progress: 150,
            created_at: '2024-01-10T10:00:00.000Z',
            updated_at: '2024-01-10T10:00:00.000Z',
            ignore_in_calcs: false,
            time_spent_reading: null,
          },
        ],
        status: [],
      };

      expect(calculateReadingDaysCount(deadline)).toBe(2);
    });

    it('should filter out ignored progress records', () => {
      const deadline: ReadingDeadlineWithProgress = {
        id: 'test-id',
        user_id: 'user-id',
        book_id: 'book-id',
        book_title: 'Test Book',
        author: 'Test Author',
        deadline_date: '2024-01-20',
        format: 'physical',
        total_quantity: 300,
        flexibility: 'flexible',
        acquisition_source: null,
        type: 'Personal',
        publishers: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        cover_image_url: null,
        progress: [
          {
            id: '1',
            deadline_id: 'test-id',
            current_progress: 0,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
            ignore_in_calcs: true,
            time_spent_reading: null,
          },
          {
            id: '2',
            deadline_id: 'test-id',
            current_progress: 50,
            created_at: '2024-01-05T10:00:00.000Z',
            updated_at: '2024-01-05T10:00:00.000Z',
            ignore_in_calcs: false,
            time_spent_reading: null,
          },
          {
            id: '3',
            deadline_id: 'test-id',
            current_progress: 100,
            created_at: '2024-01-10T14:00:00.000Z',
            updated_at: '2024-01-10T14:00:00.000Z',
            ignore_in_calcs: false,
            time_spent_reading: null,
          },
          {
            id: '4',
            deadline_id: 'test-id',
            current_progress: 150,
            created_at: '2024-01-15T20:00:00.000Z',
            updated_at: '2024-01-15T20:00:00.000Z',
            ignore_in_calcs: true,
            time_spent_reading: null,
          },
        ],
        status: [],
      };

      expect(calculateReadingDaysCount(deadline)).toBe(2);
    });
  });

  describe('calculateAveragePace', () => {
    beforeEach(() => {
      (calculateProgress as jest.Mock).mockReturnValue(100);
    });

    it('should return 0 when days spent is 0', () => {
      const deadline: ReadingDeadlineWithProgress = {
        id: 'test-id',
        user_id: 'user-id',
        book_id: 'book-id',
        book_title: 'Test Book',
        author: 'Test Author',
        deadline_date: '2024-01-20',
        format: 'physical',
        total_quantity: 300,
        flexibility: 'flexible',
        acquisition_source: null,
        type: 'Personal',
        publishers: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        cover_image_url: null,
        progress: [],
        status: [],
      };

      expect(calculateAveragePace(deadline)).toBe(0);
    });

    it('should calculate average pace correctly', () => {
      (calculateProgress as jest.Mock).mockReturnValue(120);

      const deadline: ReadingDeadlineWithProgress = {
        id: 'test-id',
        user_id: 'user-id',
        book_id: 'book-id',
        book_title: 'Test Book',
        author: 'Test Author',
        deadline_date: '2024-01-20',
        format: 'physical',
        total_quantity: 300,
        flexibility: 'flexible',
        acquisition_source: null,
        type: 'Personal',
        publishers: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        cover_image_url: null,
        progress: [
          {
            id: '1',
            deadline_id: 'test-id',
            current_progress: 50,
            created_at: '2024-01-05T00:00:00.000Z',
            updated_at: '2024-01-05T00:00:00.000Z',
            ignore_in_calcs: false,
            time_spent_reading: null,
          },
          {
            id: '2',
            deadline_id: 'test-id',
            current_progress: 120,
            created_at: '2024-01-15T00:00:00.000Z',
            updated_at: '2024-01-15T00:00:00.000Z',
            ignore_in_calcs: false,
            time_spent_reading: null,
          },
        ],
        status: [],
      };

      const result = calculateAveragePace(deadline);
      expect(result).toBe(11);
    });

    it('should round to nearest integer', () => {
      (calculateProgress as jest.Mock).mockReturnValue(125);

      const deadline: ReadingDeadlineWithProgress = {
        id: 'test-id',
        user_id: 'user-id',
        book_id: 'book-id',
        book_title: 'Test Book',
        author: 'Test Author',
        deadline_date: '2024-01-20',
        format: 'physical',
        total_quantity: 300,
        flexibility: 'flexible',
        acquisition_source: null,
        type: 'Personal',
        publishers: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        cover_image_url: null,
        progress: [
          {
            id: '1',
            deadline_id: 'test-id',
            current_progress: 50,
            created_at: '2024-01-05T00:00:00.000Z',
            updated_at: '2024-01-05T00:00:00.000Z',
            ignore_in_calcs: false,
            time_spent_reading: null,
          },
          {
            id: '2',
            deadline_id: 'test-id',
            current_progress: 125,
            created_at: '2024-01-15T00:00:00.000Z',
            updated_at: '2024-01-15T00:00:00.000Z',
            ignore_in_calcs: false,
            time_spent_reading: null,
          },
        ],
        status: [],
      };

      const result = calculateAveragePace(deadline);
      expect(result).toBe(11);
    });
  });

  describe('calculateEarlyLateCompletion', () => {
    it('should return positive days when completing early', () => {
      const deadline: ReadingDeadlineWithProgress = {
        id: 'test-id',
        user_id: 'user-id',
        book_id: 'book-id',
        book_title: 'Test Book',
        author: 'Test Author',
        deadline_date: '2024-01-20T00:00:00.000Z',
        format: 'physical',
        total_quantity: 300,
        flexibility: 'flexible',
        acquisition_source: null,
        type: 'Personal',
        publishers: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        cover_image_url: null,
        progress: [],
        status: [],
      };

      const completionDate = '2024-01-15T00:00:00.000Z';
      const result = calculateEarlyLateCompletion(deadline, completionDate);
      expect(result).toBe(5);
    });

    it('should return negative days when completing late', () => {
      const deadline: ReadingDeadlineWithProgress = {
        id: 'test-id',
        user_id: 'user-id',
        book_id: 'book-id',
        book_title: 'Test Book',
        author: 'Test Author',
        deadline_date: '2024-01-20T00:00:00.000Z',
        format: 'physical',
        total_quantity: 300,
        flexibility: 'flexible',
        acquisition_source: null,
        type: 'Personal',
        publishers: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        cover_image_url: null,
        progress: [],
        status: [],
      };

      const completionDate = '2024-01-25T00:00:00.000Z';
      const result = calculateEarlyLateCompletion(deadline, completionDate);
      expect(result).toBe(-5);
    });

    it('should return 0 when completing on deadline', () => {
      const deadline: ReadingDeadlineWithProgress = {
        id: 'test-id',
        user_id: 'user-id',
        book_id: 'book-id',
        book_title: 'Test Book',
        author: 'Test Author',
        deadline_date: '2024-01-20T00:00:00.000Z',
        format: 'physical',
        total_quantity: 300,
        flexibility: 'flexible',
        acquisition_source: null,
        type: 'Personal',
        publishers: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        cover_image_url: null,
        progress: [],
        status: [],
      };

      const completionDate = '2024-01-20T00:00:00.000Z';
      const result = calculateEarlyLateCompletion(deadline, completionDate);
      expect(result).toBe(0);
    });
  });

  describe('formatTimeAgo', () => {
    it('should return "today" for current date', () => {
      const today = new Date().toISOString();
      expect(formatTimeAgo(today)).toBe('today');
    });

    it('should return "1 day ago" for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatTimeAgo(yesterday.toISOString())).toBe('1 day ago');
    });

    it('should return "X days ago" for less than a week', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      expect(formatTimeAgo(threeDaysAgo.toISOString())).toBe('3 days ago');
    });

    it('should return "1 week ago" for exactly one week', () => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      expect(formatTimeAgo(oneWeekAgo.toISOString())).toBe('1 week ago');
    });

    it('should return "X weeks ago" for less than a month', () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      expect(formatTimeAgo(twoWeeksAgo.toISOString())).toBe('2 weeks ago');
    });

    it('should return "1 month ago" for exactly one month', () => {
      const oneMonthAgo = dayjs().subtract(1, 'month').toISOString();
      const result = formatTimeAgo(oneMonthAgo);
      expect(result).toMatch(/^(1 month ago|[34] weeks ago)$/);
    });

    it('should return "X months ago" for multiple months', () => {
      const threeMonthsAgo = dayjs().subtract(3, 'month').toISOString();
      expect(formatTimeAgo(threeMonthsAgo)).toBe('3 months ago');
    });
  });

  describe('calculateTimeSinceAdded', () => {
    it('should format deadline created_at using formatTimeAgo', () => {
      const deadline: ReadingDeadlineWithProgress = {
        id: 'test-id',
        user_id: 'user-id',
        book_id: 'book-id',
        book_title: 'Test Book',
        author: 'Test Author',
        deadline_date: '2024-01-20',
        format: 'physical',
        total_quantity: 300,
        flexibility: 'flexible',
        acquisition_source: null,
        type: 'Personal',
        publishers: null,
        created_at: new Date().toISOString(),
        updated_at: '2024-01-01',
        cover_image_url: null,
        progress: [],
        status: [],
      };

      expect(calculateTimeSinceAdded(deadline)).toBe('today');
    });

    it('should handle deadlines created weeks ago', () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const deadline: ReadingDeadlineWithProgress = {
        id: 'test-id',
        user_id: 'user-id',
        book_id: 'book-id',
        book_title: 'Test Book',
        author: 'Test Author',
        deadline_date: '2024-01-20',
        format: 'physical',
        total_quantity: 300,
        flexibility: 'flexible',
        acquisition_source: null,
        type: 'Personal',
        publishers: null,
        created_at: twoWeeksAgo.toISOString(),
        updated_at: '2024-01-01',
        cover_image_url: null,
        progress: [],
        status: [],
      };

      expect(calculateTimeSinceAdded(deadline)).toBe('2 weeks ago');
    });
  });
});
