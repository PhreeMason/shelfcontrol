import { ThemedIconButton } from '@/components/themed/ThemedIconButton';
import { BorderRadius } from '@/constants/Colors';
import { usePreferences } from '@/providers/PreferencesProvider';
import React, { useState } from 'react';
import { Platform } from 'react-native';
import { CalendarFilterSheet } from './CalendarFilterSheet';

/**
 * Toggle button for calendar activity filtering
 * Opens a sheet to select which activities to show
 */
export function CalendarFilterToggle() {
  const { excludedCalendarActivities, setExcludedCalendarActivities } =
    usePreferences();
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const handleToggle = () => {
    setShowFilterSheet(true);
  };

  const isIOS = Platform.OS === 'ios';
  const borderRadius = BorderRadius.full;
  const hasActiveFilters = excludedCalendarActivities.length > 0;

  return (
    <>
      <ThemedIconButton
        style={{ borderRadius, backgroundColor: 'transparent' }}
        icon={
          hasActiveFilters
            ? 'line.3.horizontal.decrease.circle.fill'
            : 'line.3.horizontal.decrease.circle'
        }
        variant="ghost"
        size={isIOS ? 'md' : 'sm'}
        iconColor={
          isIOS ? 'surface' : hasActiveFilters ? 'surface' : 'text'
        }
        onPress={handleToggle}
        accessibilityLabel={
          hasActiveFilters
            ? 'Filters active. Tap to change filters.'
            : 'No filters active. Tap to filter activities.'
        }
      />
      <CalendarFilterSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        excludedActivities={excludedCalendarActivities}
        onExcludedActivitiesChange={setExcludedCalendarActivities}
      />
    </>
  );
}
