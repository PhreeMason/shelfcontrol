import { renderHook } from '@testing-library/react-native';
import { dayjs } from '@/lib/dayjs';
import { useTodaysDeadlines } from '../useTodaysDeadlines';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import * as dateNormalization from '@/utils/dateNormalization';

jest.mock('@/providers/DeadlineProvider');
jest.mock('@/lib/dayjs');
jest.mock('@/utils/dateNormalization');

const mockUseDeadlines = useDeadlines as jest.Mock;
const mockDayjs = dayjs as unknown as jest.Mock;
const mockNormalizeServerDate =
  dateNormalization.normalizeServerDate as jest.Mock;
const mockNormalizeServerDateStartOfDay =
  dateNormalization.normalizeServerDateStartOfDay as jest.Mock;

describe('useTodaysDeadlines', () => {
  const mockToday = {
    startOf: jest.fn().mockReturnThis(),
    isAfter: jest.fn(),
    isValid: jest.fn().mockReturnValue(true),
  };

  const createMockDeadline = (
    id: string,
    format: 'audio' | 'physical' | 'eBook',
    deadline_date: string | null,
    status?: { created_at: string }[]
  ): ReadingDeadlineWithProgress => {
    const base = {
      id,
      format,
      deadline_date: deadline_date || '',
      book_id: `book-${id}`,
      book_title: 'Test Book',
      author: 'Test Author',
      user_id: 'user-123',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      total_quantity: 300,
      source: 'library',
      acquisition_source: null,
      deadline_type: null,
      publishers: null,
      flexibility: 'flexible' as const,
      progress: [],
    };

    if (status) {
      return {
        ...base,
        status: status.map(s => ({
          created_at: s.created_at,
          deadline_id: id,
          id: `status-${id}`,
          status: 'reading' as const,
          updated_at: s.created_at,
        })),
      };
    }

    return base;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockDayjs.mockReturnValue(mockToday);
    mockToday.startOf.mockReturnValue(mockToday);
    mockToday.isAfter.mockReturnValue(true);

    mockNormalizeServerDate.mockImplementation(() => ({
      isValid: () => true,
      isAfter: mockToday.isAfter,
    }));

    mockNormalizeServerDateStartOfDay.mockImplementation(() => ({
      isValid: () => true,
      isAfter: mockToday.isAfter,
    }));
  });

  describe('Basic functionality', () => {
    it('should return empty arrays when no deadlines exist', () => {
      mockUseDeadlines.mockReturnValue({
        activeDeadlines: [],
        completedDeadlines: [],
      });

      const { result } = renderHook(() => useTodaysDeadlines());

      expect(result.current.allDeadlines).toEqual([]);
      expect(result.current.audioDeadlines).toEqual([]);
      expect(result.current.readingDeadlines).toEqual([]);
    });

    it('should filter deadlines with dates after today', () => {
      const futureDeadline = createMockDeadline('1', 'physical', '2024-12-31');
      const pastDeadline = createMockDeadline('2', 'physical', '2024-01-01');

      mockNormalizeServerDateStartOfDay.mockImplementation(date => ({
        isValid: () => true,
        isAfter: () => date === '2024-12-31',
      }));

      mockUseDeadlines.mockReturnValue({
        activeDeadlines: [futureDeadline, pastDeadline],
        completedDeadlines: [],
      });

      const { result } = renderHook(() => useTodaysDeadlines());

      expect(result.current.allDeadlines).toHaveLength(1);
      expect(result.current.allDeadlines[0].id).toBe('1');
    });

    it('should exclude deadlines without deadline_date', () => {
      const deadlineWithDate = createMockDeadline(
        '1',
        'physical',
        '2024-12-31'
      );
      const deadlineWithoutDate = createMockDeadline('2', 'physical', null);

      mockUseDeadlines.mockReturnValue({
        activeDeadlines: [deadlineWithDate, deadlineWithoutDate],
        completedDeadlines: [],
      });

      const { result } = renderHook(() => useTodaysDeadlines());

      expect(result.current.allDeadlines).toHaveLength(1);
      expect(result.current.allDeadlines[0].id).toBe('1');
    });

    it('should exclude deadlines with invalid dates', () => {
      const validDeadline = createMockDeadline('1', 'physical', '2024-12-31');
      const invalidDeadline = createMockDeadline(
        '2',
        'physical',
        'invalid-date'
      );

      mockNormalizeServerDateStartOfDay.mockImplementation(date => ({
        isValid: () => date === '2024-12-31',
        isAfter: () => true,
      }));

      mockUseDeadlines.mockReturnValue({
        activeDeadlines: [validDeadline, invalidDeadline],
        completedDeadlines: [],
      });

      const { result } = renderHook(() => useTodaysDeadlines());

      expect(result.current.allDeadlines).toHaveLength(1);
      expect(result.current.allDeadlines[0].id).toBe('1');
    });
  });

  describe('Format separation', () => {
    it('should separate audio and reading deadlines correctly', () => {
      const audioDeadline1 = createMockDeadline('1', 'audio', '2024-12-31');
      const audioDeadline2 = createMockDeadline('2', 'audio', '2024-12-31');
      const physicalDeadline = createMockDeadline(
        '3',
        'physical',
        '2024-12-31'
      );
      const ebookDeadline = createMockDeadline('4', 'eBook', '2024-12-31');

      mockUseDeadlines.mockReturnValue({
        activeDeadlines: [
          audioDeadline1,
          audioDeadline2,
          physicalDeadline,
          ebookDeadline,
        ],
        completedDeadlines: [],
      });

      const { result } = renderHook(() => useTodaysDeadlines());

      expect(result.current.audioDeadlines).toHaveLength(2);
      expect(result.current.audioDeadlines[0].id).toBe('1');
      expect(result.current.audioDeadlines[1].id).toBe('2');

      expect(result.current.readingDeadlines).toHaveLength(2);
      expect(result.current.readingDeadlines[0].id).toBe('3');
      expect(result.current.readingDeadlines[1].id).toBe('4');

      expect(result.current.allDeadlines).toHaveLength(4);
    });

    it('should handle all audio deadlines', () => {
      const audioDeadlines = [
        createMockDeadline('1', 'audio', '2024-12-31'),
        createMockDeadline('2', 'audio', '2024-12-31'),
        createMockDeadline('3', 'audio', '2024-12-31'),
      ];

      mockUseDeadlines.mockReturnValue({
        activeDeadlines: audioDeadlines,
        completedDeadlines: [],
      });

      const { result } = renderHook(() => useTodaysDeadlines());

      expect(result.current.audioDeadlines).toHaveLength(3);
      expect(result.current.readingDeadlines).toHaveLength(0);
      expect(result.current.allDeadlines).toHaveLength(3);
    });

    it('should handle all reading deadlines', () => {
      const readingDeadlines = [
        createMockDeadline('1', 'physical', '2024-12-31'),
        createMockDeadline('2', 'eBook', '2024-12-31'),
        createMockDeadline('3', 'physical', '2024-12-31'),
      ];

      mockUseDeadlines.mockReturnValue({
        activeDeadlines: readingDeadlines,
        completedDeadlines: [],
      });

      const { result } = renderHook(() => useTodaysDeadlines());

      expect(result.current.audioDeadlines).toHaveLength(0);
      expect(result.current.readingDeadlines).toHaveLength(3);
      expect(result.current.allDeadlines).toHaveLength(3);
    });
  });

  describe('Completed deadlines filtering', () => {
    it('should include completed deadlines with recent status', () => {
      const completedDeadline = createMockDeadline(
        '1',
        'physical',
        '2024-12-31',
        [{ created_at: '2024-12-30T10:00:00Z' }]
      );

      mockNormalizeServerDate.mockImplementation(() => ({
        isValid: () => true,
        isAfter: () => true,
      }));

      mockUseDeadlines.mockReturnValue({
        activeDeadlines: [],
        completedDeadlines: [completedDeadline],
      });

      const { result } = renderHook(() => useTodaysDeadlines());

      expect(result.current.allDeadlines).toHaveLength(1);
      expect(result.current.allDeadlines[0].id).toBe('1');
    });

    it('should exclude completed deadlines with old status', () => {
      const completedDeadline = createMockDeadline(
        '1',
        'physical',
        '2024-12-31',
        [{ created_at: '2024-01-01T10:00:00Z' }]
      );

      mockNormalizeServerDate.mockImplementation(() => ({
        isValid: () => true,
        isAfter: () => false,
      }));

      mockUseDeadlines.mockReturnValue({
        activeDeadlines: [],
        completedDeadlines: [completedDeadline],
      });

      const { result } = renderHook(() => useTodaysDeadlines());

      expect(result.current.allDeadlines).toHaveLength(0);
    });

    it('should use the latest status from status array', () => {
      const completedDeadline = createMockDeadline(
        '1',
        'physical',
        '2024-12-31',
        [
          { created_at: '2024-01-01T10:00:00Z' },
          { created_at: '2024-06-01T10:00:00Z' },
          { created_at: '2024-12-30T10:00:00Z' },
        ]
      );

      mockNormalizeServerDate.mockImplementation(date => ({
        isValid: () => true,
        isAfter: () => {
          return date === '2024-12-30T10:00:00Z';
        },
      }));

      mockUseDeadlines.mockReturnValue({
        activeDeadlines: [],
        completedDeadlines: [completedDeadline],
      });

      const { result } = renderHook(() => useTodaysDeadlines());

      expect(mockNormalizeServerDate).toHaveBeenCalledWith(
        '2024-12-30T10:00:00Z'
      );
      expect(result.current.allDeadlines).toHaveLength(1);
    });

    it('should exclude completed deadlines without status', () => {
      const completedDeadlineNoStatus = createMockDeadline(
        '1',
        'physical',
        '2024-12-31'
      );
      const completedDeadlineEmptyStatus = createMockDeadline(
        '2',
        'physical',
        '2024-12-31',
        []
      );

      mockUseDeadlines.mockReturnValue({
        activeDeadlines: [],
        completedDeadlines: [
          completedDeadlineNoStatus,
          completedDeadlineEmptyStatus,
        ],
      });

      const { result } = renderHook(() => useTodaysDeadlines());

      expect(result.current.allDeadlines).toHaveLength(0);
    });

    it('should exclude completed deadlines with invalid status date', () => {
      const completedDeadline = createMockDeadline(
        '1',
        'physical',
        '2024-12-31',
        [{ created_at: 'invalid-date' }]
      );

      mockNormalizeServerDate.mockImplementation(() => ({
        isValid: () => false,
        isAfter: () => false,
      }));

      mockUseDeadlines.mockReturnValue({
        activeDeadlines: [],
        completedDeadlines: [completedDeadline],
      });

      const { result } = renderHook(() => useTodaysDeadlines());

      expect(result.current.allDeadlines).toHaveLength(0);
    });
  });

  describe('Memoization', () => {
    it('should memoize results when dependencies do not change', () => {
      const activeDeadlines = [createMockDeadline('1', 'audio', '2024-12-31')];
      const completedDeadlines = [
        createMockDeadline('2', 'physical', '2024-12-31', [
          { created_at: '2024-12-30T10:00:00Z' },
        ]),
      ];

      mockUseDeadlines.mockReturnValue({
        activeDeadlines,
        completedDeadlines,
      });

      const { result, rerender } = renderHook(() => useTodaysDeadlines());

      const firstAllDeadlines = result.current.allDeadlines;
      const firstAudioDeadlines = result.current.audioDeadlines;
      const firstReadingDeadlines = result.current.readingDeadlines;

      rerender({});

      expect(result.current.allDeadlines).toBe(firstAllDeadlines);
      expect(result.current.audioDeadlines).toBe(firstAudioDeadlines);
      expect(result.current.readingDeadlines).toBe(firstReadingDeadlines);
    });

    it('should update results when dependencies change', () => {
      const initialDeadlines = [createMockDeadline('1', 'audio', '2024-12-31')];
      const updatedDeadlines = [
        createMockDeadline('1', 'audio', '2024-12-31'),
        createMockDeadline('2', 'physical', '2024-12-31'),
      ];

      mockUseDeadlines.mockReturnValue({
        activeDeadlines: initialDeadlines,
        completedDeadlines: [],
      });

      const { result, rerender } = renderHook(() => useTodaysDeadlines());

      expect(result.current.allDeadlines).toHaveLength(1);

      mockUseDeadlines.mockReturnValue({
        activeDeadlines: updatedDeadlines,
        completedDeadlines: [],
      });

      rerender({});

      expect(result.current.allDeadlines).toHaveLength(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle mixed active and completed deadlines', () => {
      const activeDeadline = createMockDeadline('1', 'audio', '2024-12-31');
      const completedValidDeadline = createMockDeadline(
        '2',
        'physical',
        '2024-12-31',
        [{ created_at: '2024-12-30T10:00:00Z' }]
      );
      const completedInvalidDeadline = createMockDeadline(
        '3',
        'eBook',
        '2024-12-31',
        [{ created_at: '2024-01-01T10:00:00Z' }]
      );

      mockNormalizeServerDate.mockImplementation(date => ({
        isValid: () => true,
        isAfter: () => date === '2024-12-30T10:00:00Z',
      }));

      mockUseDeadlines.mockReturnValue({
        activeDeadlines: [activeDeadline],
        completedDeadlines: [completedValidDeadline, completedInvalidDeadline],
      });

      const { result } = renderHook(() => useTodaysDeadlines());

      expect(result.current.allDeadlines).toHaveLength(2);
      expect(result.current.audioDeadlines).toHaveLength(1);
      expect(result.current.readingDeadlines).toHaveLength(1);
    });

    it('should handle deadline at exactly start of day', () => {
      const deadlineAtStartOfDay = createMockDeadline(
        '1',
        'physical',
        '2024-12-31T00:00:00Z'
      );

      mockNormalizeServerDateStartOfDay.mockImplementation(() => ({
        isValid: () => true,
        isAfter: () => true,
      }));

      mockUseDeadlines.mockReturnValue({
        activeDeadlines: [deadlineAtStartOfDay],
        completedDeadlines: [],
      });

      const { result } = renderHook(() => useTodaysDeadlines());

      expect(result.current.allDeadlines).toHaveLength(1);
    });

    it('should handle undefined values gracefully', () => {
      const deadlineWithUndefined = {
        ...createMockDeadline('1', 'physical', '2024-12-31'),
        status: undefined,
      };

      mockUseDeadlines.mockReturnValue({
        activeDeadlines: [deadlineWithUndefined],
        completedDeadlines: [deadlineWithUndefined],
      });

      const { result } = renderHook(() => useTodaysDeadlines());

      expect(result.current.allDeadlines).toHaveLength(1);
    });
  });
});
