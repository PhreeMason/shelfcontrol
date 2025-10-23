import {
  useAddDeadline,
  useCompleteDeadline,
  useDeleteDeadline,
  useDidNotFinishDeadline,
  useGetDeadlines,
  usePauseDeadline,
  useResumeDeadline,
  useStartReadingDeadline,
  useUpdateDeadline,
  useUpdateDeadlineDate,
} from '@/hooks/useDeadlines';
import { posthog } from '@/lib/posthog';
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
import React, { createContext, ReactNode, useCallback, useContext, useMemo } from 'react';

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

  const getDeadlinePaceStatus = useCallback((deadline: ReadingDeadlineWithProgress) => {
    return calculateDeadlinePaceStatus(
      deadline,
      userPaceData,
      userListeningPaceData
    );
  }, [userPaceData, userListeningPaceData]);

  const formatPaceForFormat = useCallback((
    pace: number,
    format: 'physical' | 'eBook' | 'audio'
  ): string => {
    return formatPaceDisplay(pace, format);
  }, []);

  const getUserPaceReliability = useCallback((): boolean => {
    return userPaceData.isReliable;
  }, [userPaceData]);

  const getUserPaceMethod = useCallback((): 'recent_data' | 'default_fallback' => {
    return userPaceData.calculationMethod;
  }, [userPaceData]);

  const getUserListeningPaceReliability = useCallback((): boolean => {
    return userListeningPaceData.isReliable;
  }, [userListeningPaceData]);

  const getUserListeningPaceMethod = useCallback((): 'recent_data' | 'default_fallback' => {
    return userListeningPaceData.calculationMethod;
  }, [userListeningPaceData]);

  const getDeadlineCalculations = useCallback((
    deadline: ReadingDeadlineWithProgress
  ): DeadlineCalculationResult => {
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
      statusMessage = deadlineStatus.isCompleted ? 'Completed!' : 'Set aside';
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
  }, [getDeadlinePaceStatus]);

  const addDeadline = useCallback((
    params: {
      deadlineDetails: Omit<ReadingDeadlineInsert, 'user_id'>;
      progressDetails: ReadingDeadlineProgressInsert;
      status?: string;
      bookData?: { api_id: string; book_id?: string };
    },
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => {
    addDeadlineMutation(params, {
      onSuccess: () => {
        posthog.capture('deadline created', {
          format: params.deadlineDetails.format,
          status: params.status || 'active',
          source: params.deadlineDetails.source || 'manual',
        });
        onSuccess?.();
      },
      onError: (error: Error) => {
        console.error('Error adding deadline:', error);
        onError?.(error);
      },
    });
  }, [addDeadlineMutation]);

  const updateDeadline = useCallback((
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
        posthog.capture('deadline updated', {
          format: params.deadlineDetails.format,
        });
        onSuccess?.();
      },
      onError: (error: Error) => {
        console.error('Error updating deadline:', error);
        onError?.(error);
      },
    });
  }, [updateDeadlineMutation]);

  const updateDeadlineDate = useCallback((
    deadlineId: string,
    newDate: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => {
    updateDeadlineDateMutation(
      { deadlineId, newDate },
      {
        onSuccess: () => {
          posthog.capture('deadline date updated');
          onSuccess?.();
        },
        onError: (error: Error) => {
          console.error('Error updating deadline date:', error);
          onError?.(error);
        },
      }
    );
  }, [updateDeadlineDateMutation]);

  const deleteDeadline = useCallback((
    deadlineId: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => {
    deleteDeadlineMutation(deadlineId, {
      onSuccess: () => {
        posthog.capture('deadline deleted');
        onSuccess?.();
      },
      onError: (error: Error) => {
        console.error('Error deleting deadline:', error);
        onError?.(error);
      },
    });
  }, [deleteDeadlineMutation]);

  const completeDeadline = useCallback((
    deadlineId: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => {
    completeDeadlineMutation(deadlineId, {
      onSuccess: () => {
        posthog.capture('deadline completed');
        onSuccess?.();
      },
      onError: (error: Error) => {
        console.error('Error completing deadline:', error);
        onError?.(error);
      },
    });
  }, [completeDeadlineMutation]);

  const startReadingDeadline = useCallback((
    deadlineId: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => {
    startReadingDeadlineMutation(deadlineId, {
      onSuccess: () => {
        posthog.capture('deadline started');
        onSuccess?.();
      },
      onError: (error: Error) => {
        console.error('Error starting reading deadline:', error);
        onError?.(error);
      },
    });
  }, [startReadingDeadlineMutation]);

  const didNotFinishDeadline = useCallback((
    deadlineId: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => {
    didNotFinishDeadlineMutation(deadlineId, {
      onSuccess: () => {
        posthog.capture('deadline marked did not finish');
        onSuccess?.();
      },
      onError: (error: Error) => {
        console.error('Error marking deadline as did not finish:', error);
        onError?.(error);
      },
    });
  }, [didNotFinishDeadlineMutation]);

  const pauseDeadline = useCallback((
    deadlineId: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => {
    pauseDeadlineMutation(deadlineId, {
      onSuccess: () => {
        posthog.capture('deadline paused');
        onSuccess?.();
      },
      onError: (error: Error) => {
        console.error('Error pausing deadline:', error);
        onError?.(error);
      },
    });
  }, [pauseDeadlineMutation]);

  const resumeDeadline = useCallback((
    deadlineId: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => {
    resumeDeadlineMutation(deadlineId, {
      onSuccess: () => {
        posthog.capture('deadline resumed');
        onSuccess?.();
      },
      onError: (error: Error) => {
        console.error('Error resuming deadline:', error);
        onError?.(error);
      },
    });
  }, [resumeDeadlineMutation]);

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
