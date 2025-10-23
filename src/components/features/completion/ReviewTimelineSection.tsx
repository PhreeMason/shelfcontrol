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
        <ThemedText variant="title" style={styles.sectionHeader}>
          Review Timeline
        </ThemedText>
        <ThemedView style={styles.radioGroup}>
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
            <ThemedText style={styles.radioLabel}>
              Yes, I have a review deadline
            </ThemedText>
          </TouchableOpacity>
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
            <ThemedText style={styles.radioLabel}>
              No deadline, review when I can
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
        {watchHasDeadline && watchReviewDueDate && (
          <ThemedView style={styles.datePickerContainer}>
            <TouchableOpacity
              style={[
                styles.dateInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setShowDatePicker(true)}
              testID="date-picker-trigger"
            >
              <IconSymbol
                name="calendar"
                size={24}
                color={colors.text}
                style={{ opacity: 0.7 }}
              />
              <ThemedText style={styles.dateText}>
                {watchReviewDueDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </ThemedText>
            </TouchableOpacity>
            {isPastDate && (
              <ThemedText color="error" style={styles.warningText}>
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
    fontSize: 16,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  radioGroup: {
    gap: Spacing.md,
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
    lineHeight: 20,
  },
  datePickerContainer: {
    marginTop: Spacing.sm,
  },
  dateInput: {
    borderWidth: 2,
    padding: 16,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateText: {
    lineHeight: 20,
  },
  warningText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
});
