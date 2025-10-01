import { ThemedButton, ThemedView } from '@/components/themed';
import { ROUTES } from '@/constants/routes';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { getDeadlineStatus, getStatusFlags } from '@/utils/deadlineActionUtils';
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
    pauseDeadline,
    reactivateDeadline,
    startReadingDeadline,
  } = useDeadlines();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isStartingReading, setIsStartingReading] = useState(false);

  const latestStatus = getDeadlineStatus(deadline);
  const { isCompleted, isSetAside, isActive, isPending } =
    getStatusFlags(latestStatus);
  const handleComplete = () => {
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
              () => {
                setIsCompleting(false);
                router.push(`/deadline/${deadline.id}/completion`);
              },
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

  const handlePause = () => {
    setIsPausing(true);
    pauseDeadline(
      deadline.id,
      () => {
        setIsPausing(false);
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
      error => {
        setIsPausing(false);
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
              () => {
                setIsDeleting(false);
                router.replace(ROUTES.HOME);
                Toast.show({
                  swipeable: true,
                  type: 'success',
                  text1: 'Deadline deleted',
                  text2: `"${deadline.book_title}" has been removed`,
                  autoHide: true,
                  visibilityTime: 1500,
                  position: 'top',
                });
              },
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

        if (isSetAside) {
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
                    // @ts-ignore
                    router.push(`/deadline/${deadline.id}/edit?page=3`);
                  },
                },
              ]
            );
          }, 2500);
        }
      },
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
                  // @ts-ignore
                  router.push(`/deadline/${deadline.id}/edit?page=3`);
                },
              },
            ]
          );
        }, 2500);
      },
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
      <ThemedButton
        title="Notes"
        variant="outline"
        style={styles.actionButton}
        onPress={() => router.push(`/deadline/${deadline.id}/notes`)}
      />
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
            title={isPausing ? 'Pausing...' : 'Pause'}
            variant="secondary"
            style={styles.actionButton}
            onPress={handlePause}
            disabled={isPausing}
            backgroundColor="warning"
            textColor="textInverse"
          />
        </>
      )}

      {isSetAside && (
        <>
          <ThemedButton
            title={isReactivating ? 'Reactivating...' : 'Resume Reading'}
            variant="secondary"
            style={styles.actionButton}
            backgroundColor="warning"
            textColor="textInverse"
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

      {isCompleted && (
        <ThemedButton
          title={'Read Again?'}
          variant="primary"
          style={styles.actionButton}
          onPress={handleReadAgain}
          disabled={isReactivating}
        />
      )}

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
