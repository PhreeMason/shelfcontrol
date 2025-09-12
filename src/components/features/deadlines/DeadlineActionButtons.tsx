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
  const { deleteDeadline, completeDeadline, setAsideDeadline, reactivateDeadline } = useDeadlines();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSettingAside, setIsSettingAside] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  // Get current status
  const latestStatus = deadline.status && deadline.status.length > 0 
    ? deadline.status[deadline.status.length - 1].status 
    : 'reading';
  
  const isCompleted = latestStatus === 'complete';
  const isSetAside = latestStatus === 'set_aside';
  const isActive = latestStatus === 'reading';
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
                  type: 'success',
                  text1: 'Deadline completed!',
                  text2: `Congratulations on finishing "${deadline.book_title}"!`,
                  autoHide: true,
                  visibilityTime: 3000,
                  position: 'top'
                });
              },
              // Error callback
              (error) => {
                setIsCompleting(false);
                Toast.show({
                  type: 'error',
                  text1: 'Failed to complete deadline',
                  text2: error.message || 'Please try again',
                  autoHide: true,
                  visibilityTime: 3000,
                  position: 'top'
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
          type: 'success',
          text1: 'Book set aside',
          text2: `"${deadline.book_title}" has been set aside for later`,
          autoHide: true,
          visibilityTime: 2000,
          position: 'top',
        });
      },
      // Error callback
      (error) => {
        setIsSettingAside(false);
        Toast.show({
          type: 'error',
          text1: 'Failed to set aside deadline',
          text2: error.message || 'Please try again',
          autoHide: true,
          visibilityTime: 3000,
          position: 'top'
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
                  type: 'success',
                  text1: 'Deadline deleted',
                  text2: `"${deadline.book_title}" has been removed`,
                  autoHide: true,
                  visibilityTime: 2000,
                  position: 'top',
                  onHide: () => {
                    router.replace('/');
                  }
                });
              },
              // Error callback
              (error) => {
                setIsDeleting(false);
                Toast.show({
                  type: 'error',
                  text1: 'Failed to delete deadline',
                  text2: error.message || 'Please try again',
                  autoHide: true,
                  visibilityTime: 3000,
                  position: 'top'
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
          type: 'success',
          text1: 'Deadline reactivated!',
          text2: `"${deadline.book_title}" is now active again`,
          autoHide: true,
          visibilityTime: 2000,
          position: 'top',
        });
        
        // Only show update prompt for set-aside deadlines (not completed ones)
        if (isSetAside) {
          // Show prompt to update deadline after reactivation
          setTimeout(() => {
            Alert.alert(
              'Update Deadline?',
              'Would you like to update the deadline date since you\'re resuming this book?',
              [
                {
                  text: 'Not Now',
                  style: 'cancel',
                },
                {
                  text: 'Yes, Update',
                  onPress: () => {
                    // Navigate to edit form page 2 (deadline page)
                    // @ts-ignore
                    router.push(`/deadline/${deadline.id}/edit?page=2`);
                  }
                }
              ]
            );
          }, 2500); // Wait for toast to show first
        }
      },
      // Error callback
      (error) => {
        setIsReactivating(false);
        Toast.show({
          type: 'error',
          text1: 'Failed to reactivate deadline',
          text2: error.message || 'Please try again',
          autoHide: true,
          visibilityTime: 3000,
          position: 'top'
        });
      }
    );
  };

  return (
    <ThemedView style={styles.actionButtons}>
      {/* For active deadlines - show start reading session, complete and set aside */}
      {isActive && (
        <>
          <ThemedButton
            title={isCompleting ? "Completing..." : "✓ Mark as Complete"}
            variant="success"
            style={styles.completeBtn}
            onPress={handleComplete}
            disabled={isCompleting}
          />
          <ThemedButton
            title={isSettingAside ? "Pausing..." : "📚 Pause"}
            variant="secondary"
            style={styles.archiveBtn}
            onPress={handleSetAside}
            disabled={isSettingAside}
            backgroundColor='warning'
            textColor="textInverse"
          />
        </>
      )}

      {/* For set aside deadlines - show reactivate and complete */}
      {isSetAside && (
        <>
          <ThemedButton
            title={isReactivating ? "Reactivating..." : "📖 Resume Reading"}
            variant="primary"
            style={styles.reactivateBtn}
            onPress={handleReactivate}
            disabled={isReactivating}
          />
          <ThemedButton
            title={isCompleting ? "Completing..." : "✓ Mark as Complete"}
            variant="success"
            style={styles.completeBtn}
            onPress={handleComplete}
            disabled={isCompleting}
          />
        </>
      )}

      {/* For completed deadlines - show reactivate only */}
      {isCompleted && (
        <ThemedButton
          title={isReactivating ? "Reactivating..." : "📖 Resume Reading"}
          variant="primary"
          style={styles.reactivateBtn}
          onPress={handleReactivate}
          disabled={isReactivating}
        />
      )}

      {/* Delete is always available */}
      <ThemedButton
        title={isDeleting ? "Deleting..." : "🗑️ Delete Deadline"}
        variant="dangerOutline"
        style={styles.deleteBtn}
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
  startReadingBtn: {
    marginBottom: 8,
  },
  completeBtn: {
    marginBottom: 8,
  },
  archiveBtn: {
    marginBottom: 8,
  },
  reactivateBtn: {
    marginBottom: 8,
  },
  deleteBtn: {
    marginBottom: 8,
  },
});

export default DeadlineActionButtons;
