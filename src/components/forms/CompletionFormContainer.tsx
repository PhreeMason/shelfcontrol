import CompletionFormStep1 from '@/components/forms/CompletionFormStep1';
import CompletionFormStep2 from '@/components/forms/CompletionFormStep2';
import CompletionFormStep3 from '@/components/forms/CompletionFormStep3';
import { ROUTES } from '@/constants/routes';
import {
  useCompleteDeadline,
  useDidNotFinishDeadline,
} from '@/hooks/useDeadlines';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  createCompletionCallbacks,
  getCompletionStatus,
  handleReviewQuestionResponse,
  shouldShowCelebration,
  shouldShowReviewQuestion,
  shouldShowReviewForm,
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

  const { mutate: completeDeadline } = useCompleteDeadline();
  const { mutate: didNotFinishDeadline } = useDidNotFinishDeadline();

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
    const callbacks = createCompletionCallbacks(
      isDNF,
      deadline.book_title || '',
      showToast,
      navigateToHome
    );

    const finalStatus = getCompletionStatus(isDNF);
    const statusMutation =
      finalStatus === 'did_not_finish'
        ? didNotFinishDeadline
        : completeDeadline;

    statusMutation(deadline.id, {
      onSuccess: callbacks.onSuccess,
      onError: callbacks.onError,
    });
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
