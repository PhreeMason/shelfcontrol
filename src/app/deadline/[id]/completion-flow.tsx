import CelebrationScreen from '@/components/features/completion/CelebrationScreen';
import DNFConfirmationDialog from '@/components/features/completion/DNFConfirmationDialog';
import ProgressCheckDialog from '@/components/features/completion/ProgressCheckDialog';
import ReviewQuestionScreen from '@/components/features/completion/ReviewQuestionScreen';
import { ROUTES } from '@/constants/routes';
import { useUpdateDeadlineProgress } from '@/hooks/useDeadlines';
import { useCompletionFlow } from '@/providers/CompletionFlowProvider';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';

export default function CompletionFlowPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { flowState, initializeFlow, updateStep, updateCompletionData, resetFlow } =
    useCompletionFlow();
  const { deadlines, completeDeadline, didNotFinishDeadline } = useDeadlines();
  const { mutate: updateProgress } = useUpdateDeadlineProgress();

  const [showProgressCheck, setShowProgressCheck] = useState(false);
  const [showDNFConfirm, setShowDNFConfirm] = useState(false);

  const deadline = deadlines.find(d => d.id === id);

  useEffect(() => {
    if (!deadline) {
      router.replace(ROUTES.HOME);
      return;
    }

    if (!flowState) {
      initializeFlow(deadline);
    }
  }, [deadline, flowState]);

  if (!flowState || !deadline) {
    return null;
  }

  const handleCelebrationContinue = () => {
    const { currentProgress, totalPages } = flowState.bookData;

    if (currentProgress < totalPages) {
      setShowProgressCheck(true);
    } else {
      updateStep('review_question');
    }
  };

  const handleMarkAllPages = () => {
    updateProgress(
      {
        deadlineId: deadline.id,
        currentProgress: flowState.bookData.totalPages,
      },
      {
        onSuccess: () => {
          setShowProgressCheck(false);
          updateCompletionData({ finishedAllPages: true });
          updateStep('review_question');
        },
        onError: error => {
          Toast.show({
            type: 'error',
            text1: 'Failed to update progress',
            text2: error.message || 'Please try again',
          });
        },
      }
    );
  };

  const handleDidNotFinish = () => {
    setShowProgressCheck(false);
    updateCompletionData({ finishedAllPages: false });
    setShowDNFConfirm(true);
  };

  const handleMoveToDNF = () => {
    setShowDNFConfirm(false);
    updateCompletionData({ isDNF: true });
    updateStep('review_question');
  };

  const handleDNFGoBack = () => {
    setShowDNFConfirm(false);
    updateStep('celebration');
  };

  const handleReviewQuestion = (needsReview: boolean) => {
    updateCompletionData({ needsReview });

    if (needsReview) {
      router.push(`/deadline/${id}/review-form`);
    } else {
      const finalStatus = flowState.completionData.isDNF
        ? 'did_not_finish'
        : 'complete';

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
              text2: `"${deadline.book_title}" marked as complete`,
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
    return (
      <>
        <CelebrationScreen onContinue={handleCelebrationContinue} />
        <ProgressCheckDialog
          visible={showProgressCheck}
          onMarkAllPages={handleMarkAllPages}
          onDidNotFinish={handleDidNotFinish}
        />
        <DNFConfirmationDialog
          visible={showDNFConfirm}
          onMoveToDNF={handleMoveToDNF}
          onGoBack={handleDNFGoBack}
        />
      </>
    );
  }

  if (flowState.currentStep === 'review_question') {
    return <ReviewQuestionScreen onContinue={handleReviewQuestion} />;
  }

  return null;
}
