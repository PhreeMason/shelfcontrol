import { supabase } from '@/lib/supabase';
import { activityService } from '../activity.service';
import { customDatesService } from '../customDates.service';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn(),
            insert: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            eq: jest.fn(),
            order: jest.fn(),
        })),
        rpc: jest.fn(),
    },
}));

jest.mock('../activity.service', () => ({
    activityService: {
        trackUserActivity: jest.fn(),
    },
}));

describe('CustomDatesService', () => {
    const mockUserId = 'user-123';
    const mockDeadlineId = 'deadline-123';
    const mockCustomDateId = 'dcd_123';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getCustomDates', () => {
        it('should fetch custom dates for a deadline', async () => {
            const mockData = [{ id: mockCustomDateId, name: 'Test Date' }];
            const mockSelect = jest.fn().mockReturnThis();
            const mockEq = jest.fn().mockReturnThis();
            const mockOrder = jest.fn().mockResolvedValue({ data: mockData, error: null });

            (supabase.from as jest.Mock).mockReturnValue({
                select: mockSelect,
                eq: mockEq,
                order: mockOrder,
            });

            const result = await customDatesService.getCustomDates(mockUserId, mockDeadlineId);

            expect(supabase.from).toHaveBeenCalledWith('deadline_custom_dates');
            expect(mockSelect).toHaveBeenCalledWith('*');
            expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
            expect(mockEq).toHaveBeenCalledWith('deadline_id', mockDeadlineId);
            expect(mockOrder).toHaveBeenCalledWith('date', { ascending: true });
            expect(result).toEqual(mockData);
        });

        it('should throw error on fetch failure', async () => {
            const mockError = { message: 'Fetch failed' };
            const mockSelect = jest.fn().mockReturnThis();
            const mockEq = jest.fn().mockReturnThis();
            const mockOrder = jest.fn().mockResolvedValue({ data: null, error: mockError });

            (supabase.from as jest.Mock).mockReturnValue({
                select: mockSelect,
                eq: mockEq,
                order: mockOrder,
            });

            await expect(customDatesService.getCustomDates(mockUserId, mockDeadlineId))
                .rejects.toThrow('Fetch failed');
        });
    });

    describe('getAllCustomDateNames', () => {
        it('should fetch distinct custom date names', async () => {
            const mockData = [{ name: 'Date 1' }, { name: 'Date 2' }];
            const mockRpc = jest.fn().mockResolvedValue({ data: mockData, error: null });
            (supabase.rpc as jest.Mock) = mockRpc;

            const result = await customDatesService.getAllCustomDateNames(mockUserId);

            expect(supabase.rpc).toHaveBeenCalledWith('get_distinct_custom_date_names', {
                p_user_id: mockUserId,
            });
            expect(result).toEqual(['Date 1', 'Date 2']);
        });
    });

    describe('addCustomDate', () => {
        it('should add a custom date and track activity', async () => {
            const mockInput = { name: 'New Date', date: '2025-01-01' };
            const mockData = { id: mockCustomDateId, ...mockInput };

            const mockInsert = jest.fn().mockReturnThis();
            const mockSelect = jest.fn().mockReturnThis();
            const mockSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });

            (supabase.from as jest.Mock).mockReturnValue({
                insert: mockInsert,
                select: mockSelect,
                single: mockSingle,
            });

            const result = await customDatesService.addCustomDate(mockUserId, mockDeadlineId, mockInput);

            expect(supabase.from).toHaveBeenCalledWith('deadline_custom_dates');
            expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
                user_id: mockUserId,
                deadline_id: mockDeadlineId,
                name: mockInput.name,
                date: mockInput.date,
            }));
            expect(activityService.trackUserActivity).toHaveBeenCalledWith(expect.objectContaining({
                userId: mockUserId,
                activityType: 'custom_date',
                deadlineId: mockDeadlineId,
            }));
            expect(result).toEqual(mockData);
        });
    });

    describe('updateCustomDate', () => {
        it('should update a custom date and track activity', async () => {
            const mockUpdateData = { name: 'Updated Name' };
            const mockData = { id: mockCustomDateId, ...mockUpdateData };

            const mockUpdate = jest.fn().mockReturnThis();
            const mockEq = jest.fn().mockReturnThis();
            const mockSelect = jest.fn().mockReturnThis();
            const mockSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });

            (supabase.from as jest.Mock).mockReturnValue({
                update: mockUpdate,
                eq: mockEq,
                select: mockSelect,
                single: mockSingle,
            });

            const result = await customDatesService.updateCustomDate(mockCustomDateId, mockUserId, mockUpdateData);

            expect(supabase.from).toHaveBeenCalledWith('deadline_custom_dates');
            expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining(mockUpdateData));
            expect(mockEq).toHaveBeenCalledWith('id', mockCustomDateId);
            expect(activityService.trackUserActivity).toHaveBeenCalled();
            expect(result).toEqual(mockData);
        });
    });

    describe('deleteCustomDate', () => {
        it('should delete a custom date', async () => {
            const mockDelete = jest.fn().mockReturnThis();
            const mockEq = jest.fn().mockResolvedValue({ error: null });

            (supabase.from as jest.Mock).mockReturnValue({
                delete: mockDelete,
                eq: mockEq,
            });

            await customDatesService.deleteCustomDate(mockCustomDateId, mockUserId);

            expect(supabase.from).toHaveBeenCalledWith('deadline_custom_dates');
            expect(mockDelete).toHaveBeenCalled();
            expect(mockEq).toHaveBeenCalledWith('id', mockCustomDateId);
        });
    });
});
