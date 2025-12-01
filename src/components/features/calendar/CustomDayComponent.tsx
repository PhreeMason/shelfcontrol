import { Typography } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { usePreferences } from '@/providers/PreferencesProvider';
import { MarkedDatesConfig } from '@/types/calendar.types';
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
 * - Book cover as background (if available) with 6:9 aspect ratio
 * - Urgency color as border
 * - Day number with text shadow for readability
 */
export const CustomDayComponent: React.FC<CustomDayComponentProps> = ({
  date,
  state,
  marking,
  onPress,
  onLongPress,
}) => {
  const { colors } = useTheme();
  const { hideDatesOnCovers } = usePreferences();

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
    if (coverImageUrl) return '#FFFFFF';
    if (textStyle?.color) return textStyle.color;
    if (isToday) return colors.primary;
    return colors.text;
  };

  const hasCover = !!coverImageUrl;
  const hasDeadline = !!textStyle?.color;

  // Get border color from urgency (textStyle.color has the pure urgency color)
  const urgencyBorderColor = textStyle?.color;

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
          // Apply background color only if no cover image
          !hasCover &&
            containerStyle && {
              backgroundColor: containerStyle.backgroundColor,
            },
          // Apply urgency border when there's a cover
          hasCover &&
            hasDeadline && {
              borderWidth: 2,
              borderColor: urgencyBorderColor,
            },
          // Selection border (overrides urgency border)
          containerStyle?.borderWidth
            ? {
                borderWidth: containerStyle.borderWidth,
                borderColor: containerStyle.borderColor,
              }
            : null,
        ]}
      >
        {/* Cover image as background */}
        {hasCover && (
          <Image
            source={{ uri: coverImageUrl }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        )}

        {/* Urgency tint overlay for readability on cover images - hidden when hideDatesOnCovers is true */}
        {hasCover && hasDeadline && !hideDatesOnCovers && (
          <View
            style={[
              styles.tintOverlay,
              { backgroundColor: urgencyBorderColor + OPACITY.CALENDAR },
            ]}
          />
        )}

        {/* Day number - hidden on covers when hideDatesOnCovers is true */}
        {(!hasCover || !hideDatesOnCovers) && (
          <Text
            style={[
              styles.dayText,
              hasCover && styles.dayTextWithCover,
              {
                color: getTextColor(),
                fontWeight: textStyle?.fontWeight ?? (isToday ? '600' : '400'),
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
    justifyContent: 'center',
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
});
