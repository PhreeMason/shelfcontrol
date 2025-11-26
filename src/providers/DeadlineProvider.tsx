import {
  useAddDeadline,
  useCompleteDeadline,
  useDeleteDeadline,
  useDidNotFinishDeadline,
  useGetDeadlines,
  usePauseDeadline,
  useRejectDeadline,
  useResumeDeadline,
  useStartReadingDeadline,
  useUpdateDeadline,
  useUpdateDeadlineDate,
  useWithdrawDeadline,
} from '@/hooks/useDeadlines';
import { analytics } from '@/lib/analytics/client';
import type { DeadlineStatus as AnalyticsDeadlineStatus } from '@/lib/analytics/events';
import {
  ReadingDeadlineInsert,
  ReadingDeadlineProgressInsert,
  ReadingDeadlineWithProgress,
} from '@/types/deadline.types';
import {
  calculateRemaining,
  calculateTotalQuantity,
} from '@/utils/deadlineCalculations';
import {
  calculateDeadlinePaceStatus,
  calculateProgressAsOfStartOfDay,
  calculateProgressForToday,
  calculateUnitsPerDay,
  createArchivedPaceData,
  createDeadlineCalculationResult,
  DeadlineCalculationResult,
  formatUnitsPerDay,
  formatUnitsPerDayForDisplay,
  getDeadlineStatus,
  mapPaceColorToUrgencyColor,
  mapPaceToUrgency,
} from '@/utils/deadlineProviderUtils';
import {
  calculateDaysLeft,
  calculateProgress,
  calculateProgressPercentage,
  separateDeadlines,
} from '@/utils/deadlineUtils';
import {
  calculateUserListeningPace,
  calculateUserPace,
  formatPaceDisplay,
  PaceBasedStatus,
  UserListeningPaceData,
  UserPaceData,
} from '@/utils/paceCalculations';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from 'react';

