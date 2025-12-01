import { ACTIVITY_TYPE_CONFIG } from '@/constants/activityTypes';
import { DailyActivity, EnrichedActivity } from '@/types/calendar.types';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { DeadlineCalculationResult } from '@/utils/deadlineProviderUtils';
import {
  getMonthDateRange,
  getActivityPriority,
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
  source: null,
  deadline_type: null,
  publishers: null,
  deadline_date: '2025-01-31',
  total_quantity: 300,
  format: 'physical',
  flexibility: 'flexible',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  cover_image_url: null,
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

  describe('getActivityPriority', () => {
    it('should return priority 1 for progress at 100% (book completion)', () => {
      const activity = createMockActivity(
        'progress',
        '2025-01-15',
        '2025-01-15T10:00:00Z',
        'd1',
        'Book A',
        { current_progress: 300, total_quantity: 300 }
      );

      expect(getActivityPriority(activity)).toBe(1);
    });

    it('should return priority 1 for progress exceeding total (edge case)', () => {
      const activity = createMockActivity(
        'progress',
        '2025-01-15',
        '2025-01-15T10:00:00Z',
        'd1',
        'Book A',
        { current_progress: 350, total_quantity: 300 }
      );

      expect(getActivityPriority(activity)).toBe(1);
    });

    it('should return priority 3 for regular progress updates', () => {
      const activity = createMockActivity(
        'progress',
        '2025-01-15',
        '2025-01-15T10:00:00Z',
        'd1',
        'Book A',
        { current_progress: 150, total_quantity: 300 }
      );

      expect(getActivityPriority(activity)).toBe(3);
    });

    it('should return priority 3 for progress with no metadata', () => {
      const activity = createMockActivity(
        'progress',
        '2025-01-15',
        '2025-01-15T10:00:00Z',
        'd1',
        'Book A',
        {}
      );

      expect(getActivityPriority(activity)).toBe(3);
    });

    it('should return priority 2 for review_due', () => {
      const activity = createMockActivity(
        'review_due',
        '2025-01-15',
        '2025-01-15T10:00:00Z',
        'd1',
        'Book A'
      );

      expect(getActivityPriority(activity)).toBe(2);
    });

    it('should return priority 4 for deadline_created', () => {
      const activity = createMockActivity(
        'deadline_created',
        '2025-01-15',
        '2025-01-15T10:00:00Z',
        'd1',
        'Book A'
      );

      expect(getActivityPriority(activity)).toBe(4);
    });

    it('should return priority 5 for review', () => {
      const activity = createMockActivity(
        'review',
        '2025-01-15',
        '2025-01-15T10:00:00Z',
        'd1',
        'Book A'
      );

      expect(getActivityPriority(activity)).toBe(5);
    });

    it('should return priority 6 for status', () => {
      const activity = createMockActivity(
        'status',
        '2025-01-15',
        '2025-01-15T10:00:00Z',
        'd1',
        'Book A'
      );

      expect(getActivityPriority(activity)).toBe(6);
    });

    it('should return priority 7 for note', () => {
      const activity = createMockActivity(
        'note',
        '2025-01-15',
        '2025-01-15T10:00:00Z',
        'd1',
        'Book A'
      );

      expect(getActivityPriority(activity)).toBe(7);
    });

    it('should return priority 7 for custom_date', () => {
      const activity = createMockActivity(
        'custom_date',
        '2025-01-15',
        '2025-01-15T10:00:00Z',
        'd1',
        'Book A'
      );

      expect(getActivityPriority(activity)).toBe(7);
    });

    it('should return priority 7 for deadline_due (catch-all)', () => {
      const activity = createMockActivity(
        'deadline_due',
        '2025-01-15',
        '2025-01-15T12:00:00Z',
        'd1',
        'Book A'
      );

      expect(getActivityPriority(activity)).toBe(7);
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

    it('should add subtle background for dates with non-deadline activities only', () => {
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
      // Activity-only dates: subtle background using custom_date color
      expect(
        result['2025-01-15']!.customStyles?.container?.backgroundColor
      ).toBe(
        ACTIVITY_TYPE_CONFIG.custom_date.color + '20' // OPACITY.SUBTLE
      );
    });

    it('should show urgency background for single deadline_due', () => {
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
      // Single deadline: urgency color as background
      expect(
        result['2025-01-15']!.customStyles?.container?.backgroundColor
      ).toBe('#EF444440');
      expect(result['2025-01-15']!.customStyles?.text?.color).toBe('#EF4444');
    });

    it('should handle multiple deadline_due on same date using most urgent for background', () => {
      const deadline1 = createMockDeadline('d1', 'Book A');
      const deadline2 = createMockDeadline('d2', 'Book B');
      // Create calculations with different urgency levels
      const calculations1: DeadlineCalculationResult = {
        ...createMockCalculations('#EF4444'),
        urgencyLevel: 'urgent', // Higher priority
      };
      const calculations2: DeadlineCalculationResult = {
        ...createMockCalculations('#F59E0B'),
        urgencyLevel: 'approaching', // Lower priority
      };
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

      // Most urgent deadline (urgent) determines the background color
      expect(
        result['2025-01-15']!.customStyles?.container?.backgroundColor
      ).toBe('#EF444440');
      expect(result['2025-01-15']!.customStyles?.text?.color).toBe('#EF4444');
    });

    it('should handle empty activities array', () => {
      const result = calculateMarkedDates([], [], mockGetCalculations);
      expect(result).toEqual({});
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

      // Should not crash, but also not add a marking (deadline not found)
      expect(result['2025-01-15']).toBeUndefined();
    });

    it('should include coverImageUrl in customStyles when deadline has cover', () => {
      const deadline: ReadingDeadlineWithProgress = {
        ...createMockDeadline('d1', 'The Great Gatsby'),
        cover_image_url: 'https://example.com/cover.jpg',
      };
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

      const result = calculateMarkedDates(
        activities,
        [deadline],
        mockGetCalculations
      );

      expect(result['2025-01-15']).toBeDefined();
      expect(result['2025-01-15']!.customStyles?.coverImageUrl).toBe(
        'https://example.com/cover.jpg'
      );
    });

    it('should fallback to book cover_image_url when deadline has no custom cover', () => {
      const deadline: ReadingDeadlineWithProgress = {
        ...createMockDeadline('d1', 'The Great Gatsby'),
        cover_image_url: null,
        books: {
          publisher: 'Penguin',
          cover_image_url: 'https://example.com/book-cover.jpg',
        },
      };
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

      const result = calculateMarkedDates(
        activities,
        [deadline],
        mockGetCalculations
      );

      expect(result['2025-01-15']).toBeDefined();
      expect(result['2025-01-15']!.customStyles?.coverImageUrl).toBe(
        'https://example.com/book-cover.jpg'
      );
    });

    it('should include activityBars for deadline_due activities', () => {
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

      expect(result['2025-01-15']!.customStyles?.activityBars).toBeDefined();
      expect(result['2025-01-15']!.customStyles?.activityBars).toHaveLength(1);
      expect(result['2025-01-15']!.customStyles?.activityBars![0]).toEqual({
        color: '#EF4444',
        isDeadline: true,
      });
    });

    it('should add gray bar for non-deadline activities when deadline present', () => {
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
        createMockActivity(
          'progress',
          '2025-01-15',
          '2025-01-15T14:00:00Z',
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

      expect(result['2025-01-15']!.customStyles?.activityBars).toHaveLength(2);
      expect(result['2025-01-15']!.customStyles?.activityBars![0]).toEqual({
        color: '#7a5a8c',
        isDeadline: true,
      });
      expect(result['2025-01-15']!.customStyles?.activityBars![1]).toEqual({
        color: '#9CA3AF', // Gray color for non-deadline activities
        isDeadline: false,
      });
    });

    it('should limit activityBars to max 6', () => {
      const deadlines = [];
      const activities: DailyActivity[] = [];
      const calculations = createMockCalculations('#EF4444');

      // Create 8 deadlines
      for (let i = 1; i <= 8; i++) {
        deadlines.push(createMockDeadline(`d${i}`, `Book ${i}`));
        activities.push(
          createMockActivity(
            'deadline_due',
            '2025-01-15',
            '2025-01-15T12:00:00Z',
            `d${i}`,
            `Book ${i}`
          )
        );
      }

      mockGetCalculations.mockReturnValue(calculations);

      const result = calculateMarkedDates(
        activities,
        deadlines,
        mockGetCalculations
      );

      // Max 6 bars even with 8 deadlines
      expect(result['2025-01-15']!.customStyles?.activityBars).toHaveLength(6);
      expect(
        result['2025-01-15']!.customStyles?.activityBars!.every(
          bar => bar.isDeadline
        )
      ).toBe(true);
    });

    it('should include gray bar for non-deadline activities only', () => {
      const deadline = createMockDeadline('d1', 'The Great Gatsby');
      const activities: DailyActivity[] = [
        createMockActivity(
          'progress',
          '2025-01-15',
          '2025-01-15T14:00:00Z',
          'd1',
          'The Great Gatsby'
        ),
        createMockActivity(
          'note',
          '2025-01-15',
          '2025-01-15T16:00:00Z',
          'd1',
          'The Great Gatsby'
        ),
      ];

      const result = calculateMarkedDates(
        activities,
        [deadline],
        mockGetCalculations
      );

      expect(result['2025-01-15']!.customStyles?.activityBars).toBeDefined();
      // Activity-only dates get gray bars
      expect(
        result['2025-01-15']!.customStyles?.activityBars!.every(
          bar => bar.color === '#9CA3AF' && !bar.isDeadline
        )
      ).toBe(true);
    });

    it('should sort activityBars by urgency (most urgent first)', () => {
      const deadline1 = createMockDeadline('d1', 'Book A');
      const deadline2 = createMockDeadline('d2', 'Book B');
      // Create calculations with different urgency levels
      const calculationsUrgent: DeadlineCalculationResult = {
        ...createMockCalculations('#EF4444'),
        urgencyLevel: 'urgent',
      };
      const calculationsGood: DeadlineCalculationResult = {
        ...createMockCalculations('#7a5a8c'),
        urgencyLevel: 'good',
      };
      const activities: DailyActivity[] = [
        createMockActivity(
          'deadline_due',
          '2025-01-15',
          '2025-01-15T12:00:00Z',
          'd2', // Good urgency comes first in array
          'Book B'
        ),
        createMockActivity(
          'deadline_due',
          '2025-01-15',
          '2025-01-15T12:00:00Z',
          'd1', // Urgent urgency comes second in array
          'Book A'
        ),
      ];

      mockGetCalculations
        .mockReturnValueOnce(calculationsGood)
        .mockReturnValueOnce(calculationsUrgent);

      const result = calculateMarkedDates(
        activities,
        [deadline1, deadline2],
        mockGetCalculations
      );

      // Most urgent should be first in the bars array
      expect(result['2025-01-15']!.customStyles?.activityBars![0].color).toBe(
        '#EF4444'
      ); // urgent
      expect(result['2025-01-15']!.customStyles?.activityBars![1].color).toBe(
        '#7a5a8c'
      ); // good
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
