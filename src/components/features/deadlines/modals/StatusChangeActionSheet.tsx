import { ThemedButton } from '@/components/themed';
import { ThemedText } from '@/components/themed/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { DEADLINE_STATUS, VALID_STATUS_TRANSITIONS } from '@/constants/status';
import { Shadows } from '@/constants/Theme';
import { useTheme } from '@/hooks/useThemeColor';
import { useDeadlines } from '@/providers/DeadlineProvider';
import {
  useIsStatusMutating,
  useUpdateDeadlineProgress,
} from '@/hooks/useDeadlines';
import { useReviewTrackingData } from '@/hooks/useReviewTrackingData';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { getDeadlineStatus } from '@/utils/deadlineProviderUtils';
import { calculateProgress } from '@/utils/deadlineCore';
import { formatProgressDisplay } from '@/utils/deadlineUtils';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import MarkCompleteDialog from '../../review/MarkCompleteDialog';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast } from 'react-native-toast-message/lib/src/Toast';

interface StatusChangeActionSheetProps {
  deadline: ReadingDeadlineWithProgress;
  visible: boolean;
  onClose: () => void;
}

interface StatusOption {
  label: string;
  icon: string;
  color: string;
  description: string;
  disabled?: boolean;
  disabledReason?: string;
}

/**
 * StatusChangeActionSheet - Modal for changing deadline status
 *
 * Provides a comprehensive interface for transitioning between deadline statuses,
 * handling both instant transitions and complex completion flows.
 *
 * @component
 *
 * ## Transition Types
 *
 * ### Instant Transitions (No additional steps required)
 * - pending → reading (Start Reading)
 * - pending → rejected (Reject Book)
 * - pending → withdrew (Withdraw)
 * - reading → paused (Pause Reading)
 * - paused → reading (Resume Reading)
 *
 * ### Completion Flow Transitions (Requires completion-flow.tsx)
 * - reading → complete (Mark Complete)
 * - reading → did_not_finish (Did Not Finish)
 * - reading → to_review (Finish Reading)
 * - paused → complete (Mark Complete)
 * - paused → did_not_finish (Did Not Finish)
 *
 * ### Special Transitions (Show dialogs/alerts first)
 * - reading → to_review: Shows native Alert.alert() if progress < 100%
 * - to_review → complete: Shows MarkCompleteDialog warning about unposted reviews
 *
 * ## Dialog State Management
 *
 * Uses discriminated union pattern for dialog state:
 * - `{ type: 'none' }` - No dialog shown
 * - `{ type: 'mark_complete' }` - MarkCompleteDialog shown
 *
 * Note: Progress check now uses native Alert.alert() instead of a modal dialog
 *
 * ## Terminal States
 *
 * The following statuses have no valid transitions (archived):
 * - complete
 * - did_not_finish
 * - rejected
 * - withdrew
 *
 * When a deadline is in a terminal state, the sheet shows an "archived" message
 * instead of transition options.
 *
 * @example
 * ```tsx
 * <StatusChangeActionSheet
 *   deadline={deadline}
 *   visible={showStatusModal}
 *   onClose={() => setShowStatusModal(false)}
 * />
 * ```
 */
export const StatusChangeActionSheet: React.FC<
  StatusChangeActionSheetProps
