import DateRangeDisplay from '@/components/progress/DateRangeDisplay';
import ProgressInput from '@/components/progress/ProgressInput';
import QuickActionButtons from '@/components/progress/QuickActionButtons';
import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { Shadows } from '@/constants/Theme';
import {
  useDeleteFutureProgress,
  useUpdateDeadlineProgress,
} from '@/hooks/useDeadlines';
import { useTheme } from '@/hooks/useThemeColor';
import { analytics } from '@/lib/analytics/client';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { usePreferences } from '@/providers/PreferencesProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  getDeadlineStatus,
  getPausedDate,
} from '@/utils/deadlineProviderUtils';
import { formatProgressDisplay } from '@/utils/deadlineUtils';
import { createProgressUpdateSchema } from '@/utils/progressUpdateSchema';
import {
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
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useSharedValue } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';

// Slider constants
const SLIDER_HEIGHT = 30;
const THUMB_SIZE = Spacing.lg; // 22px
const TRACK_HEIGHT = Spacing.sm; // 4px

/**
 * Clamp a value between min and max
 */
const clamp = (value: number, min: number, max: number): number => {
  'worklet';
  return Math.max(min, Math.min(max, value));
};

const ReadingProgressUpdate = ({
  deadline,
  timeSpentReading,
  onProgressSubmitted,
}: {
  deadline: ReadingDeadlineWithProgress;
  timeSpentReading?: number;
  onProgressSubmitted?: () => void;
}) => {
  const { colors } = useTheme();
  const { getDeadlineCalculations } = useDeadlines();
  const calculations = getDeadlineCalculations(deadline);
  const { currentProgress, totalQuantity } = calculations;

  // Preferences for progress input mode (persisted per format)
  const { getProgressInputMode } = usePreferences();
  const inputMode = getProgressInputMode(deadline.format);

  // Local state for scrubber (real-time preview before saving)
  const [scrubberValue, setScrubberValue] = useState(currentProgress);

  // Ref for slider container width
  const sliderContainerRef = useRef<View>(null);
  const [sliderWidth, setSliderWidth] = useState(300); // Default width

  // Reanimated shared values for gesture handling
  const offset = useSharedValue(currentProgress);
  const dragStartValue = useSharedValue(0);

  const progressSchema = createProgressUpdateSchema(
    totalQuantity,
    deadline.format
  );
  const updateProgressMutation = useUpdateDeadlineProgress();
  const deleteFutureProgressMutation = useDeleteFutureProgress();

  const { handleSubmit, setValue, control, watch } = useForm({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      currentProgress: currentProgress,
    },
    mode: 'onSubmit',
  });

  // Watch form value to sync with scrubber (when ProgressInput changes the form)
  const formProgress = watch('currentProgress') as number;

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
          onPress: () =>
            router.push(`/deadline/${deadline.id}/completion-flow`),
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
      const progressType = deadline.format === 'audio' ? 'time' : 'pages';

      updateProgressMutation.mutate(
        {
          deadlineId: deadline.id,
          currentProgress: newProgress,
          ...(timeSpentReading !== undefined && { timeSpentReading }),
        },
        {
          onSuccess: () => {
            analytics.track('reading_progress_updated', {
              deadline_id: deadline.id,
              progress_type: progressType,
              previous_progress: currentProgress,
              new_progress: newProgress,
              delta: newProgress - currentProgress,
            });
            handleProgressUpdateSuccess(newProgress);
          },
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
      deadline.format,
      timeSpentReading,
      currentProgress,
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

      analytics.track('backward_progress_warning_shown', {
        current_progress: currentProgress,
        new_progress: newProgress,
        format: deadline.format,
      });

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

  // Get deadline status for paused state
  const beginDate = deadline.status?.find(
    status => status.status === 'reading'
  )?.created_at;
  let beginMessage = beginDate ? 'Started: ' : 'Added: ';
  let startDate = beginDate || deadline.created_at;
  if (currentProgress === 0) {
    beginMessage = 'Added: ';
    startDate = deadline.created_at;
  }

  const { isPaused } = getDeadlineStatus(deadline);
  const pausedDate = isPaused ? getPausedDate(deadline) : null;

  // Update scrubber value and form (called from gesture)
  const updateScrubberValue = useCallback(
    (value: number) => {
      const roundedValue = Math.round(value);
      setScrubberValue(roundedValue);
      setValue('currentProgress', roundedValue, { shouldValidate: false });
    },
    [setValue]
  );

  // Handle quick update from QuickActionButtons (+/- increments)
  const handleQuickUpdate = useCallback(
    (increment: number) => {
      const newValue = clamp(scrubberValue + increment, 0, totalQuantity);
      setScrubberValue(newValue);
      setValue('currentProgress', newValue, { shouldValidate: false });
      offset.value = newValue;
    },
    [scrubberValue, totalQuantity, setValue, offset]
  );

  // Pan gesture for direct 1:1 scrubbing
  const panGesture = Gesture.Pan()
    .onStart(() => {
      dragStartValue.value = offset.value;
    })
    .onUpdate(event => {
      'worklet';

      // Calculate absolute finger position on slider (1:1 mapping)
      const fingerPosition =
        dragStartValue.value +
        (event.translationX / sliderWidth) * totalQuantity;

      // Clamp and set thumb position directly
      offset.value = clamp(fingerPosition, 0, totalQuantity);

      // Update UI in real-time
      runOnJS(updateScrubberValue)(offset.value);
    })
    .onEnd(() => {
      'worklet';
      // Final update on gesture end
      runOnJS(updateScrubberValue)(offset.value);
    })
    .enabled(!isPaused);

  // Sync scrubber value and offset with current progress when it changes externally
  useEffect(() => {
    setScrubberValue(currentProgress);
    offset.value = currentProgress;
  }, [currentProgress, offset]);

  // Sync scrubber when form value changes (from ProgressInput)
  useEffect(() => {
    setScrubberValue(prev => {
      if (prev !== formProgress) {
        offset.value = formProgress;
        return formProgress;
      }
      return prev;
    });
  }, [formProgress, offset]);

  const DISABLED_OPACITY = 0.6;

  return (
    <ThemedView style={[styles.section]}>
      {isPaused && pausedDate && (
        <ThemedText variant="muted" style={styles.pausedMessage}>
          Paused on {pausedDate} {'\n'}
          Progress updates available when resumed
        </ThemedText>
      )}
      <ThemedView style={[isPaused && { opacity: DISABLED_OPACITY }]}>
        <ThemedView style={styles.contentContainer}>
          {/* Progress input with mode toggle */}
          <ProgressInput
            format={deadline.format}
            control={control}
            totalQuantity={totalQuantity}
            disabled={isPaused}
          />

          {/* Progress Scrubber (simplified - no +/- buttons) */}
          <ThemedView>
            <View style={styles.scrubberLabels}>
              <ThemedText typography="bodyMedium" color="textSecondary">
                {formatProgressDisplay(deadline.format, scrubberValue)}
              </ThemedText>
              <ThemedText typography="bodyMedium" color="textSecondary">
                {deadline.format === 'audio'
                  ? `${formatProgressDisplay(deadline.format, totalQuantity - scrubberValue)} left`
                  : `${totalQuantity - scrubberValue} left`}
              </ThemedText>
            </View>

            {/* Slider Container - NO +/- buttons */}
            <View
              style={styles.sliderContainer}
              onLayout={event => {
                setSliderWidth(event.nativeEvent.layout.width);
              }}
              ref={sliderContainerRef}
            >
              {/* Background Track */}
              <View
                style={[styles.track, { backgroundColor: colors.border }]}
              />

              {/* Filled Track (Progress) */}
              <View
                style={[
                  styles.filledTrack,
                  {
                    backgroundColor: colors.primary,
                    width: `${(scrubberValue / totalQuantity) * 100}%`,
                  },
                ]}
              />

              {/* Draggable Thumb with Gesture */}
              <GestureDetector gesture={panGesture}>
                <Animated.View
                  style={[
                    styles.thumb,
                    {
                      backgroundColor: colors.primary,
                      left: `${(scrubberValue / totalQuantity) * 100}%`,
                      opacity: isPaused ? 0.5 : 1,
                    },
                  ]}
                />
              </GestureDetector>
            </View>

            {/* Date Range Display */}
            <DateRangeDisplay
              startDate={startDate}
              startLabel={beginMessage}
              dueDate={deadline.deadline_date}
            />
          </ThemedView>

          {/* Quick Action Buttons - BELOW scrubber, ABOVE Update button */}
          <View style={styles.quickButtonsSection}>
            <ThemedText variant="muted" style={styles.quickActionLabel}>
              {deadline.format === 'audio'
                ? 'Quick update (minutes):'
                : 'Quick update pages:'}
            </ThemedText>
            <QuickActionButtons
              onQuickUpdate={handleQuickUpdate}
              disabled={isPaused}
              inputMode={inputMode}
            />
          </View>

          {/* Save Button */}
          <ThemedButton
            title={updateProgressMutation.isPending ? 'Updating...' : 'Update'}
            variant="primary"
            onPress={handleSubmit(onSubmitProgress)}
            disabled={updateProgressMutation.isPending || isPaused}
            style={styles.saveButton}
          />
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
};

export default ReadingProgressUpdate;

const styles = StyleSheet.create({
  section: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    ...Shadows.subtle,
  },
  pausedMessage: {
    textAlign: 'center',
    fontSize: 13,
    fontStyle: 'italic',
  },
  contentContainer: {
    gap: Spacing.md,
  },
  scrubberLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  sliderContainer: {
    height: SLIDER_HEIGHT,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    position: 'absolute',
    width: '100%',
    height: TRACK_HEIGHT,
    borderRadius: BorderRadius.full,
  },
  filledTrack: {
    position: 'absolute',
    height: TRACK_HEIGHT,
    borderRadius: BorderRadius.full,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: BorderRadius.full,
    marginLeft: -(THUMB_SIZE / 2), // Center the thumb on the track
    ...Shadows.medium,
  },
  quickButtonsSection: {
    gap: Spacing.sm,
  },
  quickActionLabel: {
    fontWeight: '700',
    textAlign: 'center',
  },
  saveButton: {
    marginTop: Spacing.sm,
  },
});
