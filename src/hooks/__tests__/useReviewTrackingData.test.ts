import { reviewTrackingService } from '@/services/reviewTracking.service';
import { useQuery } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';
import { useReviewTrackingData } from '../useReviewTrackingData';

jest.mock('@/services/reviewTracking.service');
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));
jest.mock('@/providers/AuthProvider', () => ({
  useAuth: jest.fn(() => ({
    session: { user: { id: 'user-123' } },
  })),
}));

const mockUseQuery = useQuery as jest.Mock;
const mockReviewTrackingService = reviewTrackingService as jest.Mocked<
  typeof reviewTrackingService
>;

describe('useReviewTrackingData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query configuration', () => {
    it('should configure query with correct key and function', () => {
      const deadlineId = 'rd-123';

      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderHook(() => useReviewTrackingData(deadlineId));

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['review_tracking', 'user-123', 'rd-123'],
        queryFn: expect.any(Function),
        staleTime: 300000,
        enabled: true,
      });
    });

    it('should include userId in queryKey', () => {
      const deadlineId = 'rd-123';

      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderHook(() => useReviewTrackingData(deadlineId));

      const call = mockUseQuery.mock.calls[0][0];
      expect(call.queryKey).toEqual(['review_tracking', 'user-123', 'rd-123']);
    });

    it('should set enabled to false when enabled prop is false', () => {
      const deadlineId = 'rd-123';

      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderHook(() => useReviewTrackingData(deadlineId, false));

      const call = mockUseQuery.mock.calls[0][0];
      expect(call.enabled).toBe(false);
    });

    it('should use 5 minute staleTime', () => {
      const deadlineId = 'rd-123';

      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderHook(() => useReviewTrackingData(deadlineId));

      const call = mockUseQuery.mock.calls[0][0];
      expect(call.staleTime).toBe(300000);
    });
  });

  describe('Query function execution', () => {
    it('should call reviewTrackingService.getReviewTrackingByDeadline', async () => {
      const deadlineId = 'rd-123';
      const mockData = {
        review_tracking: {
          id: 'rt-123',
          deadline_id: 'rd-123',
          review_due_date: '2025-10-20',
          needs_link_submission: true,
          all_reviews_complete: false,
        },
        platforms: [
          {
            id: 'rp-123',
            platform_name: 'NetGalley',
            posted: true,
            posted_date: '2025-10-15',
            review_url: 'https://netgalley.com/review/123',
          },
        ],
        completion_percentage: 50,
      };

      mockReviewTrackingService.getReviewTrackingByDeadline = jest
        .fn()
        .mockResolvedValue(mockData);

      let queryFn: any;
      mockUseQuery.mockImplementation(config => {
        queryFn = config.queryFn;
        return {
          data: mockData,
          isLoading: false,
          error: null,
          refetch: jest.fn(),
        };
      });

      renderHook(() => useReviewTrackingData(deadlineId));

      await queryFn();

      expect(
        mockReviewTrackingService.getReviewTrackingByDeadline
      ).toHaveBeenCalledWith('user-123', 'rd-123');
    });

    it('should call service with correct parameters from queryFn', async () => {
      const deadlineId = 'rd-123';
      const mockData = {
        review_tracking: {
          id: 'rt-123',
          deadline_id: 'rd-123',
          review_due_date: '2025-10-20',
          needs_link_submission: true,
          all_reviews_complete: false,
        },
        platforms: [],
        completion_percentage: 0,
      };

      mockReviewTrackingService.getReviewTrackingByDeadline = jest
        .fn()
        .mockResolvedValue(mockData);

      let queryFn: any;
      mockUseQuery.mockImplementation(config => {
        queryFn = config.queryFn;
        return {
          data: mockData,
          isLoading: false,
          error: null,
          refetch: jest.fn(),
        };
      });

      renderHook(() => useReviewTrackingData(deadlineId));

      const result = await queryFn();

      expect(
        mockReviewTrackingService.getReviewTrackingByDeadline
      ).toHaveBeenCalledWith('user-123', 'rd-123');
      expect(result).toEqual(mockData);
    });
  });

  describe('Data transformation', () => {
    it('should return review tracking data when available', () => {
      const mockData = {
        review_tracking: {
          id: 'rt-123',
          deadline_id: 'rd-123',
          review_due_date: '2025-10-20',
          needs_link_submission: true,
          all_reviews_complete: false,
        },
        platforms: [
          {
            id: 'rp-123',
            platform_name: 'NetGalley',
            posted: true,
            posted_date: '2025-10-15',
            review_url: 'https://netgalley.com/review/123',
          },
        ],
        completion_percentage: 50,
      };

      mockUseQuery.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useReviewTrackingData('rd-123'));

      expect(result.current.reviewTracking).toEqual(mockData.review_tracking);
      expect(result.current.platforms).toEqual(mockData.platforms);
      expect(result.current.completionPercentage).toBe(50);
    });

    it('should return null and empty arrays when data is null', () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useReviewTrackingData('rd-123'));

      expect(result.current.reviewTracking).toBeNull();
      expect(result.current.platforms).toEqual([]);
      expect(result.current.completionPercentage).toBe(0);
    });

    it('should return null when data is undefined', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useReviewTrackingData('rd-123'));

      expect(result.current.reviewTracking).toBeNull();
      expect(result.current.platforms).toEqual([]);
      expect(result.current.completionPercentage).toBe(0);
    });
  });

  describe('Loading and error states', () => {
    it('should return loading state', () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useReviewTrackingData('rd-123'));

      expect(result.current.isLoading).toBe(true);
    });

    it('should return error state', () => {
      const mockError = new Error('Failed to fetch');

      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: mockError,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useReviewTrackingData('rd-123'));

      expect(result.current.error).toBe(mockError);
    });

    it('should provide refetch function', () => {
      const mockRefetch = jest.fn();

      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useReviewTrackingData('rd-123'));

      expect(result.current.refetch).toBe(mockRefetch);
    });
  });
});