> = ({ deadline, visible, onClose }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const translateY = useSharedValue(500);
  const {
    startReadingDeadline,
    resumeDeadline,
    pauseDeadline,
    markReceivedDeadline,
    markAppliedDeadline,
    rejectDeadline,
    withdrawDeadline,
    completeDeadline,
    didNotFinishDeadline,
  } = useDeadlines();

  const { latestStatus: currentStatus } = getDeadlineStatus(deadline);
  const availableTransitions =
    VALID_STATUS_TRANSITIONS[
      currentStatus as keyof typeof VALID_STATUS_TRANSITIONS
    ] || [];

  // Dialog state management
  type DialogState = { type: 'none' } | { type: 'mark_complete' };

  const [dialogState, setDialogState] = useState<DialogState>({ type: 'none' });

  // Hooks for status changes and data fetching
  const { mutate: updateProgress } = useUpdateDeadlineProgress();
  const isStatusMutating = useIsStatusMutating();

  // Conditionally fetch review tracking data only when needed
  const shouldFetchReviewData = dialogState.type === 'mark_complete';
  const { platforms, isLoading: isLoadingPlatforms } = useReviewTrackingData(
    deadline.id,
    shouldFetchReviewData
  );

  // Calculate current progress
  const currentProgress = calculateProgress(deadline);
  const totalQuantity = deadline.total_quantity || 0;

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    } else {
      translateY.value = withSpring(500, { damping: 20, stiffness: 200 });
    }
  }, [visible, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Status options configuration
  const getStatusOption = (
    status: string,
    currentProgress: number,
    totalQuantity: number
  ): StatusOption => {
    const isFullyComplete = currentProgress >= totalQuantity;

    const options: Record<string, StatusOption> = {
      applied: {
        label: 'Mark as Applied',
        icon: 'paperplane.fill',
        color: colors.primary,
        description: 'Applied for book, awaiting response',
      },
      pending: {
        label: 'Mark as Received',
        icon: 'tray.and.arrow.down.fill',
        color: colors.primary,
        description: 'Move to pending, ready to start',
      },
      reading: {
        label: 'Start Reading',
        icon: 'book.fill',
        color: colors.primary,
        description: 'Begin tracking your progress',
      },
      paused: {
        label: 'Pause Reading',
        icon: 'pause.circle.fill',
        color: colors.textSecondary,
        description: '',
      },
      to_review: {
        label: 'Finish Reading',
        icon: 'checkmark.circle.fill',
        color: colors.good,
        description: '➜ Opens review tracking',
      },
      complete: {
        label: 'Mark Complete',
        icon: 'checkmark.seal.fill',
        color: colors.good,
        description: '➜ No review needed',
        disabled: !isFullyComplete,
        ...(!isFullyComplete && {
          disabledReason: 'Update progress to 100% to mark as complete',
        }),
      },
      did_not_finish: {
        label: 'Did Not Finish',
        icon: 'xmark.circle.fill',
        color: colors.error,
        description: '',
        disabled: isFullyComplete,
        ...(isFullyComplete && {
          disabledReason: "Book is complete - use 'Mark Complete' instead",
        }),
      },
      rejected: {
        label: 'Reject Book',
        icon: 'hand.thumbsdown.fill',
        color: colors.error,
        description: 'Decline this book (e.g., ARC rejection)',
      },
      withdrew: {
        label: 'Withdraw',
        icon: 'arrow.uturn.backward.circle.fill',
        color: colors.warning,
        description: 'Withdraw from reading commitment',
      },
    };

    return (
      options[status] || {
        label: status,
        icon: 'circle.fill',
        color: colors.text,
        description: 'Change status',
      }
    );
  };

  // Determine if transition requires completion flow
  const requiresCompletionFlow = (targetStatus: string): boolean => {
    const flowRequiredTransitions = [
      { from: 'reading', to: ['to_review', 'complete', 'did_not_finish'] },
      { from: 'paused', to: ['complete', 'did_not_finish'] },
    ];

    return flowRequiredTransitions.some(
      transition =>
        transition.from === currentStatus &&
        transition.to.includes(targetStatus)
    );
  };

  const handleStatusChange = (targetStatus: string) => {
    const isFullyComplete = currentProgress >= totalQuantity;

    // Special handling for "Finish Reading" (to_review) transition
    if (targetStatus === DEADLINE_STATUS.TO_REVIEW) {
      // Check if book is not at 100% progress
      if (!isFullyComplete) {
        // Show native alert to ask if user finished all pages
        const progressText = formatProgressDisplay(
          deadline.format,
          currentProgress
        );
        const totalText = formatProgressDisplay(deadline.format, totalQuantity);
        const unitLabel = deadline.format === 'audio' ? 'time' : 'pages';

        Alert.alert(
          `Did you finish all ${totalText} ${unitLabel}?`,
          `You're currently at ${progressText} of ${totalText}.`,
          [
            {
              text: "No, I didn't finish everything",
              onPress: handleProgressCheckDidNotFinish,
              style: 'cancel',
            },
            {
              text: `Yes, mark all ${deadline.format === 'audio' ? 'time as listened' : 'pages as read'}`,
              onPress: handleProgressCheckMarkAllPages,
              style: 'default',
            },
          ],
          { cancelable: true }
        );
        return;
      }
      // Book is at 100%, proceed directly to completion flow
      onClose();
      router.push(`/deadline/${deadline.id}/completion-flow`);
      return;
    }

    // Special handling for "Mark Complete" from to_review status
    if (
      targetStatus === DEADLINE_STATUS.COMPLETE &&
      currentStatus === DEADLINE_STATUS.TO_REVIEW
    ) {
      // Show MarkCompleteDialog to warn about unposted reviews
      setDialogState({ type: 'mark_complete' });
      return;
    }

    // Route to completion flow for other transitions that require it
    if (requiresCompletionFlow(targetStatus)) {
      onClose();
      router.push(`/deadline/${deadline.id}/completion-flow`);
      return;
    }

    // Handle instant transitions
    switch (targetStatus) {
      case DEADLINE_STATUS.PENDING:
        // Transition from applied → pending (mark as received)
        markReceivedDeadline(
          deadline.id,
          () => {
            Toast.show({
              type: 'success',
              text1: `Received ${deadline.book_title}`,
            });
            onClose();
          },
          error => {
            console.error('Failed to mark as received:', error);
            Toast.show({
              type: 'error',
              text1: 'Failed to mark as received',
              text2: 'Please try again',
            });
          }
        );
        break;

      case DEADLINE_STATUS.APPLIED:
        // Transition from pending/reading → applied (mark as applied)
        markAppliedDeadline(
          deadline.id,
          () => {
            Toast.show({
              type: 'success',
              text1: `Applied for ${deadline.book_title}`,
            });
            onClose();
          },
          error => {
            console.error('Failed to mark as applied:', error);
            Toast.show({
              type: 'error',
              text1: 'Failed to mark as applied',
              text2: 'Please try again',
            });
          }
        );
        break;

      case DEADLINE_STATUS.READING:
        if (currentStatus === DEADLINE_STATUS.PENDING) {
          startReadingDeadline(
            deadline.id,
            () => {
              Toast.show({
                type: 'success',
                text1: `Started reading ${deadline.book_title}`,
              });
              onClose();
            },
            error => {
              console.error('Failed to start reading:', error);
              Toast.show({
                type: 'error',
                text1: 'Failed to start reading',
                text2: 'Please try again',
              });
            }
          );
        } else if (currentStatus === DEADLINE_STATUS.PAUSED) {
          resumeDeadline(
            deadline.id,
            () => {
              Toast.show({
                type: 'success',
                text1: `Resumed ${deadline.book_title}`,
              });
              onClose();
            },
            error => {
              console.error('Failed to resume reading:', error);
              Toast.show({
                type: 'error',
                text1: 'Failed to resume reading',
                text2: 'Please try again',
              });
            }
          );
        }
        break;

      case DEADLINE_STATUS.PAUSED:
        pauseDeadline(
          deadline.id,
          () => {
            Toast.show({
              type: 'success',
              text1: `Paused ${deadline.book_title}`,
            });
            onClose();
          },
          error => {
            console.error('Failed to pause reading:', error);
            Toast.show({
              type: 'error',
              text1: 'Failed to pause reading',
              text2: 'Please try again',
            });
          }
        );
        break;

      case DEADLINE_STATUS.REJECTED:
        rejectDeadline(
          deadline.id,
          () => {
            Toast.show({
              type: 'success',
              text1: `Rejected ${deadline.book_title}`,
            });
            onClose();
          },
          error => {
            console.error('Failed to reject book:', error);
            Toast.show({
              type: 'error',
              text1: 'Failed to reject book',
              text2: 'Please try again',
            });
          }
        );
        break;

      case DEADLINE_STATUS.WITHDREW:
        withdrawDeadline(
          deadline.id,
          () => {
            Toast.show({
              type: 'success',
              text1: `Withdrew from ${deadline.book_title}`,
            });
            onClose();
          },
          error => {
            console.error('Failed to withdraw from book:', error);
            Toast.show({
              type: 'error',
              text1: 'Failed to withdraw',
              text2: 'Please try again',
            });
          }
        );
        break;

      default:
        console.warn(`Unhandled instant transition to: ${targetStatus}`);
        onClose();
    }
  };

  // Handler for Alert.alert - User confirms they finished all pages
  const handleProgressCheckMarkAllPages = () => {
    // First, update progress to 100%
    updateProgress(
      {
        deadlineId: deadline.id,
        currentProgress: totalQuantity,
      },
      {
        onSuccess: () => {
          // Then route to completion flow for to_review
          setDialogState({ type: 'none' });
          onClose();
          router.push(`/deadline/${deadline.id}/completion-flow`);
        },
        onError: error => {
          console.error('Failed to update progress:', error);
          Toast.show({
            type: 'error',
            text1: 'Failed to update progress',
            text2: 'Please try again',
          });
        },
      }
    );
  };

  // Handler for Alert.alert - User says they didn't finish
  const handleProgressCheckDidNotFinish = () => {
    setDialogState({ type: 'none' });
    onClose();
    router.push(`/deadline/${deadline.id}/completion-flow`);
  };

  // Handler for MarkCompleteDialog - User confirms completion from to_review
  const handleMarkComplete = () => {
    // Check if progress is at 100% to decide between complete vs DNF
    const isFullyComplete = currentProgress >= totalQuantity;
    const completeMethod = isFullyComplete
      ? completeDeadline
      : didNotFinishDeadline;

    completeMethod(
      deadline.id,
      () => {
        setDialogState({ type: 'none' });
        Toast.show({
          type: 'success',
          text1: 'Completed!',
          text2: 'All reviews tracked',
        });
        onClose();
      },
      (error: Error) => {
        console.error('Failed to complete deadline:', error);
        Toast.show({
          type: 'error',
          text1: 'Failed to complete',
          text2: error.message || 'Please try again',
        });
      }
    );
  };

  const getCurrentStatusLabel = () => {
    const labels: Record<string, string> = {
      applied: 'Applied',
      pending: 'Pending',
      reading: 'Active',
      paused: 'Paused',
      to_review: 'To Review',
      complete: 'Completed',
      did_not_finish: 'Did Not Finish',
      rejected: 'Rejected',
      withdrew: 'Withdrew',
    };
    return labels[currentStatus] || currentStatus;
  };

  // Terminal state check
  const isTerminalState = availableTransitions.length === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Close status change sheet"
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + Spacing.lg,
            },
            animatedStyle,
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText typography="titleSubLarge" style={styles.title}>
              Change Status
            </ThemedText>
            <View style={styles.currentStatusContainer}>
              <ThemedText typography="bodyMedium" color="textSecondary">
                Current:
              </ThemedText>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: colors.primary + '20' },
                ]}
              >
                <ThemedText
                  typography="labelMedium"
                  style={{ color: colors.primary }}
                >
                  {getCurrentStatusLabel()}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Terminal state message */}
          {isTerminalState ? (
            <View style={styles.terminalStateContainer}>
              <IconSymbol
                name="archivebox.fill"
                size={48}
                color={colors.textSecondary}
              />
              <ThemedText
                typography="titleMedium"
                color="textSecondary"
                style={styles.terminalStateText}
              >
                This book is archived
              </ThemedText>
              <ThemedText
                typography="bodyMedium"
                color="textMuted"
                style={styles.terminalStateDescription}
              >
                No status changes available for archived books
              </ThemedText>
            </View>
          ) : (
            /* Available transitions */
            <View style={styles.optionsContainer}>
              {availableTransitions.map((status: string) => {
                const option = getStatusOption(
                  status,
                  currentProgress,
                  totalQuantity
                );
                // Disable if option is disabled OR if a status mutation is in progress
                const isDisabled = option.disabled || isStatusMutating;

                return (
                  <TouchableOpacity
                    key={status}
                    testID={`status-option-${status}`}
                    style={[
                      styles.optionButton,
                      {
                        borderColor: colors.border,
                        backgroundColor: isDisabled
                          ? colors.disabled
                          : colors.surfaceContainer,
                        opacity: isDisabled ? 0.6 : 1,
                      },
                    ]}
                    onPress={() => !isDisabled && handleStatusChange(status)}
                    disabled={isDisabled}
                  >
                    <View style={styles.optionIconContainer}>
                      <IconSymbol
                        name={option.icon as any}
                        size={28}
                        color={isDisabled ? colors.disabledText : option.color}
                      />
                    </View>
                    <View style={styles.optionTextContainer}>
                      {isDisabled ? (
                        <ThemedText
                          typography="titleMedium"
                          color="disabledText"
                        >
                          {option.label}
                        </ThemedText>
                      ) : (
                        <ThemedText typography="titleMedium">
                          {option.label}
                        </ThemedText>
                      )}
                      {isDisabled && option.disabledReason ? (
                        <ThemedText
                          typography="bodyMedium"
                          color="textMuted"
                          style={{ fontStyle: 'italic' }}
                        >
                          {option.disabledReason}
                        </ThemedText>
                      ) : option.description ? (
                        <ThemedText
                          typography="bodyMedium"
                          color="textSecondary"
                        >
                          {option.description}
                        </ThemedText>
                      ) : null}
                    </View>
                    <IconSymbol
                      name="chevron.right"
                      size={16}
                      color={
                        isDisabled ? colors.disabled : colors.textSecondary
                      }
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Cancel button */}
          <ThemedButton
            onPress={onClose}
            variant="outline"
            title={'Cancel'}
            textColor="accent"
          />
        </Animated.View>
      </Pressable>
      {/* Mark Complete Dialog */}
      <MarkCompleteDialog
        visible={dialogState.type === 'mark_complete' && !isLoadingPlatforms}
        platforms={platforms}
        deadline={deadline}
        onComplete={handleMarkComplete}
        onCancel={() => setDialogState({ type: 'none' })}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    ...Shadows.elevated,
  },
  header: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: 'center',
  },
  currentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  terminalStateContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  terminalStateText: {
    textAlign: 'center',
  },
  terminalStateDescription: {
    textAlign: 'center',
    maxWidth: '80%',
  },
  optionsContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
});
