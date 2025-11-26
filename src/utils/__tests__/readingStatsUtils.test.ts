import {
  ReadingDeadlineProgress,
  ReadingDeadlineStatus,
  ReadingDeadlineWithProgress,
} from '@/types/deadline.types';
import {
  calculateAveragePace,
  calculateDaysToComplete,
  formatAveragePace,
  formatBookFormat,
  getCompletionDate,
  getCompletionStatusLabel,
  getProgressLabel,
  getReadingSessionCount,
  getReadingStartDate,
  getTotalLabel,
} from '../readingStatsUtils';

const createMockDeadline = (
  overrides: Partial<ReadingDeadlineWithProgress> = {}
): ReadingDeadlineWithProgress => ({
  id: 'test-id',
  user_id: 'user-123',
  book_title: 'Test Book',
  author: 'Test Author',
  book_id: null,
  total_quantity: 300,
  format: 'physical',
  deadline_date: '2025-01-20',
  flexibility: 'flexible',
  acquisition_source: null,
  type: 'Personal',
  publishers: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-15T00:00:00Z',
  cover_image_url: null,
  progress: [],
  status: [],
  ...overrides,
});

const createStatusRecord = (
  status: string,
  created_at: string
): ReadingDeadlineStatus => ({
  id: `status-${Math.random()}`,
  deadline_id: 'test-id',
  status: status as
    | 'pending'
    | 'reading'
    | 'to_review'
    | 'complete'
    | 'did_not_finish'
    | null,
  created_at,
  updated_at: created_at,
});

const createProgressRecord = (
  current_progress: number,
  created_at: string,
  ignore_in_calcs = false
): ReadingDeadlineProgress => ({
  id: `progress-${Math.random()}`,
  deadline_id: 'test-id',
  current_progress,
  ignore_in_calcs,
  time_spent_reading: null,
  created_at,
  updated_at: created_at,
});

