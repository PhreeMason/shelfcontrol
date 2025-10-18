import ProgressBar from '@/components/progress/ProgressBar';
import ProgressHeader from '@/components/progress/ProgressHeader';
import ProgressInput from '@/components/progress/ProgressInput';
import ProgressStats from '@/components/progress/ProgressStats';
import QuickActionButtons from '@/components/progress/QuickActionButtons';
import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import {
  useDeleteFutureProgress,
  useUpdateDeadlineProgress,
} from '@/hooks/useDeadlines';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { createProgressUpdateSchema } from '@/utils/progressUpdateSchema';
import {
  calculateNewProgress,
  formatBackwardProgressWarning,
  formatCompletionMessage,
  formatProgressUpdateMessage,
  getErrorToastMessage,
  hasProgressChanged,
  isBookComplete,
  shouldShowBackwardProgressWarning,
} from '@/utils/progressUpdateUtils';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

const ReadingProgressUpdate = ({
  deadline,
  timeSpentReading,
  onProgressSubmitted,
}: {
  deadline: ReadingDeadlineWithProgress;
  timeSpentReading?: number;
  onProgressSubmitted?: () => void;
}) => {
  const { getDeadlineCalculations } = useDeadlines();
  const calculations = getDeadlineCalculations(deadline);
  const {
    urgencyLevel,
    currentProgress,
    totalQuantity,
    remaining,
    progressPercentage,
  } = calculations;

  const progressSchema = createProgressUpdateSchema(
    totalQuantity,
    deadline.format
  );
  const updateProgressMutation = useUpdateDeadlineProgress();
  const deleteFutureProgressMutation = useDeleteFutureProgress();

  const { control, handleSubmit, setValue, getValues } = useForm({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      currentProgress: currentProgress,
    },
    mode: 'onSubmit',
  });

  const showCompletionDialog = useCallback(
    (newProgress: number, bookTitle: string) => {
      const message = formatCompletionMessage(
        deadline.format,
        newProgress,
        bookTitle
      );
      Alert.alert('Book Complete! 🎉', message, [
        {
          text: 'Not Yet',
          style: 'cancel',
          onPress: () => onProgressSubmitted?.(),
        },
        {
          text: "I'm done reading",
          style: 'default',
          onPress: () => router.push(`/deadline/${deadline.id}/completion-flow`),
        },
      ]);
    },
    [deadline.format, deadline.id, onProgressSubmitted]
  );

  const handleProgressUpdateSuccess = useCallback(
    (newProgress: number) => {
      const bookComplete = isBookComplete(newProgress, totalQuantity);

      if (bookComplete) {
        showCompletionDialog(newProgress, deadline.book_title);
      } else {
        const message = formatProgressUpdateMessage(
          deadline.format,
          newProgress
        );
        Toast.show({
          swipeable: true,
          type: 'success',
          text1: 'Progress Updated!',
          text2: message,
        });
        onProgressSubmitted?.();
      }
    },
    [
      totalQuantity,
      showCompletionDialog,
      deadline.book_title,
      deadline.format,
      onProgressSubmitted,
    ]
  );

  const handleProgressUpdate = useCallback(
    (newProgress: number) => {
      updateProgressMutation.mutate(
        {
          deadlineId: deadline.id,
          currentProgress: newProgress,
          ...(timeSpentReading !== undefined && { timeSpentReading }),
        },
        {
          onSuccess: () => handleProgressUpdateSuccess(newProgress),
          onError: error => {
            const { title, message } = getErrorToastMessage('update');
            Toast.show({
              swipeable: true,
              type: 'error',
              text1: title,
              text2: message,
            });
            console.error('Progress update error:', error);
          },
        }
      );
    },
    [
      updateProgressMutation,
      deadline.id,
      timeSpentReading,
      handleProgressUpdateSuccess,
    ]
  );

  const handleBackwardProgressDeletion = useCallback(
    (newProgress: number) => {
      deleteFutureProgressMutation.mutate(
        { deadlineId: deadline.id, newProgress },
        {
          onSuccess: () => {
            handleProgressUpdate(newProgress);
          },
          onError: error => {
            const { title, message } = getErrorToastMessage('deleteFuture');
            Toast.show({
              swipeable: true,
              type: 'error',
              text1: title,
              text2: message,
            });
            console.error('Delete future progress error:', error);
          },
        }
      );
    },
    [deleteFutureProgressMutation, deadline.id, handleProgressUpdate]
  );

  const showBackwardProgressWarning = useCallback(
    (newProgress: number) => {
      const { message } = formatBackwardProgressWarning(
        deadline.format,
        currentProgress,
        newProgress
      );

      Alert.alert('Backward Progress Warning', message, [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Update',
          style: 'destructive',
          onPress: () => handleBackwardProgressDeletion(newProgress),
        },
      ]);
    },
    [deadline.format, currentProgress, handleBackwardProgressDeletion]
  );

  const onSubmitProgress = useCallback(
    (data: any) => {
      const newProgress = data.currentProgress;

      if (!hasProgressChanged(newProgress, currentProgress)) {
        return; // Do nothing if values are the same
      }

      if (shouldShowBackwardProgressWarning(newProgress, currentProgress)) {
        showBackwardProgressWarning(newProgress);
      } else {
        // Normal forward progress update
        handleProgressUpdate(newProgress);
      }
    },
    [currentProgress, showBackwardProgressWarning, handleProgressUpdate]
  );

  const handleQuickUpdate = (increment: number) => {
    const currentFormValue = getValues('currentProgress');
    const newProgress = calculateNewProgress(
      currentFormValue as string | number | undefined,
      increment,
      currentProgress,
      totalQuantity
    );
    setValue('currentProgress', newProgress, { shouldValidate: false });
  };

  return (
    <ThemedView style={[styles.section]}>
      <ProgressHeader />

      <ThemedView style={{ gap: 12 }}>
        <ProgressInput
          format={deadline.format}
          control={control}
          totalQuantity={totalQuantity}
        />

        <ProgressStats
          currentProgress={currentProgress}
          totalQuantity={totalQuantity}
          remaining={remaining}
          format={deadline.format}
          urgencyLevel={urgencyLevel}
          progressPercentage={progressPercentage}
        />

        <ProgressBar
          progressPercentage={progressPercentage}
          deadlineDate={deadline.deadline_date}
          urgencyLevel={urgencyLevel}
          startDate={deadline.created_at}
        />
      </ThemedView>

      <View style={styles.updateSection}>
        <View
          style={{ height: 1, backgroundColor: '#cccccc30', marginVertical: 8 }}
        />
        <ThemedText variant="muted" style={styles.quickActionLabel}>
          {deadline.format === 'audio'
            ? 'Quick update time (minutes):'
            : 'Quick update pages:'}
        </ThemedText>

        <QuickActionButtons onQuickUpdate={handleQuickUpdate} />

        <ThemedButton
          title={
            updateProgressMutation.isPending ? 'Updating...' : 'Update Progress'
          }
          variant="primary"
          onPress={handleSubmit(onSubmitProgress)}
          disabled={updateProgressMutation.isPending}
        />
      </View>
    </ThemedView>
  );
};

export default ReadingProgressUpdate;

const styles = StyleSheet.create({
  section: {
    padding: 8,
    marginBottom: 16,
  },
  updateSection: {
    marginTop: 8,
    gap: 12,
  },
  quickActionLabel: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
