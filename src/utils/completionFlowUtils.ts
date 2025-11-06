import { ReadingDeadlineWithProgress } from '@/types/deadline.types';

export const getCompletionFormSteps = (isDNF: boolean): string[] => {
  return isDNF
    ? ['Review Question', 'Review Setup']
    : ['Celebration', 'Review Question', 'Review Setup'];
};

export const getInitialStep = (isDNF: boolean): number => {
  return isDNF ? 2 : 1;
};

export const getTotalSteps = (isDNF: boolean): number => {
  return getCompletionFormSteps(isDNF).length;
};

export interface CompletionToastConfig {
  type: 'success' | 'error';
  text1: string;
  text2: string;
}

export const createCompletionSuccessToast = (
  isDNF: boolean,
  bookTitle: string
): CompletionToastConfig => ({
  type: 'success',
  text1: 'All done!',
  text2: isDNF
    ? `"${bookTitle}" moved to DNF`
    : `"${bookTitle}" marked as complete`,
});

export const createCompletionErrorToast = (
  error?: Error
): CompletionToastConfig => ({
  type: 'error',
  text1: 'Error',
  text2: error?.message || 'Failed to update book. Please try again.',
});

export interface StepComponentType {
  component: 'celebration' | 'reviewQuestion' | 'reviewForm' | null;
  step: number;
}

export const getCurrentStepComponent = (
  currentStep: number,
  isDNF: boolean,
  needsReview: boolean | null
): StepComponentType => {
  if (currentStep === 1 && !isDNF) {
    return { component: 'celebration', step: 1 };
  }

  if (currentStep === 2) {
    return { component: 'reviewQuestion', step: 2 };
  }

  if (currentStep === 3 && needsReview) {
    return { component: 'reviewForm', step: 3 };
  }

  return { component: null, step: currentStep };
};

export interface CompletionCallbacks {
  onSuccess: () => void;
  onError: (error: Error) => void;
}

export const createCompletionCallbacks = (
  isDNF: boolean,
  bookTitle: string,
  showToast: (config: CompletionToastConfig) => void,
  navigateToHome: () => void
): CompletionCallbacks => {
  return {
    onSuccess: () => {
      showToast(createCompletionSuccessToast(isDNF, bookTitle));
      navigateToHome();
    },
    onError: (error: Error) => {
      console.error('Error updating book status:', error);
      showToast(createCompletionErrorToast(error));
    },
  };
};

export const handleReviewQuestionResponse = (
  needsReview: boolean,
  setNeedsReview: (value: boolean) => void,
  setCurrentStep: (step: number) => void,
  handleDirectCompletion: () => void
): void => {
  setNeedsReview(needsReview);

  if (needsReview) {
    setCurrentStep(3);
  } else {
    handleDirectCompletion();
  }
};

export const shouldShowCelebration = (
  currentStep: number,
  isDNF: boolean
): boolean => {
  return currentStep === 1 && !isDNF;
};

export const shouldShowReviewQuestion = (currentStep: number): boolean => {
  return currentStep === 2;
};

export const shouldShowReviewForm = (
  currentStep: number,
  needsReview: boolean | null
): boolean => {
  return currentStep === 3 && needsReview === true;
};

export type CompletionStatus = 'complete' | 'did_not_finish';

export const getCompletionStatus = (isDNF: boolean): CompletionStatus => {
  return isDNF ? 'did_not_finish' : 'complete';
};

export const validateCompletionFlow = (
  deadline: ReadingDeadlineWithProgress | undefined
): { isValid: boolean; error?: string } => {
  if (!deadline) {
    return {
      isValid: false,
      error: 'Deadline not found',
    };
  }

  return { isValid: true };
};
