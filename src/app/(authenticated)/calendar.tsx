import { ActivityTimelineItem } from '@/components/features/calendar/ActivityTimelineItem';
import { CalendarFilterToggle } from '@/components/features/calendar/CalendarFilterToggle';
import { CalendarLegend } from '@/components/features/calendar/CalendarLegend';
import { CustomDateCalendarCard } from '@/components/features/calendar/CustomDateCalendarCard';
import { CustomDayComponent } from '@/components/features/calendar/CustomDayComponent';
import { DeadlineDueCard } from '@/components/features/calendar/DeadlineDueCard';
import { ReviewDueCard } from '@/components/features/calendar/ReviewDueCard';
import AppHeader from '@/components/shared/AppHeader';
import { ThemedText } from '@/components/themed';
import { CalendarFilterType } from '@/constants/activityTypes';
import { useGetDailyActivities } from '@/hooks/useCalendar';
import { useTheme } from '@/hooks/useTheme';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { usePreferences } from '@/providers/PreferencesProvider';
import { validateDailyActivities } from '@/types/calendar.types';
import {
  ReadingDeadlineWithProgress,
  UrgencyLevel,
} from '@/types/deadline.types';
import {
  calculateMarkedDates,
  transformActivitiesToAgendaItems,
} from '@/utils/calendarUtils';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';

// Empty function constant for callbacks that don't need to do anything
const NOOP = () => { };

/**
 * Generate a unique key for agenda items in the list
 */
function generateAgendaItemKey(
  deadlineId: string,
  activityType: string,
  index: number
): string {
  return `agenda-${activityType}-${deadlineId}-${index}`;
}

