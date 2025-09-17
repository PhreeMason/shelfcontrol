import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import dayjs from '@/lib/dayjs';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';

interface DeadlineCalendarProps {
  style?: any;
}

export function DeadlineCalendar({ style }: DeadlineCalendarProps) {
  const { activeDeadlines, overdueDeadlines, getDeadlineCalculations } =
    useDeadlines();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  const { colors } = useTheme();
  const { good, approaching, urgent, overdue, impossible } = colors;

  const urgencyColorMap = useMemo(
    () => ({
      good,
      approaching,
      urgent,
      overdue,
      impossible,
    }),
    [good, approaching, urgent, overdue, impossible]
  );
  // Process deadlines to create marked dates
  const markedDates = useMemo(() => {
    const marked: any = {};

    // Combine active and overdue deadlines
    const allActiveDeadlines = [...activeDeadlines, ...overdueDeadlines];

    allActiveDeadlines.forEach(deadline => {
      if (deadline.deadline_date) {
        const dateStr = dayjs(deadline.deadline_date).format('YYYY-MM-DD');
        const { urgencyLevel } = getDeadlineCalculations(deadline);
        const color = urgencyColorMap[urgencyLevel] || urgencyColorMap.good;

        if (!marked[dateStr]) {
          marked[dateStr] = {
            marked: true,
            dots: [],
            deadlines: [],
          };
        }

        marked[dateStr].dots.push({
          key: deadline.id,
          color: color,
          selectedDotColor: color,
        });
        marked[dateStr].deadlines.push(deadline);
      }
    });

    // Add selection styling for selected date
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: Colors.light.primary,
        selectedTextColor: Colors.light.onPrimary,
      };
    }

    return marked;
  }, [
    activeDeadlines,
    overdueDeadlines,
    getDeadlineCalculations,
    selectedDate,
    urgencyColorMap,
  ]);

  // Get deadlines for selected date
  const selectedDateDeadlines =
    selectedDate && markedDates[selectedDate]
      ? markedDates[selectedDate].deadlines
      : [];

  const handleDayPress = (day: DateData) => {
    const dateStr = day.dateString;

    if (markedDates[dateStr]?.deadlines?.length > 0) {
      setSelectedDate(dateStr);
      setModalVisible(true);
    }
  };

  const handleDeadlinePress = (deadlineId: string) => {
    setModalVisible(false);
    router.push(`/deadline/${deadlineId}`);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedDate(null);
  };

  return (
    <View style={[styles.container, style]}>
      <Calendar
        markedDates={markedDates}
        markingType="multi-dot"
        onDayPress={handleDayPress}
        theme={{
          backgroundColor: '#f8f9fa',
          calendarBackground: '#f8f9fa',
          textSectionTitleColor: Colors.light.text,
          selectedDayBackgroundColor: Colors.light.primary,
          selectedDayTextColor: Colors.light.onPrimary,
          todayTextColor: Colors.light.primary,
          dayTextColor: Colors.light.text,
          textDisabledColor: Colors.light.textMuted,
          dotColor: Colors.light.primary,
          selectedDotColor: Colors.light.onPrimary,
          arrowColor: Colors.light.primary,
          monthTextColor: Colors.light.text,
          indicatorColor: Colors.light.primary,
          textDayFontFamily: 'System',
          textMonthFontFamily: 'System',
          textDayHeaderFontFamily: 'System',
          textDayFontWeight: '400',
          textMonthFontWeight: '600',
          textDayHeaderFontWeight: '600',
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
        }}
        firstDay={1}
        hideExtraDays={true}
        disableMonthChange={false}
        hideDayNames={false}
        showWeekNumbers={false}
        enableSwipeMonths={true}
      />

      {/* Modal for deadline details */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="title">
                Deadlines for{' '}
                {selectedDate ? dayjs(selectedDate).format('MMM D, YYYY') : ''}
              </ThemedText>
              <Pressable onPress={closeModal} style={styles.closeButton}>
                <IconSymbol name="xmark" size={20} color={Colors.light.text} />
              </Pressable>
            </View>

            <View style={styles.deadlinesList}>
              {/* // TODO: Sort by urgency level */}
              {selectedDateDeadlines.map(
                (deadline: ReadingDeadlineWithProgress) => {
                  const { urgencyLevel, daysLeft } =
                    getDeadlineCalculations(deadline);
                  const urgencyColor = urgencyColorMap[urgencyLevel];

                  return (
                    <Pressable
                      key={deadline.id}
                      style={styles.deadlineItem}
                      onPress={() => handleDeadlinePress(deadline.id)}
                    >
                      <View
                        style={[
                          styles.urgencyIndicator,
                          { backgroundColor: urgencyColor },
                        ]}
                      />
                      <View style={styles.deadlineContent}>
                        <ThemedText
                          style={styles.deadlineTitle}
                          numberOfLines={2}
                        >
                          {deadline.book_title}
                        </ThemedText>
                        <ThemedText
                          variant="secondary"
                          style={styles.deadlineSubtitle}
                        >
                          {daysLeft > 0
                            ? `${daysLeft} days left`
                            : daysLeft === 0
                              ? 'Due today'
                              : `${Math.abs(daysLeft)} days overdue`}
                        </ThemedText>
                      </View>
                      <IconSymbol
                        name="chevron.right"
                        size={16}
                        color={Colors.light.textMuted}
                      />
                    </Pressable>
                  );
                }
              )}
            </View>
          </ThemedView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    padding: 8,
  },
  deadlinesList: {
    gap: 12,
  },
  deadlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: 12,
    gap: 12,
  },
  urgencyIndicator: {
    width: 8,
    height: 32,
    borderRadius: 4,
  },
  deadlineContent: {
    flex: 1,
  },
  deadlineTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  deadlineSubtitle: {
    fontSize: 14,
  },
});