interface DeadlineContextType {
  deadlines: ReadingDeadlineWithProgress[];
  activeDeadlines: ReadingDeadlineWithProgress[];
  overdueDeadlines: ReadingDeadlineWithProgress[];
  completedDeadlines: ReadingDeadlineWithProgress[];
  toReviewDeadlines: ReadingDeadlineWithProgress[];
  didNotFinishDeadlines: ReadingDeadlineWithProgress[];
  pendingDeadlines: ReadingDeadlineWithProgress[];
  pausedDeadlines: ReadingDeadlineWithProgress[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  isRefreshing: boolean;

  userPaceData: UserPaceData;
  userListeningPaceData: UserListeningPaceData;
  addDeadline: (
    params: {
      deadlineDetails: Omit<ReadingDeadlineInsert, 'user_id'>;
      progressDetails: ReadingDeadlineProgressInsert;
      status?: string;
      bookData?: { api_id: string; book_id?: string };
    },
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => void;
  updateDeadline: (
    params: {
      deadlineDetails: ReadingDeadlineInsert;
      progressDetails: ReadingDeadlineProgressInsert;
      status?: string;
    },
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => void;
  updateDeadlineDate: (
    deadlineId: string,
    newDate: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => void;
  deleteDeadline: (
    deadlineId: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => void;
  completeDeadline: (
    deadlineId: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => void;
  startReadingDeadline: (
    deadlineId: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => void;
  didNotFinishDeadline: (
    deadlineId: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => void;
  pauseDeadline: (
    deadlineId: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => void;
  resumeDeadline: (
    deadlineId: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => void;
  rejectDeadline: (
    deadlineId: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => void;
  withdrawDeadline: (
    deadlineId: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => void;
  getDeadlineCalculations: (deadline: ReadingDeadlineWithProgress) => {
    currentProgress: number;
    totalQuantity: number;
    remaining: number;
    progressPercentage: number;
    daysLeft: number;
    unitsPerDay: number;
    urgencyLevel: 'overdue' | 'urgent' | 'good' | 'approaching' | 'impossible';
    urgencyColor: string;
    statusMessage: string;
    readingEstimate: string;
    paceEstimate: string;
    unit: string;
    userPace: number;
    requiredPace: number;
    paceStatus: 'green' | 'orange' | 'red';
    paceMessage: string;
  };

  formatUnitsPerDay: (
    units: number,
    format: 'physical' | 'eBook' | 'audio'
  ) => string;
  formatUnitsPerDayForDisplay: (
    units: number,
    format: 'physical' | 'eBook' | 'audio',
    remaining: number,
    daysLeft: number
  ) => string;
  getDeadlinePaceStatus: (deadline: ReadingDeadlineWithProgress) => {
    userPace: number;
    requiredPace: number;
    status: PaceBasedStatus;
    statusMessage: string;
    paceDisplay: string;
    requiredPaceDisplay: string;
    daysLeft: number;
    progressPercentage: number;
  };
  formatPaceForFormat: (
    pace: number,
    format: 'physical' | 'eBook' | 'audio'
  ) => string;
  getUserPaceReliability: () => boolean;
  getUserPaceMethod: () => 'recent_data' | 'default_fallback';
  getUserListeningPaceReliability: () => boolean;
  getUserListeningPaceMethod: () => 'recent_data' | 'default_fallback';

  activeCount: number;
  overdueCount: number;
  toReviewCount: number;
  didNotFinishCount: number;
  calculateProgressAsOfStartOfDay: (
    deadline: ReadingDeadlineWithProgress
  ) => number;
  calculateProgressForToday: (deadline: ReadingDeadlineWithProgress) => number;
}

const DeadlineContext = createContext<DeadlineContextType | undefined>(
  undefined
);

interface DeadlineProviderProps {
  children: ReactNode;
}

export const DeadlineProvider: React.FC<DeadlineProviderProps> = ({
  children,
}) => {
  const {
    data: deadlines = [],
    error,
    isLoading,
    refetch,
    isFetching,
  } = useGetDeadlines();
  const { mutate: addDeadlineMutation } = useAddDeadline();
  const { mutate: updateDeadlineMutation } = useUpdateDeadline();
  const { mutate: updateDeadlineDateMutation } = useUpdateDeadlineDate();
  const { mutate: deleteDeadlineMutation } = useDeleteDeadline();
  const { mutate: completeDeadlineMutation } = useCompleteDeadline();
  const { mutate: startReadingDeadlineMutation } = useStartReadingDeadline();
  const { mutate: didNotFinishDeadlineMutation } = useDidNotFinishDeadline();
  const { mutate: pauseDeadlineMutation } = usePauseDeadline();
  const { mutate: resumeDeadlineMutation } = useResumeDeadline();
  const { mutate: rejectDeadlineMutation } = useRejectDeadline();
  const { mutate: withdrawDeadlineMutation } = useWithdrawDeadline();

  const {
    active: activeDeadlines,
    overdue: overdueDeadlines,
    completed: completedDeadlines,
    toReview: toReviewDeadlines,
    didNotFinish: didNotFinishDeadlines,
    pending: pendingDeadlines,
    paused: pausedDeadlines,
  } = useMemo(() => separateDeadlines(deadlines), [deadlines]);

  const userPaceData = useMemo(() => {
    return calculateUserPace(deadlines);
  }, [deadlines]);

  const userListeningPaceData = useMemo(() => {
    return calculateUserListeningPace(deadlines);
  }, [deadlines]);

  const getDeadlinePaceStatus = useCallback(
    (deadline: ReadingDeadlineWithProgress) => {
      return calculateDeadlinePaceStatus(
        deadline,
        userPaceData,
        userListeningPaceData
      );
    },
    [userPaceData, userListeningPaceData]
  );

  const formatPaceForFormat = useCallback(
    (pace: number, format: 'physical' | 'eBook' | 'audio'): string => {
      return formatPaceDisplay(pace, format);
    },
    []
  );

  const getUserPaceReliability = useCallback((): boolean => {
    return userPaceData.isReliable;
  }, [userPaceData]);

  const getUserPaceMethod = useCallback(():
    | 'recent_data'
    | 'default_fallback' => {
    return userPaceData.calculationMethod;
  }, [userPaceData]);

  const getUserListeningPaceReliability = useCallback((): boolean => {
    return userListeningPaceData.isReliable;
  }, [userListeningPaceData]);

  const getUserListeningPaceMethod = useCallback(():
    | 'recent_data'
    | 'default_fallback' => {
    return userListeningPaceData.calculationMethod;
  }, [userListeningPaceData]);

  const getDeadlineCalculations = useCallback(
    (deadline: ReadingDeadlineWithProgress): DeadlineCalculationResult => {
      const currentProgress = calculateProgress(deadline);
      const totalQuantity = calculateTotalQuantity(
        deadline.format,
        deadline.total_quantity
      );
      const remaining = calculateRemaining(
        deadline.format,
        deadline.total_quantity,
        undefined,
        currentProgress,
        undefined
      );
      const progressPercentage = calculateProgressPercentage(deadline);
      const deadlineStatus = getDeadlineStatus(deadline);
      let daysLeft,
        unitsPerDay,
        urgencyLevel,
        urgencyColor,
        statusMessage,
        paceData;

      if (deadlineStatus.isArchived) {
        daysLeft = 0;
        unitsPerDay = 0;
        urgencyLevel = 'good' as const;
        urgencyColor = '#10b981';
        statusMessage = deadlineStatus.isCompleted ? 'Completed!' : 'Paused';
        paceData = createArchivedPaceData(statusMessage);
      } else {
        daysLeft = calculateDaysLeft(deadline.deadline_date);
        const currentProgressAsOfStartOfDay =
          calculateProgressAsOfStartOfDay(deadline);
        unitsPerDay = calculateUnitsPerDay(
          deadline.total_quantity,
          currentProgressAsOfStartOfDay,
          daysLeft,
          deadline.format
        );

        paceData = getDeadlinePaceStatus(deadline);
        urgencyLevel = mapPaceToUrgency(paceData.status, daysLeft);
        urgencyColor = mapPaceColorToUrgencyColor(paceData.status.color);
        statusMessage = paceData.statusMessage;
      }

      return createDeadlineCalculationResult(
        deadline,
        { currentProgress, totalQuantity, daysLeft, progressPercentage },
        remaining,
        daysLeft,
        unitsPerDay,
        urgencyLevel,
        urgencyColor,
        statusMessage,
        paceData
      );
    },
    [getDeadlinePaceStatus]
  );

  const addDeadline = useCallback(
    (
      params: {
        deadlineDetails: Omit<ReadingDeadlineInsert, 'user_id'>;
        progressDetails: ReadingDeadlineProgressInsert;
        status?: string;
        bookData?: { api_id: string; book_id?: string };
        analyticsContext?: {
          book_source: 'search' | 'manual';
          creation_duration_seconds: number;
          total_steps: number;
        };
      },
      onSuccess?: () => void,
      onError?: (error: Error) => void
    ) => {
      addDeadlineMutation(params, {
        onSuccess: () => {
          analytics.track('deadline_created', {
            format: params.deadlineDetails.format,
            status: params.status as AnalyticsDeadlineStatus,
            type: params.deadlineDetails.deadline_type || 'Personal',
            book_source: params.analyticsContext?.book_source || 'manual',
            has_deadline_date: !!params.deadlineDetails.deadline_date,
            creation_duration_seconds:
              params.analyticsContext?.creation_duration_seconds || 0,
            total_steps: params.analyticsContext?.total_steps || 0,
          });
          onSuccess?.();
        },
        onError: (error: Error) => {
          console.error('Error adding deadline:', error);
          onError?.(error);
        },
      });
    },
    [addDeadlineMutation]
  );

  const updateDeadline = useCallback(
    (
      params: {
        deadlineDetails: ReadingDeadlineInsert;
        progressDetails: ReadingDeadlineProgressInsert;
        status?: string;
        bookData?: { api_id: string; book_id?: string };
      },
      onSuccess?: () => void,
      onError?: (error: Error) => void
    ) => {
      updateDeadlineMutation(params, {
        onSuccess: () => {
          analytics.track('deadline_updated', {
            format: params.deadlineDetails.format as
              | 'physical'
              | 'eBook'
              | 'audio',
          });
          onSuccess?.();
        },
        onError: (error: Error) => {
          console.error('Error updating deadline:', error);
          onError?.(error);
        },
      });
    },
    [updateDeadlineMutation]
  );

  const updateDeadlineDate = useCallback(
    (
      deadlineId: string,
      newDate: string,
      onSuccess?: () => void,
      onError?: (error: Error) => void
    ) => {
      updateDeadlineDateMutation(
        { deadlineId, newDate },
        {
          onSuccess: () => {
            analytics.track('deadline_date_updated');
            onSuccess?.();
          },
          onError: (error: Error) => {
            console.error('Error updating deadline date:', error);
            onError?.(error);
          },
        }
      );
    },
    [updateDeadlineDateMutation]
  );

  const deleteDeadline = useCallback(
    (
      deadlineId: string,
      onSuccess?: () => void,
      onError?: (error: Error) => void
    ) => {
      deleteDeadlineMutation(deadlineId, {
        onSuccess: () => {
          analytics.track('deadline_deleted');
          onSuccess?.();
        },
        onError: (error: Error) => {
          console.error('Error deleting deadline:', error);
          onError?.(error);
        },
      });
    },
    [deleteDeadlineMutation]
  );

  const completeDeadline = useCallback(
    (
      deadlineId: string,
      onSuccess?: () => void,
      onError?: (error: Error) => void
    ) => {
      completeDeadlineMutation(
        { deadlineId },
        {
          onSuccess: () => {
            analytics.track('deadline_completed');

            const newCompletedCount = completedDeadlines.length + 1;
            const milestones = [5, 10, 25, 50, 100, 250, 500, 1000];

            if (milestones.includes(newCompletedCount)) {
              analytics.track('engagement_milestone', {
                milestone_type: 'deadlines_completed',
                count: newCompletedCount,
              });
            }

            onSuccess?.();
          },
          onError: (error: Error) => {
            console.error('Error completing book:', error);
            onError?.(error);
          },
        }
      );
    },
    [completeDeadlineMutation, completedDeadlines.length]
  );

  const startReadingDeadline = useCallback(
    (
      deadlineId: string,
      onSuccess?: () => void,
      onError?: (error: Error) => void
    ) => {
      startReadingDeadlineMutation(deadlineId, {
        onSuccess: () => {
          analytics.track('deadline_started');
          onSuccess?.();
        },
        onError: (error: Error) => {
          console.error('Error starting reading book:', error);
          onError?.(error);
        },
      });
    },
    [startReadingDeadlineMutation]
  );

  const didNotFinishDeadline = useCallback(
    (
      deadlineId: string,
      onSuccess?: () => void,
      onError?: (error: Error) => void
    ) => {
      didNotFinishDeadlineMutation(deadlineId, {
        onSuccess: () => {
          analytics.track('deadline_marked_did_not_finish');
          onSuccess?.();
        },
        onError: (error: Error) => {
          console.error('Error marking book as did not finish:', error);
          onError?.(error);
        },
      });
    },
    [didNotFinishDeadlineMutation]
  );

  const pauseDeadline = useCallback(
    (
      deadlineId: string,
      onSuccess?: () => void,
      onError?: (error: Error) => void
    ) => {
      pauseDeadlineMutation(deadlineId, {
        onSuccess: () => {
          analytics.track('deadline_paused');
          onSuccess?.();
        },
        onError: (error: Error) => {
          console.error('Error pausing book:', error);
          onError?.(error);
        },
      });
    },
    [pauseDeadlineMutation]
  );

  const resumeDeadline = useCallback(
    (
      deadlineId: string,
      onSuccess?: () => void,
      onError?: (error: Error) => void
    ) => {
      resumeDeadlineMutation(deadlineId, {
        onSuccess: () => {
          analytics.track('deadline_resumed');
          onSuccess?.();
        },
        onError: (error: Error) => {
          console.error('Error resuming book:', error);
          onError?.(error);
        },
      });
    },
    [resumeDeadlineMutation]
  );

  const rejectDeadline = useCallback(
    (
      deadlineId: string,
      onSuccess?: () => void,
      onError?: (error: Error) => void
    ) => {
      rejectDeadlineMutation(deadlineId, {
        onSuccess: () => {
          analytics.track('deadline_rejected');
          onSuccess?.();
        },
        onError: (error: Error) => {
          console.error('Error rejecting book:', error);
          onError?.(error);
        },
      });
    },
    [rejectDeadlineMutation]
  );

  const withdrawDeadline = useCallback(
    (
      deadlineId: string,
      onSuccess?: () => void,
      onError?: (error: Error) => void
    ) => {
      withdrawDeadlineMutation(deadlineId, {
        onSuccess: () => {
          analytics.track('deadline_withdrew');
          onSuccess?.();
        },
        onError: (error: Error) => {
          console.error('Error withdrawing from book:', error);
          onError?.(error);
        },
      });
    },
    [withdrawDeadlineMutation]
  );

  const value: DeadlineContextType = {
    deadlines,
    activeDeadlines,
    overdueDeadlines,
    completedDeadlines,
    toReviewDeadlines,
    didNotFinishDeadlines,
    pendingDeadlines,
    pausedDeadlines,
    isLoading,
    error,
    refetch,
    isRefreshing: isFetching,

    userPaceData,
    userListeningPaceData,
    addDeadline,
    updateDeadline,
    updateDeadlineDate,
    deleteDeadline,
    completeDeadline,
    startReadingDeadline,
    didNotFinishDeadline,
    pauseDeadline,
    resumeDeadline,
    rejectDeadline,
    withdrawDeadline,

    getDeadlineCalculations,

    formatUnitsPerDay,
    formatUnitsPerDayForDisplay,

    getDeadlinePaceStatus,
    formatPaceForFormat,
    getUserPaceReliability,
    getUserPaceMethod,
    getUserListeningPaceReliability,
    getUserListeningPaceMethod,

    activeCount: activeDeadlines.length,
    overdueCount: overdueDeadlines.length,
    toReviewCount: toReviewDeadlines.length,
    didNotFinishCount: didNotFinishDeadlines.length,
    calculateProgressAsOfStartOfDay,
    calculateProgressForToday,
  };

  return (
    <DeadlineContext.Provider value={value}>
      {children}
    </DeadlineContext.Provider>
  );
};

export const useDeadlines = (): DeadlineContextType => {
  const context = useContext(DeadlineContext);
  if (context === undefined) {
    throw new Error('useDeadlines must be used within a DeadlineProvider');
  }
  return context;
};
