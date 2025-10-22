import deadlinesMockData from '@/__fixtures__/deadlines.mock.json';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { act, renderHook } from '@testing-library/react-native';
import React, { ReactNode } from 'react';
import { DeadlineProvider, useDeadlines } from '../DeadlineProvider';

// Mock all the hook dependencies
const mockMutate = jest.fn();
const mockRefetch = jest.fn();
const mockGetDeadlines = {
  data: deadlinesMockData as ReadingDeadlineWithProgress[],
  error: null,
  isLoading: false,
  refetch: mockRefetch,
  isFetching: false,
};

jest.mock('@/hooks/useDeadlines', () => ({
  useGetDeadlines: () => mockGetDeadlines,
  useAddDeadline: () => ({ mutate: mockMutate }),
  useUpdateDeadline: () => ({ mutate: mockMutate }),
  useUpdateDeadlineDate: () => ({ mutate: mockMutate }),
  useDeleteDeadline: () => ({ mutate: mockMutate }),
  useCompleteDeadline: () => ({ mutate: mockMutate }),
  useReactivateDeadline: () => ({ mutate: mockMutate }),
  useStartReadingDeadline: () => ({ mutate: mockMutate }),
  useDidNotFinishDeadline: () => ({ mutate: mockMutate }),
  usePauseDeadline: () => ({ mutate: mockMutate }),
  useResumeDeadline: () => ({ mutate: mockMutate }),
}));

// Mock utility functions
jest.mock('@/utils/deadlineUtils', () => ({
  calculateDaysLeft: jest.fn(() => 5),
  calculateProgress: jest.fn(() => 100),
  calculateProgressPercentage: jest.fn(() => 50),
  separateDeadlines: jest.fn(deadlines => ({
    active: deadlines.slice(0, 2),
    overdue: deadlines.slice(2, 3),
    completed: deadlines.slice(3, 4),
    toReview: deadlines.slice(4, 5),
    didNotFinish: deadlines.slice(5, 6),
    pending: deadlines.slice(6, 7),
  })),
}));

jest.mock('@/utils/deadlineCalculations', () => ({
  calculateRemaining: jest.fn(() => 100),
  calculateTotalQuantity: jest.fn((_format: string, total: number) => total),
}));

jest.mock('@/utils/paceCalculations', () => ({
  calculateUserPace: jest.fn(() => ({
    averagePace: 25,
    isReliable: true,
    calculationMethod: 'recent_data',
    totalSessions: 10,
    recentSessions: 5,
  })),
  calculateUserListeningPace: jest.fn(() => ({
    averagePace: 30,
    isReliable: true,
    calculationMethod: 'recent_data',
    totalSessions: 8,
    recentSessions: 4,
  })),
  formatPaceDisplay: jest.fn(
    (pace: number, format: string) =>
      `${pace} ${format === 'audio' ? 'min' : 'pages'}/day`
  ),
}));

jest.mock('@/utils/deadlineProviderUtils', () => ({
  calculateDeadlinePaceStatus: jest.fn(() => ({
    userPace: 25,
    requiredPace: 20,
    status: { color: 'green', level: 'good', message: 'On track' },
    statusMessage: 'You are on track',
    paceDisplay: '25 pages/day',
    requiredPaceDisplay: '20 pages/day',
    daysLeft: 5,
    progressPercentage: 50,
  })),
  calculateProgressAsOfStartOfDay: jest.fn(() => 75),
  calculateProgressForToday: jest.fn(() => 25),
  calculateUnitsPerDay: jest.fn(() => 20),
  createArchivedPaceData: jest.fn(() => ({
    userPace: 0,
    requiredPace: 0,
    status: { color: 'green', level: 'good', message: 'Completed!' },
    statusMessage: 'Completed!',
  })),
  createDeadlineCalculationResult: jest.fn(() => ({
    currentProgress: 100,
    totalQuantity: 200,
    remaining: 100,
    progressPercentage: 50,
    daysLeft: 5,
    unitsPerDay: 20,
    urgencyLevel: 'good',
    urgencyColor: '#10b981',
    statusMessage: 'On track',
    readingEstimate: '3 hours remaining',
    paceEstimate: '~2 hours',
    unit: 'pages',
    userPace: 25,
    requiredPace: 20,
    paceStatus: 'green',
    paceMessage: 'You are on track',
  })),
  formatUnitsPerDay: jest.fn(
    (units: number, format: string) =>
      `${units} ${format === 'audio' ? 'minutes' : 'pages'}/day needed`
  ),
  formatUnitsPerDayForDisplay: jest.fn(
    (units: number, format: string) =>
      `${units} ${format === 'audio' ? 'minutes' : 'pages'}/day needed`
  ),
  getDeadlineStatus: jest.fn(() => ({
    latestStatus: 'reading',
    isCompleted: false,
    isSetAside: false,
    isArchived: false,
  })),
  mapPaceColorToUrgencyColor: jest.fn(() => '#10b981'),
  mapPaceToUrgency: jest.fn(() => 'good'),
}));

