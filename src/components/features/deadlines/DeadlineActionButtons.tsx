import { ThemedButton, ThemedView } from '@/components/themed';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';

interface DeadlineActionButtonsProps {
  deadline: ReadingDeadlineWithProgress;
}

const DeadlineActionButtons: React.FC<DeadlineActionButtonsProps> = ({
  deadline,
}) => {
  const {
    deleteDeadline,
    completeDeadline,
    setAsideDeadline,
    reactivateDeadline,
    startReadingDeadline,
  } = useDeadlines();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSettingAside, setIsSettingAside] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isStartingReading, setIsStartingReading] = useState(false);

  // Get current status
  const latestStatus =
    deadline.status && deadline.status.length > 0
      ? deadline.status[deadline.status.length - 1].status
      : 'reading';

  const isCompleted = latestStatus === 'complete';
  const isSetAside = latestStatus === 'set_aside';
  const isActive = latestStatus === 'reading';
  const isPending = latestStatus === 'requested';
  const handleComplete = () => {
    // Show confirmation dialog before completing
    Alert.alert(
      'Complete Book',
      `Are you sure you want to mark "${deadline.book_title}" as complete?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Complete',
          style: 'default',
          onPress: () => {
            setIsCompleting(true);
            completeDeadline(
              deadline.id,
              // Success callback
              () => {
                setIsCompleting(false);
                Toast.show({
                  swipeable: true,
                  type: 'success',
                  text1: 'Deadline completed!',
                  text2: `Congratulations on finishing "${deadline.book_title}"!`,
                  autoHide: true,
                  visibilityTime: 1000,
                  position: 'top',
                });
              },
              // Error callback
              error => {
                setIsCompleting(false);
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
        },
      ]
    );
  };

  const handleSetAside = () => {
    setIsSettingAside(true);
    setAsideDeadline(
      deadline.id,
      // Success callback
      () => {
        setIsSettingAside(false);
        Toast.show({
          swipeable: true,
          type: 'success',
          text1: 'Book paused',
          text2: `"${deadline.book_title}" has been paused`,
          autoHide: true,
          visibilityTime: 1500,
          position: 'top',
        });
      },
      // Error callback
      error => {
        setIsSettingAside(false);
        Toast.show({
          swipeable: true,
          type: 'error',
          text1: 'Failed to pause deadline',
          text2: error.message || 'Please try again',
          autoHide: true,
          visibilityTime: 1500,
          position: 'top',
        });
      }
    );
  };

  const handleDelete = () => {
    // Show confirmation dialog
    Alert.alert(
      'Delete Deadline',
      `Are you sure you want to delete "${deadline.book_title}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setIsDeleting(true);
            deleteDeadline(
              deadline.id,
              // Success callback
              () => {
                setIsDeleting(false);
                Toast.show({
                  swipeable: true,
                  type: 'success',
                  text1: 'Deadline deleted',
                  text2: `"${deadline.book_title}" has been removed`,
                  autoHide: true,
                  visibilityTime: 1500,
                  position: 'top',
                  onHide: () => {
                    router.replace('/');
                  },
                });
              },
              // Error callback
              error => {
                setIsDeleting(false);
                Toast.show({
                  swipeable: true,
                  type: 'error',
                  text1: 'Failed to delete deadline',
                  text2: error.message || 'Please try again',
                  autoHide: true,
                  visibilityTime: 1500,
                  position: 'top',
                });
              }
            );
          },
        },
      ]
    );
  };

  const handleReactivate = () => {
    setIsReactivating(true);
    reactivateDeadline(
      deadline.id,
      // Success callback
      () => {
        setIsReactivating(false);
        Toast.show({
          swipeable: true,
          type: 'success',
          text1: 'Deadline reactivated!',
          text2: `"${deadline.book_title}" is now active again`,
          autoHide: true,
          visibilityTime: 1500,
          position: 'top',
        });

        // Only show update prompt for set-aside deadlines (not completed ones)
        if (isSetAside) {
          // Show prompt to update deadline after reactivation
          setTimeout(() => {
            Alert.alert(
              'Update Deadline?',
              "Would you like to update the deadline date since you're resuming this book?",
              [
                {
                  text: 'Not Now',
                  style: 'cancel',
                },
                {
                  text: 'Yes, Update',
                  onPress: () => {
                    // Navigate to edit form page 3 (deadline page)
                    // @ts-ignore
                    router.push(`/deadline/${deadline.id}/edit?page=3`);
                  },
                },
              ]
            );
          }, 2500); // Wait for toast to show first
        }
      },
      // Error callback
      error => {
        setIsReactivating(false);
        Toast.show({
          swipeable: true,
          type: 'error',
          text1: 'Failed to reactivate deadline',
          text2: error.message || 'Please try again',
          autoHide: true,
          visibilityTime: 1500,
          position: 'top',
        });
      }
    );
  };

  const handleReadAgain = () => {
    Alert.alert(
      'Read Again?',
      `Create a new deadline to read "${deadline.book_title}" again?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => {
            router.push({
              pathname: '/deadline/new',
              params: {
                page: '3',
                bookTitle: deadline.book_title,
                bookAuthor: deadline.author || '',
                format: deadline.format,
                flexibility: (deadline as any).flexibility || 'flexible',
                ...(deadline.format === 'audio'
                  ? { totalMinutes: String(deadline.total_quantity) }
                  : { totalQuantity: String(deadline.total_quantity) }),
                book_id: (deadline as any).book_id || '',
              },
            });
          },
        },
      ]
    );
  };

  const handleStartReading = () => {
    setIsStartingReading(true);
    startReadingDeadline(
      deadline.id,
      // Success callback
      () => {
        setIsStartingReading(false);
        Toast.show({
          swipeable: true,
          type: 'success',
          text1: 'Started reading!',
          text2: `"${deadline.book_title}" is now active`,
          autoHide: true,
          visibilityTime: 1500,
          position: 'top',
        });

        // Show prompt to update deadline after starting
        setTimeout(() => {
          Alert.alert(
            'Update Deadline?',
            'Would you like to update the deadline date?',
            [
              {
                text: 'Not Now',
                style: 'cancel',
              },
              {
                text: 'Yes, Update',
                onPress: () => {
                  // Navigate to edit form page 3 (deadline page)
                  // @ts-ignore
                  router.push(`/deadline/${deadline.id}/edit?page=3`);
                },
              },
            ]
          );
        }, 2500); // Wait for toast to show first
      },
      // Error callback
      error => {
        setIsStartingReading(false);
        Toast.show({
          swipeable: true,
          type: 'error',
          text1: 'Failed to start reading',
          text2: error.message || 'Please try again',
          autoHide: true,
          visibilityTime: 1500,
          position: 'top',
        });
      }
    );
  };

  return (
    <ThemedView style={styles.actionButtons}>
      {/* For pending deadlines - show start reading button */}
      {isPending && (
        <>
          <ThemedButton
            title={isStartingReading ? 'Starting...' : 'Start Reading'}
            variant="primary"
            style={styles.actionButton}
            onPress={handleStartReading}
            disabled={isStartingReading}
          />
        </>
      )}

      {/* For active deadlines - show start reading session, complete and set aside */}
      {isActive && (
        <>
          <ThemedButton
            title={isCompleting ? 'Completing...' : 'Mark as Complete'}
            variant="success"
            style={styles.actionButton}
            onPress={handleComplete}
            disabled={isCompleting}
          />
          <ThemedButton
            title={isSettingAside ? 'Pausing...' : 'Pause'}
            variant="secondary"
            style={styles.actionButton}
            onPress={handleSetAside}
            disabled={isSettingAside}
            backgroundColor="warning"
            textColor="textInverse"
          />
        </>
      )}

      {/* For set aside deadlines - show reactivate and complete */}
      {isSetAside && (
        <>
          <ThemedButton
            title={isReactivating ? 'Reactivating...' : 'Resume Reading'}
            variant="primary"
            style={styles.actionButton}
            onPress={handleReactivate}
            disabled={isReactivating}
          />
          <ThemedButton
            title={isCompleting ? 'Completing...' : 'Mark as Complete'}
            variant="success"
            style={styles.actionButton}
            onPress={handleComplete}
            disabled={isCompleting}
          />
        </>
      )}

      {/* For completed deadlines - show reactivate only */}
      {isCompleted && (
        <ThemedButton
          title={'Read Again?'}
          variant="primary"
          style={styles.actionButton}
          onPress={handleReadAgain}
          disabled={isReactivating}
        />
      )}

      {/* Delete is always available */}
      <ThemedButton
        title={isDeleting ? 'Deleting...' : 'Delete Deadline'}
        variant="dangerOutline"
        style={styles.actionButton}
        onPress={handleDelete}
        disabled={isDeleting}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  actionButtons: {
    gap: 12,
    marginTop: 24,
    paddingBottom: 32,
  },
  actionButton: {
    marginBottom: 8,
  },
});

export default DeadlineActionButtons;
