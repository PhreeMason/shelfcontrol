import {
  useAddDeadline,
  useCompleteDeadline,
  useDeleteDeadline,
  useGetDeadlines,
  useReactivateDeadline,
  useSetAsideDeadline,
  useUpdateDeadline,
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
  // Data
  deadlines: ReadingDeadlineWithProgress[];
  activeDeadlines: ReadingDeadlineWithProgress[];
  overdueDeadlines: ReadingDeadlineWithProgress[];
  completedDeadlines: ReadingDeadlineWithProgress[];
  isLoading: boolean;
  error: Error | null;

  // Pace data (merged from PaceProvider)
  userPaceData: UserPaceData;
  userListeningPaceData: UserListeningPaceData;

  // Actions
  addDeadline: (
    params: {
      deadlineDetails: Omit<ReadingDeadlineInsert, 'user_id'>;
      progressDetails: ReadingDeadlineProgressInsert;
      bookData?: { api_id: string; book_id?: string };
    },
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => void;
  updateDeadline: (
    params: {
      deadlineDetails: ReadingDeadlineInsert;
      progressDetails: ReadingDeadlineProgressInsert;
    },
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
  setAsideDeadline: (
    deadlineId: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => void;
  reactivateDeadline: (
    deadlineId: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => void;

  // Calculations for individual deadlines (updated with pace-based logic)
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
    // New pace-based fields
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

  // Pace functions (merged from PaceProvider)
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

  // Counts
  activeCount: number;
  overdueCount: number;

  // Progress calculations
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

// Single, clean DeadlineProvider that handles all deadline and pace logic
export const DeadlineProvider: React.FC<DeadlineProviderProps> = ({
  children,
}) => {
  const { data: deadlines = [], error, isLoading } = useGetDeadlines();
  const { mutate: addDeadlineMutation } = useAddDeadline();
  const { mutate: updateDeadlineMutation } = useUpdateDeadline();
  const { mutate: deleteDeadlineMutation } = useDeleteDeadline();
  const { mutate: completeDeadlineMutation } = useCompleteDeadline();
  const { mutate: setAsideDeadlineMutation } = useSetAsideDeadline();
  const { mutate: reactivateDeadlineMutation } = useReactivateDeadline();

  // Separate deadlines by active and overdue status
  const {
    active: activeDeadlines,
    overdue: overdueDeadlines,
    completed: completedDeadlines,
  } = separateDeadlines(deadlines);

  // Calculate pace data (merged from PaceProvider)
  const userPaceData = useMemo(() => {
    return calculateUserPace(activeDeadlines);
  }, [activeDeadlines]);

  const userListeningPaceData = useMemo(() => {
    return calculateUserListeningPace(activeDeadlines);
  }, [activeDeadlines]);

  // Pace calculation functions (merged from PaceProvider)
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

  const getUserListeningPaceReliability = (): boolean => {
    return userListeningPaceData.isReliable;
  };

  const getUserListeningPaceMethod = (): 'recent_data' | 'default_fallback' => {
    return userListeningPaceData.calculationMethod;
  };

  // Calculate units per day needed based on format (now using utility function)

  // Calculate progress as of the start of today (now using utility function)

  // Calculate how much progress was made today (now using utility function)

  // Format the units per day display (now using utility function)

  // Special formatting for DeadlineCard display (now using utility function)

  // Comprehensive calculations for a single deadline (enhanced with pace-based logic)
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

    // Check if deadline is completed or set aside
    const deadlineStatus = getDeadlineStatus(deadline);

    // For archived deadlines, don't calculate countdown-related metrics
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
      // Calculate normally for active deadlines
      daysLeft = calculateDaysLeft(deadline.deadline_date);
      const currentProgressAsOfStartOfDay =
        calculateProgressAsOfStartOfDay(deadline);
      unitsPerDay = calculateUnitsPerDay(
        deadline.total_quantity,
        currentProgressAsOfStartOfDay,
        daysLeft,
        deadline.format
      );

      // Get pace-based calculations
      paceData = getDeadlinePaceStatus(deadline);

      // Map pace status to urgency level and color
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

  const setAsideDeadline = (
    deadlineId: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => {
    setAsideDeadlineMutation(deadlineId, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (error: Error) => {
        console.error('Error setting aside deadline:', error);
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

  const value: DeadlineContextType = {
    // Data
    deadlines,
    activeDeadlines,
    overdueDeadlines,
    completedDeadlines,
    isLoading,
    error,

    // Pace data (merged from PaceProvider)
    userPaceData,
    userListeningPaceData,

    // Actions
    addDeadline,
    updateDeadline,
    deleteDeadline,
    completeDeadline,
    setAsideDeadline,
    reactivateDeadline,

    getDeadlineCalculations,

    formatUnitsPerDay,
    formatUnitsPerDayForDisplay,

    // Pace functions (merged from PaceProvider)
    getDeadlinePaceStatus,
    formatPaceForFormat,
    getUserPaceReliability,
    getUserPaceMethod,
    getUserListeningPaceReliability,
    getUserListeningPaceMethod,

    // Counts
    activeCount: activeDeadlines.length,
    overdueCount: overdueDeadlines.length,

    // Progress calculations
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
