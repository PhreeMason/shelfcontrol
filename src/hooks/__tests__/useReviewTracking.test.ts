import { useAuth } from '@/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { useReviewTracking } from '../useReviewTracking';
import { ReviewTrackingResponse } from '@/services/reviewTracking.service';
import { renderHook } from '@testing-library/react-native';

jest.mock('@/services/reviewTracking.service', () => ({
  reviewTrackingService: {
    getReviewTrackingByDeadline: jest.fn(),
  },
}));

jest.mock('@/providers/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

const mockUseQuery = useQuery as jest.Mock;
const mockUseAuth = useAuth as jest.Mock;

describe('useReviewTracking', () => {
  const mockUserId = 'user-123';
  const mockDeadlineId = 'deadline-456';
  const mockSession = {
    user: { id: mockUserId },
    access_token: 'token',
    refresh_token: 'refresh',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    token_type: 'bearer',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ session: mockSession });
  });

  it('should return review data when tracking exists', () => {
    const mockReviewData: ReviewTrackingResponse = {
      review_tracking: {
        id: 'rt-123',
        deadline_id: mockDeadlineId,
        review_due_date: '2025-10-20',
        needs_link_submission: true,
        all_reviews_complete: false,
      },
      platforms: [
        {
          id: 'rp-1',
          platform_name: 'Goodreads',
          posted: true,
          posted_date: '2025-10-15',
          review_url: 'https://goodreads.com/review/1',
        },
        {
          id: 'rp-2',
          platform_name: 'NetGalley',
          posted: false,
          posted_date: null,
          review_url: null,
        },
        {
          id: 'rp-3',
          platform_name: 'Amazon',
          posted: false,
          posted_date: null,
          review_url: null,
        },
      ],
      completion_percentage: 33,
    };

    mockUseQuery.mockReturnValue({
      data: mockReviewData,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useReviewTracking(mockDeadlineId, true));

    expect(result.current.reviewDueDate).toBe('2025-10-20');
    expect(result.current.unpostedCount).toBe(2);
    expect(result.current.totalPlatformCount).toBe(3);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return defaults when no tracking data exists', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useReviewTracking(mockDeadlineId, true));

    expect(result.current.reviewDueDate).toBe(null);
    expect(result.current.unpostedCount).toBe(0);
    expect(result.current.totalPlatformCount).toBe(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return zero unposted when all platforms are posted', () => {
    const mockReviewData: ReviewTrackingResponse = {
      review_tracking: {
        id: 'rt-123',
        deadline_id: mockDeadlineId,
        review_due_date: '2025-10-20',
        needs_link_submission: true,
        all_reviews_complete: true,
      },
      platforms: [
        {
          id: 'rp-1',
          platform_name: 'Goodreads',
          posted: true,
          posted_date: '2025-10-15',
          review_url: 'https://goodreads.com/review/1',
        },
        {
          id: 'rp-2',
          platform_name: 'NetGalley',
          posted: true,
          posted_date: '2025-10-16',
          review_url: 'https://netgalley.com/review/1',
        },
      ],
      completion_percentage: 100,
    };

    mockUseQuery.mockReturnValue({
      data: mockReviewData,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useReviewTracking(mockDeadlineId, true));

    expect(result.current.unpostedCount).toBe(0);
    expect(result.current.totalPlatformCount).toBe(2);
  });

  it('should return isLoading true when query is loading', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() => useReviewTracking(mockDeadlineId, true));

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle review tracking without due date', () => {
    const mockReviewData: ReviewTrackingResponse = {
      review_tracking: {
        id: 'rt-123',
        deadline_id: mockDeadlineId,
        review_due_date: null,
        needs_link_submission: false,
        all_reviews_complete: false,
      },
      platforms: [
        {
          id: 'rp-1',
          platform_name: 'Goodreads',
          posted: false,
          posted_date: null,
          review_url: null,
        },
      ],
      completion_percentage: 0,
    };

    mockUseQuery.mockReturnValue({
      data: mockReviewData,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useReviewTracking(mockDeadlineId, true));

    expect(result.current.reviewDueDate).toBe(null);
    expect(result.current.unpostedCount).toBe(1);
    expect(result.current.totalPlatformCount).toBe(1);
  });

  it('should not fetch when enabled is false', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    renderHook(() => useReviewTracking(mockDeadlineId, false));

    const callArgs = mockUseQuery.mock.calls[0][0];
    expect(callArgs.enabled).toBe(false);
  });

  it('should not fetch when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ session: null });

    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    renderHook(() => useReviewTracking(mockDeadlineId, true));

    const callArgs = mockUseQuery.mock.calls[0][0];
    expect(callArgs.enabled).toBe(false);
  });
});
