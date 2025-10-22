import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Typography } from '@/constants/Colors';
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
            </View>
          </View>
          <DeadlineCountdownDisplay {...viewModel.componentProps.countdown} />

          {!disableNavigation && (
            <Pressable
              onPress={viewModel.handlers.onMorePress}
              hitSlop={8}
              style={styles.moreButton}
            >
              <IconSymbol
                name="ellipsis"
                size={24}
                color={colors.textMuted}
              />
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
    alignItems: 'stretch',
    overflow: 'hidden',
    borderColor: 'rgba(232, 194, 185, 0.15)',
    position: 'relative',
  },
  moreButton: {
    position: 'absolute',
    top: 1,
    right: 1,
    zIndex: 10,
    padding: 4,
  },
  bookContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flex: 3,
    minWidth: 0,
  },
  bookInfo: {
    flex: 1,
    marginBottom: 4,
  },
  bookTitle: {
    color: '#2B3D4F',
    paddingVertical: 10,
    marginLeft: 1,
    ...Typography.titleMedium,
    fontSize: 18,
  },
  capacityText: {
    color: '#2B3D4F',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 1,
  },
  dueDate: {
    color: '#6B7280',
    fontSize: 12,
  },
});

export default DeadlineCard;
