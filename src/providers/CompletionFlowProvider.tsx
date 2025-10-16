import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import React, { createContext, ReactNode, useContext, useState } from 'react';

export type CompletionFlowStep =
  | 'celebration'
  | 'progress_check'
  | 'dnf_confirm'
  | 'review_question'
  | 'review_form'
  | 'complete';

export interface ReviewPlatform {
  name: string;
  posted: boolean;
  postedDate: string | null;
  reviewUrl: string | null;
}

export interface CompletionFlowState {
  currentStep: CompletionFlowStep;
  deadlineId: string;
  bookData: {
    title: string;
    author: string;
    coverUrl: string;
    totalPages: number;
    currentProgress: number;
    startDate: string;
    source: string;
    bookId: string;
  };
  completionData: {
    finishedAllPages: boolean | null;
    needsReview: boolean | null;
    isDNF: boolean;
  };
  reviewData: {
    reviewDueDate: string | null;
    platforms: ReviewPlatform[];
    needsLinkSubmission: boolean;
    reviewNotes: string;
  };
}

interface CompletionFlowContextType {
  flowState: CompletionFlowState | null;
  initializeFlow: (deadline: ReadingDeadlineWithProgress) => void;
  updateStep: (step: CompletionFlowStep) => void;
  updateCompletionData: (data: Partial<CompletionFlowState['completionData']>) => void;
  updateReviewData: (data: Partial<CompletionFlowState['reviewData']>) => void;
  resetFlow: () => void;
}

const CompletionFlowContext = createContext<CompletionFlowContextType | undefined>(
  undefined
);

export const useCompletionFlow = () => {
  const context = useContext(CompletionFlowContext);
  if (!context) {
    throw new Error('useCompletionFlow must be used within CompletionFlowProvider');
  }
  return context;
};

interface CompletionFlowProviderProps {
  children: ReactNode;
}

export const CompletionFlowProvider: React.FC<CompletionFlowProviderProps> = ({
  children,
}) => {
  const [flowState, setFlowState] = useState<CompletionFlowState | null>(null);

  const initializeFlow = (deadline: ReadingDeadlineWithProgress) => {
    const totalPages = deadline.total_quantity || 0;
    const latestProgress = deadline.progress?.[0];
    const currentProgress = latestProgress?.current_progress || 0;
    const startDate = latestProgress?.created_at || new Date().toISOString();

    setFlowState({
      currentStep: 'celebration',
      deadlineId: deadline.id,
      bookData: {
        title: deadline.book_title,
        author: deadline.author || 'Unknown Author',
        coverUrl: '',
        totalPages,
        currentProgress,
        startDate,
        source: deadline.source || 'Personal',
        bookId: deadline.book_id || '',
      },
      completionData: {
        finishedAllPages: null,
        needsReview: null,
        isDNF: false,
      },
      reviewData: {
        reviewDueDate: null,
        platforms: [],
        needsLinkSubmission: false,
        reviewNotes: '',
      },
    });
  };

  const updateStep = (step: CompletionFlowStep) => {
    if (!flowState) return;
    setFlowState({ ...flowState, currentStep: step });
  };

  const updateCompletionData = (
    data: Partial<CompletionFlowState['completionData']>
  ) => {
    if (!flowState) return;
    setFlowState({
      ...flowState,
      completionData: { ...flowState.completionData, ...data },
    });
  };

  const updateReviewData = (data: Partial<CompletionFlowState['reviewData']>) => {
    if (!flowState) return;
    setFlowState({
      ...flowState,
      reviewData: { ...flowState.reviewData, ...data },
    });
  };

  const resetFlow = () => {
    setFlowState(null);
  };

  return (
    <CompletionFlowContext.Provider
      value={{
        flowState,
        initializeFlow,
        updateStep,
        updateCompletionData,
        updateReviewData,
        resetFlow,
      }}
    >
      {children}
    </CompletionFlowContext.Provider>
  );
};
