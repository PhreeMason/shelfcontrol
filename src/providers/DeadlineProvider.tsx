import {
  useAddDeadline,
  useCompleteDeadline,
  useDeleteDeadline,
  useDidNotFinishDeadline,
  useGetDeadlines,
  usePauseDeadline,
  useReactivateDeadline,
  useStartReadingDeadline,
  useUpdateDeadline,
  useUpdateDeadlineDate,
} from '@/hooks/useDeadlines';
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
import React, { createContext, ReactNode, useContext, useMemo } from 'react';

interface DeadlineContextType {
  deadlines: ReadingDeadlineWithProgress[];
  activeDeadlines: ReadingDeadlineWithProgress[];
  overdueDeadlines: ReadingDeadlineWithProgress[];
  completedDeadlines: ReadingDeadlineWithProgress[];
  pausedDeadlines: ReadingDeadlineWithProgress[];
  didNotFinishDeadlines: ReadingDeadlineWithProgress[];
  pendingDeadlines: ReadingDeadlineWithProgress[];
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
  pauseDeadline: (
    deadlineId: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => void;
  reactivateDeadline: (
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
  pausedCount: number;
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
  const { mutate: pauseDeadlineMutation } = usePauseDeadline();
  const { mutate: reactivateDeadlineMutation } = useReactivateDeadline();
  const { mutate: startReadingDeadlineMutation } = useStartReadingDeadline();
  const { mutate: didNotFinishDeadlineMutation } = useDidNotFinishDeadline();

  const {
    active: activeDeadlines,
    overdue: overdueDeadlines,
    completed: completedDeadlines,
    setAside: pausedDeadlines,
    didNotFinish: didNotFinishDeadlines,
    pending: pendingDeadlines,
  } = separateDeadlines(deadlines);

  const userPaceData = useMemo(() => {
    return calculateUserPace(deadlines);
  }, [deadlines]);

  const userListeningPaceData = useMemo(() => {
    return calculateUserListeningPace(deadlines);
  }, [deadlines]);

  const getDeadlinePaceStatus = (deadline: ReadingDeadlineWithProgress) => {
    return calculateDeadlinePaceStatus(
      deadline,
      userPaceData,
      userListeningPaceData
    );
  };

  const formatPaceForFormat = (
    pace: number,
    format: 'physical' | 'eBook' | 'audio'
  ): string => {
    return formatPaceDisplay(pace, format);
  };

  const getUserPaceReliability = (): boolean => {
    return userPaceData.isReliable;
  };

  const getUserPaceMethod = (): 'recent_data' | 'default_fallback' => {
    return userPaceData.calculationMethod;
  };

  // Calculate units per day needed based on format (now using utility function)

  // Calculate progress as of the start of today (now using utility function)

  // Calculate how much progress was made today (now using utility function)

  // Format the units per day display (now using utility function)

  // Special formatting for DeadlineCard display (now using utility function)

  // Comprehensive calculations for a single deadline (enhanced with pace-based logic)

  const getUserListeningPaceReliability = (): boolean => {
    return userListeningPaceData.isReliable;
  };

  const getUserListeningPaceMethod = (): 'recent_data' | 'default_fallback' => {
    return userListeningPaceData.calculationMethod;
  };
  const getDeadlineCalculations = (
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
  };

  const addDeadline = (
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
        onSuccess?.();
      },
      onError: (error: Error) => {
        console.error('Error adding deadline:', error);
        onError?.(error);
      },
    });
  };

  const updateDeadline = (
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
        onSuccess?.();
      },
      onError: (error: Error) => {
        console.error('Error updating deadline:', error);
        onError?.(error);
      },
    });
  };

  const updateDeadlineDate = (
    deadlineId: string,
    newDate: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => {
    updateDeadlineDateMutation(
      { deadlineId, newDate },
      {
        onSuccess: () => {
          onSuccess?.();
        },
        onError: (error: Error) => {
          console.error('Error updating deadline date:', error);
          onError?.(error);
        },
      }
    );
  };

  const deleteDeadline = (
    deadlineId: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => {
    deleteDeadlineMutation(deadlineId, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (error: Error) => {
        console.error('Error deleting deadline:', error);
        onError?.(error);
      },
    });
  };

  const completeDeadline = (
    deadlineId: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => {
    completeDeadlineMutation(deadlineId, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (error: Error) => {
        console.error('Error completing deadline:', error);
        onError?.(error);
      },
    });
  };

  const pauseDeadline = (
    deadlineId: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => {
    pauseDeadlineMutation(deadlineId, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (error: Error) => {
        console.error('Error pausing deadline:', error);
        onError?.(error);
      },
    });
  };

  const reactivateDeadline = (
    deadlineId: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => {
    reactivateDeadlineMutation(deadlineId, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (error: Error) => {
        console.error('Error reactivating deadline:', error);
        onError?.(error);
      },
    });
  };

  const startReadingDeadline = (
    deadlineId: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => {
    startReadingDeadlineMutation(deadlineId, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (error: Error) => {
        console.error('Error starting reading deadline:', error);
        onError?.(error);
      },
    });
  };

  const didNotFinishDeadline = (
    deadlineId: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => {
    didNotFinishDeadlineMutation(deadlineId, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (error: Error) => {
        console.error('Error marking deadline as did not finish:', error);
        onError?.(error);
      },
    });
  };

  const value: DeadlineContextType = {
    // Data
    deadlines,
    activeDeadlines,
    overdueDeadlines,
    completedDeadlines,
    pausedDeadlines,
    didNotFinishDeadlines,
    pendingDeadlines,
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
    pauseDeadline,
    reactivateDeadline,
    startReadingDeadline,
    didNotFinishDeadline,

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
    pausedCount: pausedDeadlines.length,
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
