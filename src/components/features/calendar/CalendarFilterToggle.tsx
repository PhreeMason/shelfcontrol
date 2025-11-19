import { ThemedIconButton } from '@/components/themed/ThemedIconButton';
import { BorderRadius } from '@/constants/Colors';
import { usePreferences } from '@/providers/PreferencesProvider';
import React from 'react';
import { Platform } from 'react-native';

/**
 * Toggle button for calendar activity filtering
 * - When OFF (default): Shows only deadline due dates and completions
 * - When ON: Shows all activity types
 */
export function CalendarFilterToggle() {
  const { showAllCalendarActivities, setShowAllCalendarActivities } =
    usePreferences();

  const handleToggle = () => {
    setShowAllCalendarActivities(!showAllCalendarActivities);
  };

  const isIOS = Platform.OS === 'ios';

  const borderRadius = BorderRadius.full

  return (
    <ThemedIconButton
    style={{ borderRadius, backgroundColor: 'transparent' }}
      icon={
        showAllCalendarActivities
          ? 'line.3.horizontal.decrease.circle.fill'
          : 'line.3.horizontal.decrease.circle'
      }
      variant="ghost"
      size={isIOS ? 'md' : 'sm'}
      iconColor={isIOS ? 'surface' : showAllCalendarActivities ? 'surface' : 'text'}
      onPress={handleToggle}
      accessibilityLabel={
        showAllCalendarActivities
          ? 'Showing all activities. Tap to show only deadlines.'
          : 'Showing only deadlines. Tap to show all activities.'
      }
    />
  );
}

