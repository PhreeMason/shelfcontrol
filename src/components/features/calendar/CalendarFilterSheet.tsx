import { ThemedButton } from '@/components/themed/ThemedButton';
import { ThemedText } from '@/components/themed/ThemedText';
import { CalendarFilterType } from '@/constants/activityTypes';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { Shadows } from '@/constants/Theme';
import { useTheme } from '@/hooks/useThemeColor';
import { usePreferences } from '@/providers/PreferencesProvider';
import { OPACITY } from '@/utils/formatters';
import React, { useEffect } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CalendarFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  excludedActivities: CalendarFilterType[];
  onExcludedActivitiesChange: (activities: CalendarFilterType[]) => void;
}

interface FilterConfig {
  type: CalendarFilterType;
  label: string;
  /** Theme color key for urgency-based colors (due date filters) or feature colors */
  colorKey?: 'successGreen' | 'good' | 'approaching' | 'urgent' | 'reviewsPending' | 'accent';
}

// Due date filters with urgency-based coloring (matching calendar legend)
// Includes all-day events like custom_date (Important Dates)
const DUE_DATE_FILTERS: FilterConfig[] = [
  {
    type: 'deadline_due_completed',
    label: 'Completed',
    colorKey: 'successGreen',
  },
  { type: 'deadline_due_good', label: 'On Track', colorKey: 'good' },
  { type: 'deadline_due_approaching', label: 'Tight', colorKey: 'approaching' },
  {
    type: 'deadline_due_urgent',
    label: 'Needs Replanning',
    colorKey: 'urgent',
  },
  { type: 'custom_date', label: 'Important Dates', colorKey: 'accent' },
];

// Activity event filters (no color boxes, just labels)
const ACTIVITY_FILTERS: FilterConfig[] = [
  { type: 'progress_complete', label: 'Progress Complete' },
  { type: 'deadline_created', label: 'New Books Added' },
  { type: 'progress', label: 'Progress Updates' },
  { type: 'status', label: 'Status Changes' },
  { type: 'note', label: 'Notes' },
  { type: 'review', label: 'Reviews Posted' },
  { type: 'review_due', label: 'Review Due Dates' },
];

// Daily reminder filters (show on today's date)
const DAILY_REMINDER_FILTERS: FilterConfig[] = [
  { type: 'reviews_pending', label: 'Reviews Pending', colorKey: 'reviewsPending' },
];

// All filter types combined for Clear All / Select All functionality
const ALL_FILTER_TYPES: CalendarFilterType[] = [
  ...DUE_DATE_FILTERS.map(f => f.type),
  ...ACTIVITY_FILTERS.map(f => f.type),
  ...DAILY_REMINDER_FILTERS.map(f => f.type),
];

