import { productivityService } from '../productivity.service';
import { supabase } from '@/lib/supabase';

// Create a chainable mock factory
const createChainableMock = () => {
  const chainable: any = {};
  chainable.select = jest.fn().mockReturnValue(chainable);
  chainable.gte = jest.fn().mockReturnValue(chainable);
  chainable.lte = jest.fn().mockReturnValue(chainable);
  chainable.lt = jest.fn().mockReturnValue(chainable);
  chainable.eq = jest.fn().mockReturnValue(chainable);
  chainable.in = jest.fn().mockReturnValue(chainable);
  chainable.order = jest.fn().mockReturnValue(chainable);
  return chainable;
};

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockSupabaseFrom = supabase.from as jest.Mock;

describe('ProductivityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProductivityByDayOfWeek', () => {
    const mockUserId = 'user-123';
    const mockStartDate = '2025-10-26T00:00:00Z';
    const mockEndDate = '2025-11-08T23:59:59Z';

    it('should fetch progress entries and baseline progress successfully', async () => {
      const mockProgressData = [
        {
          deadline_id: 'deadline-1',
          current_progress: 50,
          created_at: '2025-11-05T10:00:00Z',
          deadlines: { format: 'physical', user_id: mockUserId },
        },
        {
          deadline_id: 'deadline-2',
          current_progress: 30,
          created_at: '2025-11-06T14:00:00Z',
          deadlines: { format: 'eBook', user_id: mockUserId },
        },
      ];

      const mockBaselineData = [
        {
          deadline_id: 'deadline-1',
          current_progress: 20,
          deadlines: { format: 'physical', user_id: mockUserId },
        },
        {
          deadline_id: 'deadline-2',
          current_progress: 10,
          deadlines: { format: 'eBook', user_id: mockUserId },
        },
      ];

      // Create chainable mocks for both queries
      const progressChain = createChainableMock();
      progressChain.then = (onFulfilled: any) =>
        Promise.resolve({ data: mockProgressData, error: null }).then(onFulfilled);

      const baselineChain = createChainableMock();
      // Make the chainable awaitable by implementing then properly
      baselineChain.then = (onFulfilled: any) =>
        Promise.resolve({ data: mockBaselineData, error: null }).then(onFulfilled);

      mockSupabaseFrom
        .mockReturnValueOnce(progressChain)
        .mockReturnValueOnce(baselineChain);

      const result = await productivityService.getProductivityByDayOfWeek({
        userId: mockUserId,
        startDate: mockStartDate,
        endDate: mockEndDate,
      });

      expect(result.progressEntries).toHaveLength(2);
      expect(result.progressEntries[0]).toEqual({
        deadline_id: 'deadline-1',
        current_progress: 50,
        created_at: '2025-11-05T10:00:00Z',
        format: 'physical',
      });

      expect(result.baselineProgress).toHaveLength(2);
      expect(result.baselineProgress[0].baseline_progress).toBe(20);
    });

    it('should filter by format when format parameter is provided', async () => {
      const mockProgressData = [
        {
          deadline_id: 'deadline-1',
          current_progress: 120,
          created_at: '2025-11-05T10:00:00Z',
          deadlines: { format: 'audio', user_id: mockUserId },
        },
      ];

      const mockEq = jest.fn();

      const progressChain = createChainableMock();
      progressChain.eq = mockEq.mockReturnValue(progressChain);
      progressChain.then = (onFulfilled: any) =>
        Promise.resolve({ data: mockProgressData, error: null }).then(onFulfilled);

      const baselineChain = createChainableMock();
      baselineChain.then = (onFulfilled: any) =>
        Promise.resolve({ data: [], error: null }).then(onFulfilled);

      mockSupabaseFrom
        .mockReturnValueOnce(progressChain)
        .mockReturnValueOnce(baselineChain);

      await productivityService.getProductivityByDayOfWeek({
        userId: mockUserId,
        startDate: mockStartDate,
        endDate: mockEndDate,
        format: 'audio',
      });

      // Should be called with format filter
      expect(mockEq).toHaveBeenCalledWith('deadlines.format', 'audio');
    });

    it('should return empty arrays when no progress data exists', async () => {
      const progressChain = createChainableMock();
      progressChain.then = (onFulfilled: any) =>
        Promise.resolve({ data: [], error: null }).then(onFulfilled);

      mockSupabaseFrom.mockReturnValue(progressChain);

      const result = await productivityService.getProductivityByDayOfWeek({
        userId: mockUserId,
        startDate: mockStartDate,
        endDate: mockEndDate,
      });

      expect(result.progressEntries).toEqual([]);
      expect(result.baselineProgress).toEqual([]);
    });

    it('should throw error when progress query fails', async () => {
      const mockError = new Error('Database error');

      const progressChain = createChainableMock();
      progressChain.then = (onFulfilled: any) =>
        Promise.resolve({ data: null, error: mockError }).then(onFulfilled);

      mockSupabaseFrom.mockReturnValue(progressChain);

      await expect(
        productivityService.getProductivityByDayOfWeek({
          userId: mockUserId,
          startDate: mockStartDate,
          endDate: mockEndDate,
        })
      ).rejects.toThrow('Database error');
    });

    it('should throw error when baseline query fails', async () => {
      const mockProgressData = [
        {
          deadline_id: 'deadline-1',
          current_progress: 50,
          created_at: '2025-11-05T10:00:00Z',
          deadlines: { format: 'physical', user_id: mockUserId },
        },
      ];

      const mockBaselineError = new Error('Baseline query failed');

      const progressChain = createChainableMock();
      progressChain.then = (onFulfilled: any) =>
        Promise.resolve({ data: mockProgressData, error: null }).then(onFulfilled);

      const baselineChain = createChainableMock();
      baselineChain.then = (onFulfilled: any) =>
        Promise.resolve({ data: null, error: mockBaselineError }).then(onFulfilled);

      mockSupabaseFrom
        .mockReturnValueOnce(progressChain)
        .mockReturnValueOnce(baselineChain);

      await expect(
        productivityService.getProductivityByDayOfWeek({
          userId: mockUserId,
          startDate: mockStartDate,
          endDate: mockEndDate,
        })
      ).rejects.toThrow('Baseline query failed');
    });

    it('should calculate max baseline progress correctly when multiple entries exist', async () => {
      const mockProgressData = [
        {
          deadline_id: 'deadline-1',
          current_progress: 100,
          created_at: '2025-11-05T10:00:00Z',
          deadlines: { format: 'physical', user_id: mockUserId },
        },
      ];

      // Multiple baseline entries for same deadline, should pick max
      const mockBaselineData = [
        {
          deadline_id: 'deadline-1',
          current_progress: 20,
          deadlines: { format: 'physical', user_id: mockUserId },
        },
        {
          deadline_id: 'deadline-1',
          current_progress: 50, // Max value
          deadlines: { format: 'physical', user_id: mockUserId },
        },
        {
          deadline_id: 'deadline-1',
          current_progress: 30,
          deadlines: { format: 'physical', user_id: mockUserId },
        },
      ];

      const progressChain = createChainableMock();
      progressChain.then = (onFulfilled: any) =>
        Promise.resolve({ data: mockProgressData, error: null }).then(onFulfilled);

      const baselineChain = createChainableMock();
      // Make the chainable awaitable by implementing then properly
      baselineChain.then = (onFulfilled: any) =>
        Promise.resolve({ data: mockBaselineData, error: null }).then(onFulfilled);

      mockSupabaseFrom
        .mockReturnValueOnce(progressChain)
        .mockReturnValueOnce(baselineChain);

      const result = await productivityService.getProductivityByDayOfWeek({
        userId: mockUserId,
        startDate: mockStartDate,
        endDate: mockEndDate,
      });

      expect(result.baselineProgress).toHaveLength(1);
      expect(result.baselineProgress[0].baseline_progress).toBe(50); // Should be max value
    });

    it('should handle null baseline data gracefully', async () => {
      const mockProgressData = [
        {
          deadline_id: 'deadline-1',
          current_progress: 50,
          created_at: '2025-11-05T10:00:00Z',
          deadlines: { format: 'physical', user_id: mockUserId },
        },
      ];

      const progressChain = createChainableMock();
      progressChain.then = (onFulfilled: any) =>
        Promise.resolve({ data: mockProgressData, error: null }).then(onFulfilled);

      const baselineChain = createChainableMock();
      baselineChain.then = (onFulfilled: any) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled);

      mockSupabaseFrom
        .mockReturnValueOnce(progressChain)
        .mockReturnValueOnce(baselineChain);

      const result = await productivityService.getProductivityByDayOfWeek({
        userId: mockUserId,
        startDate: mockStartDate,
        endDate: mockEndDate,
      });

      expect(result.progressEntries).toHaveLength(1);
      expect(result.baselineProgress).toEqual([]);
    });
  });
});
