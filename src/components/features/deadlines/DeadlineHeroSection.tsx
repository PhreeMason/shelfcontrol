import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/hooks/useTheme';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { DeadlineCard } from './DeadlineCard';

interface DeadlineHeroSectionProps {
  deadline: ReadingDeadlineWithProgress;
  isPending?: boolean;
}

const DeadlineHeroSection: React.FC<DeadlineHeroSectionProps> = ({
  deadline,
  isPending = false,
}) => {
  const { colors } = useTheme();
  const { startReadingDeadline } = useDeadlines();
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
