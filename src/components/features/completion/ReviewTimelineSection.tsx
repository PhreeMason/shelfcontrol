import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { dayjs } from '@/lib/dayjs';
import { ReviewFormData } from '@/utils/reviewFormSchema';
import DateTimePicker from '@react-native-community/datetimepicker';
import React from 'react';
import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

interface ReviewTimelineSectionProps {
  control: Control<ReviewFormData>;
  watch: UseFormWatch<ReviewFormData>;
  setValue: UseFormSetValue<ReviewFormData>;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
  onDateChange: (event: any, selectedDate?: Date) => void;
}

export const ReviewTimelineSection: React.FC<ReviewTimelineSectionProps> = ({
  watch,
  setValue,
  showDatePicker,
  setShowDatePicker,
  onDateChange,
}) => {
  const { colors } = useTheme();
  const watchHasDeadline = watch('hasReviewDeadline');
  const watchReviewDueDate = watch('reviewDueDate');

  const isPastDate =
    watchReviewDueDate &&
    dayjs(watchReviewDueDate).isBefore(dayjs().startOf('day'));

  return (
    <ThemedView
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      testID="timeline-section"
    >
      <ThemedView style={styles.section}>
        <ThemedText typography="titleMediumPlus" style={styles.sectionHeader}>
          When will you review?
        </ThemedText>
        <ThemedView>
          <TouchableOpacity
            style={[
              styles.radioOption,
              { borderColor: colors.border },
              watchHasDeadline && {
                backgroundColor: colors.primaryContainer,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setValue('hasReviewDeadline', true)}
            activeOpacity={0.7}
            testID="has-deadline-yes"
          >
            <View
              style={[
                styles.radioCircle,
                { borderColor: colors.border },
                watchHasDeadline && {
                  borderColor: colors.primary,
                  backgroundColor: colors.primary,
                },
              ]}
            >
              {watchHasDeadline && (
                <View
                  style={[
                    styles.radioInnerCircle,
                    { backgroundColor: colors.textOnPrimary },
                  ]}
                />
              )}
            </View>
            <ThemedText typography="bodyMedium" style={styles.radioLabel}>
              I have a due date
            </ThemedText>
          </TouchableOpacity>
          {watchHasDeadline && watchReviewDueDate && (
            <ThemedView style={styles.datePickerContainer}>
              <TouchableOpacity
                style={[
                  styles.dateInput,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
                testID="date-picker-trigger"
              >
                <IconSymbol name="calendar" size={20} color={colors.primary} />
                <ThemedText typography="bodyMedium" style={styles.dateText}>
                  {watchReviewDueDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </ThemedText>
              </TouchableOpacity>
              {isPastDate && (
                <ThemedText
                  typography="bodySmall"
                  color="error"
                  style={styles.warningText}
                >
                  This date is in the past
                </ThemedText>
              )}
              {showDatePicker && (
                <DateTimePicker
                  themeVariant="light"
                  value={watchReviewDueDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={onDateChange}
                />
              )}
            </ThemedView>
          )}
          <TouchableOpacity
            style={[
              styles.radioOption,
              { borderColor: colors.border },
              !watchHasDeadline && {
                backgroundColor: colors.primaryContainer,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setValue('hasReviewDeadline', false)}
            activeOpacity={0.7}
            testID="has-deadline-no"
          >
            <View
              style={[
                styles.radioCircle,
                { borderColor: colors.border },
                !watchHasDeadline && {
                  borderColor: colors.primary,
                  backgroundColor: colors.primary,
                },
              ]}
            >
              {!watchHasDeadline && (
                <View
                  style={[
                    styles.radioInnerCircle,
                    { backgroundColor: colors.textOnPrimary },
                  ]}
                />
              )}
            </View>
            <ThemedText typography="bodyMedium" style={styles.radioLabel}>
              No due date, I'll review when ready
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  section: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    marginBottom: Spacing.xs,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabel: {
    flex: 1,
  },
  datePickerContainer: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  dateInput: {
    borderWidth: 2,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dateText: {
    flex: 1,
  },
  warningText: {
    marginTop: 6,
  },
});