export default function CalendarScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { excludedCalendarActivities } = usePreferences();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Calculate date range for current month plus buffer (prev/next month)
  const { startDate, endDate } = useMemo(() => {
    const today = selectedMonth;
    const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

    const start = prevMonth.toISOString().split('T')[0];
    const end = nextMonth.toISOString().split('T')[0];

    return { startDate: start, endDate: end };
  }, [selectedMonth]);

  // Fetch activities for the date range
  const {
    data: rawActivities = [],
    isLoading,
    isFetching,
    error,
  } = useGetDailyActivities(startDate, endDate);

  // Validate and transform activities from database (validates types and structure)
  const activities = useMemo(
    () => validateDailyActivities(rawActivities),
    [rawActivities]
  );

  // Get deadline calculations (must be before filteredActivities)
  const { deadlines, getDeadlineCalculations } = useDeadlines();

  /**
   * Map urgency level to the corresponding CalendarFilterType for deadline_due activities
   */
  const getDeadlineFilterType = (
    urgencyLevel: UrgencyLevel,
    deadline: ReadingDeadlineWithProgress
  ): CalendarFilterType => {
    // Get latest status (status array is sorted ASC by created_at, so last element is most recent)
    const statusArray = deadline.status;
    const currentStatus =
      statusArray && statusArray.length > 0
        ? statusArray[statusArray.length - 1].status
        : undefined;

    // Check if deadline is completed (status-based, not urgency-based)
    if (currentStatus === 'complete') {
      return 'deadline_due_completed';
    }

    // Map urgency levels to filter types
    switch (urgencyLevel) {
      case 'good':
        return 'deadline_due_good';
      case 'approaching':
        return 'deadline_due_approaching';
      case 'urgent':
      case 'overdue':
      case 'impossible':
        return 'deadline_due_urgent';
      default:
        return 'deadline_due_good'; // Default to "on track"
    }
  };

  // Filter activities based on user preference
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      // Special handling for deadline_due - check urgency-based filters
      if (activity.activity_type === 'deadline_due') {
        const deadline = deadlines.find(d => d.id === activity.deadline_id);
        if (deadline) {
          const calculations = getDeadlineCalculations(deadline);
          const filterType = getDeadlineFilterType(
            calculations.urgencyLevel,
            deadline
          );
          return !excludedCalendarActivities.includes(filterType);
        }
        return true; // Show if we can't find the deadline
      }

      // For non-deadline_due activities, check directly against activity type
      if (
        excludedCalendarActivities.includes(
          activity.activity_type as CalendarFilterType
        )
      ) {
        return false;
      }

      return true;
    });
  }, [
    activities,
    excludedCalendarActivities,
    deadlines,
    getDeadlineCalculations,
  ]);

  // Transform activities to agenda format
  const agendaItems = useMemo(() => {
    return transformActivitiesToAgendaItems(
      filteredActivities,
      deadlines,
      getDeadlineCalculations
    );
  }, [filteredActivities, deadlines, getDeadlineCalculations]);

  // Calculate marked dates for calendar with custom styling
  const markedDates = useMemo(() => {
    const marked = calculateMarkedDates(
      filteredActivities,
      deadlines,
      getDeadlineCalculations
    );

    // Add selection styling (border overlay preserves urgency background)
    if (marked[selectedDate]) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        customStyles: {
          ...marked[selectedDate].customStyles,
          container: {
            ...marked[selectedDate].customStyles?.container,
            borderWidth: 2,
            borderColor: colors.primary,
          },
        },
      };
    } else {
      marked[selectedDate] = {
        customStyles: {
          container: {
            borderWidth: 2,
            borderColor: colors.primary,
            borderRadius: 4,
          },
          text: {
            fontWeight: 'bold',
          },
        },
      };
    }

    return marked;
  }, [
    filteredActivities,
    deadlines,
    getDeadlineCalculations,
    selectedDate,
    colors.primary,
  ]);

  // Get activities for selected date
  const selectedDateActivities = useMemo(
    () => agendaItems[selectedDate] || [],
    [agendaItems, selectedDate]
  );

  // Separate deadline due from other activities
  const deadlineDueActivities = useMemo(
    () =>
      selectedDateActivities.filter(
        item => item.activityType === 'deadline_due'
      ),
    [selectedDateActivities]
  );

  // Separate review_due activities (all-day cards like deadline_due)
  const reviewDueActivities = useMemo(
    () =>
      selectedDateActivities.filter(item => item.activityType === 'review_due'),
    [selectedDateActivities]
  );

  const customDateActivities = useMemo(
    () =>
      selectedDateActivities.filter(
        item => item.activityType === 'custom_date'
      ),
    [selectedDateActivities]
  );

  const otherActivities = useMemo(
    () =>
      selectedDateActivities.filter(
        item =>
          item.activityType !== 'deadline_due' &&
          item.activityType !== 'review_due' &&
          item.activityType !== 'custom_date'
      ),
    [selectedDateActivities]
  );

  // Handle day press
  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString);
  }, []);

  // Handle month change
  const handleMonthChange = useCallback((month: DateData) => {
    const newMonth = new Date(month.dateString);
    setSelectedMonth(newMonth);
  }, []);

  // Get current month string for Calendar component
  const currentMonth = useMemo(() => {
    return selectedMonth.toISOString().split('T')[0];
  }, [selectedMonth]);

  // Loading state - only show full page loader on initial load
  if (isLoading && activities.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['right', 'left']}>
        <AppHeader
          title="Activity Calendar"
          onBack={NOOP}
          showBackButton={false}
          rightElement={<CalendarFilterToggle />}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>
            Loading activities...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['right', 'left']}
      >
        <AppHeader
          title="Activity Calendar"
          onBack={NOOP}
          showBackButton={false}
          rightElement={<CalendarFilterToggle />}
        />
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            Failed to load activities
          </ThemedText>
          <ThemedText variant="muted" style={styles.errorSubtext}>
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['right', 'left']}
    >
      <AppHeader
        title="Activity Calendar"
        onBack={NOOP}
        showBackButton={false}
        rightElement={<CalendarFilterToggle />}
      />
      <View style={styles.content}>
        <View
          style={[
            styles.calendarContainer,
            { borderBottomColor: colors.border },
          ]}
        >
          <Calendar
            current={currentMonth}
            markedDates={markedDates}
            hideExtraDays
            enableSwipeMonths
            dayComponent={CustomDayComponent as React.ComponentType}
            onDayPress={handleDayPress}
            onMonthChange={handleMonthChange}
            theme={{
              backgroundColor: colors.background,
              calendarBackground: colors.background,
              textSectionTitleColor: colors.text,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: colors.background,
              todayTextColor: colors.primary,
              dayTextColor: colors.text,
              textDisabledColor: colors.textMuted,
              dotColor: colors.primary,
              selectedDotColor: colors.background,
              arrowColor: colors.primary,
              monthTextColor: colors.text,
            }}
          />
        </View>

        <ScrollView
          style={styles.activitiesList}
          contentContainerStyle={styles.activitiesContent}
        >
          <CalendarLegend />

          {isFetching && (
            <View style={styles.inlineLoadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <ThemedText variant="muted" style={styles.inlineLoadingText}>
                Loading activities...
              </ThemedText>
            </View>
          )}

          {selectedDateActivities.length > 0 ? (
            <View>
              {/* Deadline Due Items (All-Day) - Rendered First */}
              {deadlineDueActivities.map((item, index) => (
                <DeadlineDueCard
                  key={generateAgendaItemKey(
                    item.activity.deadline_id,
                    'deadline_due',
                    index
                  )}
                  agendaItem={item}
                  onPress={() =>
                    router.push(`/deadline/${item.activity.deadline_id}`)
                  }
                />
              ))}

              {/* Custom Date Items (All-Day) - Rendered After Deadlines */}
              {customDateActivities.map((item, index) => (
                <CustomDateCalendarCard
                  key={generateAgendaItemKey(
                    item.activity.deadline_id,
                    'custom_date',
                    index
                  )}
                  agendaItem={item}
                  onPress={() =>
                    router.push(`/deadline/${item.activity.deadline_id}`)
                  }
                />
              ))}

              {/* Review Due Items (All-Day) - Rendered After Deadlines */}
              {reviewDueActivities.map((item, index) => (
                <ReviewDueCard
                  key={generateAgendaItemKey(
                    item.activity.deadline_id,
                    'review_due',
                    index
                  )}
                  activity={item.activity}
                  onPress={() =>
                    router.push(`/deadline/${item.activity.deadline_id}`)
                  }
                />
              ))}

              {/* Other Activities (Timed) - Rendered After */}
              {otherActivities.map((item, index) => (
                <ActivityTimelineItem
                  key={generateAgendaItemKey(
                    item.activity.deadline_id,
                    item.activityType,
                    index
                  )}
                  activity={item.activity}
                  onPress={() => {
                    if (item.activityType === 'note') {
                      router.push(
                        `/deadline/${item.activity.deadline_id}/notes`
                      );
                    } else {
                      router.push(`/deadline/${item.activity.deadline_id}`);
                    }
                  }}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <ThemedText variant="muted">
                No activities for this day
              </ThemedText>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  calendarContainer: {
    borderBottomWidth: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  activitiesList: {
    flex: 1,
  },
  activitiesContent: {
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 100,
  },
  emptyState: {
    paddingTop: 40,
    alignItems: 'center',
  },
  inlineLoadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  inlineLoadingText: {
    fontSize: 14,
  },
});
