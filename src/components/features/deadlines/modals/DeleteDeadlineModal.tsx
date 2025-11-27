import { ThemedButton } from '@/components/themed/ThemedButton';
import { ThemedText } from '@/components/themed/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { calculateTotalQuantity } from '@/utils/deadlineCalculations';
import {
  calculateReadingDaysCount,
  calculateTimeSinceAdded,
} from '@/utils/deadlineModalUtils';
import {
  calculateProgress,
  calculateProgressPercentage,
} from '@/utils/deadlineUtils';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DeleteDeadlineModalProps {
  deadline: ReadingDeadlineWithProgress;
  visible: boolean;
  onClose: () => void;
}

export const DeleteDeadlineModal: React.FC<DeleteDeadlineModalProps> = ({
  deadline,
  visible,
  onClose,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(500);
  const { deleteDeadline } = useDeadlines();
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = () => {
    setIsDeleting(true);
    deleteDeadline(
      deadline.id,
      () => {
        setIsDeleting(false);
        onClose();
      },
      error => {
        setIsDeleting(false);
        console.error('Failed to delete deadline:', error);
      }
    );
  };

  const currentProgress = calculateProgress(deadline);
  const totalQuantity = calculateTotalQuantity(
    deadline.format,
    deadline.total_quantity
  );
  const progressPercentage = calculateProgressPercentage(deadline);
  const daysInvested = calculateReadingDaysCount(deadline);
  const timeSinceAdded = calculateTimeSinceAdded(deadline);

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
        accessibilityLabel="Close delete dialog"
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
          <View style={styles.content}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.error + '20' },
              ]}
            >
              <IconSymbol
                name="exclamationmark.triangle"
                size={36}
                color={colors.error}
              />
            </View>
            <ThemedText style={styles.title}>Delete Deadline</ThemedText>
            <ThemedText style={styles.message}>
              Are you sure you want to remove{' '}
              <ThemedText style={{ fontWeight: '700' }}>
                "{deadline.book_title}"
              </ThemedText>{' '}
              from your reading list?
            </ThemedText>

            <View style={styles.progressSection}>
              <ThemedText style={styles.sectionTitle}>YOUR PROGRESS</ThemedText>

              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${progressPercentage}%`,
                        backgroundColor: colors.error,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.statsRow}>
                <ThemedText style={styles.statLabel}>Pages read</ThemedText>
                <ThemedText style={styles.statValue}>
                  {currentProgress} of {totalQuantity}
                </ThemedText>
              </View>

              <View style={styles.statsRow}>
                <ThemedText style={styles.statLabel}>Time invested</ThemedText>
                <ThemedText style={styles.statValue}>
                  {daysInvested} days
                </ThemedText>
              </View>

              <View style={styles.statsRow}>
                <ThemedText style={styles.statLabel}>Added to list</ThemedText>
                <ThemedText style={styles.statValue}>
                  {timeSinceAdded}
                </ThemedText>
              </View>
            </View>

            <View
              style={[
                styles.warningBox,
                { backgroundColor: colors.error + '15' },
              ]}
            >
              <ThemedText style={[styles.warningText, { color: colors.error }]}>
                • This action cannot be undone
              </ThemedText>
              <ThemedText style={[styles.warningText, { color: colors.error }]}>
                • Your reading progress will be lost
              </ThemedText>
              <ThemedText style={[styles.warningText, { color: colors.error }]}>
                • Any notes will be deleted
              </ThemedText>
            </View>

            <View style={styles.buttonContainer}>
              <ThemedButton
                title="Cancel"
                variant="outline"
                style={styles.button}
                onPress={onClose}
                disabled={isDeleting}
              />
              <ThemedButton
                title={isDeleting ? '' : 'Delete'}
                variant="error"
                style={styles.button}
                onPress={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting && (
                  <ActivityIndicator color={colors.surface} size="small" />
                )}
              </ThemedButton>
            </View>
          </View>
        </Animated.View>
      </Pressable>
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
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    gap: Spacing.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: Spacing.xs,
  },
  progressSection: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  progressBarContainer: {
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: Spacing.sm,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 15,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  warningBox: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
  },
});
