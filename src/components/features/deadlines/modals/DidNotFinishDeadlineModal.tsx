import { ThemedButton } from '@/components/themed/ThemedButton';
import { ThemedText } from '@/components/themed/ThemedText';
import { useAddNote } from '@/hooks/useNotes';
import { useTheme } from '@/hooks/useThemeColor';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { calculateTotalQuantity } from '@/utils/deadlineCalculations';
import {
  calculateAveragePace,
  calculateDaysSpent,
} from '@/utils/deadlineModalUtils';
import {
  calculateProgress,
  calculateProgressPercentage,
  getUnitForFormat,
} from '@/utils/deadlineUtils';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

interface DidNotFinishDeadlineModalProps {
  deadline: ReadingDeadlineWithProgress;
  visible: boolean;
  onClose: () => void;
}

type StopReason =
  | 'not_enjoying'
  | 'too_difficult'
  | 'no_time'
  | 'other_priorities'
  | null;

export const DidNotFinishDeadlineModal: React.FC<
  DidNotFinishDeadlineModalProps
> = ({ deadline, visible, onClose }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(500);
  const { didNotFinishDeadline } = useDeadlines();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedReason, setSelectedReason] = useState<StopReason>(null);
  const { mutateAsync: addNote } = useAddNote();

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

  const currentProgress = calculateProgress(deadline);
  const totalQuantity = calculateTotalQuantity(
    deadline.format,
    deadline.total_quantity
  );
  const progressPercentage = calculateProgressPercentage(deadline);
  const unit = getUnitForFormat(deadline.format);
  const daysSpent = calculateDaysSpent(deadline);
  const averagePace = calculateAveragePace(deadline);

  const reasonLabels: Record<Exclude<StopReason, null>, string> = {
    not_enjoying: 'Not enjoying it',
    too_difficult: 'Too difficult/dense',
    no_time: 'No time right now',
    other_priorities: 'Other priorities',
  };

  const handleDidNotFinish = async () => {
    setIsUpdating(true);

    try {
      if (selectedReason) {
        await addNote({
          deadlineId: deadline.id,
          noteText: `Stopped reading: ${reasonLabels[selectedReason]}`,
          deadlineProgress: currentProgress,
        });
      }

      didNotFinishDeadline(
        deadline.id,
        () => {
          setIsUpdating(false);
          setSelectedReason(null);
          onClose();
        },
        error => {
          setIsUpdating(false);
          console.error('Failed to mark deadline as did not finish:', error);
        }
      );
    } catch (error) {
      setIsUpdating(false);
      console.error('Failed to add note:', error);
    }
  };

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
        accessibilityLabel="Close did not finish dialog"
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
            <ThemedText style={styles.emoji}>🤗</ThemedText>
            <ThemedText style={styles.title}>Stop Reading</ThemedText>
            <ThemedText style={styles.subtitle}>
              It's okay to not finish
            </ThemedText>
            <ThemedText style={styles.bookTitle}>
              "{deadline.book_title}"
            </ThemedText>

            <View
              style={[
                styles.journeySection,
                { backgroundColor: colors.approaching + '10' },
              ]}
            >
              <ThemedText style={styles.sectionTitle}>YOUR JOURNEY</ThemedText>

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
                        backgroundColor: colors.approaching,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.statsRow}>
                <ThemedText style={styles.statLabel}>You read</ThemedText>
                <ThemedText style={styles.statValue}>
                  {currentProgress} of {totalQuantity} {unit} (
                  {progressPercentage}%)
                </ThemedText>
              </View>

              <View style={styles.statsRow}>
                <ThemedText style={styles.statLabel}>Time spent</ThemedText>
                <ThemedText style={styles.statValue}>
                  {daysSpent} days
                </ThemedText>
              </View>

              <View style={styles.statsRow}>
                <ThemedText style={styles.statLabel}>Average pace</ThemedText>
                <ThemedText style={styles.statValue}>
                  {averagePace} {unit}/day
                </ThemedText>
              </View>
            </View>

            <View style={styles.reasonSection}>
              <ThemedText style={styles.reasonTitle}>
                Why are you stopping? (optional)
              </ThemedText>

              {(Object.keys(reasonLabels) as Exclude<StopReason, null>[]).map(
                reason => (
                  <TouchableOpacity
                    key={reason}
                    style={styles.reasonOption}
                    onPress={() => setSelectedReason(reason)}
                  >
                    <View
                      style={[
                        styles.radioButton,
                        { borderColor: colors.border },
                        selectedReason === reason && {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      {selectedReason === reason && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <ThemedText style={styles.reasonLabel}>
                      {reasonLabels[reason]}
                    </ThemedText>
                  </TouchableOpacity>
                )
              )}
            </View>

            <View style={styles.buttonContainer}>
              <ThemedButton
                title="Keep Trying"
                variant="outline"
                style={styles.button}
                onPress={onClose}
                disabled={isUpdating}
              />
              <ThemedButton
                title={isUpdating ? '' : 'Stop Reading'}
                variant="secondary"
                style={styles.button}
                onPress={handleDidNotFinish}
                disabled={isUpdating}
              >
                {isUpdating && (
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
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  content: {
    gap: 16,
  },
  emoji: {
    fontSize: 48,
    lineHeight: 56,
    textAlign: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.6,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  journeySection: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  progressBarContainer: {
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
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
  reasonSection: {
    gap: 12,
  },
  reasonTitle: {
    fontSize: 15,
    opacity: 0.7,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 12,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  reasonLabel: {
    fontSize: 16,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
  },
});
