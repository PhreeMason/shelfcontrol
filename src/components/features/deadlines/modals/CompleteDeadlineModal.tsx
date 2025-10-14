import { ThemedButton } from '@/components/themed/ThemedButton';
import { ThemedText } from '@/components/themed/ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { calculateTotalQuantity } from '@/utils/deadlineCalculations';
import {
  calculateAveragePace,
  calculateDaysSpent,
  calculateEarlyLateCompletion,
} from '@/utils/deadlineModalUtils';
import { getUnitForFormat } from '@/utils/deadlineUtils';
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

interface CompleteDeadlineModalProps {
  deadline: ReadingDeadlineWithProgress;
  visible: boolean;
  onClose: () => void;
}

export const CompleteDeadlineModal: React.FC<CompleteDeadlineModalProps> = ({
  deadline,
  visible,
  onClose,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(500);
  const { completeDeadline } = useDeadlines();
  const [isCompleting, setIsCompleting] = useState(false);

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

  const handleComplete = () => {
    setIsCompleting(true);
    completeDeadline(
      deadline.id,
      () => {
        setIsCompleting(false);
        onClose();
      },
      error => {
        setIsCompleting(false);
        console.error('Failed to complete deadline:', error);
      }
    );
  };

  const daysSpent = calculateDaysSpent(deadline);
  const averagePace = calculateAveragePace(deadline);
  const totalQuantity = calculateTotalQuantity(
    deadline.format,
    deadline.total_quantity
  );
  const unit = getUnitForFormat(deadline.format);
  const earlyLateDays = calculateEarlyLateCompletion(deadline);

  const isEarly = earlyLateDays > 0;
  const isOnTime = earlyLateDays === 0;

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
        accessibilityLabel="Close complete dialog"
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
            <ThemedText style={styles.emoji}>🎉</ThemedText>
            <ThemedText style={styles.title}>Complete Book</ThemedText>
            <ThemedText style={styles.subtitle}>Great job finishing</ThemedText>
            <ThemedText style={styles.bookTitle}>
              "{deadline.book_title}"
            </ThemedText>

            <View
              style={[
                styles.achievementSection,
                { backgroundColor: colors.good + '15' },
              ]}
            >
              <View style={styles.achievementHeader}>
                <ThemedText style={styles.achievementTitle}>
                  📚 READING ACHIEVEMENT
                </ThemedText>
              </View>

              <View style={styles.statsRow}>
                <ThemedText style={styles.statLabel}>Total {unit}</ThemedText>
                <ThemedText style={styles.statValue}>
                  {totalQuantity} {unit}
                </ThemedText>
              </View>

              <View style={styles.statsRow}>
                <ThemedText style={styles.statLabel}>Completed in</ThemedText>
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

              {!isOnTime && (
                <View style={styles.statsRow}>
                  <ThemedText style={styles.statLabel}>
                    {isEarly ? 'Finished early by' : 'Finished late by'}
                  </ThemedText>
                  <ThemedText style={styles.statValue}>
                    {Math.abs(earlyLateDays)} days {isEarly ? '🎯' : ''}
                  </ThemedText>
                </View>
              )}
            </View>

            <View style={styles.buttonContainer}>
              <ThemedButton
                title="Not Yet"
                variant="outline"
                style={styles.button}
                onPress={onClose}
                disabled={isCompleting}
              />
              <ThemedButton
                title={isCompleting ? '' : 'Mark Complete'}
                variant="success"
                style={styles.button}
                onPress={handleComplete}
                disabled={isCompleting}
              >
                {isCompleting && (
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
    marginBottom: 8,
  },
  achievementSection: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  achievementHeader: {
    marginBottom: 4,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    opacity: 0.7,
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
    fontSize: 16,
    fontWeight: '600',
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
