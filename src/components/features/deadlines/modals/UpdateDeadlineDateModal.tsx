import { ThemedButton } from '@/components/themed/ThemedButton';
import { ThemedText } from '@/components/themed/ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { dayjs } from '@/lib/dayjs';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  calculateDeadlineImpact,
  getFeasibilityConfig,
  getQuickSelectDate,
  QuickSelectType,
} from '@/utils/deadlineModalUtils';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface UpdateDeadlineDateModalProps {
  deadline: ReadingDeadlineWithProgress;
  visible: boolean;
  onClose: () => void;
}

export const UpdateDeadlineDateModal: React.FC<
  UpdateDeadlineDateModalProps
> = ({ deadline, visible, onClose }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(500);
  const { updateDeadlineDate, userPaceData, userListeningPaceData } =
    useDeadlines();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(deadline.deadline_date)
  );

  const currentDeadlineDate = useMemo(
    () => new Date(deadline.deadline_date),
    [deadline.deadline_date]
  );

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  useEffect(() => {
    if (visible) {
      setSelectedDate(new Date(deadline.deadline_date));
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    } else {
      translateY.value = withSpring(500, { damping: 20, stiffness: 200 });
    }
  }, [visible, deadline.deadline_date, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleQuickSelectDate = useCallback(
    (type: QuickSelectType): Date => {
      const baseDate =
        currentDeadlineDate < today ? today : currentDeadlineDate;
      return getQuickSelectDate(baseDate, type);
    },
    [currentDeadlineDate, today]
  );

  const getImpactData = useCallback(
    (newDate: Date) => {
      return calculateDeadlineImpact(
        newDate,
        deadline,
        today,
        userPaceData,
        userListeningPaceData
      );
    },
    [deadline, today, userPaceData, userListeningPaceData]
  );

  const impactData = useMemo(
    () => getImpactData(selectedDate),
    [selectedDate, getImpactData]
  );

  const handleQuickSelect = (type: QuickSelectType) => {
    const date = handleQuickSelectDate(type);
    setSelectedDate(date);
  };

  const handleDayPress = (day: DateData) => {
    const date = new Date(day.year, day.month - 1, day.day);
    if (date >= today) {
      setSelectedDate(date);
    }
  };

  const handleSave = () => {
    setIsUpdating(true);

    updateDeadlineDate(
      deadline.id,
      selectedDate.toISOString(),
      () => {
        setIsUpdating(false);
        onClose();
      },
      error => {
        setIsUpdating(false);
        console.error('Failed to update due date:', error);
      }
    );
  };

  const formatDateShort = (date: Date): string => {
    return dayjs(date).format('MMM D');
  };

  const markedDates = useMemo(() => {
    const marks: any = {};

    const todayStr = dayjs(today).format('YYYY-MM-DD');
    marks[todayStr] = {
      customStyles: {
        container: {
          borderWidth: 2,
          borderColor: colors.primary,
        },
        text: {
          color: colors.text,
          fontWeight: '600',
        },
      },
    };

    const currentDeadlineStr = dayjs(currentDeadlineDate).format('YYYY-MM-DD');
    marks[currentDeadlineStr] = {
      customStyles: {
        container: {
          backgroundColor: colors.error + '20',
        },
        text: {
          color: colors.text,
        },
      },
    };

    const selectedStr = dayjs(selectedDate).format('YYYY-MM-DD');
    marks[selectedStr] = {
      selected: true,
      customStyles: {
        container: {
          backgroundColor: colors.primary,
        },
        text: {
          color: colors.surface,
          fontWeight: '600',
        },
      },
    };

    return marks;
  }, [selectedDate, today, currentDeadlineDate, colors]);

  const feasibilityConfig = useMemo(
    () => getFeasibilityConfig(impactData.feasibility, colors),
    [impactData.feasibility, colors]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
            },
            animatedStyle,
          ]}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <ThemedText style={styles.title}>Update due date</ThemedText>
          </View>

          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={true}
            bounces={true}
          >
            <View style={styles.content}>
              <View style={styles.dateComparison}>
                <View
                  style={[
                    styles.dateBox,
                    styles.currentDateBox,
                    {
                      backgroundColor: colors.surfaceVariant,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <ThemedText style={styles.dateLabel}>Current</ThemedText>
                  <ThemedText style={styles.dateValue}>
                    {formatDateShort(currentDeadlineDate)}
                  </ThemedText>
                </View>

                <ThemedText style={[styles.arrow, { color: colors.primary }]}>
                  →
                </ThemedText>

                <View
                  style={[
                    styles.dateBox,
                    styles.newDateBox,
                    {
                      backgroundColor: colors.primary + '10',
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <ThemedText style={styles.dateLabel}>New</ThemedText>
                  <ThemedText style={styles.dateValue}>
                    {formatDateShort(selectedDate)}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>
                  Quick Select
                </ThemedText>
                <View style={styles.quickSelectGrid}>
                  <Pressable
                    style={[
                      styles.quickButton,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => handleQuickSelect('week')}
                  >
                    <ThemedText style={styles.quickButtonText}>
                      +1 week
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.quickButton,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => handleQuickSelect('twoWeeks')}
                  >
                    <ThemedText style={styles.quickButtonText}>
                      +2 weeks
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.quickButton,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => handleQuickSelect('month')}
                  >
                    <ThemedText style={styles.quickButtonText}>
                      +1 month
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.quickButton,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => handleQuickSelect('endOfMonth')}
                  >
                    <ThemedText style={styles.quickButtonText}>
                      End of month
                    </ThemedText>
                  </Pressable>
                </View>
              </View>

              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Select Date</ThemedText>
                <View
                  style={[
                    styles.calendarContainer,
                    { backgroundColor: colors.surfaceVariant },
                  ]}
                >
                  <Calendar
                    key={dayjs(selectedDate).format('YYYY-MM-DD')}
                    current={dayjs(selectedDate).format('YYYY-MM-DD')}
                    onDayPress={handleDayPress}
                    markedDates={markedDates}
                    markingType="custom"
                    minDate={dayjs(today).format('YYYY-MM-DD')}
                    theme={{
                      backgroundColor: colors.surfaceVariant,
                      calendarBackground: colors.surfaceVariant,
                      textSectionTitleColor: colors.textMuted,
                      selectedDayBackgroundColor: colors.primary,
                      selectedDayTextColor: colors.surface,
                      todayTextColor: colors.primary,
                      dayTextColor: colors.text,
                      textDisabledColor: colors.textMuted + '40',
                      dotColor: colors.primary,
                      selectedDotColor: colors.surface,
                      arrowColor: colors.primary,
                      monthTextColor: colors.text,
                      indicatorColor: colors.primary,
                      textDayFontWeight: '400',
                      textMonthFontWeight: '600',
                      textDayHeaderFontWeight: '600',
                      textDayFontSize: 14,
                      textMonthFontSize: 16,
                      textDayHeaderFontSize: 12,
                    }}
                    enableSwipeMonths
                  />
                </View>
              </View>

              <View
                style={[
                  styles.impactSection,
                  {
                    backgroundColor: feasibilityConfig.backgroundColor,
                    borderColor: feasibilityConfig.color,
                  },
                ]}
              >
                <View style={styles.impactHeader}>
                  <ThemedText
                    style={[
                      styles.impactTitle,
                      { color: feasibilityConfig.color },
                    ]}
                  >
                    Reading Impact
                  </ThemedText>
                </View>

                <View style={styles.impactContent}>
                  <View style={styles.impactRow}>
                    <ThemedText
                      style={[
                        styles.impactLabel,
                        { color: feasibilityConfig.color },
                      ]}
                    >
                      Days remaining:
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.impactValue,
                        { color: feasibilityConfig.color },
                      ]}
                    >
                      {impactData.daysRemaining} days
                    </ThemedText>
                  </View>

                  <View style={styles.impactRow}>
                    <ThemedText
                      style={[
                        styles.impactLabel,
                        { color: feasibilityConfig.color },
                      ]}
                    >
                      Required pace:
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.impactValue,
                        { color: feasibilityConfig.color },
                      ]}
                    >
                      {impactData.requiredPace} {impactData.unit}/day
                    </ThemedText>
                  </View>

                  <View style={styles.impactRow}>
                    <ThemedText
                      style={[
                        styles.impactLabel,
                        { color: feasibilityConfig.color },
                      ]}
                    >
                      Change from current:
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.impactValue,
                        { color: feasibilityConfig.color },
                      ]}
                    >
                      {impactData.paceChange > 0 ? '+' : ''}
                      {impactData.paceChange} {impactData.unit}/day
                    </ThemedText>
                  </View>
                </View>

                <View
                  style={[
                    styles.feasibilityIndicator,
                    { backgroundColor: feasibilityConfig.color },
                  ]}
                >
                  <ThemedText
                    style={[styles.feasibilityText, { color: colors.surface }]}
                  >
                    {feasibilityConfig.text}
                  </ThemedText>
                </View>
              </View>
            </View>
          </ScrollView>

          <View
            style={[
              styles.buttonContainer,
              {
                borderTopColor: colors.border,
                paddingBottom: insets.bottom + 16,
              },
            ]}
          >
            <ThemedButton
              title="Cancel"
              variant="outline"
              style={styles.button}
              onPress={onClose}
              disabled={isUpdating}
            />
            <ThemedButton
              title={isUpdating ? '' : 'Save'}
              variant="primary"
              style={styles.button}
              onPress={handleSave}
              disabled={isUpdating}
            >
              {isUpdating && (
                <ActivityIndicator color={colors.surface} size="small" />
              )}
            </ThemedButton>
          </View>
        </Animated.View>
      </View>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    flexDirection: 'column',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexShrink: 0,
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  scrollContent: {
    flexShrink: 1,
  },
  scrollContentContainer: {
    paddingBottom: 8,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  dateComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  currentDateBox: {
    borderWidth: 1,
  },
  newDateBox: {
    borderWidth: 2,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    opacity: 0.7,
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  arrow: {
    fontSize: 20,
    fontWeight: '600',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  quickSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    minWidth: '47%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 14,
  },
  calendarContainer: {
    borderRadius: 12,
    padding: 8,
    overflow: 'hidden',
  },
  impactSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  impactTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  impactContent: {
    gap: 8,
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  impactLabel: {
    fontSize: 14,
  },
  impactValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  feasibilityIndicator: {
    marginTop: 4,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  feasibilityText: {
    fontSize: 13,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    flexShrink: 0,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
  },
});
