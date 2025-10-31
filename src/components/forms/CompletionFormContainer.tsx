import CompletionFormStep1 from '@/components/forms/CompletionFormStep1';
import CompletionFormStep2 from '@/components/forms/CompletionFormStep2';
import CompletionFormStep3 from '@/components/forms/CompletionFormStep3';
import { ROUTES } from '@/constants/routes';
import {
  useCompleteDeadline,
  useDidNotFinishDeadline,
} from '@/hooks/useDeadlines';
import { analytics } from '@/lib/analytics/client';
import { useFormFlowTracking } from '@/hooks/analytics/useFormFlowTracking';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  createCompletionCallbacks,
  getCompletionStatus,
  handleReviewQuestionResponse,
  shouldShowCelebration,
  shouldShowReviewForm,
  shouldShowReviewQuestion,
} from '@/utils/completionFlowUtils';
import { router } from 'expo-router';
import React, { useState } from 'react';
import Toast from 'react-native-toast-message';

interface CompletionFormContainerProps {
  deadline: ReadingDeadlineWithProgress;
  isDNF?: boolean;
}

const CompletionFormContainer: React.FC<CompletionFormContainerProps> = ({
  deadline,
  isDNF = false,
}) => {
  const [currentStep, setCurrentStep] = useState(isDNF ? 2 : 1);
  const [needsReview, setNeedsReview] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { mutate: completeDeadline } = useCompleteDeadline();
  const { mutate: didNotFinishDeadline } = useDidNotFinishDeadline();

  useFormFlowTracking({
    flowType: 'completion',
    currentStep,
    stepNames: ['celebration', 'review_question', 'review_form'],
  });

  const handleCelebrationContinue = () => {
    setCurrentStep(2);
  };

  const showToast = (config: {
    type: 'success' | 'error';
    text1: string;
    text2: string;
  }) => {
    Toast.show(config);
  };

  const navigateToHome = () => {
    router.replace(ROUTES.HOME);
  };

  const handleDirectCompletion = () => {
    setIsProcessing(true);

    const callbacks = createCompletionCallbacks(
      isDNF,
      deadline.book_title || '',
      showToast,
      navigateToHome
    );

    const finalStatus = getCompletionStatus(isDNF);

    if (finalStatus === 'did_not_finish') {
      analytics.track('did_not_finish_selected', {
        format: deadline.format as 'physical' | 'eBook' | 'audio',
        book_title: deadline.book_title,
      });
    }

    const mutationCallbacks = {
      onSuccess: () => {
        setIsProcessing(false);
        callbacks.onSuccess();
      },
      onError: (error: any) => {
        setIsProcessing(false);
        callbacks.onError(error);
      },
    };

    if (finalStatus === 'did_not_finish') {
      didNotFinishDeadline(deadline.id, mutationCallbacks);
    } else {
      completeDeadline(
        {
          deadlineId: deadline.id,
          deadline: {
            total_quantity: deadline.total_quantity,
            progress: deadline.progress,
          },
        },
        mutationCallbacks
      );
    }
  };

  const handleReviewQuestionContinue = (needsReviewAnswer: boolean) => {
    handleReviewQuestionResponse(
      needsReviewAnswer,
      setNeedsReview,
      setCurrentStep,
      handleDirectCompletion
    );
  };

  const getStepComponent = () => {
    if (shouldShowCelebration(currentStep, isDNF)) {
      return (
        <CompletionFormStep1
          deadline={deadline}
          onContinue={handleCelebrationContinue}
        />
      );
    }

    if (shouldShowReviewQuestion(currentStep)) {
      return (
        <CompletionFormStep2
          deadline={deadline}
          onContinue={handleReviewQuestionContinue}
          isProcessing={isProcessing}
        />
      );
    }

    if (shouldShowReviewForm(currentStep, needsReview)) {
      return <CompletionFormStep3 deadline={deadline} isDNF={isDNF} />;
    }

    return null;
  };

  return <>{getStepComponent()}</>;
};

export default CompletionFormContainer;
