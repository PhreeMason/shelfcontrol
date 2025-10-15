import { deadlinesService } from '@/services';
import { useAuth } from '@/providers/AuthProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useAddDeadline,
  useUpdateDeadline,
  useDeleteDeadline,
  useUpdateDeadlineProgress,
  useGetDeadlines,
  useCompleteDeadline,
  useReactivateDeadline,
  useGetDeadlineById,
  useDeleteFutureProgress,
} from '../useDeadlines';

jest.mock('@/services', () => ({
  deadlinesService: {
    addDeadline: jest.fn(),
    updateDeadline: jest.fn(),
    deleteDeadline: jest.fn(),
    updateDeadlineProgress: jest.fn(),
    getDeadlines: jest.fn(),
    completeDeadline: jest.fn(),
    updateDeadlineStatus: jest.fn(),
    getDeadlineById: jest.fn(),
    deleteFutureProgress: jest.fn(),
  },
}));

jest.mock('@/providers/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useMutation: jest.fn(),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;
const mockUseMutation = useMutation as jest.Mock;
const mockUseQuery = useQuery as jest.Mock;
const mockUseQueryClient = useQueryClient as jest.Mock;
const mockDeadlinesService = deadlinesService as jest.Mocked<
  typeof deadlinesService
>;

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

const mockSession = {
  user: { id: 'session-user-123' },
};

describe('useDeadlines hooks', () => {
  let mockMutate: jest.Mock;
  let mockInvalidateQueries: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockMutate = jest.fn();
    mockInvalidateQueries = jest.fn();

    mockUseAuth.mockReturnValue({
      profile: mockUser,
      session: mockSession,
    });

    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    });

    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      mutateAsync: jest.fn(),
      isLoading: false,
      isError: false,
      error: null,
      data: null,
      reset: jest.fn(),
    });

    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      refetch: jest.fn(),
    });
  });

  describe('useAddDeadline', () => {
    it('should configure mutation with correct parameters', () => {
      useAddDeadline();

      expect(mockUseMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          mutationKey: ['addDeadline'],
          mutationFn: expect.any(Function),
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });

    it('should call deadlinesService.addDeadline with correct parameters', async () => {
      const mockAddParams = {
        book_id: 'book-123',
        deadline_date: '2024-12-31',
        priority: 'medium' as const,
      };

      useAddDeadline();

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      await mutationConfig.mutationFn(mockAddParams);

      expect(mockDeadlinesService.addDeadline).toHaveBeenCalledWith(
        'session-user-123',
        mockAddParams
      );
    });

    it('should throw error when user not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        session: null,
      });

      useAddDeadline();

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      const mockParams = {
        book_id: 'book-123',
        deadline_date: '2024-12-31',
        priority: 'medium' as const,
      };

      await expect(mutationConfig.mutationFn(mockParams)).rejects.toThrow(
        'User not authenticated'
      );
    });

    it('should invalidate queries on success', () => {
      useAddDeadline();

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      mutationConfig.onSuccess();

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['deadlines', 'session-user-123'],
      });
    });
  });

  describe('useUpdateDeadline', () => {
    it('should configure mutation with correct parameters', () => {
      useUpdateDeadline();

      expect(mockUseMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          mutationKey: ['updateDeadline'],
          mutationFn: expect.any(Function),
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });

    it('should call deadlinesService.updateDeadline with correct parameters', async () => {
      const mockUpdateParams = {
        deadline_id: 'deadline-123',
        deadline_date: '2024-12-31',
        priority: 'high' as const,
      };

      useUpdateDeadline();

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      await mutationConfig.mutationFn(mockUpdateParams);

      expect(mockDeadlinesService.updateDeadline).toHaveBeenCalledWith(
        'session-user-123',
        mockUpdateParams
      );
    });

    it('should throw error when user not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        session: null,
      });

      useUpdateDeadline();

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      const mockParams = {
        deadline_id: 'deadline-123',
        deadline_date: '2024-12-31',
        priority: 'high' as const,
      };

      await expect(mutationConfig.mutationFn(mockParams)).rejects.toThrow(
        'User not authenticated'
      );
    });
  });

  describe('useDeleteDeadline', () => {
    it('should configure mutation with correct parameters', () => {
      useDeleteDeadline();

      expect(mockUseMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          mutationKey: ['deleteDeadline'],
          mutationFn: expect.any(Function),
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });

    it('should call deadlinesService.deleteDeadline with correct parameters', async () => {
      useDeleteDeadline();

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      await mutationConfig.mutationFn('deadline-123');

      expect(mockDeadlinesService.deleteDeadline).toHaveBeenCalledWith(
        'session-user-123',
        'deadline-123'
      );
    });

    it('should throw error when user not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        session: null,
      });

      useDeleteDeadline();

      const mutationConfig = mockUseMutation.mock.calls[0][0];

      await expect(mutationConfig.mutationFn('deadline-123')).rejects.toThrow(
        'User not authenticated'
      );
    });
  });

  describe('useUpdateDeadlineProgress', () => {
    it('should configure mutation with correct parameters', () => {
      useUpdateDeadlineProgress();

      expect(mockUseMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          mutationKey: ['updateDeadlineProgress'],
          mutationFn: expect.any(Function),
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });

    it('should call deadlinesService.updateDeadlineProgress with correct parameters', async () => {
      const mockProgressDetails = {
        deadlineId: 'deadline-123',
        currentProgress: 150,
        timeSpentReading: 30,
      };

      useUpdateDeadlineProgress();

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      await mutationConfig.mutationFn(mockProgressDetails);

      expect(mockDeadlinesService.updateDeadlineProgress).toHaveBeenCalledWith(
        mockProgressDetails
      );
    });

    it('should throw error when user not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        session: null,
      });

      useUpdateDeadlineProgress();

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      const mockProgressDetails = {
        deadlineId: 'deadline-123',
        currentProgress: 150,
      };

      await expect(
        mutationConfig.mutationFn(mockProgressDetails)
      ).rejects.toThrow('User not authenticated');
    });
  });

  describe('useGetDeadlines', () => {
    it('should configure query with correct parameters', () => {
      useGetDeadlines();

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['deadlines', 'session-user-123'],
          queryFn: expect.any(Function),
          enabled: true,
        })
      );
    });

    it('should call deadlinesService.getDeadlines with correct userId', async () => {
      useGetDeadlines();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      await queryConfig.queryFn();

      expect(mockDeadlinesService.getDeadlines).toHaveBeenCalledWith(
        'session-user-123'
      );
    });

    it('should use session user id when profile not available', () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        session: mockSession,
      });

      useGetDeadlines();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.queryKey).toEqual(['deadlines', 'session-user-123']);
    });

    it('should be disabled when user not authenticated', () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        session: null,
      });

      useGetDeadlines();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.enabled).toBe(false);
    });

    it('should throw error when user not authenticated in queryFn', async () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        session: null,
      });

      useGetDeadlines();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      await expect(queryConfig.queryFn()).rejects.toThrow(
        'User not authenticated'
      );
    });
  });

  describe('useCompleteDeadline', () => {
    it('should configure mutation with correct parameters', () => {
      useCompleteDeadline();

      expect(mockUseMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          mutationKey: ['completeDeadline'],
          mutationFn: expect.any(Function),
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });

    it('should call deadlinesService.completeDeadline with correct parameters', async () => {
      useCompleteDeadline();

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      await mutationConfig.mutationFn('deadline-123');

      expect(mockDeadlinesService.completeDeadline).toHaveBeenCalledWith(
        'session-user-123',
        'deadline-123'
      );
    });

    it('should invalidate queries with correct userId on success', () => {
      useCompleteDeadline();

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      mutationConfig.onSuccess();

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['deadlines', 'session-user-123'],
      });
    });

    it('should throw error when user not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        session: null,
      });

      useCompleteDeadline();

      const mutationConfig = mockUseMutation.mock.calls[0][0];

      await expect(mutationConfig.mutationFn('deadline-123')).rejects.toThrow(
        'User not authenticated'
      );
    });
  });

  describe('useReactivateDeadline', () => {
    it('should configure mutation with reading status', () => {
      useReactivateDeadline();

      expect(mockUseMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          mutationKey: ['updateDeadlineStatus'],
          mutationFn: expect.any(Function),
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });

    it('should call deadlinesService.updateDeadlineStatus with reading', async () => {
      useReactivateDeadline();

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      await mutationConfig.mutationFn('deadline-123');

      expect(mockDeadlinesService.updateDeadlineStatus).toHaveBeenCalledWith(
        'deadline-123',
        'reading'
      );
    });

    it('should invalidate queries with correct userId on success - FAILING TEST', () => {
      useReactivateDeadline();

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      mutationConfig.onSuccess();

      // This test should FAIL initially due to the query invalidation bug
      // useReactivateDeadline uses useUpdateDeadlineStatus which invalidates ['deadlines'] only
      // instead of ['deadlines', userId] like other hooks
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['deadlines', 'session-user-123'],
      });
    });
  });

  describe('useGetDeadlineById', () => {
    it('should configure query with correct parameters', () => {
      useGetDeadlineById('deadline-123');

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['deadline', 'session-user-123', 'deadline-123'],
          queryFn: expect.any(Function),
          enabled: true,
          refetchOnWindowFocus: false,
          staleTime: 1000 * 60 * 5,
        })
      );
    });

    it('should call deadlinesService.getDeadlineById with correct parameters', async () => {
      useGetDeadlineById('deadline-123');

      const queryConfig = mockUseQuery.mock.calls[0][0];
      await queryConfig.queryFn();

      expect(mockDeadlinesService.getDeadlineById).toHaveBeenCalledWith(
        'session-user-123',
        'deadline-123'
      );
    });

    it('should return null when deadlineId is undefined', async () => {
      useGetDeadlineById(undefined);

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const result = await queryConfig.queryFn();

      expect(result).toBeNull();
      expect(mockDeadlinesService.getDeadlineById).not.toHaveBeenCalled();
    });

    it('should be disabled when user not authenticated or deadlineId missing', () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        session: null,
      });

      useGetDeadlineById('deadline-123');

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.enabled).toBe(false);
    });

    it('should be disabled when deadlineId is undefined', () => {
      useGetDeadlineById(undefined);

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.enabled).toBe(false);
    });
  });

  describe('useDeleteFutureProgress', () => {
    it('should configure mutation with correct parameters', () => {
      useDeleteFutureProgress();

      expect(mockUseMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          mutationKey: ['deleteFutureProgress'],
          mutationFn: expect.any(Function),
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });

    it('should call deadlinesService.deleteFutureProgress with correct parameters', async () => {
      const params = { deadlineId: 'deadline-123', newProgress: 100 };

      useDeleteFutureProgress();

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      await mutationConfig.mutationFn(params);

      expect(mockDeadlinesService.deleteFutureProgress).toHaveBeenCalledWith(
        'deadline-123',
        100
      );
    });

    it('should throw error when user not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        session: null,
      });

      useDeleteFutureProgress();

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      const params = { deadlineId: 'deadline-123', newProgress: 100 };

      await expect(mutationConfig.mutationFn(params)).rejects.toThrow(
        'User not authenticated'
      );
    });
  });
});
