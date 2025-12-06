import { BorderRadius, Spacing } from '@/constants/Colors';
import { StyleSheet } from 'react-native';

/**
 * Shared styles for calendar card components (DeadlineDueCard, ReviewsPendingCard, etc.)
 * Extracted to avoid duplication across similar card layouts.
 */
export const calendarCardStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  pressed: {
    opacity: 0.7,
  },
  timeColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  timelineColumn: {
    alignItems: 'center',
    position: 'relative',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    borderWidth: 2,
  },
  content: {
    flex: 1,
    paddingLeft: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
  bookTitle: {
    marginBottom: 4,
  },
});
