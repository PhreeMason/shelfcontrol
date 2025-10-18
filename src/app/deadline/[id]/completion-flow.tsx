import CelebrationScreen from '@/components/features/completion/CelebrationScreen';
import ReviewQuestionScreen from '@/components/features/completion/ReviewQuestionScreen';
import { ROUTES } from '@/constants/routes';
import { useCompletionFlow } from '@/providers/CompletionFlowProvider';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import Toast from 'react-native-toast-message';

export default function CompletionFlowPage() {
  const { id, skipToReview } = useLocalSearchParams<{ id: string; skipToReview?: string }>();
  const { flowState, initializeFlow, updateStep, setNeedsReview, resetFlow } =
    useCompletionFlow();
  const { deadlines, completeDeadline, didNotFinishDeadline } = useDeadlines();

  const deadline = deadlines.find(d => d.id === id);

  useEffect(() => {
    if (!deadline) {
      router.replace(ROUTES.HOME);
      return;
    }

    if (!flowState) {
      const isDNF = skipToReview === 'true';
      initializeFlow(deadline, isDNF);
    }
  }, [deadline, flowState, initializeFlow, skipToReview]);

  if (!flowState || !deadline) {
    return null;
  }

  const handleCelebrationContinue = () => {
    updateStep('review_question');
  };

  const handleReviewQuestion = (needsReview: boolean) => {
    setNeedsReview(needsReview);

    if (needsReview) {
      router.push(`/deadline/${id}/review-form`);
    } else {
      const finalStatus = flowState.isDNF ? 'did_not_finish' : 'complete';

      if (finalStatus === 'did_not_finish') {
        didNotFinishDeadline(
          deadline.id,
          () => {
            Toast.show({
              type: 'success',
              text1: 'All done!',
              text2: `"${deadline.book_title}" moved to DNF`,
            });
            resetFlow();
            router.replace(ROUTES.HOME);
          },
          error => {
            Toast.show({
              type: 'error',
              text1: 'Failed to update status',
              text2: error.message || 'Please try again',
            });
          }
        );
      } else {
        completeDeadline(
          deadline.id,
          () => {
            Toast.show({
              type: 'success',
              text1: 'All done!',
              text2: `"${deadline.book_title}" moved to complete`,
            });
            resetFlow();
            router.replace(ROUTES.HOME);
          },
          error => {
            Toast.show({
              type: 'error',
              text1: 'Failed to complete deadline',
              text2: error.message || 'Please try again',
            });
          }
        );
      }
    }
  };

  if (flowState.currentStep === 'celebration') {
    return <CelebrationScreen onContinue={handleCelebrationContinue} />;
  }

  if (flowState.currentStep === 'review_question') {
    return <ReviewQuestionScreen onContinue={handleReviewQuestion} />;
  }

  return null;
}
