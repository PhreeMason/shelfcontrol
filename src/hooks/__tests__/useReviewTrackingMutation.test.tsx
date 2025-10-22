import { renderHook, act } from '@testing-library/react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useReviewTrackingMutation } from '../useReviewTrackingMutation';
import { useAuth } from '@/providers/AuthProvider';
import { reviewTrackingService } from '@/services/reviewTracking.service';
import Toast from 'react-native-toast-message';
import { QUERY_KEYS } from '@/constants/queryKeys';

jest.mock('@/providers/AuthProvider');
jest.mock('@/services/reviewTracking.service');
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;
const mockUseMutation = useMutation as jest.Mock;
const mockUseQueryClient = useQueryClient as jest.Mock;
const mockReviewTrackingService = reviewTrackingService as jest.Mocked<
  typeof reviewTrackingService
>;

describe('useReviewTrackingMutation', () => {
  const mockUserId = 'user-123';
  const mockDeadlineId = 'rd-123';
  let mockQueryClient: any;
  let mockMutate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockQueryClient = {
      cancelQueries: jest.fn(),
      getQueryData: jest.fn(),
      setQueryData: jest.fn(),
      invalidateQueries: jest.fn(),
    };

    mockUseQueryClient.mockReturnValue(mockQueryClient);

    mockUseAuth.mockReturnValue({
      session: { user: { id: mockUserId } },
    });

    mockMutate = jest.fn();
    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  describe('optimistic updates', () => {
    it('should preserve posted_date when platform is already posted', async () => {
      const existingPostedDate = '2025-01-15T10:00:00.000Z';
      const existingData = {
        review_tracking: {
          id: 'rt-123',
          deadline_id: mockDeadlineId,
          review_due_date: null,
          needs_link_submission: false,
          all_reviews_complete: false,
        },
        platforms: [
          {
            id: 'rp-123',
            platform_name: 'Goodreads',
            posted: true,
            posted_date: existingPostedDate,
            review_url: 'https://goodreads.com/review/123',
          },
        ],
        completion_percentage: 100,
      };

      mockQueryClient.getQueryData.mockReturnValue(existingData);

      renderHook(() => useReviewTrackingMutation(mockDeadlineId));

      // Get the onMutate function from the mutation configuration
      const mutationConfig = mockUseMutation.mock.calls[0][0];

      // Execute the onMutate function
      const result = await mutationConfig.onMutate({
        reviewTrackingId: 'rt-123',
        params: {
          platforms: [{ id: 'rp-123', posted: true }],
        },
      });

      // If the onMutate returned early, result will be undefined
      expect(result).toBeDefined();

      // Check that setQueryData was called with preserved date
      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        QUERY_KEYS.REVIEW_TRACKING.BY_DEADLINE(mockUserId, mockDeadlineId),
        expect.objectContaining({
          platforms: expect.arrayContaining([
            expect.objectContaining({
              id: 'rp-123',
              posted: true,
              posted_date: existingPostedDate, // Date should be preserved
            }),
          ]),
        })
      );
    });

    it('should set new posted_date when changing from not posted to posted', async () => {
      const existingData = {
        review_tracking: {
          id: 'rt-123',
          deadline_id: mockDeadlineId,
          review_due_date: null,
          needs_link_submission: false,
          all_reviews_complete: false,
        },
        platforms: [
          {
            id: 'rp-123',
            platform_name: 'Goodreads',
            posted: false,
            posted_date: null,
            review_url: null,
          },
        ],
        completion_percentage: 0,
      };

      mockQueryClient.getQueryData.mockReturnValue(existingData);

      const beforeUpdate = new Date();

      renderHook(() => useReviewTrackingMutation(mockDeadlineId));

      const mutationConfig = mockUseMutation.mock.calls[0][0];

      await mutationConfig.onMutate({
        reviewTrackingId: 'rt-123',
        params: {
          platforms: [{ id: 'rp-123', posted: true }],
        },
      });

      const afterUpdate = new Date();

      // Check that setQueryData was called
      const setQueryDataCall = mockQueryClient.setQueryData.mock.calls[0];
      const updatedData = setQueryDataCall[1];

      expect(updatedData.platforms[0].posted).toBe(true);
      expect(updatedData.platforms[0].posted_date).toBeDefined();

      // Verify the date is roughly current
      const postedDate = new Date(updatedData.platforms[0].posted_date);
      expect(postedDate.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime()
      );
      expect(postedDate.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
      expect(updatedData.completion_percentage).toBe(100);
    });

    it('should handle errors and revert optimistic updates', async () => {
      const existingData = {
        review_tracking: {
          id: 'rt-123',
          deadline_id: mockDeadlineId,
          review_due_date: null,
          needs_link_submission: false,
          all_reviews_complete: false,
        },
        platforms: [
          {
            id: 'rp-123',
            platform_name: 'Goodreads',
            posted: false,
            posted_date: null,
            review_url: null,
          },
        ],
        completion_percentage: 0,
      };

      mockQueryClient.getQueryData.mockReturnValue(existingData);

      renderHook(() => useReviewTrackingMutation(mockDeadlineId));

      const mutationConfig = mockUseMutation.mock.calls[0][0];

      // Execute onMutate to get the context
      const context = await mutationConfig.onMutate({
        reviewTrackingId: 'rt-123',
        params: {
          platforms: [{ id: 'rp-123', posted: true }],
        },
      });

      // Execute onError with the context
      const error = new Error('Update failed');
      act(() => {
        mutationConfig.onError(error, {}, context);
      });

      // Check that the data was reverted
      expect(mockQueryClient.setQueryData).toHaveBeenLastCalledWith(
        QUERY_KEYS.REVIEW_TRACKING.BY_DEADLINE(mockUserId, mockDeadlineId),
        existingData
      );

      // Check that Toast was shown
      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Failed to update platforms',
        text2: 'Update failed',
        position: 'top',
        visibilityTime: 3000,
      });
    });

    it('should update review_url while preserving posted_date', async () => {
      const existingPostedDate = '2025-01-15T10:00:00.000Z';
      const existingData = {
        review_tracking: {
          id: 'rt-123',
          deadline_id: mockDeadlineId,
          review_due_date: null,
          needs_link_submission: true,
          all_reviews_complete: false,
        },
        platforms: [
          {
            id: 'rp-123',
            platform_name: 'Goodreads',
            posted: true,
            posted_date: existingPostedDate,
            review_url: null,
          },
        ],
        completion_percentage: 100,
      };

      mockQueryClient.getQueryData.mockReturnValue(existingData);

      renderHook(() => useReviewTrackingMutation(mockDeadlineId));

      const mutationConfig = mockUseMutation.mock.calls[0][0];

      await mutationConfig.onMutate({
        reviewTrackingId: 'rt-123',
        params: {
          platforms: [
            {
              id: 'rp-123',
              posted: true,
              review_url: 'https://goodreads.com/review/456',
            },
          ],
        },
      });

      // Check that setQueryData was called with preserved date and updated URL
      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        QUERY_KEYS.REVIEW_TRACKING.BY_DEADLINE(mockUserId, mockDeadlineId),
        expect.objectContaining({
          platforms: expect.arrayContaining([
            expect.objectContaining({
              id: 'rp-123',
              posted: true,
              posted_date: existingPostedDate, // Date should be preserved
              review_url: 'https://goodreads.com/review/456', // URL should be updated
            }),
          ]),
        })
      );
    });
  });

  describe('authentication', () => {
    it('should throw error when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        session: null,
      });

      renderHook(() => useReviewTrackingMutation(mockDeadlineId));

      const mutationConfig = mockUseMutation.mock.calls[0][0];

      // Try to execute the mutation function
      const result = mutationConfig.mutationFn({
        reviewTrackingId: 'rt-123',
        params: {
          platforms: [{ id: 'rp-123', posted: true }],
        },
      });

      expect(result).rejects.toThrow('User not authenticated');
    });
  });

  describe('mutation function', () => {
    it('should call reviewTrackingService.updateReviewPlatforms with correct parameters', async () => {
      mockReviewTrackingService.updateReviewPlatforms.mockResolvedValue({
        completion_percentage: 100,
      });

      renderHook(() => useReviewTrackingMutation(mockDeadlineId));

      const mutationConfig = mockUseMutation.mock.calls[0][0];

      const params = {
        reviewTrackingId: 'rt-123',
        params: {
          platforms: [{ id: 'rp-123', posted: true }],
        },
      };

      await mutationConfig.mutationFn(params);

      expect(
        mockReviewTrackingService.updateReviewPlatforms
      ).toHaveBeenCalledWith(mockUserId, 'rt-123', {
        platforms: [{ id: 'rp-123', posted: true }],
      });
    });
  });

  describe('hook return values', () => {
    it('should return updatePlatforms function and isUpdating state', () => {
      mockMutate.mockImplementation(() => {});
      mockUseMutation.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      });

      const { result } = renderHook(() =>
        useReviewTrackingMutation(mockDeadlineId)
      );

      expect(result.current.updatePlatforms).toBe(mockMutate);
      expect(result.current.isUpdating).toBe(true);
    });
  });
});
