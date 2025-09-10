import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { calculateTotalQuantity } from '@/utils/deadlineCalculations';
import { calculateDaysLeft, calculateProgress, calculateProgressPercentage } from '@/utils/deadlineUtils';
import {
  calculateRequiredPace,
  calculateUserListeningPace,
  calculateUserPace,
  formatPaceDisplay,
  getPaceBasedStatus,
  getPaceStatusMessage,
  PaceBasedStatus,
  UserListeningPaceData,
  UserPaceData
} from '@/utils/paceCalculations';
import React, { createContext, ReactNode, useContext, useMemo } from 'react';

interface PaceContextType {
  // User's overall pace data
  userPaceData: UserPaceData;
  userListeningPaceData: UserListeningPaceData;
  
  // Calculate pace-based status for a specific deadline
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
  
  // Utility functions
  formatPaceForFormat: (pace: number, format: 'physical' | 'ebook' | 'audio') => string;
  getUserPaceReliability: () => boolean;
  getUserPaceMethod: () => 'recent_data' | 'default_fallback';
  getUserListeningPaceReliability: () => boolean;
  getUserListeningPaceMethod: () => 'recent_data' | 'default_fallback';
}

const PaceContext = createContext<PaceContextType | undefined>(undefined);

interface PaceProviderProps {
  children: ReactNode;
  deadlines: ReadingDeadlineWithProgress[];
}

export const PaceProvider: React.FC<PaceProviderProps> = ({ children, deadlines }) => {
  // Calculate user's overall pace from all deadlines
  const userPaceData = useMemo(() => {
    return calculateUserPace(deadlines);
  }, [deadlines]);

  // Calculate user's listening pace from audio deadlines
  const userListeningPaceData = useMemo(() => {
    return calculateUserListeningPace(deadlines);
  }, [deadlines]);

  // Calculate pace-based status for a specific deadline
  const getDeadlinePaceStatus = (deadline: ReadingDeadlineWithProgress) => {
    const currentProgress = calculateProgress(deadline);
    const totalQuantity = calculateTotalQuantity(deadline.format, deadline.total_quantity);
    const daysLeft = calculateDaysLeft(deadline.deadline_date);
    const progressPercentage = calculateProgressPercentage(deadline);
    
    // Calculate required pace for this specific deadline
    const requiredPace = calculateRequiredPace(
      totalQuantity,
      currentProgress,
      daysLeft,
      deadline.format
    );
    
    // Use appropriate pace data based on format
    const relevantUserPaceData = deadline.format === 'audio' ? userListeningPaceData : userPaceData;
    const userPace = relevantUserPaceData.averagePace;
    
    // Get status based on user's pace vs required pace
    const status = getPaceBasedStatus(
      userPace,
      requiredPace,
      daysLeft,
      progressPercentage
    );
    
    // Generate detailed status message
    const statusMessage = getPaceStatusMessage(
      relevantUserPaceData,
      requiredPace,
      status,
      deadline.format
    );
    
    return {
      userPace,
      requiredPace,
      status,
      statusMessage,
      paceDisplay: formatPaceDisplay(userPace, deadline.format),
      requiredPaceDisplay: formatPaceDisplay(requiredPace, deadline.format),
      daysLeft,
      progressPercentage
    };
  };

  // Format pace for specific format
  const formatPaceForFormat = (pace: number, format: 'physical' | 'ebook' | 'audio'): string => {
    return formatPaceDisplay(pace, format);
  };

  // Get reliability of user pace calculation
  const getUserPaceReliability = (): boolean => {
    return userPaceData.isReliable;
  };

  // Get calculation method used
  const getUserPaceMethod = (): 'recent_data' | 'default_fallback' => {
    return userPaceData.calculationMethod;
  };

  // Get reliability of user listening pace calculation
  const getUserListeningPaceReliability = (): boolean => {
    return userListeningPaceData.isReliable;
  };

  // Get listening pace calculation method used
  const getUserListeningPaceMethod = (): 'recent_data' | 'default_fallback' => {
    return userListeningPaceData.calculationMethod;
  };

  const value: PaceContextType = {
    userPaceData,
    userListeningPaceData,
    getDeadlinePaceStatus,
    formatPaceForFormat,
    getUserPaceReliability,
    getUserPaceMethod,
    getUserListeningPaceReliability,
    getUserListeningPaceMethod
  };

  return (
    <PaceContext.Provider value={value}>
      {children}
    </PaceContext.Provider>
  );
};

export const usePace = (): PaceContextType => {
  const context = useContext(PaceContext);
  if (context === undefined) {
    throw new Error('usePace must be used within a PaceProvider');
  }
  return context;
};