import { ThemedButton } from '@/components/themed/ThemedButton';
import { ThemedText } from '@/components/themed/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useUpdateDeadlineProgress } from '@/hooks/useDeadlines';
import { useTheme } from '@/hooks/useThemeColor';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { getDeadlineStatus } from '@/utils/deadlineProviderUtils';
import { formatProgressDisplay } from '@/utils/deadlineUtils';
import { useRouter } from 'expo-router';
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
import Toast from 'react-native-toast-message';

interface ProgressCheckModalProps {
  deadline: ReadingDeadlineWithProgress;
  visible: boolean;
  onClose: () => void;
}

export const ProgressCheckModal: React.FC<ProgressCheckModalProps> = ({
  deadline,
  visible,
  onClose,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const translateY = useSharedValue(500);
  const { mutate: updateProgress } = useUpdateDeadlineProgress();
  const [selectedOption, setSelectedOption] = useState<
    'finished' | 'dnf' | null
  >(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const totalQuantity = deadline.total_quantity || 0;
  const latestProgress =
    deadline.progress && deadline.progress.length > 0
      ? deadline.progress[deadline.progress.length - 1]
      : null;
  const currentProgress = latestProgress?.current_progress || 0;

  const deadlineStatus = getDeadlineStatus(deadline);
  const isToReview = deadlineStatus?.isToReview || false;

  const isAudiobook = deadline.format === 'audio';

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      setSelectedOption(null);
    } else {
      translateY.value = withSpring(500, { damping: 20, stiffness: 200 });
    }
  }, [visible, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleMarkAllPages = () => {
    setIsUpdating(true);
    updateProgress(
      {
        deadlineId: deadline.id,
        currentProgress: totalQuantity,
      },
      {
        onSuccess: () => {
          setIsUpdating(false);
          onClose();
          router.push(`/deadline/${deadline.id}/completion-flow`);
        },
        onError: error => {
          setIsUpdating(false);
          Toast.show({
            type: 'error',
            text1: 'Failed to update progress',
            text2: error.message || 'Please try again',
          });
        },
      }
    );
  };

  const handleDidNotFinish = () => {
    onClose();
    router.push(`/deadline/${deadline.id}/completion-flow?skipToReview=true`);
  };

  const handleConfirm = () => {
    if (selectedOption === 'finished') {
      handleMarkAllPages();
    } else if (selectedOption === 'dnf') {
      handleDidNotFinish();
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
        accessibilityLabel="Close progress check"
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
            <ThemedText style={styles.title}>
              {isToReview
                ? 'Ready to complete this book?'
                : `Did you finish all ${formatProgressDisplay(deadline.format, totalQuantity)}?`}
            </ThemedText>

            {!isToReview && (
              <ThemedText
                style={[styles.subtitle, { color: colors.text + '80' }]}
              >
                You're currently at{' '}
                {formatProgressDisplay(deadline.format, currentProgress)}/
                {formatProgressDisplay(deadline.format, totalQuantity)}.
              </ThemedText>
            )}

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                onPress={() => setSelectedOption('finished')}
                style={[
                  styles.optionButton,
                  { borderColor: colors.border },
                  selectedOption === 'finished' && {
                    backgroundColor: colors.primary + '20',
                    borderColor: colors.primary,
                  },
                ]}
                disabled={isUpdating}
              >
                <View style={styles.optionContent}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: colors.good + '20' },
                    ]}
                  >
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={28}
                      color={colors.good}
                    />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <ThemedText
                      style={[
                        styles.optionTitle,
                        selectedOption === 'finished' && {
                          color: colors.primary,
                        },
                      ]}
                    >
                      {isToReview ? 'Yes, all done' : 'Yes, I finished'}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.optionDescription,
                        { color: colors.text + '60' },
                      ]}
                    >
                      {isToReview
                        ? 'Mark this book as completed'
                        : isAudiobook
                          ? 'Mark all time as listened and complete the book'
                          : 'Mark all pages as read and complete the book'}
                    </ThemedText>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedOption('dnf')}
                style={[
                  styles.optionButton,
                  { borderColor: colors.border },
                  selectedOption === 'dnf' && {
                    backgroundColor: colors.approaching + '20',
                    borderColor: colors.approaching,
                  },
                ]}
                disabled={isUpdating}
              >
                <View style={styles.optionContent}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: colors.approaching + '20' },
                    ]}
                  >
                    <IconSymbol
                      name="book.fill"
                      size={28}
                      color={colors.approaching}
                    />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <ThemedText
                      style={[
                        styles.optionTitle,
                        selectedOption === 'dnf' && {
                          color: colors.approaching,
                        },
                      ]}
                    >
                      {isToReview ? 'Not finishing' : 'Not quite'}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.optionDescription,
                        { color: colors.text + '60' },
                      ]}
                    >
                      {isToReview
                        ? 'Mark as did not finish'
                        : 'Keep current progress and mark as did not finish'}
                    </ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
              <ThemedButton
                title="Cancel"
                variant="outline"
                style={styles.button}
                onPress={onClose}
                disabled={isUpdating}
              />
              {selectedOption && (
                <ThemedButton
                  title={isUpdating ? '' : 'Continue'}
                  variant="primary"
                  style={styles.button}
                  onPress={handleConfirm}
                  disabled={isUpdating || !selectedOption}
                >
                  {isUpdating && (
                    <ActivityIndicator color={colors.surface} size="small" />
                  )}
                </ThemedButton>
              )}
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
    gap: 20,
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
    marginTop: -12,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextContainer: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 14,
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
