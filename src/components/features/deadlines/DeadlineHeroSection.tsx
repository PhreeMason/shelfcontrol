import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/hooks/useTheme';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Toast from 'react-native-toast-message';
import { DeadlineCard } from './DeadlineCard';

interface DeadlineHeroSectionProps {
  deadline: ReadingDeadlineWithProgress;
  isPending?: boolean;
  isPaused?: boolean;
}

const DeadlineHeroSection: React.FC<DeadlineHeroSectionProps> = ({
  deadline,
  isPending = false,
  isPaused = false,
}) => {
  const { colors } = useTheme();
  const { startReadingDeadline, resumeDeadline } = useDeadlines();
  return (
    <ThemedView style={styles.heroCardContainer}>
      <DeadlineCard deadline={deadline} disableNavigation={true} />
      {isPending ? (
        <TouchableOpacity
          testID="primary-action-button"
          style={[
            styles.primaryActionButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={() =>
            startReadingDeadline(
              deadline.id,
              () => {},
              error => {
                console.error('Failed to start reading:', error);
              }
            )
          }
        >
          <IconSymbol name="book.fill" size={20} color={colors.surface} />
          <ThemedText
            style={[styles.primaryActionText, { color: colors.surface }]}
          >
            Start Reading
          </ThemedText>
        </TouchableOpacity>
      ) : isPaused ? (
        <TouchableOpacity
          testID="resume-reading-button"
          style={[
            styles.primaryActionButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={() =>
            resumeDeadline(
              deadline.id,
              () => {
                Toast.show({
                  swipeable: true,
                  type: 'success',
                  text1: 'Reading resumed!',
                  text2: `${deadline.book_title} is now active`,
                });
              },
              error => {
                console.error('Failed to resume reading:', error);
                Toast.show({
                  swipeable: true,
                  type: 'error',
                  text1: 'Failed to resume reading',
                  text2: 'Please try again',
                });
              }
            )
          }
        >
          <IconSymbol name="play.fill" size={20} color={colors.surface} />
          <ThemedText
            style={[styles.primaryActionText, { color: colors.surface }]}
          >
            Resume Reading
          </ThemedText>
        </TouchableOpacity>
      ) : null}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  heroCardContainer: {
    marginBottom: 10,
  },
  primaryActionText: {
    fontSize: 17,
    fontWeight: '600',
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginTop: 25,
  },
});

export default DeadlineHeroSection;
