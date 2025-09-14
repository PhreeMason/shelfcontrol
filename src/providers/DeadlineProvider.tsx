import { useAddDeadline, useCompleteDeadline, useDeleteDeadline, useGetDeadlines, useReactivateDeadline, useSetAsideDeadline, useUpdateDeadline } from '@/hooks/useDeadlines';
import { PaceProvider, usePace } from '@/providers/PaceProvider';
import { ReadingDeadlineInsert, ReadingDeadlineProgressInsert, ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  calculateCurrentProgress,
  calculateRemaining,
  calculateTotalQuantity,
  getPaceEstimate,
  getReadingEstimate
} from '@/utils/deadlineCalculations';
import { calculateDaysLeft, calculateProgress, calculateProgressPercentage, getTotalReadingPagesForDay, getUnitForFormat, separateDeadlines } from '@/utils/deadlineUtils';
import dayjs from 'dayjs';
import React, { createContext, ReactNode, useContext } from 'react';

interface DeadlineContextType {
  // Data
  deadlines: ReadingDeadlineWithProgress[];
  activeDeadlines: ReadingDeadlineWithProgress[];
  overdueDeadlines: ReadingDeadlineWithProgress[];
  completedDeadlines: ReadingDeadlineWithProgress[];
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  addDeadline: (params: {
    deadlineDetails: Omit<ReadingDeadlineInsert, 'user_id'>;
    progressDetails: ReadingDeadlineProgressInsert;
    bookData?: { api_id: string; book_id?: string };
  }, onSuccess?: () => void, onError?: (error: Error) => void) => void;
  updateDeadline: (params: {
    deadlineDetails: ReadingDeadlineInsert;
    progressDetails: ReadingDeadlineProgressInsert;
  }, onSuccess?: () => void, onError?: (error: Error) => void) => void;
  deleteDeadline: (deadlineId: string, onSuccess?: () => void, onError?: (error: Error) => void) => void;
  completeDeadline: (deadlineId: string, onSuccess?: () => void, onError?: (error: Error) => void) => void;
  setAsideDeadline: (deadlineId: string, onSuccess?: () => void, onError?: (error: Error) => void) => void;
  reactivateDeadline: (deadlineId: string, onSuccess?: () => void, onError?: (error: Error) => void) => void;
  
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

  formatUnitsPerDay: (units: number, format: 'physical' | 'ebook' | 'audio') => string;
  formatUnitsPerDayForDisplay: (units: number, format: 'physical' | 'ebook' | 'audio', remaining: number, daysLeft: number) => string;
  
  // Counts
  activeCount: number;
  overdueCount: number;
  
  // Summary calculations
  getTotalReadingPagesForDay: () => string;
  
  // Progress calculations
  calculateProgressAsOfStartOfDay: (deadline: ReadingDeadlineWithProgress) => number;
  calculateProgressForToday: (deadline: ReadingDeadlineWithProgress) => number;
}

const DeadlineContext = createContext<DeadlineContextType | undefined>(undefined);

interface DeadlineProviderProps {
  children: ReactNode;
}