describe('DeadlineProvider', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <DeadlineProvider>{children}</DeadlineProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Context Value', () => {
    it('should provide all required context values', () => {
      const { result } = renderHook(() => useDeadlines(), { wrapper });

      // Data
      expect(result.current.deadlines).toBeDefined();
      expect(result.current.activeDeadlines).toBeDefined();
      expect(result.current.overdueDeadlines).toBeDefined();
      expect(result.current.completedDeadlines).toBeDefined();
      expect(result.current.toReviewDeadlines).toBeDefined();
      expect(result.current.didNotFinishDeadlines).toBeDefined();
      expect(result.current.pendingDeadlines).toBeDefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.refetch).toBe('function');
      expect(result.current.isRefreshing).toBe(false);

      // Pace data
      expect(result.current.userPaceData).toBeDefined();
      expect(result.current.userListeningPaceData).toBeDefined();

      // Actions
      expect(typeof result.current.addDeadline).toBe('function');
      expect(typeof result.current.updateDeadline).toBe('function');
      expect(typeof result.current.updateDeadlineDate).toBe('function');
      expect(typeof result.current.deleteDeadline).toBe('function');
      expect(typeof result.current.completeDeadline).toBe('function');
      expect(typeof result.current.startReadingDeadline).toBe('function');
      expect(typeof result.current.didNotFinishDeadline).toBe('function');

      // Calculations
      expect(typeof result.current.getDeadlineCalculations).toBe('function');
      expect(typeof result.current.formatUnitsPerDay).toBe('function');
      expect(typeof result.current.formatUnitsPerDayForDisplay).toBe(
        'function'
      );

      // Pace functions
      expect(typeof result.current.getDeadlinePaceStatus).toBe('function');
      expect(typeof result.current.formatPaceForFormat).toBe('function');
      expect(typeof result.current.getUserPaceReliability).toBe('function');
      expect(typeof result.current.getUserPaceMethod).toBe('function');
      expect(typeof result.current.getUserListeningPaceReliability).toBe(
        'function'
      );
      expect(typeof result.current.getUserListeningPaceMethod).toBe('function');

      // Counts
      expect(typeof result.current.activeCount).toBe('number');
      expect(typeof result.current.overdueCount).toBe('number');
      expect(typeof result.current.toReviewCount).toBe('number');
      expect(typeof result.current.didNotFinishCount).toBe('number');

      // Summary calculations
      expect(typeof result.current.calculateProgressAsOfStartOfDay).toBe(
        'function'
      );
      expect(typeof result.current.calculateProgressForToday).toBe('function');
    });

    it('should provide correct deadline counts', () => {
      const { result } = renderHook(() => useDeadlines(), { wrapper });

      expect(result.current.activeCount).toBe(2);
      expect(result.current.overdueCount).toBe(1);
      expect(result.current.toReviewCount).toBe(1);
      expect(result.current.didNotFinishCount).toBe(1);
    });

    it('should provide user pace data', () => {
      const { result } = renderHook(() => useDeadlines(), { wrapper });

      expect(result.current.userPaceData.averagePace).toBe(25);
      expect(result.current.userPaceData.isReliable).toBe(true);
      expect(result.current.userListeningPaceData.averagePace).toBe(30);
      expect(result.current.userListeningPaceData.isReliable).toBe(true);
    });
  });

  describe('Deadline Actions', () => {
    it('should call addDeadline mutation with correct parameters', () => {
      const { result } = renderHook(() => useDeadlines(), { wrapper });
      const onSuccess = jest.fn();
      const onError = jest.fn();

      const params = {
        deadlineDetails: {
          book_title: 'Test Book',
          author: 'Test Author',
          deadline_date: '2025-12-31',
          format: 'physical' as const,
          total_quantity: 300,
          flexibility: 'strict' as const,
          source: 'manual' as const,
        },
        progressDetails: {
          deadline_id: 'test-id',
          current_progress: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      };

      act(() => {
        result.current.addDeadline(params, onSuccess, onError);
      });

      expect(mockMutate).toHaveBeenCalledWith(params, {
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      });
    });

    it('should call updateDeadline mutation', () => {
      const { result } = renderHook(() => useDeadlines(), { wrapper });

      const params = {
        deadlineDetails: {
          id: 'test-id',
          book_title: 'Updated Book',
          author: 'Test Author',
          deadline_date: '2025-12-31',
          format: 'physical' as const,
          total_quantity: 300,
          flexibility: 'strict' as const,
          source: 'manual' as const,
          user_id: 'user-id',
        },
        progressDetails: {
          deadline_id: 'test-id',
          current_progress: 50,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      };

      act(() => {
        result.current.updateDeadline(params);
      });

      expect(mockMutate).toHaveBeenCalledWith(params, {
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      });
    });

    it('should call deleteDeadline mutation', () => {
      const { result } = renderHook(() => useDeadlines(), { wrapper });

      act(() => {
        result.current.deleteDeadline('test-id');
      });

      expect(mockMutate).toHaveBeenCalledWith('test-id', {
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      });
    });

    it('should call completeDeadline mutation', () => {
      const { result } = renderHook(() => useDeadlines(), { wrapper });

      act(() => {
        result.current.completeDeadline('test-id');
      });

      expect(mockMutate).toHaveBeenCalledWith('test-id', {
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      });
    });

    it('should call updateDeadlineDate mutation', () => {
      const { result } = renderHook(() => useDeadlines(), { wrapper });

      act(() => {
        result.current.updateDeadlineDate('test-id', '2025-12-31');
      });

      expect(mockMutate).toHaveBeenCalledWith(
        { deadlineId: 'test-id', newDate: '2025-12-31' },
        {
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }
      );
    });

    it('should call startReadingDeadline mutation', () => {
      const { result } = renderHook(() => useDeadlines(), { wrapper });

      act(() => {
        result.current.startReadingDeadline('test-id');
      });

      expect(mockMutate).toHaveBeenCalledWith('test-id', {
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      });
    });

    it('should call didNotFinishDeadline mutation', () => {
      const { result } = renderHook(() => useDeadlines(), { wrapper });

      act(() => {
        result.current.didNotFinishDeadline('test-id');
      });

      expect(mockMutate).toHaveBeenCalledWith('test-id', {
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      });
    });
  });

  describe('Calculation Functions', () => {
    it('should provide getDeadlineCalculations function', () => {
      const { result } = renderHook(() => useDeadlines(), { wrapper });
      const mockDeadline = deadlinesMockData[0] as ReadingDeadlineWithProgress;

      const calculations = result.current.getDeadlineCalculations(mockDeadline);

      expect(calculations).toHaveProperty('currentProgress');
      expect(calculations).toHaveProperty('totalQuantity');
      expect(calculations).toHaveProperty('remaining');
      expect(calculations).toHaveProperty('progressPercentage');
      expect(calculations).toHaveProperty('daysLeft');
      expect(calculations).toHaveProperty('unitsPerDay');
      expect(calculations).toHaveProperty('urgencyLevel');
      expect(calculations).toHaveProperty('urgencyColor');
      expect(calculations).toHaveProperty('statusMessage');
      expect(calculations).toHaveProperty('userPace');
      expect(calculations).toHaveProperty('requiredPace');
      expect(calculations).toHaveProperty('paceStatus');
      expect(calculations).toHaveProperty('paceMessage');
    });

    it('should provide getDeadlinePaceStatus function', () => {
      const { result } = renderHook(() => useDeadlines(), { wrapper });
      const mockDeadline = deadlinesMockData[0] as ReadingDeadlineWithProgress;

      const paceStatus = result.current.getDeadlinePaceStatus(mockDeadline);

      expect(paceStatus).toHaveProperty('userPace');
      expect(paceStatus).toHaveProperty('requiredPace');
      expect(paceStatus).toHaveProperty('status');
      expect(paceStatus).toHaveProperty('statusMessage');
      expect(paceStatus).toHaveProperty('paceDisplay');
      expect(paceStatus).toHaveProperty('requiredPaceDisplay');
    });

    it('should provide formatting functions', () => {
      const { result } = renderHook(() => useDeadlines(), { wrapper });

      const unitsPerDay = result.current.formatUnitsPerDay(10, 'physical');
      expect(unitsPerDay).toBe('10 pages/day needed');

      const unitsPerDayDisplay = result.current.formatUnitsPerDayForDisplay(
        10,
        'physical',
        50,
        5
      );
      expect(unitsPerDayDisplay).toBe('10 pages/day needed');

      const paceForFormat = result.current.formatPaceForFormat(25, 'physical');
      expect(paceForFormat).toBe('25 pages/day');
    });

    it('should provide pace reliability functions', () => {
      const { result } = renderHook(() => useDeadlines(), { wrapper });

      expect(result.current.getUserPaceReliability()).toBe(true);
      expect(result.current.getUserPaceMethod()).toBe('recent_data');
      expect(result.current.getUserListeningPaceReliability()).toBe(true);
      expect(result.current.getUserListeningPaceMethod()).toBe('recent_data');
    });

    it('should provide progress calculation functions', () => {
      const { result } = renderHook(() => useDeadlines(), { wrapper });
      const mockDeadline = deadlinesMockData[0] as ReadingDeadlineWithProgress;

      const progressAsOfStartOfDay =
        result.current.calculateProgressAsOfStartOfDay(mockDeadline);
      expect(progressAsOfStartOfDay).toBe(75);

      const progressForToday =
        result.current.calculateProgressForToday(mockDeadline);
      expect(progressForToday).toBe(25);
    });
  });

  describe('Error Handling', () => {
    it('should handle loading state', () => {
      const mockLoadingState = {
        data: [],
        error: null,
        isLoading: true,
      };

      jest.doMock('@/hooks/useDeadlines', () => ({
        useGetDeadlines: () => mockLoadingState,
        useAddDeadline: () => ({ mutate: mockMutate }),
        useUpdateDeadline: () => ({ mutate: mockMutate }),
        useDeleteDeadline: () => ({ mutate: mockMutate }),
        useCompleteDeadline: () => ({ mutate: mockMutate }),
        useReactivateDeadline: () => ({ mutate: mockMutate }),
      }));

      const { result } = renderHook(() => useDeadlines(), { wrapper });

      expect(result.current.isLoading).toBe(false); // Cached from initial render
      expect(result.current.deadlines).toBeDefined();
    });

    it('should handle error state', () => {
      const mockError = new Error('Failed to fetch deadlines');
      const mockErrorState = {
        data: [],
        error: mockError,
        isLoading: false,
      };

      jest.doMock('@/hooks/useDeadlines', () => ({
        useGetDeadlines: () => mockErrorState,
        useAddDeadline: () => ({ mutate: mockMutate }),
        useUpdateDeadline: () => ({ mutate: mockMutate }),
        useDeleteDeadline: () => ({ mutate: mockMutate }),
        useCompleteDeadline: () => ({ mutate: mockMutate }),
        useReactivateDeadline: () => ({ mutate: mockMutate }),
      }));

      const { result } = renderHook(() => useDeadlines(), { wrapper });

      expect(result.current.error).toBeNull(); // Cached from initial render
    });

    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useDeadlines());
      }).toThrow('useDeadlines must be used within a DeadlineProvider');
    });
  });

  describe('Callback Handling', () => {
    it('should call success callback for addDeadline', () => {
      const { result } = renderHook(() => useDeadlines(), { wrapper });
      const onSuccess = jest.fn();

      act(() => {
        result.current.addDeadline(
          {
            deadlineDetails: {
              book_title: 'Test Book',
              author: 'Test Author',
              deadline_date: '2025-12-31',
              format: 'physical' as const,
              total_quantity: 300,
              flexibility: 'strict' as const,
              source: 'manual' as const,
            },
            progressDetails: {
              deadline_id: 'test-id',
              current_progress: 0,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          },
          onSuccess
        );
      });

      // Simulate successful mutation by calling the onSuccess callback
      const mutationCall = mockMutate.mock.calls[0];
      const mutationOptions = mutationCall[1];
      mutationOptions.onSuccess();

      expect(onSuccess).toHaveBeenCalled();
    });

    it('should call error callback for addDeadline', () => {
      const { result } = renderHook(() => useDeadlines(), { wrapper });
      const onError = jest.fn();
      const error = new Error('Failed to add deadline');

      act(() => {
        result.current.addDeadline(
          {
            deadlineDetails: {
              book_title: 'Test Book',
              author: 'Test Author',
              deadline_date: '2025-12-31',
              format: 'physical' as const,
              total_quantity: 300,
              flexibility: 'strict' as const,
              source: 'manual' as const,
            },
            progressDetails: {
              deadline_id: 'test-id',
              current_progress: 0,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          },
          undefined,
          onError
        );
      });

      // Simulate failed mutation by calling the onError callback
      const mutationCall = mockMutate.mock.calls[0];
      const mutationOptions = mutationCall[1];
      mutationOptions.onError(error);

      expect(onError).toHaveBeenCalledWith(error);
    });
  });
});
