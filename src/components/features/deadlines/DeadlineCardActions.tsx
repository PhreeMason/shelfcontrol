import { ThemedText } from '@/components/themed/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/hooks/useThemeColor';
import { useDeadlines } from '@/providers/DeadlineProvider';
import type { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { getDeadlineStatus, getStatusFlags } from '@/utils/deadlineActionUtils';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { UpdateDeadlineDateModal } from './modals/UpdateDeadlineDateModal';

interface DeadlineCardActionsProps {
  deadline: ReadingDeadlineWithProgress;
}

export const DeadlineCardActions: React.FC<DeadlineCardActionsProps> = ({
  deadline,
}) => {
  const { colors } = useTheme();
  const { pauseDeadline, resumeDeadline } = useDeadlines();
  const [showDateModal, setShowDateModal] = useState(false);

  const latestStatus = getDeadlineStatus(deadline);
  const { isPaused } = getStatusFlags(latestStatus);

  const handleStatusToggle = () => {
    if (isPaused) {
      resumeDeadline(
        deadline.id,
        () => {
          Toast.show({
            type: 'success',
            text1: `${deadline.book_title} is now active.`,
            visibilityTime: 1500,
            position: 'top',
          });
        },
        error => {
          console.error('Failed to resume reading:', error);
          Toast.show({
            type: 'error',
            text1: 'Failed to resume reading',
            visibilityTime: 2000,
            position: 'top',
          });
        }
      );
    } else {
      pauseDeadline(
        deadline.id,
        () => {
          Toast.show({
            type: 'success',
            text1: `${deadline.book_title} has been paused.`,
            visibilityTime: 1500,
            position: 'top',
          });
        },
        error => {
          console.error('Failed to pause reading:', error);
          Toast.show({
            type: 'error',
            text1: 'Failed to pause reading',
            visibilityTime: 2000,
            position: 'top',
          });
        }
      );
    }
  };

  const handleEditPress = () => {
    router.push(`/deadline/${deadline.id}/edit`);
  };

  const handleNotesPress = () => {
    router.push(`/deadline/${deadline.id}/notes`);
  };

  return (
    <>
      <View style={styles.container}>
        {/* Status Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleStatusToggle}
          accessibilityLabel={isPaused ? 'Resume reading' : 'Pause reading'}
          accessibilityRole="button"
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.surface },
            ]}
          >
            <IconSymbol
              name="arrow.left.arrow.right"
              size={20}
              color={colors.primary}
            />
          </View>
          <ThemedText typography="bodySmall" style={styles.buttonLabel}>
            Status
          </ThemedText>
        </TouchableOpacity>

        {/* Calendar Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowDateModal(true)}
          accessibilityLabel="Update deadline date"
          accessibilityRole="button"
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.surface },
            ]}
          >
            <IconSymbol
              name="calendar.badge.clock"
              size={20}
              color={colors.primary}
            />
          </View>
          <ThemedText typography="bodySmall" style={styles.buttonLabel}>
            Due Date
          </ThemedText>
        </TouchableOpacity>

        {/* Edit Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleEditPress}
          accessibilityLabel="Edit deadline"
          accessibilityRole="button"
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.surface },
            ]}
          >
            <IconSymbol
              name="pencil"
              size={20}
              color={colors.primary}
            />
          </View>
          <ThemedText typography="bodySmall" style={styles.buttonLabel}>
            Edit
          </ThemedText>
        </TouchableOpacity>

        {/* Notes Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleNotesPress}
          accessibilityLabel="View notes"
          accessibilityRole="button"
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.surface },
            ]}
          >
            <IconSymbol
              name="note.text"
              size={20}
              color={colors.primary}
            />
          </View>
          <ThemedText typography="bodySmall" style={styles.buttonLabel}>
            Notes
          </ThemedText>
        </TouchableOpacity>
      </View>

      <UpdateDeadlineDateModal
        deadline={deadline}
        visible={showDateModal}
        onClose={() => setShowDateModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLabel: {
    textAlign: 'center',
  },
});
