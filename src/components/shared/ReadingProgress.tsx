import ProgressBar from '@/components/progress/ProgressBar';
import ProgressHeader from '@/components/progress/ProgressHeader';
import ProgressInput from '@/components/progress/ProgressInput';
import ProgressStats from '@/components/progress/ProgressStats';
import { ThemedButton, ThemedView } from '@/components/themed';
import { Typography } from '@/constants/Colors';
import {
  useDeleteFutureProgress,
  useUpdateDeadlineProgress,
} from '@/hooks/useDeadlines';
import { useTheme } from '@/hooks/useThemeColor';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { formatProgressDisplay } from '@/utils/deadlineUtils';
import { createProgressUpdateSchema } from '@/utils/progressUpdateSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

const ReadingProgress = ({
  deadline,
  timeSpentReading,
  onProgressSubmitted,
}: {
  deadline: ReadingDeadlineWithProgress;
  timeSpentReading?: number;
  onProgressSubmitted?: () => void;
}) => {
  const { colors } = useTheme();
  const { getDeadlineCalculations, completeDeadline } = useDeadlines();
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

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      currentProgress: currentProgress,
    },
    mode: 'onSubmit',
  });

  const handleBookCompletion = useCallback(
    (deadlineId: string, bookTitle: string) => {
      completeDeadline(
        deadlineId,
        () => {
          Toast.show({
            swipeable: true,
            type: 'success',
            text1: 'Deadline completed!',
            text2: `Congratulations on finishing "${bookTitle}"!`,
            autoHide: true,
            visibilityTime: 1500,
            position: 'top',
          });
          onProgressSubmitted?.();
        },
        error => {
          Toast.show({
            swipeable: true,
            type: 'error',
            text1: 'Failed to complete deadline',
            text2: error.message || 'Please try again',
            autoHide: true,
            visibilityTime: 1500,
            position: 'top',
          });
        }
      );
    },
    [completeDeadline, onProgressSubmitted]
  );

  const showCompletionDialog = useCallback(
    (newProgress: number, bookTitle: string) => {
      Alert.alert(
        'Book Complete! 🎉',
        `Progress updated to ${formatProgressDisplay(deadline.format, newProgress)}.\n\nYou've reached the end of "${bookTitle}". Would you like to mark this book as complete?`,
        [
          {
            text: 'Not Yet',
            style: 'cancel',
            onPress: () => onProgressSubmitted?.(),
          },
          {
            text: 'Mark Complete',
            style: 'default',
            onPress: () => handleBookCompletion(deadline.id, bookTitle),
          },
        ]
      );
    },
    [deadline.format, deadline.id, handleBookCompletion, onProgressSubmitted]
  );

  const handleProgressUpdateSuccess = useCallback(
    (newProgress: number) => {
      const isBookComplete = newProgress >= totalQuantity;

      if (isBookComplete) {
        showCompletionDialog(newProgress, deadline.book_title);
      } else {
        Toast.show({
          swipeable: true,
          type: 'success',
          text1: 'Progress Updated!',
          text2: `Updated to ${formatProgressDisplay(deadline.format, newProgress)}`,
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
            Toast.show({
              swipeable: true,
              type: 'error',
              text1: 'Update Failed',
              text2: 'Please try again',
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
            Toast.show({
              swipeable: true,
              type: 'error',
              text1: 'Failed to Delete Future Progress',
              text2: 'Please try again',
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
      const progressUnit = deadline.format === 'audio' ? 'time' : 'page';
      const currentDisplay = formatProgressDisplay(
        deadline.format,
        currentProgress
      );
      const newDisplay = formatProgressDisplay(deadline.format, newProgress);

      Alert.alert(
        'Backward Progress Warning',
        `You're updating from ${currentDisplay} to ${newDisplay}. This will delete all progress entries greater than the new ${progressUnit}. Are you sure?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Update',
            style: 'destructive',
            onPress: () => handleBackwardProgressDeletion(newProgress),
          },
        ]
      );
    },
    [deadline.format, currentProgress, handleBackwardProgressDeletion]
  );

  const onSubmitProgress = useCallback(
    (data: any) => {
      const newProgress = data.currentProgress;

      // Check if the new progress is the same as current progress
      if (newProgress === currentProgress) {
        return; // Do nothing if values are the same
      }

      // Check if the new progress is lower than current progress
      if (newProgress < currentProgress) {
        showBackwardProgressWarning(newProgress);
      } else {
        // Normal forward progress update
        handleProgressUpdate(newProgress);
      }
    },
    [currentProgress, showBackwardProgressWarning, handleProgressUpdate]
  );

  // const handleQuickUpdate = (increment: number) => {
  //   const currentFormValue = getValues('currentProgress');

  //   // Convert form value to number, handling both strings and numbers
  //   let numericValue: number;

  //   if (typeof currentFormValue === 'number' && !isNaN(currentFormValue)) {
  //     numericValue = currentFormValue;
  //   } else if (typeof currentFormValue === 'string') {
  //     const parsed = parseFloat(currentFormValue.trim());
  //     numericValue = isNaN(parsed) ? currentProgress : parsed;
  //   } else {
  //     numericValue = currentProgress;
  //   }

  //   const newProgress = Math.max(
  //     0,
  //     Math.min(totalQuantity, numericValue + increment)
  //   );

  //   // Check if the new progress would be lower than current progress
  //   if (newProgress < currentProgress) {
  //     const progressUnit = deadline.format === 'audio' ? 'time' : 'page';
  //     const currentDisplay = formatProgressDisplay(
  //       deadline.format,
  //       currentProgress
  //     );
  //     const newDisplay = formatProgressDisplay(deadline.format, newProgress);

  //     Alert.alert(
  //       'Backward Progress Warning',
  //       `You're updating from ${currentDisplay} to ${newDisplay}. This will delete all progress entries beyond the new ${progressUnit}. Are you sure?`,
  //       [
  //         {
  //           text: 'Cancel',
  //           style: 'cancel',
  //         },
  //         {
  //           text: 'Update',
  //           style: 'destructive',
  //           onPress: () => {
  //             setValue('currentProgress', newProgress, {
  //               shouldValidate: false,
  //             });
  //           },
  //         },
  //       ]
  //     );
  //   } else {
  //     setValue('currentProgress', newProgress, { shouldValidate: false });
  //   }
  // };

  // const handleStartReadingSession = () => {
  //   router.push(`/deadline/${deadline.id}/reading-session`);
  // };

  return (
    <ThemedView style={[styles.section]}>
      <ProgressHeader />

      <ThemedView
        style={[
          styles.progressSection,
          { borderColor: colors.border, borderWidth: 1 },
        ]}
      >
        <ProgressStats
          currentProgress={currentProgress}
          totalQuantity={totalQuantity}
          remaining={remaining}
          format={deadline.format}
          urgencyLevel={urgencyLevel}
        />

        <ProgressBar
          progressPercentage={progressPercentage}
          deadlineDate={deadline.deadline_date}
        />
      </ThemedView>

      <View style={styles.updateSection}>
        <ProgressInput format={deadline.format} control={control} />

        {/* <QuickActionButtons onQuickUpdate={handleQuickUpdate} /> */}

        <ThemedButton
          title={
            updateProgressMutation.isPending
              ? 'Updating...'
              : 'Update Progress'
          }
          variant="primary"
          onPress={handleSubmit(onSubmitProgress)}
          disabled={updateProgressMutation.isPending}
        />
      </View>
    </ThemedView>
  );
};

export default ReadingProgress;

const styles = StyleSheet.create({
  section: {
    padding: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  updateSection: {
    marginTop: 8,
    gap: 12,
  },
  sessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(232, 194, 185, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(232, 194, 185, 0.41)',
  },
  sessionIcon: {
    fontSize: 20,
  },
  sessionText: {
    ...Typography.titleMedium,
  },
  progressSection: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
});
