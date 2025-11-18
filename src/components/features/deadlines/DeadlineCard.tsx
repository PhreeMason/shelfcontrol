import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Spacing, Typography } from '@/constants/Colors';
import { useDeadlineCardViewModel } from '@/hooks/useDeadlineCardViewModel';
import { useTheme } from '@/hooks/useThemeColor';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { DeadlineActionSheet } from './DeadlineActionSheet';
import { DeadlineBookCover } from './DeadlineBookCover';
import { DeadlineCountdownDisplay } from './DeadlineCountdownDisplay';

interface DeadlineCardProps {
  deadline: ReadingDeadlineWithProgress;
  disableNavigation?: boolean;
}

export function DeadlineCard({
  deadline,
  disableNavigation = false,
}: DeadlineCardProps) {
  const { colors } = useTheme();
  const viewModel = useDeadlineCardViewModel({ deadline, disableNavigation });

  return (
    <>
      <Pressable
        onPress={viewModel.handlers.onCardPress}
        style={({ pressed }) => [
          { opacity: pressed ? 0.8 : 1, backgroundColor: 'transparent' },
        ]}
      >
        <View
          style={[styles.cardContainer, viewModel.styling.cardContainerStyle]}
        >
          <View style={styles.bookContent}>
            <DeadlineBookCover {...viewModel.componentProps.bookCover} />
            <View style={styles.bookInfo}>
              <ThemedText style={styles.bookTitle} numberOfLines={2}>
                {viewModel.display.title}
              </ThemedText>

              <View style={styles.additionalInfo}>
                {!viewModel.flags.isArchived && (
                  <ThemedText style={styles.capacityText}>
                    {viewModel.display.primaryText}
                  </ThemedText>
                )}
                {viewModel.flags.isArchived && (
                  <ThemedText style={styles.capacityText}>
                    {viewModel.display.secondaryText}
                  </ThemedText>
                )}
                {!viewModel.flags.isArchived && (
                  <ThemedText style={styles.dueDate}>
                    {viewModel.display.secondaryText}
                  </ThemedText>
                )}
                {!viewModel.flags.isArchived && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${viewModel.progress.progressPercentage}%`,
                            backgroundColor: viewModel.styling.countdownColor,
                          },
                        ]}
                      />
                    </View>
                    <ThemedText variant="muted" style={styles.progressLabel}>
                      {Math.round(viewModel.progress.progressPercentage)}%
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          </View>
          <DeadlineCountdownDisplay {...viewModel.componentProps.countdown} />

          {!disableNavigation && (
            <Pressable
              onPress={viewModel.handlers.onMorePress}
              hitSlop={8}
              style={styles.moreButton}
            >
              <IconSymbol name="ellipsis" size={24} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </Pressable>

      {!disableNavigation && (
        <DeadlineActionSheet
          {...viewModel.componentProps.actionSheet}
          onClose={() => viewModel.state.setShowActionSheet(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 5,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 0,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    borderColor: 'rgba(232, 194, 185, 0.15)',
    position: 'relative',
  },
  moreButton: {
    position: 'absolute',
    top: 1,
    right: 1,
    zIndex: 10,
    padding: Spacing.xs,
  },
  bookContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    flex: 3,
    minWidth: 0,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    color: '#2B3D4F',
    marginBottom: Spacing.sm,
    ...Typography.titleMedium,
    fontSize: 18,
  },
  additionalInfo: {
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  capacityText: {
    color: '#2B3D4F',
    fontSize: 13,
    lineHeight: 15,
    fontWeight: '600',
  },
  dueDate: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 14,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(232, 194, 185, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '500',
    minWidth: 30,
  },
});

export default DeadlineCard;
