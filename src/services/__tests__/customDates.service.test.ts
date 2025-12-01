import { generateId, supabase } from '@/lib/supabase';
import { activityService } from '../activity.service';
import { customDatesService } from '../customDates.service';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  generateId: jest.fn(),
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    })),
  },
}));

jest.mock('../activity.service', () => ({
  activityService: {
    trackUserActivity: jest.fn(),
  },
}));

const mockSupabaseFrom = supabase.from as jest.Mock;
const mockGenerateId = generateId as jest.Mock;

describe('CustomDatesService', () => {
  const mockUserId = 'user-123';
  const mockDeadlineId = 'deadline-123';
  const mockCustomDateId = 'dcd_123';

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateId.mockReturnValue(mockCustomDateId);
  });

  describe('getCustomDates', () => {
    it('should fetch custom dates for a deadline', async () => {
      const mockData = [{ id: mockCustomDateId, name: 'Test Date' }];
      const mockOrder = jest
        .fn()
        .mockResolvedValue({ data: mockData, error: null });
      const mockSelect = jest.fn().mockReturnThis();

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: mockOrder,
          }),
        }),
      });

      const result = await customDatesService.getCustomDates(
        mockUserId,
        mockDeadlineId
      );

      expect(supabase.from).toHaveBeenCalledWith('deadline_custom_dates');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('date', { ascending: true });
      expect(result).toEqual(mockData);
    });

    it('should throw error on fetch failure', async () => {
      const mockError = new Error('Fetch failed');
      const mockOrder = jest
        .fn()
        .mockResolvedValue({ data: null, error: mockError });

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: mockOrder,
          }),
        }),
      });

      await expect(
        customDatesService.getCustomDates(mockUserId, mockDeadlineId)
      ).rejects.toThrow('Fetch failed');
    });
  });

  describe('getAllCustomDateNames', () => {
    it('should fetch distinct custom date names', async () => {
      const mockData = [
        { name: 'Date 1' },
        { name: 'Date 2' },
        { name: 'Date 1' },
      ];
      const mockOrder = jest
        .fn()
        .mockResolvedValue({ data: mockData, error: null });
      const mockSelect = jest.fn().mockReturnThis();

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: jest.fn().mockReturnValue({
          order: mockOrder,
        }),
      });

      const result = await customDatesService.getAllCustomDateNames(mockUserId);

      expect(supabase.from).toHaveBeenCalledWith('deadline_custom_dates');
      expect(mockSelect).toHaveBeenCalledWith('name');
      expect(result).toEqual(['Date 1', 'Date 2']);
    });
  });

  describe('addCustomDate', () => {
    it('should add a custom date and track activity', async () => {
      const mockInput = { name: 'New Date', date: '2025-01-01' };
      const mockData = [{ id: mockCustomDateId, ...mockInput }];

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockLimit = jest
        .fn()
        .mockResolvedValue({ data: mockData, error: null });

      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        limit: mockLimit,
      });

      const result = await customDatesService.addCustomDate(
        mockUserId,
        mockDeadlineId,
        mockInput
      );

      expect(supabase.from).toHaveBeenCalledWith('deadline_custom_dates');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockCustomDateId,
          user_id: mockUserId,
          deadline_id: mockDeadlineId,
          name: mockInput.name,
          date: mockInput.date,
        })
      );
      expect(activityService.trackUserActivity).toHaveBeenCalledWith(
        'custom_date_created',
        expect.objectContaining({
          deadlineId: mockDeadlineId,
          customDateId: mockCustomDateId,
          name: mockInput.name,
        })
      );
      expect(result).toEqual(mockData[0]);
    });
  });

  describe('updateCustomDate', () => {
    it('should update a custom date and track activity', async () => {
      const mockUpdateData = { name: 'Updated Name' };
      const mockData = [{ id: mockCustomDateId, ...mockUpdateData }];

      const mockUpdate = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockLimit = jest
        .fn()
        .mockResolvedValue({ data: mockData, error: null });

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: mockSelect,
            limit: mockLimit,
          }),
        }),
        select: mockSelect,
        limit: mockLimit,
      });

      const result = await customDatesService.updateCustomDate(
        mockCustomDateId,
        mockUserId,
        mockUpdateData
      );

      expect(supabase.from).toHaveBeenCalledWith('deadline_custom_dates');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining(mockUpdateData)
      );
      expect(activityService.trackUserActivity).toHaveBeenCalledWith(
        'custom_date_updated',
        expect.objectContaining({
          customDateId: mockCustomDateId,
        })
      );
      expect(result).toEqual(mockData[0]);
    });
  });

  describe('deleteCustomDate', () => {
    it('should delete a custom date', async () => {
      const mockDelete = jest.fn().mockReturnThis();
      const mockEqOuter = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabaseFrom.mockReturnValue({
        delete: mockDelete,
        eq: mockEqOuter,
      });

      const result = await customDatesService.deleteCustomDate(
        mockCustomDateId,
        mockUserId
      );

      expect(supabase.from).toHaveBeenCalledWith('deadline_custom_dates');
      expect(mockDelete).toHaveBeenCalled();
      expect(activityService.trackUserActivity).toHaveBeenCalledWith(
        'custom_date_deleted',
        expect.objectContaining({
          customDateId: mockCustomDateId,
        })
      );
      expect(result).toEqual(mockCustomDateId);
    });
  });
});
