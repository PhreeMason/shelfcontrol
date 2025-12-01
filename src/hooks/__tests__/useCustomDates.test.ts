import { customDatesService } from '@/services/customDates.service';
import { useQuery } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';
import { useGetAllCustomDateNames, useGetCustomDates } from '../useCustomDates';

// Mock service
jest.mock('@/services/customDates.service', () => ({
    customDatesService: {
        getCustomDates: jest.fn(),
        getAllCustomDateNames: jest.fn(),
    },
}));

// Mock react-query
jest.mock('@tanstack/react-query', () => ({
    ...jest.requireActual('@tanstack/react-query'),
    useQuery: jest.fn(),
    useMutation: jest.fn(() => ({
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
    })),
    useQueryClient: jest.fn(() => ({
        invalidateQueries: jest.fn(),
    })),
}));

describe('useCustomDates Hooks', () => {
    const mockUserId = 'user-123';
    const mockDeadlineId = 'deadline-123';
    const mockUseQuery = useQuery as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        // Default mock implementation for useQuery
        mockUseQuery.mockImplementation(({ queryFn }) => {
            return {
                data: undefined,
                isLoading: false,
                isSuccess: false,
                refetch: jest.fn(),
            };
        });
    });

    describe('useGetCustomDates', () => {
        it('should configure query correctly', async () => {
            const mockData = [{ id: '1', name: 'Test', date: '2025-01-01' }];
            (customDatesService.getCustomDates as jest.Mock).mockResolvedValue(mockData);

            renderHook(() => useGetCustomDates(mockDeadlineId));

            expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({
                queryKey: ['custom_dates', 'deadline', mockDeadlineId],
                enabled: true,
            }));
        });
    });

    describe('useGetAllCustomDateNames', () => {
        it('should configure query correctly', async () => {
            const mockData = ['Name 1', 'Name 2'];
            (customDatesService.getAllCustomDateNames as jest.Mock).mockResolvedValue(mockData);

            renderHook(() => useGetAllCustomDateNames());

            expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({
                queryKey: ['custom_dates', 'names'],
            }));
        });
    });
});