// Internal component that needs pace context
const DeadlineProviderInternal: React.FC<DeadlineProviderProps> = ({ children }) => {
  const { data: deadlines = [], error, isLoading } = useGetDeadlines();
  const { mutate: addDeadlineMutation } = useAddDeadline();
  const { mutate: updateDeadlineMutation } = useUpdateDeadline();
  const { mutate: deleteDeadlineMutation } = useDeleteDeadline();
  const { mutate: completeDeadlineMutation } = useCompleteDeadline();
  const { mutate: setAsideDeadlineMutation } = useSetAsideDeadline();
  const { mutate: reactivateDeadlineMutation } = useReactivateDeadline();
  
  // Access pace calculations
  const { getDeadlinePaceStatus } = usePace();
  
  // Separate deadlines by active and overdue status
  const { active: activeDeadlines, overdue: overdueDeadlines, completed: completedDeadlines } = separateDeadlines(deadlines);
  
  // Calculate units per day needed based on format
  const calculateUnitsPerDay = (
    totalQuantity: number, 
    currentProgress: number, 
    daysLeft: number, 
    format: 'physical' | 'ebook' | 'audio'
  ): number => {
    const total = calculateTotalQuantity(format, totalQuantity);
    const current = calculateCurrentProgress(format, currentProgress);
    const remaining = total - current;
    
    if (daysLeft <= 0) return remaining;
    return Math.ceil(remaining / daysLeft);
  };

    // Calculate progress as of the start of today (local time)
  const calculateProgressAsOfStartOfDay = (deadline: ReadingDeadlineWithProgress): number => {
    if (!deadline.progress || deadline.progress.length === 0) return 0;
    
    // Get the start of today in local time
    const startOfToday = dayjs().startOf('day').toDate();
    
    // Filter progress entries to only include those from before or at the start of today
    const progressBeforeToday = deadline.progress.filter(progress => {
      const progressDate = new Date(progress.updated_at || progress.created_at || '');
      return progressDate <= startOfToday;
    });
    
    if (progressBeforeToday.length === 0) return 0;
    
    // Find the most recent progress entry before or at the start of today
    const latestProgress = progressBeforeToday.reduce((latest, current) => {
      const currentDate = new Date(current.updated_at || current.created_at || '');
      const latestDate = new Date(latest.updated_at || latest.created_at || '');
      return currentDate > latestDate ? current : latest;
    });
    
    return latestProgress.current_progress || 0;
  };

  // Calculate how much progress was made today (since start of day)
  const calculateProgressForToday = (deadline: ReadingDeadlineWithProgress): number => {
    const currentProgress = calculateProgress(deadline);
    const progressAtStartOfDay = calculateProgressAsOfStartOfDay(deadline);
    
    // Return the difference (progress made today)
    return Math.max(0, currentProgress - progressAtStartOfDay);
  };

  // Format the units per day display based on format (original version for general use)
  const formatUnitsPerDay = (units: number, format: 'physical' | 'ebook' | 'audio'): string => {
    if (format === 'audio') {
      const hours = Math.floor(units / 60);
      const minutes = units % 60;
      if (hours > 0) {
        return minutes > 0 ? `${hours}h ${minutes}m/day needed` : `${hours}h/day needed`;
      }
      return `${minutes} minutes/day needed`;
    }
    const unit = getUnitForFormat(format);
    return `${units} ${unit}/day needed`;
  };

  // Special formatting for DeadlineCard display - handles < 1 unit/day cases
  const formatUnitsPerDayForDisplay = (units: number, format: 'physical' | 'ebook' | 'audio', remaining: number, daysLeft: number): string => {
    // Calculate the actual decimal value for precise formatting
    const actualUnitsPerDay = daysLeft > 0 ? remaining / daysLeft : units;
    
    if (format === 'audio') {
      // For audio: if less than 1 minute per day, show in week format when appropriate
      if (actualUnitsPerDay < 1 && daysLeft > 0) {
        const daysPerMinute = Math.round(1 / actualUnitsPerDay);
        
        // Convert to weeks if it makes sense
        if (daysPerMinute === 7) {
          return '1 minute/week';
        } else if (daysPerMinute === 14) {
          return '1 minute/2 weeks';
        } else if (daysPerMinute === 21) {
          return '1 minute/3 weeks';
        } else if (daysPerMinute === 28) {
          return '1 minute/month';
        } else if (daysPerMinute > 7 && daysPerMinute % 7 === 0) {
          const weeks = daysPerMinute / 7;
          return `1 minute/${weeks} weeks`;
        }
        
        return `1 minute every ${daysPerMinute} days`;
      }
      
      // For >= 1 minute/day, use standard formatting
      const hours = Math.floor(units / 60);
      const minutes = Math.round(units % 60);
      if (hours > 0) {
        return minutes > 0 ? `${hours}h ${minutes}m/day needed` : `${hours}h/day needed`;
      }
      return `${Math.round(units)} minutes/day needed`;
    }
    
    // For physical/ebook: if less than 1 page per day, show in week format when appropriate
    if (actualUnitsPerDay < 1 && daysLeft > 0) {
      const daysPerPage = Math.round(1 / actualUnitsPerDay);
      
      // Convert to weeks if it makes sense
      if (daysPerPage === 7) {
        return '1 page/week';
      } else if (daysPerPage === 14) {
        return '1 page/2 weeks';
      } else if (daysPerPage === 21) {
        return '1 page/3 weeks';
      } else if (daysPerPage === 28) {
        return '1 page/month';
      } else if (daysPerPage > 7 && daysPerPage % 7 === 0) {
        const weeks = daysPerPage / 7;
        return `1 page/${weeks} weeks`;
      }
      
      return `1 page every ${daysPerPage} days`;
    }
    
    // For >= 1 page/day, use standard formatting
    const unit = getUnitForFormat(format);
    return `${Math.round(units)} ${unit}/day needed`;
  };

  // Comprehensive calculations for a single deadline (enhanced with pace-based logic)
  const getDeadlineCalculations = (deadline: ReadingDeadlineWithProgress) => {
    const currentProgress = calculateProgress(deadline);
    const totalQuantity = calculateTotalQuantity(deadline.format, deadline.total_quantity);
    const remaining = calculateRemaining(
      deadline.format,
      deadline.total_quantity,
      undefined,
      currentProgress,
      undefined
    );
    const progressPercentage = calculateProgressPercentage(deadline);
    const unit = getUnitForFormat(deadline.format);

    // Check if deadline is completed or set aside
    const latestStatus = deadline.status && deadline.status.length > 0 
      ? deadline.status[deadline.status.length - 1].status 
      : 'reading';
    
    const isCompleted = latestStatus === 'complete';
    const isSetAside = latestStatus === 'set_aside';
    const isArchived = isCompleted || isSetAside;

    // For archived deadlines, don't calculate countdown-related metrics
    let daysLeft, unitsPerDay, urgencyLevel, urgencyColor, statusMessage, paceData;
    
    if (isArchived) {
      daysLeft = 0; // No countdown for archived deadlines
      unitsPerDay = 0; // No daily requirement
      urgencyLevel = 'good' as const; // Neutral status for archived deadlines
      urgencyColor = '#10b981'; // Green for completed/set aside
      statusMessage = isCompleted ? 'Completed!' : 'Set aside';
      paceData = {
        userPace: 0,
        requiredPace: 0,
        status: { color: 'green' as const, level: 'good' },
        statusMessage: statusMessage
      };
    } else {
      // Calculate normally for active deadlines
      daysLeft = calculateDaysLeft(deadline.deadline_date);
      const currentProgressAsOfStartOfDay = calculateProgressAsOfStartOfDay(deadline);
      unitsPerDay = calculateUnitsPerDay(deadline.total_quantity, currentProgressAsOfStartOfDay, daysLeft, deadline.format);
      
      // Get pace-based calculations
      paceData = getDeadlinePaceStatus(deadline);
      
      // Map pace status to urgency level for backward compatibility
      const paceToUrgencyMap: Record<string, 'overdue' | 'urgent' | 'good' | 'approaching' | 'impossible'> = {
        'overdue': 'overdue',
        'impossible': 'impossible',
        'good': 'good',
        'approaching': 'approaching'
      };
      
      urgencyLevel = paceToUrgencyMap[paceData.status.level] || (daysLeft <= 7 ? 'urgent' : 'good');
      
      // Map pace color to urgency color
      const paceColorToUrgencyColorMap: Record<string, string> = {
        'green': '#10b981',
        'orange': '#f59e0b',
        'red': '#ef4444'
      };
      
      urgencyColor = paceColorToUrgencyColorMap[paceData.status.color] || '#7bc598';
      statusMessage = paceData.statusMessage;
    }

    const readingEstimate = getReadingEstimate(deadline.format, remaining);
    const paceEstimate = getPaceEstimate(deadline.format, new Date(deadline.deadline_date), remaining);

    return {
      currentProgress,
      totalQuantity,
      remaining,
      progressPercentage,
      daysLeft,
      unitsPerDay,
      urgencyLevel,
      urgencyColor,
      statusMessage,
      readingEstimate,
      paceEstimate,
      unit,
      // New pace-based fields
      userPace: paceData.userPace,
      requiredPace: paceData.requiredPace,
      paceStatus: paceData.status.color,
      paceMessage: paceData.statusMessage
    };
  };

  const addDeadline = (params: {
    deadlineDetails: Omit<ReadingDeadlineInsert, 'user_id'>;
    progressDetails: ReadingDeadlineProgressInsert;
    bookData?: { api_id: string; book_id?: string };
  }, onSuccess?: () => void, onError?: (error: Error) => void) => {
    addDeadlineMutation(params, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (error) => {
        console.error("Error adding deadline:", error);
        onError?.(error);
      }
    });
  };

  const updateDeadline = (params: {
    deadlineDetails: ReadingDeadlineInsert;
    progressDetails: ReadingDeadlineProgressInsert;
    bookData?: { api_id: string; book_id?: string };
  }, onSuccess?: () => void, onError?: (error: Error) => void) => {
    updateDeadlineMutation(params, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (error) => {
        console.error("Error updating deadline:", error);
        onError?.(error);
      }
    });
  };

  const deleteDeadline = (deadlineId: string, onSuccess?: () => void, onError?: (error: Error) => void) => {
    deleteDeadlineMutation(deadlineId, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (error) => {
        console.error("Error deleting deadline:", error);
        onError?.(error);
      }
    });
  };

  const completeDeadline = (deadlineId: string, onSuccess?: () => void, onError?: (error: Error) => void) => {
    completeDeadlineMutation(deadlineId, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (error) => {
        console.error("Error completing deadline:", error);
        onError?.(error);
      }
    });
  };

  const setAsideDeadline = (deadlineId: string, onSuccess?: () => void, onError?: (error: Error) => void) => {
    setAsideDeadlineMutation(deadlineId, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (error) => {
        console.error("Error setting aside deadline:", error);
        onError?.(error);
      }
    });
  };

  const reactivateDeadline = (deadlineId: string, onSuccess?: () => void, onError?: (error: Error) => void) => {
    reactivateDeadlineMutation(deadlineId, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (error) => {
        console.error("Error reactivating deadline:", error);
        onError?.(error);
      }
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
    
    // Counts
    activeCount: activeDeadlines.length,
    overdueCount: overdueDeadlines.length,
    
    // Summary calculations
    getTotalReadingPagesForDay: () => {
      return getTotalReadingPagesForDay(activeDeadlines, getDeadlineCalculations);
    },
    
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

// Main DeadlineProvider that wraps both pace and deadline logic
export const DeadlineProvider: React.FC<DeadlineProviderProps> = ({ children }) => {
  const { data: deadlines = [] } = useGetDeadlines();
  const { active: activeDeadlines } = separateDeadlines(deadlines);
  
  return (
    <PaceProvider deadlines={activeDeadlines}>
      <DeadlineProviderInternal>
        {children}
      </DeadlineProviderInternal>
    </PaceProvider>
  );
};

export const useDeadlines = (): DeadlineContextType => {
  const context = useContext(DeadlineContext);
  if (context === undefined) {
    throw new Error('useDeadlines must be used within a DeadlineProvider');
  }
  return context;
}; 