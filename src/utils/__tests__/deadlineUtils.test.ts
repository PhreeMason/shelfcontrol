import dayjs from '@/lib/dayjs';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  calculateDaysLeft,
  calculateProgress,
  calculateProgressPercentage,
  formatProgressDisplay,
  getCompletedThisMonth,
  getInitialStepFromSearchParams,
  getOnTrackDeadlines,
  getUnitForFormat,
  separateDeadlines,
  sortDeadlines,
} from '../deadlineUtils';

const createMockDeadline = (
  id: string,
  deadlineDate: string,
  createdAt = '2024-01-01T00:00:00Z',
  updatedAt?: string,
  progress: {
    current_progress: number;
    created_at: string;
    updated_at?: string;
  }[] = [],
  status: {
    status: 'reading' | 'complete' | 'set_aside';
    created_at: string;
  }[] = []
): ReadingDeadlineWithProgress => ({
  id,
  user_id: 'user-123',
  book_id: 'book-123',
  book_title: 'Test Book',
  author: 'Test Author',
  source: 'test',
  deadline_date: deadlineDate,
  total_quantity: 300,
  format: 'physical',
  flexibility: 'flexible',
  created_at: createdAt,
  updated_at: updatedAt || createdAt,
  progress: progress.map((p, index) => ({
    id: `progress-${index}`,
    deadline_id: id,
    current_progress: p.current_progress,
    created_at: p.created_at,
    updated_at: p.updated_at || p.created_at,
    time_spent_reading: null,
  })),
  status: status?.map((s, index) => ({
    id: `status-${index}`,
    deadline_id: id,
    status: s.status,
    created_at: s.created_at,
    updated_at: s.created_at,
  })),
});

