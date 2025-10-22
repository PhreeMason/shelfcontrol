import { ThemedButton, ThemedView } from '@/components/themed';
import { ROUTES } from '@/constants/routes';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  createReadAgainParams,
  getDeadlineStatus,
  getStatusFlags,
} from '@/utils/deadlineActionUtils';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';

interface DeadlineActionButtonsProps {
  deadline: ReadingDeadlineWithProgress;
  onComplete?: () => void;
}

const DeadlineActionButtons: React.FC<DeadlineActionButtonsProps> = ({
  deadline,
  onComplete,
}) => {
  const { deleteDeadline, startReadingDeadline } = useDeadlines();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStartingReading, setIsStartingReading] = useState(false);

  const latestStatus = getDeadlineStatus(deadline);
  const { isCompleted, isActive, isPending } = getStatusFlags(latestStatus);
  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    } else {
      router.push(`/deadline/${deadline.id}/completion-flow`);
    }
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

  const handleReadAgain = () => {
    Alert.alert(
      'Read Again?',
      `Create a new deadline to read "${deadline.book_title}" again?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => {
            const readAgainParams = createReadAgainParams(deadline);
            router.push({
              pathname: readAgainParams.pathname,
              params: {
                ...readAgainParams.params,
              },
            } as any);
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
        hapticsOnPress
        title="Notes"
        variant="outline"
        style={styles.actionButton}
        onPress={() => router.push(`/deadline/${deadline.id}/notes`)}
      />
      {isPending && (
        <ThemedButton
          hapticsOnPress
          title={isStartingReading ? 'Starting...' : 'Start Reading'}
          variant="primary"
          style={styles.actionButton}
          onPress={handleStartReading}
          disabled={isStartingReading}
        />
      )}

      {isActive && (
        <ThemedButton
          hapticsOnPress
          title="I'm Done Reading"
          variant="success"
          style={styles.actionButton}
          onPress={handleComplete}
        />
      )}

      {isCompleted && (
        <ThemedButton
          hapticsOnPress
          title={'Read Again?'}
          variant="primary"
          style={styles.actionButton}
          onPress={handleReadAgain}
        />
      )}

      <ThemedButton
        hapticsOnPress
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