describe('readingStatsUtils', () => {
  describe('getReadingStartDate', () => {
    it('should return the created_at of first reading status', () => {
      const deadline = createMockDeadline({
        status: [
          createStatusRecord('pending', '2025-01-01T00:00:00Z'),
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('complete', '2025-01-15T00:00:00Z'),
        ],
      });

      const result = getReadingStartDate(deadline);
      expect(result).toBe('2025-01-05T00:00:00Z');
    });

    it('should return null if no reading status exists', () => {
      const deadline = createMockDeadline({
        status: [
          createStatusRecord('pending', '2025-01-01T00:00:00Z'),
          createStatusRecord('complete', '2025-01-15T00:00:00Z'),
        ],
      });

      const result = getReadingStartDate(deadline);
      expect(result).toBeNull();
    });

    it('should return null if status array is empty', () => {
      const deadline = createMockDeadline({ status: [] });
      const result = getReadingStartDate(deadline);
      expect(result).toBeNull();
    });

    it('should return null if status is missing', () => {
      const deadline = createMockDeadline();
      deadline.status = undefined as any;
      const result = getReadingStartDate(deadline);
      expect(result).toBeNull();
    });

    it('should return first reading status when deadline starts with reading', () => {
      const deadline = createMockDeadline({
        status: [
          createStatusRecord('reading', '2025-01-01T00:00:00Z'),
          createStatusRecord('complete', '2025-01-15T00:00:00Z'),
        ],
      });

      const result = getReadingStartDate(deadline);
      expect(result).toBe('2025-01-01T00:00:00Z');
    });
  });

  describe('getCompletionDate', () => {
    it('should return the created_at of complete status', () => {
      const deadline = createMockDeadline({
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('complete', '2025-01-15T00:00:00Z'),
        ],
      });

      const result = getCompletionDate(deadline);
      expect(result).toBe('2025-01-15T00:00:00Z');
    });

    it('should return the created_at of to_review status', () => {
      const deadline = createMockDeadline({
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('to_review', '2025-01-15T00:00:00Z'),
        ],
      });

      const result = getCompletionDate(deadline);
      expect(result).toBe('2025-01-15T00:00:00Z');
    });

    it('should return the created_at of did_not_finish status', () => {
      const deadline = createMockDeadline({
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('did_not_finish', '2025-01-15T00:00:00Z'),
        ],
      });

      const result = getCompletionDate(deadline);
      expect(result).toBe('2025-01-15T00:00:00Z');
    });

    it('should return the most recent completion status when multiple exist', () => {
      const deadline = createMockDeadline({
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('to_review', '2025-01-15T00:00:00Z'),
          createStatusRecord('complete', '2025-01-20T00:00:00Z'),
        ],
      });

      const result = getCompletionDate(deadline);
      expect(result).toBe('2025-01-20T00:00:00Z');
    });

    it('should return null if no completion status exists', () => {
      const deadline = createMockDeadline({
        status: [
          createStatusRecord('pending', '2025-01-01T00:00:00Z'),
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
        ],
      });

      const result = getCompletionDate(deadline);
      expect(result).toBeNull();
    });

    it('should return null if status array is empty', () => {
      const deadline = createMockDeadline({ status: [] });
      const result = getCompletionDate(deadline);
      expect(result).toBeNull();
    });

    it('should return null if status is missing', () => {
      const deadline = createMockDeadline();
      deadline.status = undefined as any;
      const result = getCompletionDate(deadline);
      expect(result).toBeNull();
    });
  });

  describe('calculateDaysToComplete', () => {
    it('should calculate days between reading start and completion', () => {
      const deadline = createMockDeadline({
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('complete', '2025-01-15T00:00:00Z'),
        ],
      });

      const result = calculateDaysToComplete(deadline);
      expect(result).toBe(10);
    });

    it('should calculate days skipping pending status', () => {
      const deadline = createMockDeadline({
        status: [
          createStatusRecord('pending', '2025-01-01T00:00:00Z'),
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('complete', '2025-01-15T00:00:00Z'),
        ],
      });

      const result = calculateDaysToComplete(deadline);
      expect(result).toBe(10);
    });

    it('should return at least 1 day for same-day completion', () => {
      const deadline = createMockDeadline({
        status: [
          createStatusRecord('reading', '2025-01-15T08:00:00Z'),
          createStatusRecord('complete', '2025-01-15T18:00:00Z'),
        ],
      });

      const result = calculateDaysToComplete(deadline);
      expect(result).toBe(1);
    });

    it('should return null if no reading start date', () => {
      const deadline = createMockDeadline({
        status: [createStatusRecord('complete', '2025-01-15T00:00:00Z')],
      });

      const result = calculateDaysToComplete(deadline);
      expect(result).toBeNull();
    });

    it('should return null if no completion date', () => {
      const deadline = createMockDeadline({
        status: [createStatusRecord('reading', '2025-01-05T00:00:00Z')],
      });

      const result = calculateDaysToComplete(deadline);
      expect(result).toBeNull();
    });

    it('should return null if status array is empty', () => {
      const deadline = createMockDeadline({ status: [] });
      const result = calculateDaysToComplete(deadline);
      expect(result).toBeNull();
    });

    it('should handle multi-month completion period', () => {
      const deadline = createMockDeadline({
        status: [
          createStatusRecord('reading', '2025-01-01T00:00:00Z'),
          createStatusRecord('complete', '2025-03-01T00:00:00Z'),
        ],
      });

      const result = calculateDaysToComplete(deadline);
      expect(result).toBe(59);
    });
  });

  describe('calculateAveragePace', () => {
    it('should calculate average pace based on current progress, not total quantity', () => {
      const deadline = createMockDeadline({
        total_quantity: 300,
        format: 'physical',
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('complete', '2025-01-15T00:00:00Z'),
        ],
      });

      const result = calculateAveragePace(deadline, 300);
      expect(result).toBe(30);
    });

    it('should calculate average pace for partial progress', () => {
      const deadline = createMockDeadline({
        total_quantity: 300,
        format: 'physical',
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('complete', '2025-01-15T00:00:00Z'),
        ],
      });

      const result = calculateAveragePace(deadline, 100);
      expect(result).toBe(10);
    });

    it('should calculate average pace for audio book', () => {
      const deadline = createMockDeadline({
        total_quantity: 600,
        format: 'audio',
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('complete', '2025-01-15T00:00:00Z'),
        ],
      });

      const result = calculateAveragePace(deadline, 600);
      expect(result).toBe(60);
    });

    it('should calculate average pace for audio book with partial progress', () => {
      const deadline = createMockDeadline({
        total_quantity: 600,
        format: 'audio',
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('complete', '2025-01-15T00:00:00Z'),
        ],
      });

      const result = calculateAveragePace(deadline, 200);
      expect(result).toBe(20);
    });

    it('should round average pace to nearest integer', () => {
      const deadline = createMockDeadline({
        total_quantity: 250,
        format: 'physical',
        status: [
          createStatusRecord('reading', '2025-01-01T00:00:00Z'),
          createStatusRecord('complete', '2025-01-08T00:00:00Z'),
        ],
      });

      const result = calculateAveragePace(deadline, 250);
      expect(result).toBe(36);
    });

    it('should return null if days to complete is null', () => {
      const deadline = createMockDeadline({
        total_quantity: 300,
        status: [],
      });

      const result = calculateAveragePace(deadline, 300);
      expect(result).toBeNull();
    });

    it('should return null if days to complete is zero', () => {
      const deadline = createMockDeadline({
        total_quantity: 300,
        status: [
          createStatusRecord('reading', '2025-01-15T00:00:00Z'),
          createStatusRecord('complete', '2025-01-15T00:00:00Z'),
        ],
      });

      const result = calculateAveragePace(deadline, 300);
      expect(result).toBe(300);
    });

    it('should handle large quantities', () => {
      const deadline = createMockDeadline({
        total_quantity: 1000,
        format: 'physical',
        status: [
          createStatusRecord('reading', '2025-01-01T00:00:00Z'),
          createStatusRecord('complete', '2025-01-31T00:00:00Z'),
        ],
      });

      const result = calculateAveragePace(deadline, 1000);
      expect(result).toBe(33);
    });
  });

  describe('getReadingSessionCount', () => {
    it('should count progress records that are not ignored', () => {
      const deadline = createMockDeadline({
        progress: [
          createProgressRecord(50, '2025-01-05T00:00:00Z', false),
          createProgressRecord(100, '2025-01-06T00:00:00Z', false),
          createProgressRecord(150, '2025-01-07T00:00:00Z', false),
        ],
      });

      const result = getReadingSessionCount(deadline);
      expect(result).toBe(3);
    });

    it('should exclude progress records with ignore_in_calcs=true', () => {
      const deadline = createMockDeadline({
        progress: [
          createProgressRecord(50, '2025-01-05T00:00:00Z', false),
          createProgressRecord(100, '2025-01-06T00:00:00Z', true),
          createProgressRecord(150, '2025-01-07T00:00:00Z', false),
        ],
      });

      const result = getReadingSessionCount(deadline);
      expect(result).toBe(2);
    });

    it('should return 0 if progress array is empty', () => {
      const deadline = createMockDeadline({ progress: [] });
      const result = getReadingSessionCount(deadline);
      expect(result).toBe(0);
    });

    it('should return 0 if progress is missing', () => {
      const deadline = createMockDeadline();
      deadline.progress = undefined as any;
      const result = getReadingSessionCount(deadline);
      expect(result).toBe(0);
    });

    it('should count only non-ignored records when all are ignored', () => {
      const deadline = createMockDeadline({
        progress: [
          createProgressRecord(50, '2025-01-05T00:00:00Z', true),
          createProgressRecord(100, '2025-01-06T00:00:00Z', true),
        ],
      });

      const result = getReadingSessionCount(deadline);
      expect(result).toBe(0);
    });

    it('should handle large number of sessions', () => {
      const progress = Array.from({ length: 50 }, (_, i) =>
        createProgressRecord(
          i * 10,
          `2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
          false
        )
      );

      const deadline = createMockDeadline({ progress });
      const result = getReadingSessionCount(deadline);
      expect(result).toBe(50);
    });
  });

  describe('formatBookFormat', () => {
    it('should format physical to Physical Book', () => {
      const result = formatBookFormat('physical');
      expect(result).toBe('Physical Book');
    });

    it('should format eBook to eBook', () => {
      const result = formatBookFormat('eBook');
      expect(result).toBe('eBook');
    });

    it('should format audio to Audiobook', () => {
      const result = formatBookFormat('audio');
      expect(result).toBe('Audiobook');
    });
  });

  describe('formatAveragePace', () => {
    it('should format pages/day for physical books', () => {
      const result = formatAveragePace(42, 'physical');
      expect(result).toBe('42 pages/day');
    });

    it('should format pages/day for eBooks', () => {
      const result = formatAveragePace(35, 'eBook');
      expect(result).toBe('35 pages/day');
    });

    it('should format minutes only for audio books under 60 min', () => {
      const result = formatAveragePace(45, 'audio');
      expect(result).toBe('45 min/day');
    });

    it('should format hours only for audio books at exact hour', () => {
      const result = formatAveragePace(120, 'audio');
      expect(result).toBe('2h/day');
    });

    it('should format hours and minutes for audio books', () => {
      const result = formatAveragePace(125, 'audio');
      expect(result).toBe('2h 5m/day');
    });

    it('should return N/A for null pace', () => {
      const result = formatAveragePace(null, 'physical');
      expect(result).toBe('N/A');
    });

    it('should handle zero pace', () => {
      const result = formatAveragePace(0, 'physical');
      expect(result).toBe('0 pages/day');
    });

    it('should handle single digit minutes for audio', () => {
      const result = formatAveragePace(5, 'audio');
      expect(result).toBe('5 min/day');
    });
  });

  describe('getCompletionStatusLabel', () => {
    it('should return Finished Reading for complete status (physical book)', () => {
      const result = getCompletionStatusLabel('complete', 'physical');
      expect(result).toBe('Finished Reading');
    });

    it('should return Finished Reading for to_review status (eBook)', () => {
      const result = getCompletionStatusLabel('to_review', 'eBook');
      expect(result).toBe('Finished Reading');
    });

    it('should return Finished Listening for complete status (audiobook)', () => {
      const result = getCompletionStatusLabel('complete', 'audio');
      expect(result).toBe('Finished Listening');
    });

    it('should return Finished Listening for to_review status (audiobook)', () => {
      const result = getCompletionStatusLabel('to_review', 'audio');
      expect(result).toBe('Finished Listening');
    });

    it('should return Did Not Finish for did_not_finish status (any format)', () => {
      expect(getCompletionStatusLabel('did_not_finish', 'physical')).toBe(
        'Did Not Finish'
      );
      expect(getCompletionStatusLabel('did_not_finish', 'eBook')).toBe(
        'Did Not Finish'
      );
      expect(getCompletionStatusLabel('did_not_finish', 'audio')).toBe(
        'Did Not Finish'
      );
    });

    it('should return Finished Reading for null status without format', () => {
      const result = getCompletionStatusLabel(null);
      expect(result).toBe('Finished Reading');
    });

    it('should return Finished Listening for null status with audio format', () => {
      const result = getCompletionStatusLabel(null, 'audio');
      expect(result).toBe('Finished Listening');
    });

    it('should return Finished Reading for undefined status', () => {
      const result = getCompletionStatusLabel(undefined);
      expect(result).toBe('Finished Reading');
    });

    it('should return Finished Reading for unknown status', () => {
      const result = getCompletionStatusLabel('unknown', 'physical');
      expect(result).toBe('Finished Reading');
    });

    it('should return Finished Listening for unknown status with audio format', () => {
      const result = getCompletionStatusLabel('unknown', 'audio');
      expect(result).toBe('Finished Listening');
    });
  });

  describe('getProgressLabel', () => {
    it('should return Pages Read for physical books', () => {
      const result = getProgressLabel('physical');
      expect(result).toBe('Pages Read');
    });

    it('should return Pages Read for eBooks', () => {
      const result = getProgressLabel('eBook');
      expect(result).toBe('Pages Read');
    });

    it('should return Time Listened for audiobooks', () => {
      const result = getProgressLabel('audio');
      expect(result).toBe('Time Listened');
    });
  });

  describe('getTotalLabel', () => {
    it('should return Total Pages for physical books', () => {
      const result = getTotalLabel('physical');
      expect(result).toBe('Total Pages');
    });

    it('should return Total Pages for eBooks', () => {
      const result = getTotalLabel('eBook');
      expect(result).toBe('Total Pages');
    });

    it('should return Total Duration for audiobooks', () => {
      const result = getTotalLabel('audio');
      expect(result).toBe('Total Duration');
    });
  });
});