describe('deadlineUtils', () => {
  describe('sortDeadlines', () => {
    it('should sort by deadline date (earliest first)', () => {
      const deadline1 = createMockDeadline('1', '2024-02-01');
      const deadline2 = createMockDeadline('2', '2024-01-01');
      const deadline3 = createMockDeadline('3', '2024-03-01');

      const result = [deadline1, deadline2, deadline3].sort(sortDeadlines);

      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('1');
      expect(result[2].id).toBe('3');
    });

    it('should sort by updated_at when deadline dates are equal', () => {
      const deadline1 = createMockDeadline(
        '1',
        '2024-01-01',
        '2024-01-01T00:00:00Z',
        '2024-01-02T00:00:00Z'
      );
      const deadline2 = createMockDeadline(
        '2',
        '2024-01-01',
        '2024-01-01T00:00:00Z',
        '2024-01-03T00:00:00Z'
      );

      const result = [deadline1, deadline2].sort(sortDeadlines);

      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('1');
    });

    it('should sort by created_at when deadline dates and updated_at are equal', () => {
      const deadline1 = createMockDeadline(
        '1',
        '2024-01-01',
        '2024-01-02T00:00:00Z'
      );
      const deadline2 = createMockDeadline(
        '2',
        '2024-01-01',
        '2024-01-03T00:00:00Z'
      );

      const result = [deadline1, deadline2].sort(sortDeadlines);

      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('1');
    });

    it('should handle missing updated_at (treat empty updated_at as older)', () => {
      const deadline1 = createMockDeadline(
        '1',
        '2024-01-01',
        '2024-01-01T00:00:00Z'
      );
      deadline1.updated_at = '';
      const deadline2 = createMockDeadline(
        '2',
        '2024-01-01',
        '2024-01-01T00:00:00Z',
        '2024-01-02T00:00:00Z'
      );

      const result = [deadline1, deadline2].sort(sortDeadlines);
      // With normalization, deadline2 has a valid updated_at making it first
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('1');
    });
  });

  describe('separateDeadlines', () => {
    it('should separate deadlines into active, overdue, and completed', () => {
      const activeDeadline = createMockDeadline('1', '2025-12-31');
      const overdueDeadline = createMockDeadline('2', '2023-01-01');
      const completedDeadline = createMockDeadline(
        '3',
        '2024-12-31',
        '2024-01-01T00:00:00Z',
        undefined,
        [],
        [{ status: 'complete', created_at: '2024-01-15T00:00:00Z' }]
      );
      const setAsideDeadline = createMockDeadline(
        '4',
        '2024-12-31',
        '2024-01-01T00:00:00Z',
        undefined,
        [],
        [{ status: 'set_aside', created_at: '2024-01-15T00:00:00Z' }]
      );

      const result = separateDeadlines([
        activeDeadline,
        overdueDeadline,
        completedDeadline,
        setAsideDeadline,
      ]);

      expect(result.active).toHaveLength(1);
      expect(result.active[0].id).toBe('1');
      expect(result.overdue).toHaveLength(1);
      expect(result.overdue[0].id).toBe('2');
      expect(result.completed).toHaveLength(2);
      expect(result.completed.map(d => d.id)).toContain('3');
      expect(result.completed.map(d => d.id)).toContain('4');
    });

    it('should use latest status when multiple status entries exist', () => {
      const deadline = createMockDeadline(
        '1',
        '2025-12-31',
        '2024-01-01T00:00:00Z',
        undefined,
        [],
        [
          { status: 'reading', created_at: '2024-01-10T00:00:00Z' },
          { status: 'complete', created_at: '2024-01-15T00:00:00Z' },
        ]
      );

      const result = separateDeadlines([deadline]);

      expect(result.completed).toHaveLength(1);
      expect(result.active).toHaveLength(0);
      expect(result.overdue).toHaveLength(0);
    });

    it('should default to reading status when no status exists', () => {
      const deadline = createMockDeadline('1', '2025-12-31');

      const result = separateDeadlines([deadline]);

      expect(result.active).toHaveLength(1);
      expect(result.completed).toHaveLength(0);
      expect(result.overdue).toHaveLength(0);
    });

    it('should sort completed by most recently updated', () => {
      const deadline1 = createMockDeadline(
        '1',
        '2024-12-31',
        '2024-01-01T00:00:00Z',
        '2024-01-10T00:00:00Z',
        [],
        [{ status: 'complete', created_at: '2024-01-15T00:00:00Z' }]
      );
      const deadline2 = createMockDeadline(
        '2',
        '2024-12-31',
        '2024-01-01T00:00:00Z',
        '2024-01-20T00:00:00Z',
        [],
        [{ status: 'complete', created_at: '2024-01-15T00:00:00Z' }]
      );

      const result = separateDeadlines([deadline1, deadline2]);

      expect(result.completed[0].id).toBe('2');
      expect(result.completed[1].id).toBe('1');
    });
  });

  describe('calculateDaysLeft', () => {
    it('should calculate positive days for future dates (local calendar diff)', () => {
      const future = dayjs().add(5, 'day').format('YYYY-MM-DD');
      const result = calculateDaysLeft(future);
      expect(result).toBe(5);
    });

    it('should calculate negative days for past dates (local calendar diff)', () => {
      const past = dayjs().subtract(3, 'day').format('YYYY-MM-DD');
      const result = calculateDaysLeft(past);
      expect(result).toBe(-3);
    });

    it('should return 0 for today (local calendar start)', () => {
      const today = dayjs().format('YYYY-MM-DD');
      const result = calculateDaysLeft(today);
      expect(result).toBe(0);
    });
  });

  describe('calculateProgress', () => {
    it('should return 0 for no progress entries', () => {
      const deadline = createMockDeadline('1', '2024-12-31');

      const result = calculateProgress(deadline);
      expect(result).toBe(0);
    });

    it('should return 0 for empty progress array', () => {
      const deadline = createMockDeadline(
        '1',
        '2024-12-31',
        '2024-01-01T00:00:00Z',
        undefined,
        []
      );

      const result = calculateProgress(deadline);
      expect(result).toBe(0);
    });

    it('should return progress from single entry', () => {
      const deadline = createMockDeadline(
        '1',
        '2024-12-31',
        '2024-01-01T00:00:00Z',
        undefined,
        [{ current_progress: 150, created_at: '2024-01-05T00:00:00Z' }]
      );

      const result = calculateProgress(deadline);
      expect(result).toBe(150);
    });

    it('should return latest progress from multiple entries', () => {
      const deadline = createMockDeadline(
        '1',
        '2024-12-31',
        '2024-01-01T00:00:00Z',
        undefined,
        [
          { current_progress: 100, created_at: '2024-01-05T00:00:00Z' },
          { current_progress: 150, created_at: '2024-01-10T00:00:00Z' },
          { current_progress: 120, created_at: '2024-01-08T00:00:00Z' },
        ]
      );

      const result = calculateProgress(deadline);
      expect(result).toBe(150);
    });

    it('should use updated_at if available and later than created_at', () => {
      const deadline = createMockDeadline(
        '1',
        '2024-12-31',
        '2024-01-01T00:00:00Z',
        undefined,
        [
          {
            current_progress: 100,
            created_at: '2024-01-05T00:00:00Z',
            updated_at: '2024-01-12T00:00:00Z',
          },
          { current_progress: 150, created_at: '2024-01-10T00:00:00Z' },
        ]
      );

      const result = calculateProgress(deadline);
      expect(result).toBe(100);
    });
  });

  describe('calculateProgressPercentage', () => {
    it('should calculate percentage correctly', () => {
      const deadline = createMockDeadline(
        '1',
        '2024-12-31',
        '2024-01-01T00:00:00Z',
        undefined,
        [{ current_progress: 150, created_at: '2024-01-05T00:00:00Z' }]
      );

      const result = calculateProgressPercentage(deadline);
      expect(result).toBe(50);
    });

    it('should handle zero progress', () => {
      const deadline = createMockDeadline('1', '2024-12-31');

      const result = calculateProgressPercentage(deadline);
      expect(result).toBe(0);
    });

    it('should handle 100% progress', () => {
      const deadline = createMockDeadline(
        '1',
        '2024-12-31',
        '2024-01-01T00:00:00Z',
        undefined,
        [{ current_progress: 300, created_at: '2024-01-05T00:00:00Z' }]
      );

      const result = calculateProgressPercentage(deadline);
      expect(result).toBe(100);
    });

    it('should round to nearest whole number', () => {
      const deadline = createMockDeadline(
        '1',
        '2024-12-31',
        '2024-01-01T00:00:00Z',
        undefined,
        [{ current_progress: 100, created_at: '2024-01-05T00:00:00Z' }]
      );

      const result = calculateProgressPercentage(deadline);
      expect(result).toBe(33);
    });
  });

  describe('getUnitForFormat', () => {
    it('should return minutes for audio format', () => {
      const result = getUnitForFormat('audio');
      expect(result).toBe('minutes');
    });

    it('should return pages for physical format', () => {
      const result = getUnitForFormat('physical');
      expect(result).toBe('pages');
    });

    it('should return pages for eBook format', () => {
      const result = getUnitForFormat('eBook');
      expect(result).toBe('pages');
    });
  });

  describe('formatProgressDisplay', () => {
    it('should format physical book progress as is', () => {
      const result = formatProgressDisplay('physical', 150);
      expect(result).toBe('150');
    });

    it('should format eBook progress as is', () => {
      const result = formatProgressDisplay('eBook', 200);
      expect(result).toBe('200');
    });

    it('should format audio progress in minutes only', () => {
      const result = formatProgressDisplay('audio', 45);
      expect(result).toBe('45m');
    });

    it('should format audio progress in hours and minutes', () => {
      const result = formatProgressDisplay('audio', 150);
      expect(result).toBe('2h 30m');
    });

    it('should format audio progress in hours only', () => {
      const result = formatProgressDisplay('audio', 120);
      expect(result).toBe('2h 0m');
    });

    it('should handle zero audio progress', () => {
      const result = formatProgressDisplay('audio', 0);
      expect(result).toBe('0m');
    });
  });

  describe('getInitialStepFromSearchParams', () => {
    it('should return default step when params is null', () => {
      const result = getInitialStepFromSearchParams({});
      expect(result).toBe(1);
    });

    it('should return default step when param does not exist', () => {
      const result = getInitialStepFromSearchParams({});
      expect(result).toBe(1);
    });

    it('should parse valid step from params', () => {
      const result = getInitialStepFromSearchParams({ page: '5' });
      expect(result).toBe(5);
    });

    it('should use custom param name', () => {
      const result = getInitialStepFromSearchParams(
        { step: '3' },
        { paramName: 'step' }
      );
      expect(result).toBe(3);
    });

    it('should use custom default step', () => {
      const result = getInitialStepFromSearchParams({}, { defaultStep: 10 });
      expect(result).toBe(10);
    });

    it('should enforce minimum step', () => {
      const result = getInitialStepFromSearchParams(
        { page: '-5' },
        { minStep: 1 }
      );
      expect(result).toBe(1);
    });

    it('should enforce maximum step', () => {
      const result = getInitialStepFromSearchParams(
        { page: '20' },
        { maxStep: 10 }
      );
      expect(result).toBe(10);
    });

    it('should handle array parameter (take first)', () => {
      const result = getInitialStepFromSearchParams({ page: ['3', '5'] });
      expect(result).toBe(3);
    });

    it('should return default for invalid number', () => {
      const result = getInitialStepFromSearchParams({ page: 'invalid' });
      expect(result).toBe(1);
    });

    it('should return default for NaN', () => {
      const result = getInitialStepFromSearchParams({ page: 'NaN' });
      expect(result).toBe(1);
    });
  });

  describe('getCompletedThisMonth', () => {
    it('should return 0 for no deadlines', () => {
      const result = getCompletedThisMonth([]);
      expect(result).toBe(0);
    });

    it('should count deadlines completed this month', () => {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonth = new Date(currentYear, currentMonth, 15);

      const completedThisMonth = createMockDeadline(
        '1',
        '2024-12-31',
        '2024-01-01T00:00:00Z',
        undefined,
        [],
        [{ status: 'complete', created_at: thisMonth.toISOString() }]
      );
      const completedLastMonth = createMockDeadline(
        '2',
        '2024-12-31',
        '2024-01-01T00:00:00Z',
        undefined,
        [],
        [{ status: 'complete', created_at: '2024-01-15T00:00:00Z' }]
      );

      const result = getCompletedThisMonth([
        completedThisMonth,
        completedLastMonth,
      ]);
      expect(result).toBe(1);
    });

    it('should ignore non-completed deadlines', () => {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonth = new Date(currentYear, currentMonth, 15);

      const readingDeadline = createMockDeadline(
        '1',
        '2024-12-31',
        '2024-01-01T00:00:00Z',
        undefined,
        [],
        [{ status: 'reading', created_at: thisMonth.toISOString() }]
      );

      const result = getCompletedThisMonth([readingDeadline]);
      expect(result).toBe(0);
    });

    it('should use latest status', () => {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonth = new Date(currentYear, currentMonth, 15);

      const deadline = createMockDeadline(
        '1',
        '2024-12-31',
        '2024-01-01T00:00:00Z',
        undefined,
        [],
        [
          { status: 'reading', created_at: thisMonth.toISOString() },
          { status: 'complete', created_at: thisMonth.toISOString() },
        ]
      );

      const result = getCompletedThisMonth([deadline]);
      expect(result).toBe(1);
    });
  });

  describe('getOnTrackDeadlines', () => {
    it('should return 0 for no deadlines', () => {
      const result = getOnTrackDeadlines([]);
      expect(result).toBe(0);
    });

    it('should count deadlines that are on track', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      const onTrackDeadline = createMockDeadline(
        '1',
        futureDate.toISOString().split('T')[0],
        pastDate.toISOString(),
        undefined,
        [{ current_progress: 150, created_at: '2024-01-05T00:00:00Z' }]
      );

      const result = getOnTrackDeadlines([onTrackDeadline]);
      expect(result).toBe(1);
    });

    it('should ignore overdue deadlines', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const overdueDeadline = createMockDeadline(
        '1',
        pastDate.toISOString().split('T')[0]
      );

      const result = getOnTrackDeadlines([overdueDeadline]);
      expect(result).toBe(0);
    });

    it('should ignore completed deadlines', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const completedDeadline = createMockDeadline(
        '1',
        futureDate.toISOString().split('T')[0],
        '2024-01-01T00:00:00Z',
        undefined,
        [],
        [{ status: 'complete', created_at: '2024-01-15T00:00:00Z' }]
      );

      const result = getOnTrackDeadlines([completedDeadline]);
      expect(result).toBe(0);
    });

    it('should count deadlines with no status as reading', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const deadline = createMockDeadline(
        '1',
        futureDate.toISOString().split('T')[0],
        pastDate.toISOString(),
        undefined,
        [{ current_progress: 150, created_at: '2024-01-05T00:00:00Z' }]
      );

      const result = getOnTrackDeadlines([deadline]);
      expect(result).toBe(1);
    });

    it('should filter out behind schedule deadlines', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      const behindDeadline = createMockDeadline(
        '1',
        futureDate.toISOString().split('T')[0],
        pastDate.toISOString(),
        undefined,
        [{ current_progress: 10, created_at: '2024-01-05T00:00:00Z' }]
      );

      const result = getOnTrackDeadlines([behindDeadline]);
      expect(result).toBe(0);
    });
  });
});
