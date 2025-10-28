import CompletionFormStep1 from '@/components/forms/CompletionFormStep1';
import CompletionFormStep2 from '@/components/forms/CompletionFormStep2';
import CompletionFormStep3 from '@/components/forms/CompletionFormStep3';
import { ROUTES } from '@/constants/routes';
import {
  useCompleteDeadline,
  useDidNotFinishDeadline,
} from '@/hooks/useDeadlines';
import { dayjs } from '@/lib/dayjs';
import { posthog } from '@/lib/posthog';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  createCompletionCallbacks,
  getCompletionStatus,
  handleReviewQuestionResponse,
  shouldShowCelebration,
  shouldShowReviewForm,
  shouldShowReviewQuestion,
} from '@/utils/completionFlowUtils';
import { normalizeServerDateStartOfDay } from '@/utils/dateNormalization';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
  const mountTimeRef = useRef(Date.now());
  const hasCompletedRef = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { mutate: completeDeadline } = useCompleteDeadline();
  const { mutate: didNotFinishDeadline } = useDidNotFinishDeadline();

  useEffect(() => {
    const createdDate = normalizeServerDateStartOfDay(deadline.created_at);
    const daysToComplete = dayjs().diff(createdDate, 'day');

    posthog.capture('completion_flow_started', {
      format: deadline.format,
      status: deadline.status || 'unknown',
      days_to_complete: daysToComplete,
      is_dnf: isDNF,
    });

    return () => {
      if (!hasCompletedRef.current) {
        const timeSpent = Math.round((Date.now() - mountTimeRef.current) / 1000);
        posthog.capture('completion_flow_abandoned', {
          last_step: currentStep,
          time_spent: timeSpent,
        });
      }
    };
  }, []);

  useEffect(() => {
    const stepNames = ['celebration', 'review_question', 'review_form'];
    const stepName = stepNames[currentStep - 1] || 'unknown';

    posthog.capture('completion_step_viewed', {
      step_number: currentStep,
      step_name: stepName,
    });
  }, [currentStep]);

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
      posthog.capture('did_not_finish_selected', {
        format: deadline.format,
        book_title: deadline.book_title,
      });
    }

    const mutationCallbacks = {
      onSuccess: () => {
        hasCompletedRef.current = true;
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
