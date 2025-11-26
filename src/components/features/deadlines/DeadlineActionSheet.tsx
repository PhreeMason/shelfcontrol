import { ThemedText } from '@/components/themed/ThemedText';
import { ActionSheetOption } from '@/components/ui/ActionSheet';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useReviewTrackingData } from '@/hooks/useReviewTrackingData';
import { useReviewTrackingMutation } from '@/hooks/useReviewTrackingMutation';
import { useTheme } from '@/hooks/useThemeColor';
import { dayjs } from '@/lib/dayjs';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { getDeadlineStatus, getStatusFlags } from '@/utils/deadlineActionUtils';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
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
import PostReviewModal from '../review/PostReviewModal';
import { DeleteDeadlineModal } from './modals/DeleteDeadlineModal';
import { ProgressCheckModal } from './modals/ProgressCheckModal';
import { UpdateDeadlineDateModal } from './modals/UpdateDeadlineDateModal';

interface DeadlineActionSheetProps {
  deadline: ReadingDeadlineWithProgress;
  visible: boolean;
  onClose: () => void;
}

export const DeadlineActionSheet: React.FC<DeadlineActionSheetProps> = ({
  deadline,
  visible,
  onClose,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const translateY = useSharedValue(500);
  const { startReadingDeadline, resumeDeadline, pauseDeadline } =
    useDeadlines();
  const [showUpdateDateModal, setShowUpdateDateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPostReviewModal, setShowPostReviewModal] = useState(false);
  const [showProgressCheckModal, setShowProgressCheckModal] = useState(false);

  const latestStatus = getDeadlineStatus(deadline);
  const { isCompleted, isToReview, isActive, isPending, isPaused } =
    getStatusFlags(latestStatus);

  const { reviewTracking, platforms } = useReviewTrackingData(
    deadline.id,
    isToReview
  );
  const { updatePlatforms } = useReviewTrackingMutation(deadline.id);

  const isArchived = isCompleted || latestStatus === 'did_not_finish';

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

  const getStatusBadge = () => {
    if (isPending) return { label: 'Pending', color: colors.secondary };
    if (isActive) return { label: 'Active', color: colors.primary };
    if (isPaused) return { label: 'Paused', color: colors.textSecondary };
    if (isToReview) return { label: 'To Review', color: colors.approaching };
    if (isCompleted) return { label: 'Completed', color: colors.good };
    if (latestStatus === 'did_not_finish')
      return { label: 'Did Not Finish', color: colors.error };
    if (latestStatus === 'rejected')
      return { label: 'Rejected', color: colors.error };
    if (latestStatus === 'withdrew')
      return { label: 'Withdrew', color: colors.warning };
    return { label: 'Unknown', color: colors.text };
  };

  const statusBadge = getStatusBadge();

  const getDisplayDate = () => {
    if (isArchived) {
      const archivedStatus = deadline.status?.find(
        s => s.status === 'complete' || s.status === 'did_not_finish'
      );
      if (archivedStatus) {
        return {
          label: '',
          date: dayjs(archivedStatus.created_at).format('MMM D, YYYY'),
        };
      }
    }
    return {
      label: 'Due',
      date: dayjs(deadline.deadline_date).format('MMM D, YYYY'),
    };
  };

  const displayDate = getDisplayDate();

  const getActionButton = () => {
    if (isArchived) return null;

    if (isPending) {
      return {
        label: 'Start Reading',
        icon: 'book.fill' as const,
        onPress: () => {
          startReadingDeadline(
            deadline.id,
            () => {
              onClose();
            },
            error => {
              console.error('Failed to start reading:', error);
            }
          );
        },
      };
    }

    if (isPaused) {
      return {
        label: 'Resume Book',
        icon: 'play.circle.fill' as const,
        onPress: () => {
          resumeDeadline(
            deadline.id,
            () => {
              Toast.show({
                type: 'success',
                text1: `${deadline.book_title} is now active.`,
              });
              onClose();
            },
            error => {
              console.error('Failed to resume reading:', error);
            }
          );
        },
      };
    }

    if (isActive) {
      return {
        label: "I'm done reading",
        icon: 'checkmark.circle.fill' as const,
        onPress: () => {
          onClose();
          setShowProgressCheckModal(true);
        },
      };
    }

    return null;
  };

  const actionButton = getActionButton();

  const handlePostReviewSave = (
    updates: { id: string; posted: boolean; review_url?: string }[]
  ) => {
    if (!reviewTracking) return;

    updatePlatforms({
      reviewTrackingId: reviewTracking.id,
      params: { platforms: updates },
    });
  };

  const editingActions: ActionSheetOption[] = [];
  const actions: ActionSheetOption[] = [];

  if (!isArchived) {
    editingActions.push({
      label: 'Book Details',
      icon: 'pencil.and.scribble',
      iconColor: colors.primary,
      showChevron: true,
      onPress: () => {
        router.push(`/deadline/${deadline.id}/edit`);
      },
    });

    if (isToReview && reviewTracking) {
      editingActions.push({
        label: 'Review Details',
        icon: 'square.and.pencil',
        iconColor: colors.backupPink,
        showChevron: true,
        onPress: () => {
          router.push(`/deadline/${deadline.id}/edit-review-tracking`);
        },
      });
    }

    actions.push({
      label: 'Update Date',
      icon: 'calendar.badge.clock',
      iconColor: colors.secondary,
      showChevron: true,
      onPress: () => {
        setShowUpdateDateModal(true);
      },
    });

    // if (isToReview) {
    //   actions.push({
    //     label: 'Track Reviews',
    //     icon: 'note.text',
    //     iconColor: colors.backupPink,
    //     showChevron: true,
    //     onPress: () => {
    //       setShowPostReviewModal(true);
    //     },
    //   });
    // }

    if (isActive) {
      actions.push({
        label: 'Pause Reading',
        icon: 'pause.circle.fill' as const,
        iconColor: colors.textSecondary,
        onPress: () => {
          pauseDeadline(
            deadline.id,
            () => {
              onClose();
              Toast.show({
                type: 'success',
                text1: `${deadline.book_title} has been paused.`,
              });
            },
            error => {
              console.error('Failed to pause reading:', error);
            }
          );
        },
      });
    }
  }

  actions.push({
    label: 'Add Note',
    icon: 'text.page',
    iconColor: colors.primary,
    showChevron: true,
    onPress: () => {
      router.push(`/deadline/${deadline.id}/notes`);
    },
  });

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel="Close action sheet"
        >
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                paddingBottom: insets.bottom + 16,
              },
              animatedStyle,
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.header}>
              <ThemedText style={styles.bookTitle}>
                {deadline.book_title}
              </ThemedText>
              <View style={styles.headerInfo}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusBadge.color + '20' },
                  ]}
                >
                  <ThemedText
                    style={[styles.statusText, { color: statusBadge.color }]}
                  >
                    {statusBadge.label}
                  </ThemedText>
                </View>
                <ThemedText style={styles.dueDate}>
                  {displayDate.label} {displayDate.date}
                </ThemedText>
              </View>
            </View>

            {actionButton && (
              <TouchableOpacity
                testID="primary-action-button"
                style={[
                  styles.primaryActionButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={actionButton.onPress}
              >
                <IconSymbol
                  name={actionButton.icon}
                  size={20}
                  color={colors.surface}
                />
                <ThemedText
                  style={[styles.primaryActionText, { color: colors.surface }]}
                >
                  {actionButton.label}
                </ThemedText>
              </TouchableOpacity>
            )}

            <View style={styles.actionsContainer}>
              {editingActions.length > 0 && (
                <View style={styles.section}>
                  <ThemedText style={styles.sectionHeader}>EDIT</ThemedText>
                  <View style={styles.gridRow}>
                    {editingActions.map((action, index) => (
                      <TouchableOpacity
                        key={index}
                        testID={`editing-action-${index}`}
                        style={[
                          styles.gridButton,
                          { borderColor: colors.border },
                        ]}
                        onPress={() => {
                          onClose();
                          action.onPress();
                        }}
                      >
                        <IconSymbol
                          name={action.icon as any}
                          size={28}
                          color={action.iconColor || colors.text}
                        />
                        <ThemedText style={styles.gridButtonLabel}>
                          {action.label}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {actions.length > 0 && (
                <View style={styles.section}>
                  <ThemedText style={styles.sectionHeader}>ACTIONS</ThemedText>
                  <View style={styles.gridRow}>
                    {actions.map((action, index) => (
                      <TouchableOpacity
                        key={index}
                        testID={`action-item-${index}`}
                        style={[
                          styles.gridButton,
                          { borderColor: colors.border },
                        ]}
                        onPress={() => {
                          onClose();
                          action.onPress();
                        }}
                      >
                        <IconSymbol
                          name={action.icon as any}
                          size={28}
                          color={action.iconColor || colors.text}
                        />
                        <ThemedText style={styles.gridButtonLabel}>
                          {action.label}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.section}>
                <TouchableOpacity
                  testID="delete-action"
                  style={[styles.deleteButton, { borderColor: colors.error }]}
                  onPress={() => {
                    onClose();
                    setShowDeleteModal(true);
                  }}
                >
                  <IconSymbol
                    name="trash.fill"
                    size={28}
                    color={colors.error}
                    style={{ transform: [{ translateY: -2 }] }}
                  />
                  <ThemedText
                    style={[styles.deleteButtonLabel, { color: colors.error }]}
                  >
                    Delete This Book
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <ThemedText style={styles.cancelText}>Cancel</ThemedText>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>

      <UpdateDeadlineDateModal
        deadline={deadline}
        visible={showUpdateDateModal}
        onClose={() => setShowUpdateDateModal(false)}
      />

      <DeleteDeadlineModal
        deadline={deadline}
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />

      <ProgressCheckModal
        deadline={deadline}
        visible={showProgressCheckModal}
        onClose={() => setShowProgressCheckModal(false)}
      />
      {/* // TODO: Remove this modal once we sure we dont need it anymore */}
      {isToReview && (
        <PostReviewModal
          visible={showPostReviewModal}
          platforms={platforms}
          onClose={() => setShowPostReviewModal(false)}
          onSave={handlePostReviewSave}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  header: {
    gap: 12,
    marginBottom: 20,
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dueDate: {
    fontSize: 14,
    opacity: 0.6,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginBottom: 10,
  },
  primaryActionText: {
    fontSize: 17,
    fontWeight: '600',
  },
  actionsContainer: {
    gap: 10,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    opacity: 0.5,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  gridButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 10,
  },
  deleteButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    paddingTop: 2,
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
