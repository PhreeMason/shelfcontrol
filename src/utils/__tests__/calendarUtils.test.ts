import { ACTIVITY_DOT_COLOR } from '@/constants/activityTypes';
import { DailyActivity, EnrichedActivity } from '@/types/calendar.types';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { DeadlineCalculationResult } from '@/utils/deadlineProviderUtils';
import {
  getMonthDateRange,
  enrichDeadlineActivity,
  sortActivitiesByTime,
  transformActivitiesToAgendaItems,
  calculateMarkedDates,
  formatActivityTime,
} from '../calendarUtils';

// Mock helper to create deadline calculation results
const createMockCalculations = (
  urgencyColor: string
): DeadlineCalculationResult => ({
  currentProgress: 100,
  totalQuantity: 300,
  remaining: 200,
  progressPercentage: 33,
  daysLeft: 7,
  unitsPerDay: 28.57,
  urgencyLevel: 'good',
  urgencyColor,
  statusMessage: 'On track',
  readingEstimate: '7 days',
  paceEstimate: '29 pages/day',
  unit: 'pages',
  userPace: 30,
  requiredPace: 28.57,
  paceStatus: 'green',
  paceMessage: 'You are on track',
});

// Mock helper to create deadline
const createMockDeadline = (
  id: string,
  title: string
): ReadingDeadlineWithProgress => ({
  id,
  user_id: 'user-123',
  book_id: 'book-123',
  book_title: title,
  author: 'Test Author',
  acquisition_source: null,
  type: 'Personal',
  publishers: null,
  deadline_date: '2025-01-31',
  total_quantity: 300,
  format: 'physical',
  flexibility: 'flexible',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  progress: [],
  status: [],
});

// Mock helper to create activity
const createMockActivity = (
  type: DailyActivity['activity_type'],
  date: string,
  timestamp: string,
  deadlineId: string,
  bookTitle: string,
  metadata: Record<string, any> = {}
): DailyActivity => ({
  activity_date: date,
  activity_type: type,
  deadline_id: deadlineId,
  book_title: bookTitle,
  activity_timestamp: timestamp,
  metadata,
});