export const CalendarFilterSheet: React.FC<CalendarFilterSheetProps> = ({
  visible,
  onClose,
  excludedActivities,
  onExcludedActivitiesChange,
}) => {
  const { colors } = useTheme();
  const {
    hideDatesOnCovers,
    setHideDatesOnCovers,
    showActivityBars,
    setShowActivityBars,
    showCoverOnCalendar,
    setShowCoverOnCalendar,
  } = usePreferences();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(1000);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    } else {
      translateY.value = withSpring(1000, { damping: 20, stiffness: 200 });
    }
  }, [visible, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const toggleActivity = (type: CalendarFilterType) => {
    if (excludedActivities.includes(type)) {
      onExcludedActivitiesChange(excludedActivities.filter(t => t !== type));
    } else {
      onExcludedActivitiesChange([...excludedActivities, type]);
    }
  };

  const clearAllFilters = () => {
    onExcludedActivitiesChange(ALL_FILTER_TYPES);
  };

  const selectAllFilters = () => {
    onExcludedActivitiesChange([]);
  };

  // Mutual exclusivity handlers for covers vs activity bars
  const handleActivityBarsChange = (value: boolean) => {
    setShowActivityBars(value);
    if (value) {
      setShowCoverOnCalendar(false);
    }
  };

  const handleCoverOnCalendarChange = (value: boolean) => {
    setShowCoverOnCalendar(value);
    if (value) {
      setShowActivityBars(false);
    }
  };

  // Show "Clear All" when any filters are selected (items showing)
  const hasActiveFilters = excludedActivities.length < ALL_FILTER_TYPES.length;
  // Show "Select All" when all filters are cleared (nothing showing)
  const allFiltersCleared =
    excludedActivities.length === ALL_FILTER_TYPES.length;

  // Render a filter item - color boxes only for due date filters (colorKey)
  const renderFilterItem = (filter: FilterConfig) => {
    const isExcluded = excludedActivities.includes(filter.type);
    // Only show color box for urgency-based due date filters (colorKey), not activity filters
    const showColorBox = !!filter.colorKey;
    const color = filter.colorKey ? colors[filter.colorKey] : undefined;

    // Due date filters use urgency color for border/text, activity filters use primary
    const activeColor = color ?? colors.primary;

    return (
      <TouchableOpacity
        key={filter.type}
        style={[
          styles.filterItem,
          {
            borderColor: !isExcluded ? activeColor : colors.border,
          },
        ]}
        onPress={() => toggleActivity(filter.type)}
        activeOpacity={0.7}
      >
        {showColorBox && color && (
          <View
            style={[
              styles.colorBox,
              { backgroundColor: color + OPACITY.CALENDAR },
            ]}
          >
            <ThemedText typography="labelSmall" style={{ color }}>
              12
            </ThemedText>
          </View>
        )}
        <ThemedText
          typography="labelLarge"
          style={[styles.filterLabel, !isExcluded && { color: activeColor }]}
        >
          {filter.label}
        </ThemedText>
      </TouchableOpacity>
    );
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
        accessibilityLabel="Close filter sheet"
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + Spacing.md,
            },
            animatedStyle,
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.header}>
            <ThemedText typography="titleSubLarge" style={styles.title}>
              Filter Activities
            </ThemedText>
            <View style={styles.headerActions}>
              {hasActiveFilters && (
                <TouchableOpacity
                  onPress={clearAllFilters}
                  style={styles.clearButton}
                >
                  <ThemedText
                    typography="titleMedium"
                    style={[styles.closeButton, { color: colors.darkPink }]}
                  >
                    Clear All
                  </ThemedText>
                </TouchableOpacity>
              )}
              {allFiltersCleared && (
                <TouchableOpacity
                  onPress={selectAllFilters}
                  style={styles.clearButton}
                >
                  <ThemedText
                    typography="titleMedium"
                    style={[styles.closeButton, { color: colors.primary }]}
                  >
                    Select All
                  </ThemedText>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose}>
                <ThemedText typography="titleMedium" style={styles.closeButton}>
                  Done
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {/* Due Date Filters Section */}
            <View style={styles.section}>
              <ThemedText typography="titleMedium" style={styles.sectionTitle}>
                Due Dates
              </ThemedText>
              <View style={styles.filterRow}>
                {DUE_DATE_FILTERS.map(renderFilterItem)}
              </View>
            </View>

            {/* Activity Events Section */}
            <View style={styles.section}>
              <ThemedText typography="titleMedium" style={styles.sectionTitle}>
                Activity Events
              </ThemedText>
              <View style={styles.filterRow}>
                {ACTIVITY_FILTERS.map(renderFilterItem)}
              </View>
            </View>

            {/* Daily Reminders Section */}
            <View style={styles.section}>
              <ThemedText typography="titleMedium" style={styles.sectionTitle}>
                Daily Reminders
              </ThemedText>
              <View style={styles.filterRow}>
                {DAILY_REMINDER_FILTERS.map(renderFilterItem)}
              </View>
            </View>

            {/* Display Options Section */}
            <View style={styles.section}>
              <ThemedText typography="titleMedium" style={styles.sectionTitle}>
                Display Options
              </ThemedText>
              <View style={styles.toggleRow}>
                <ThemedText typography="labelLarge">
                  Show activity dots
                </ThemedText>
                <Switch
                  value={showActivityBars}
                  onValueChange={handleActivityBarsChange}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
              <View style={styles.toggleRow}>
                <ThemedText typography="labelLarge">
                  Show book covers
                </ThemedText>
                <Switch
                  value={showCoverOnCalendar}
                  onValueChange={handleCoverOnCalendarChange}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
              <View style={styles.toggleRow}>
                <ThemedText typography="labelLarge">
                  Hide dates on covers
                </ThemedText>
                <Switch
                  value={hideDatesOnCovers}
                  onValueChange={setHideDatesOnCovers}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <ThemedButton
              title="APPLY"
              variant="primary"
              style={styles.applyButton}
              onPress={onClose}
            />
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
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '85%',
    ...Shadows.elevated,
  },
  scrollView: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  clearButton: {
    marginRight: 0,
  },
  title: {
    fontWeight: '700',
  },
  closeButton: {
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  colorBox: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterLabel: {
    // Label styling handled by ThemedText
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  applyButton: {
    paddingVertical: Spacing.md,
    width: '100%',
  },
});
