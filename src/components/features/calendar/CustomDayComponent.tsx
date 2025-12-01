import { Typography } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { usePreferences } from '@/providers/PreferencesProvider';
import { ActivityBarInfo, MarkedDatesConfig } from '@/types/calendar.types';
import { OPACITY } from '@/utils/formatters';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DateData } from 'react-native-calendars';

/**
 * Props passed by react-native-calendars to custom day components
 */
interface CustomDayComponentProps {
  date?: DateData;
  state?: 'disabled' | 'today' | '';
  marking?: MarkedDatesConfig[string];
  onPress?: (date: DateData) => void;
  onLongPress?: (date: DateData) => void;
  // Allow any additional props from the library
  [key: string]: unknown;
}

/**
 * Custom day component for the calendar that renders:
 * - Horizontal activity bars mode: colored bars filling the cell with day number overlay
 * - Cover mode: Book cover as background with urgency border
 * - Default mode: Day number with urgency-colored background
 */
export const CustomDayComponent: React.FC<CustomDayComponentProps> = ({
  date,
  state,
  marking,
  onPress,
  onLongPress,
}) => {
  const { colors } = useTheme();
  const { hideDatesOnCovers, showActivityBars, showCoverOnCalendar } =
    usePreferences();

  // Early return if no date (shouldn't happen but satisfies types)
  if (!date) {
    return null;
  }

  const isDisabled = state === 'disabled';
  const isToday = state === 'today';

  // Get custom styles from marking
  const containerStyle = marking?.customStyles?.container;
  const textStyle = marking?.customStyles?.text;
  const coverImageUrl = marking?.customStyles?.coverImageUrl;
  const activityBars = marking?.customStyles?.activityBars;
  // Determine if we should show activity bars
  const hasActivityBars = activityBars && activityBars.length > 0;
  const shouldShowBars = showActivityBars && hasActivityBars;

  // Determine if we should show cover (respects showCoverOnCalendar preference)
  const hasCoverUrl = !!coverImageUrl;
  const shouldShowCover = showCoverOnCalendar && hasCoverUrl && !shouldShowBars;

  // Handle press
  const handlePress = () => {
    if (!isDisabled && onPress) {
      onPress(date);
    }
  };

  const handleLongPress = () => {
    if (!isDisabled && onLongPress) {
      onLongPress(date);
    }
  };

  // Build text color - white when there's a cover image for contrast
  const getTextColor = () => {
    if (isDisabled) return colors.textMuted;
    if (shouldShowCover) return '#FFFFFF';
    if (textStyle?.color) return textStyle.color;
    if (isToday) return colors.primary;
    return colors.text;
  };

  const hasDeadline = !!textStyle?.color;

  // Get border color from urgency (textStyle.color has the pure urgency color)
  const urgencyBorderColor = textStyle?.color;

  // Render activity bars component
  const renderActivityBars = (bars: ActivityBarInfo[]) => (
    <View style={styles.dotsContainer}>
      {bars.map((bar, index) => (
        <View
          key={index}
          style={[styles.activityBar, { backgroundColor: bar.color }]}
        />
      ))}
    </View>
  );

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={isDisabled}
      activeOpacity={0.6}
      style={styles.wrapper}
      accessibilityRole="button"
      accessibilityLabel={`${date.day}`}
      accessibilityState={{ disabled: isDisabled }}
    >
      <View
        style={[
          styles.container,
          // Apply background color only if not showing cover or bars
          !shouldShowCover &&
          !shouldShowBars &&
          containerStyle && {
            backgroundColor: containerStyle.backgroundColor,
          },
          // Apply urgency border when there's a cover
          shouldShowCover &&
          hasDeadline && {
            borderWidth: 2,
            borderColor: urgencyBorderColor,
          },
          activityBars?.some((bar) => bar.color === '#c8696e') && {borderColor: colors.urgent, borderWidth: 1, paddingTop: 2},
          // Selection border (overrides urgency border)
          containerStyle?.borderWidth
            ? {
              borderWidth: containerStyle.borderWidth,
              borderColor: containerStyle.borderColor,
            }
            : null,
        ]}
      >
        {/* Activity bars mode - bars with centered day number overlay */}
        {shouldShowBars && activityBars && (
          <>
            <View style={styles.dayNumberBadge}>
              <Text
                style={[
                  styles.dayTextOverlay,
                  {
                    color: isDisabled
                      ? colors.textMuted
                      : isToday
                        ? colors.primary
                        : colors.text,
                  },
                ]}
              >
                {date.day}
              </Text>
            </View>
            {renderActivityBars(activityBars)}
          </>
        )}

        {/* Cover image as background (only when not showing bars) */}
        {shouldShowCover && (
          <Image
            source={{ uri: coverImageUrl }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        )}

        {/* Urgency tint overlay for readability on cover images - hidden when hideDatesOnCovers is true */}
        {shouldShowCover && hasDeadline && !hideDatesOnCovers && (
          <View
            style={[
              styles.tintOverlay,
              { backgroundColor: urgencyBorderColor + OPACITY.CALENDAR },
            ]}
          />
        )}

        {/* Day number - hidden when showing bars or when hideDatesOnCovers is true on covers */}
        {!shouldShowBars && (!shouldShowCover || !hideDatesOnCovers) && (
          <Text
            style={[
              styles.dayText,
              shouldShowCover && styles.dayTextWithCover,
              {
                color: getTextColor(),
                fontWeight: textStyle?.fontWeight ?? (isToday ? '600' : '400'),
                fontSize: 13
              },
            ]}
          >
            {date.day}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// 6:9 aspect ratio to match book covers
const CELL_WIDTH = 36;
const CELL_HEIGHT = 54;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: CELL_WIDTH,
    height: CELL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    borderRadius: 4,
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 2,
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 2,
  },
  dayText: {
    ...Typography.bodyLarge,
    textAlign: 'center',
    zIndex: 1,
  },
  dayTextWithCover: {
    // Text shadow for readability on cover images
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontWeight: '600',
  },
  dayNumberBadge: {
    borderRadius: 10,
    minWidth: 20,
  },
  dayTextOverlay: {
    ...Typography.labelMedium,
    textAlign: 'center',
    fontSize: 13,
  },
  dotsContainer: {
    flex: 1,
    width: '100%',
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignContent: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  activityBar: {
    height: 10,
    width: 10,
    borderRadius: '100%',
  },
});