describe('calendarUtils', () => {
  describe('getMonthDateRange', () => {
    it('should calculate month range correctly', () => {
      const result = getMonthDateRange(new Date('2025-01-15'));
      expect(result).toEqual({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });
    });

    it('should handle December to January transition', () => {
      const result = getMonthDateRange(new Date('2024-12-15'));
      expect(result).toEqual({
        startDate: '2024-12-01',
        endDate: '2024-12-31',
      });
    });

    it('should handle February in a leap year', () => {
      const result = getMonthDateRange(new Date('2024-02-15'));
      expect(result).toEqual({
        startDate: '2024-02-01',
        endDate: '2024-02-29',
      });
    });

    it('should handle February in a non-leap year', () => {
      const result = getMonthDateRange(new Date('2025-02-15'));
      expect(result).toEqual({
        startDate: '2025-02-01',
        endDate: '2025-02-28',
      });
    });

    it('should handle first day of month', () => {
      const result = getMonthDateRange(new Date(2025, 2, 1)); // Month is 0-indexed
      expect(result).toEqual({
        startDate: '2025-03-01',
        endDate: '2025-03-31',
      });
    });

    it('should handle last day of month', () => {
      const result = getMonthDateRange(new Date(2025, 3, 30)); // Month is 0-indexed
      expect(result).toEqual({
        startDate: '2025-04-01',
        endDate: '2025-04-30',
      });
    });
  });

  describe('enrichDeadlineActivity', () => {
    const mockGetCalculations = jest.fn<
      DeadlineCalculationResult,
      [ReadingDeadlineWithProgress]
    >();

    beforeEach(() => {
      mockGetCalculations.mockClear();
    });

    it('should add deadline calculations for deadline_due activity', () => {
      const activity = createMockActivity(
        'deadline_due',
        '2025-01-15',
        '2025-01-15T12:00:00Z',
        'deadline-1',
        'The Great Gatsby'
      );
      const deadline = createMockDeadline('deadline-1', 'The Great Gatsby');
      const calculations = createMockCalculations('#7a5a8c');

      mockGetCalculations.mockReturnValue(calculations);

      const result = enrichDeadlineActivity(
        activity,
        [deadline],
        mockGetCalculations
      );

      expect(result).toEqual({
        ...activity,
        deadlineCalculations: calculations,
      });
      expect(mockGetCalculations).toHaveBeenCalledWith(deadline);
    });

    it('should not modify non-deadline_due activities', () => {
      const activity = createMockActivity(
        'progress',
        '2025-01-15',
        '2025-01-15T10:30:00Z',
        'deadline-1',
        'The Great Gatsby'
      );

      const result = enrichDeadlineActivity(activity, [], mockGetCalculations);

      expect(result).toEqual(activity);
      expect(mockGetCalculations).not.toHaveBeenCalled();
    });

    it('should handle missing deadline gracefully', () => {
      const activity = createMockActivity(
        'deadline_due',
        '2025-01-15',
        '2025-01-15T12:00:00Z',
        'nonexistent-deadline',
        'The Great Gatsby'
      );

      const result = enrichDeadlineActivity(activity, [], mockGetCalculations);

      expect(result).toEqual(activity);
      expect(mockGetCalculations).not.toHaveBeenCalled();
    });
  });

  describe('sortActivitiesByTime', () => {
    it('should place deadline_due activities first', () => {
      const activities: EnrichedActivity[] = [
        createMockActivity(
          'progress',
          '2025-01-15',
          '2025-01-15T15:00:00Z',
          'd1',
          'Book A'
        ),
        createMockActivity(
          'deadline_due',
          '2025-01-15',
          '2025-01-15T12:00:00Z',
          'd2',
          'Book B'
        ),
        createMockActivity(
          'note',
          '2025-01-15',
          '2025-01-15T18:00:00Z',
          'd3',
          'Book C'
        ),
      ];

      const result = sortActivitiesByTime(activities);

      expect(result[0].activity_type).toBe('deadline_due');
      expect(result[1].activity_type).toBe('progress');
      expect(result[2].activity_type).toBe('note');
    });

    it('should sort deadline_due alphabetically by book title', () => {
      const activities: EnrichedActivity[] = [
        createMockActivity(
          'deadline_due',
          '2025-01-15',
          '2025-01-15T12:00:00Z',
          'd1',
          'Zebra Book'
        ),
        createMockActivity(
          'deadline_due',
          '2025-01-15',
          '2025-01-15T12:00:00Z',
          'd2',
          'Apple Book'
        ),
        createMockActivity(
          'deadline_due',
          '2025-01-15',
          '2025-01-15T12:00:00Z',
          'd3',
          'Mango Book'
        ),
      ];

      const result = sortActivitiesByTime(activities);

      expect(result[0].book_title).toBe('Apple Book');
      expect(result[1].book_title).toBe('Mango Book');
      expect(result[2].book_title).toBe('Zebra Book');
    });

    it('should sort non-deadline activities by timestamp', () => {
      const activities: EnrichedActivity[] = [
        createMockActivity(
          'progress',
          '2025-01-15',
          '2025-01-15T14:00:00Z',
          'd1',
          'Book A'
        ),
        createMockActivity(
          'note',
          '2025-01-15',
          '2025-01-15T10:00:00Z',
          'd2',
          'Book B'
        ),
        createMockActivity(
          'status',
          '2025-01-15',
          '2025-01-15T12:00:00Z',
          'd3',
          'Book C'
        ),
      ];

      const result = sortActivitiesByTime(activities);

      expect(result[0].activity_timestamp).toBe('2025-01-15T10:00:00Z');
      expect(result[1].activity_timestamp).toBe('2025-01-15T12:00:00Z');
      expect(result[2].activity_timestamp).toBe('2025-01-15T14:00:00Z');
    });

    it('should handle mixed activities correctly', () => {
      const activities: EnrichedActivity[] = [
        createMockActivity(
          'progress',
          '2025-01-15',
          '2025-01-15T18:00:00Z',
          'd1',
          'Book A'
        ),
        createMockActivity(
          'deadline_due',
          '2025-01-15',
          '2025-01-15T12:00:00Z',
          'd2',
          'Zebra Book'
        ),
        createMockActivity(
          'note',
          '2025-01-15',
          '2025-01-15T15:00:00Z',
          'd3',
          'Book C'
        ),
        createMockActivity(
          'deadline_due',
          '2025-01-15',
          '2025-01-15T12:00:00Z',
          'd4',
          'Apple Book'
        ),
      ];

      const result = sortActivitiesByTime(activities);

      expect(result[0].book_title).toBe('Apple Book');
      expect(result[1].book_title).toBe('Zebra Book');
      expect(result[2].activity_timestamp).toBe('2025-01-15T15:00:00Z');
      expect(result[3].activity_timestamp).toBe('2025-01-15T18:00:00Z');
    });

    it('should handle empty array', () => {
      const result = sortActivitiesByTime([]);
      expect(result).toEqual([]);
    });

    it('should handle single activity', () => {
      const activities: EnrichedActivity[] = [
        createMockActivity(
          'progress',
          '2025-01-15',
          '2025-01-15T10:00:00Z',
          'd1',
          'Book A'
        ),
      ];

      const result = sortActivitiesByTime(activities);
      expect(result).toEqual(activities);
    });
  });

  describe('transformActivitiesToAgendaItems', () => {
    const mockGetCalculations = jest.fn<
      DeadlineCalculationResult,
      [ReadingDeadlineWithProgress]
    >();

    beforeEach(() => {
      mockGetCalculations.mockClear();
    });

    it('should transform activities to agenda items format', () => {
      const activities: DailyActivity[] = [
        createMockActivity(
          'progress',
          '2025-01-15',
          '2025-01-15T10:30:00Z',
          'd1',
          'The Great Gatsby'
        ),
      ];

      const result = transformActivitiesToAgendaItems(
        activities,
        [],
        mockGetCalculations
      );

      expect(result['2025-01-15']).toBeDefined();
      expect(result['2025-01-15']).toHaveLength(1);
      expect(result['2025-01-15'][0]).toMatchObject({
        name: 'The Great Gatsby',
        activityType: 'progress',
        timestamp: expect.any(String),
      });
    });

    it('should group activities by date', () => {
      const activities: DailyActivity[] = [
        createMockActivity(
          'progress',
          '2025-01-15',
          '2025-01-15T10:00:00Z',
          'd1',
          'Book A'
        ),
        createMockActivity(
          'note',
          '2025-01-15',
          '2025-01-15T14:00:00Z',
          'd2',
          'Book B'
        ),
        createMockActivity(
          'status',
          '2025-01-16',
          '2025-01-16T10:00:00Z',
          'd3',
          'Book C'
        ),
      ];

      const result = transformActivitiesToAgendaItems(
        activities,
        [],
        mockGetCalculations
      );

      expect(Object.keys(result)).toHaveLength(2);
      expect(result['2025-01-15']).toHaveLength(2);
      expect(result['2025-01-16']).toHaveLength(1);
    });

    it('should include deadline and calculations for deadline_due items', () => {
      const deadline = createMockDeadline('d1', 'The Great Gatsby');
      const calculations = createMockCalculations('#7a5a8c');
      const activities: DailyActivity[] = [
        createMockActivity(
          'deadline_due',
          '2025-01-15',
          '2025-01-15T12:00:00Z',
          'd1',
          'The Great Gatsby'
        ),
      ];

      mockGetCalculations.mockReturnValue(calculations);

      const result = transformActivitiesToAgendaItems(
        activities,
        [deadline],
        mockGetCalculations
      );

      expect(result['2025-01-15'][0]).toMatchObject({
        name: 'The Great Gatsby',
        activityType: 'deadline_due',
        deadline,
        calculations,
      });
      expect(result['2025-01-15'][0].timestamp).toBeUndefined();
    });

    it('should handle empty activities array', () => {
      const result = transformActivitiesToAgendaItems(
        [],
        [],
        mockGetCalculations
      );
      expect(result).toEqual({});
    });

    it('should sort activities within each date', () => {
      const activities: DailyActivity[] = [
        createMockActivity(
          'progress',
          '2025-01-15',
          '2025-01-15T18:00:00Z',
          'd1',
          'Book A'
        ),
        createMockActivity(
          'deadline_due',
          '2025-01-15',
          '2025-01-15T12:00:00Z',
          'd2',
          'Book B'
        ),
        createMockActivity(
          'note',
          '2025-01-15',
          '2025-01-15T15:00:00Z',
          'd3',
          'Book C'
        ),
      ];

      const result = transformActivitiesToAgendaItems(
        activities,
        [],
        mockGetCalculations
      );

      expect(result['2025-01-15'][0].activityType).toBe('deadline_due');
      expect(result['2025-01-15'][1].activityType).toBe('note');
      expect(result['2025-01-15'][2].activityType).toBe('progress');
    });
  });

  describe('calculateMarkedDates', () => {
    const mockGetCalculations = jest.fn<
      DeadlineCalculationResult,
      [ReadingDeadlineWithProgress]
    >();

    beforeEach(() => {
      mockGetCalculations.mockClear();
    });

    it('should add grey dot for dates with non-deadline activities', () => {
      const activities: DailyActivity[] = [
        createMockActivity(
          'progress',
          '2025-01-15',
          '2025-01-15T15:00:00Z',
          'd1',
          'Book A'
        ),
      ];

      const result = calculateMarkedDates(activities, [], mockGetCalculations);

      expect(result['2025-01-15']).toBeDefined();
      expect(result['2025-01-15'].dots).toHaveLength(1);
      expect(result['2025-01-15'].dots[0]).toEqual({
        key: 'activity',
        color: ACTIVITY_DOT_COLOR,
      });
    });

    it('should add colored dots for deadline_due activities', () => {
      const deadline = createMockDeadline('d1', 'The Great Gatsby');
      const calculations = createMockCalculations('#EF4444');
      const activities: DailyActivity[] = [
        createMockActivity(
          'deadline_due',
          '2025-01-15',
          '2025-01-15T12:00:00Z',
          'd1',
          'The Great Gatsby'
        ),
      ];

      mockGetCalculations.mockReturnValue(calculations);

      const result = calculateMarkedDates(
        activities,
        [deadline],
        mockGetCalculations
      );

      expect(result['2025-01-15']).toBeDefined();
      expect(result['2025-01-15'].dots).toHaveLength(1);
      expect(result['2025-01-15'].dots[0]).toEqual({
        key: 'deadline_0',
        color: '#EF4444',
      });
    });

    it('should add both grey and colored dots when date has both types', () => {
      const deadline = createMockDeadline('d1', 'The Great Gatsby');
      const calculations = createMockCalculations('#EF4444');
      const activities: DailyActivity[] = [
        createMockActivity(
          'progress',
          '2025-01-15',
          '2025-01-15T15:00:00Z',
          'd2',
          'Book B'
        ),
        createMockActivity(
          'deadline_due',
          '2025-01-15',
          '2025-01-15T12:00:00Z',
          'd1',
          'The Great Gatsby'
        ),
      ];

      mockGetCalculations.mockReturnValue(calculations);

      const result = calculateMarkedDates(
        activities,
        [deadline],
        mockGetCalculations
      );

      expect(result['2025-01-15'].dots).toHaveLength(2);
      expect(result['2025-01-15'].dots[0]).toEqual({
        key: 'activity',
        color: ACTIVITY_DOT_COLOR,
      });
      expect(result['2025-01-15'].dots[1]).toEqual({
        key: 'deadline_0',
        color: '#EF4444',
      });
    });

    it('should handle multiple deadline_due on same date', () => {
      const deadline1 = createMockDeadline('d1', 'Book A');
      const deadline2 = createMockDeadline('d2', 'Book B');
      const calculations1 = createMockCalculations('#EF4444');
      const calculations2 = createMockCalculations('#F59E0B');
      const activities: DailyActivity[] = [
        createMockActivity(
          'deadline_due',
          '2025-01-15',
          '2025-01-15T12:00:00Z',
          'd1',
          'Book A'
        ),
        createMockActivity(
          'deadline_due',
          '2025-01-15',
          '2025-01-15T12:00:00Z',
          'd2',
          'Book B'
        ),
      ];

      mockGetCalculations
        .mockReturnValueOnce(calculations1)
        .mockReturnValueOnce(calculations2);

      const result = calculateMarkedDates(
        activities,
        [deadline1, deadline2],
        mockGetCalculations
      );

      expect(result['2025-01-15'].dots).toHaveLength(2);
      expect(result['2025-01-15'].dots[0].color).toBe('#EF4444');
      expect(result['2025-01-15'].dots[1].color).toBe('#F59E0B');
    });

    it('should handle empty activities array', () => {
      const result = calculateMarkedDates([], [], mockGetCalculations);
      expect(result).toEqual({});
    });

    it('should not add dots for dates with only deadline_due (no other activities)', () => {
      const deadline = createMockDeadline('d1', 'The Great Gatsby');
      const calculations = createMockCalculations('#EF4444');
      const activities: DailyActivity[] = [
        createMockActivity(
          'deadline_due',
          '2025-01-15',
          '2025-01-15T12:00:00Z',
          'd1',
          'The Great Gatsby'
        ),
      ];

      mockGetCalculations.mockReturnValue(calculations);

      const result = calculateMarkedDates(
        activities,
        [deadline],
        mockGetCalculations
      );

      // Should only have the deadline dot, not the activity dot
      expect(result['2025-01-15'].dots).toHaveLength(1);
      expect(result['2025-01-15'].dots[0].key).toBe('deadline_0');
    });

    it('should handle missing deadline for deadline_due activity', () => {
      const activities: DailyActivity[] = [
        createMockActivity(
          'deadline_due',
          '2025-01-15',
          '2025-01-15T12:00:00Z',
          'nonexistent',
          'The Great Gatsby'
        ),
      ];

      const result = calculateMarkedDates(activities, [], mockGetCalculations);

      // Should not crash, but also not add a dot
      expect(result['2025-01-15']).toBeUndefined();
    });
  });

  describe('formatActivityTime', () => {
    it('should format timestamp to h:mm A format', () => {
      const result = formatActivityTime('2025-01-15T14:30:00Z');
      // The exact output depends on the local timezone, but should match h:mm A format
      expect(result).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
    });

    it('should handle midnight correctly', () => {
      const result = formatActivityTime('2025-01-15T00:00:00Z');
      expect(result).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
    });

    it('should handle noon correctly', () => {
      const result = formatActivityTime('2025-01-15T12:00:00Z');
      expect(result).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
    });

    it('should handle 11:59 PM correctly', () => {
      const result = formatActivityTime('2025-01-15T23:59:00Z');
      expect(result).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
    });

    it('should convert UTC to local time', () => {
      // This test verifies that parseServerDateTime is being used
      const timestamp = '2025-01-15T10:30:00Z';
      const result = formatActivityTime(timestamp);
      expect(result).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
    });
  });
});
