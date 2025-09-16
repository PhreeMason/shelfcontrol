import CustomInput from '@/components/shared/CustomInput';
import { ThemedText } from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';
import { DeadlineFormData } from '@/utils/deadlineFormSchema';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Control, Controller, useWatch } from 'react-hook-form';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { PrioritySelector } from './PrioritySelector';

interface DeadlineFormStep3Props {
  control: Control<DeadlineFormData>;
  selectedFormat: 'physical' | 'eBook' | 'audio';
  selectedPriority: 'flexible' | 'strict';
  onPriorityChange: (priority: 'flexible' | 'strict') => void;
  showDatePicker: boolean;
  onDatePickerToggle: () => void;
  onDateChange: (event: any, selectedDate?: Date) => void;
  deadline: Date;
  paceEstimate: string;
  watchedValues: any;
  setValue: (name: keyof DeadlineFormData, value: any) => void;
}

export const DeadlineFormStep3 = ({
  control,
  selectedFormat,
  selectedPriority,
  onPriorityChange,
  showDatePicker,
  onDatePickerToggle,
  onDateChange,
  deadline,
  paceEstimate,
  watchedValues,
  setValue,
}: DeadlineFormStep3Props) => {
  const { colors } = useTheme();

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);

  // Watch for changes in current progress
  const currentProgress = useWatch({ control, name: 'currentProgress' });
  const currentMinutes = useWatch({ control, name: 'currentMinutes' });
  const startDate = useWatch({ control, name: 'startDate' });

  // Determine if we should show the start date field
  const shouldShowStartDate =
    (currentProgress && currentProgress > 0) ||
    (selectedFormat === 'audio' && currentMinutes && currentMinutes > 0);

  // Set default start date when progress is entered
  useEffect(() => {
    if (shouldShowStartDate && !startDate) {
      // Default to 7 days ago if significant progress, otherwise today
      const significantProgress =
        selectedFormat === 'audio'
          ? (currentProgress || 0) > 2 || (currentMinutes || 0) > 30
          : (currentProgress || 0) > 50;

      const defaultDate = new Date();
      if (significantProgress) {
        defaultDate.setDate(defaultDate.getDate() - 7);
      }
      setValue('startDate', defaultDate);
    } else if (!shouldShowStartDate && startDate) {
      // Clear start date if progress is removed
      setValue('startDate', undefined);
    }
  }, [
    shouldShowStartDate,
    startDate,
    currentProgress,
    currentMinutes,
    selectedFormat,
    setValue,
  ]);

  const onStartDateChange = (_event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setValue('startDate', selectedDate);
    }
  };

  const getProgressLabel = () => {
    switch (selectedFormat) {
      case 'audio':
        return 'Time Already Listened';
      default:
        return 'Pages Already Read';
    }
  };

  return (
    <View style={{ flex: 1, gap: 24 }}>
      <ThemedText color="textMuted" style={{ fontSize: 16 }}>
        When do you need to finish? We'll calculate if it's feasible at your
        reading pace.
      </ThemedText>

      <View>
        <ThemedText variant="default" style={{ marginBottom: 8 }}>
          Deadline Date *
        </ThemedText>
        <Controller
          control={control}
          name="deadline"
          render={({ field: { value } }) => (
            <>
              <TouchableOpacity
                style={[
                  styles.dateInput,
                  {
                    backgroundColor: colors.inputBlurBackground,
                    borderColor: colors.border,
                  },
                ]}
                onPress={onDatePickerToggle}
                testID="date-picker-button"
              >
                <ThemedText>
                  {value.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </ThemedText>
                {showDatePicker && (
                  <DateTimePicker
                    value={deadline}
                    mode="date"
                    display="inline"
                    onChange={onDateChange}
                    testID="input-deadline"
                  />
                )}
              </TouchableOpacity>
            </>
          )}
        />
        <ThemedText color="textMuted" style={{ marginTop: 6, lineHeight: 18 }}>
          Past dates will be marked as overdue
        </ThemedText>
      </View>

      <View
        style={[styles.sectionDivider, { backgroundColor: colors.textMuted }]}
      />

      <View>
        <ThemedText variant="default" style={{ marginBottom: 8 }}>
          {getProgressLabel()}
        </ThemedText>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <CustomInput
              control={control}
              name="currentProgress"
              inputType="integer"
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
          {selectedFormat === 'audio' ? (
            <View style={{ flex: 1 }}>
              <CustomInput
                control={control}
                name="currentMinutes"
                inputType="integer"
                placeholder="minutes"
                keyboardType="numeric"
              />
            </View>
          ) : null}
        </View>
        <ThemedText
          color="textMuted"
          style={{ marginTop: -18, lineHeight: 18 }}
        >
          Count towards today's reading progress
        </ThemedText>
      </View>

      {shouldShowStartDate && (
        <>
          <View
            style={[
              styles.sectionDivider,
              { backgroundColor: colors.textMuted },
            ]}
          />
          <View>
            <ThemedText variant="default" style={{ marginBottom: 8 }}>
              When did you start reading?
            </ThemedText>
            <Controller
              control={control}
              name="startDate"
              render={({ field: { value } }) => (
                <>
                  <TouchableOpacity
                    style={[
                      styles.dateInput,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setShowStartDatePicker(!showStartDatePicker)}
                    testID="start-date-picker-button"
                  >
                    <ThemedText>
                      {value
                        ? value.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Select start date'}
                    </ThemedText>
                    {showStartDatePicker && (
                      <DateTimePicker
                        value={value || new Date()}
                        mode="date"
                        display="inline"
                        onChange={onStartDateChange}
                        maximumDate={new Date()}
                        testID="input-startDate"
                      />
                    )}
                  </TouchableOpacity>
                </>
              )}
            />
            <ThemedText
              color="textMuted"
              style={{ marginTop: 6, lineHeight: 18 }}
            >
              Since you've already started, we'll track your progress from this
              date for accurate pacing
            </ThemedText>
          </View>
        </>
      )}

      <View
        style={[styles.sectionDivider, { backgroundColor: colors.textMuted }]}
      />
      <View>
        <ThemedText variant="default" style={{ marginBottom: 8 }}>
          Deadline Flexibility
        </ThemedText>
        <PrioritySelector
          selectedPriority={selectedPriority}
          onSelectPriority={onPriorityChange}
        />
        <ThemedText color="textMuted" style={{ marginTop: 6, lineHeight: 18 }}>
          Can this deadline be adjusted if needed?
        </ThemedText>
      </View>

      <View
        style={[styles.sectionDivider, { backgroundColor: colors.textMuted }]}
      />

      {paceEstimate && (
        <LinearGradient
          colors={[
            colors.accent,
            paceEstimate.includes('⚠️')
              ? `${colors.danger}20`
              : `${colors.primary}`,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.estimateContainer,
            {
              borderColor: paceEstimate.includes('⚠️')
                ? colors.danger
                : colors.primary,
            },
          ]}
        >
          <ThemedText
            style={styles.paceEstimateStyle}
            variant="defaultSemiBold"
            color={paceEstimate.includes('⚠️') ? 'danger' : 'textOnPrimary'}
          >
            {paceEstimate}
          </ThemedText>
          <ThemedText
            variant="defaultSemiBold"
            color={paceEstimate.includes('⚠️') ? 'danger' : 'textOnPrimary'}
          >
            to finish on time
          </ThemedText>
        </LinearGradient>
      )}

      <View
        style={[
          styles.summaryCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <ThemedText color="good" style={styles.summaryTitle}>
          ✓ Ready to Add
        </ThemedText>
        {watchedValues.bookTitle && watchedValues.deadline ? (
          <ThemedText
            color="primary"
            style={styles.summaryText}
            variant="label"
          >
            {watchedValues.bookTitle}{' '}
            <ThemedText>
              • Due{' '}
              {watchedValues.deadline.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </ThemedText>
          </ThemedText>
        ) : (
          <ThemedText>
            'Complete the form above to see your reading plan'
          </ThemedText>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionDivider: {
    height: 1,
    marginVertical: 2,
    opacity: 0.5,
  },
  estimateContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginTop: 16,
    alignItems: 'center',
  },
  paceEstimateStyle: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 32,
    borderWidth: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 'bold',
  },
  dateInput: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
  },
});
