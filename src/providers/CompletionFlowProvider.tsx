import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import React, { createContext, ReactNode, useContext, useState } from 'react';

export type CompletionFlowStep = 'celebration' | 'review_question';

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
  isDNF: boolean;
  needsReview: boolean | null;
}

interface CompletionFlowContextType {
  flowState: CompletionFlowState | null;
  initializeFlow: (deadline: ReadingDeadlineWithProgress, isDNF?: boolean) => void;
  updateStep: (step: CompletionFlowStep) => void;
  setNeedsReview: (needsReview: boolean) => void;
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

  const initializeFlow = (deadline: ReadingDeadlineWithProgress, isDNF = false) => {
    const totalPages = deadline.total_quantity || 0;
    const latestProgress =
      deadline.progress && deadline.progress.length > 0
        ? deadline.progress[deadline.progress.length - 1]
        : null;
    const currentProgress = latestProgress?.current_progress || 0;
    const firstProgress =
      deadline.progress && deadline.progress.length > 0 ? deadline.progress[0] : null;
    const startDate = firstProgress?.created_at || new Date().toISOString();

    setFlowState({
      currentStep: isDNF ? 'review_question' : 'celebration',
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
      isDNF,
      needsReview: null,
    });
  };

  const updateStep = (step: CompletionFlowStep) => {
    if (!flowState) return;
    setFlowState({ ...flowState, currentStep: step });
  };

  const setNeedsReview = (needsReview: boolean) => {
    if (!flowState) return;
    setFlowState({ ...flowState, needsReview });
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
        setNeedsReview,
        resetFlow,
      }}
    >
      {children}
    </CompletionFlowContext.Provider>
  );
};
