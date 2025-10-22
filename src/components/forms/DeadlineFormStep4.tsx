import CustomInput from '@/components/shared/CustomInput';
import { ThemedText } from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';
import { DeadlineFormData } from '@/utils/deadlineFormSchema';
import DateTimePicker from '@react-native-community/datetimepicker';
import React from 'react';
import { Control, Controller } from 'react-hook-form';
import { StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { PaceEstimateBox } from './PaceEstimateBox';
import { PrioritySelector } from './PrioritySelector';

interface DeadlineFormStep4Props {
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
  deadlineFromPublicationDate?: boolean;
}

export const DeadlineFormStep4 = ({
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
  deadlineFromPublicationDate = false,
}: DeadlineFormStep4Props) => {
  const { colors } = useTheme();

  const getProgressLabel = () => {
    switch (selectedFormat) {
      case 'audio':
        return 'Time Already Listened';
      default:
        return 'Pages Already Read';
    }
  };
  const getTotalQuantityPlaceholder = () => {
    switch (selectedFormat) {
      case 'audio':
        return 'Hours';
      default:
        return 'How many pages total?';
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
          Deadline Date <ThemedText style={{ color: '#dc2626' }}>*</ThemedText>
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
                    themeVariant="light"
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
        {deadlineFromPublicationDate && (
          <ThemedText color="primary" style={styles.autoFilledIndicator}>
            ✓ Set to book publication date
          </ThemedText>
        )}
        <ThemedText color="textMuted" style={{ marginTop: 6, lineHeight: 18 }}>
          Past dates will be marked as overdue
        </ThemedText>
      </View>

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
              placeholder={getTotalQuantityPlaceholder()}
              keyboardType="numeric"
            />
          </View>
          {selectedFormat === 'audio' ? (
            <View style={{ flex: 1 }}>
              <CustomInput
                control={control}
                name="currentMinutes"
                inputType="integer"
                placeholder="Minutes"
                keyboardType="numeric"
              />
            </View>
          ) : null}
        </View>
        {(watchedValues.currentProgress > 0 ||
          watchedValues.currentMinutes > 0) && (
          <View>
            <Controller
              control={control}
              name="ignoreInCalcs"
              render={({ field: { value, onChange } }) => (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    marginTop: -12,
                    marginBottom: 6,
                  }}
                >
                  <Switch
                    testID="checkbox-ignoreInCalcs"
                    value={value ?? true}
                    onValueChange={onChange}
                    trackColor={{
                      false: colors.border,
                      true: colors.primary,
                    }}
                    thumbColor={colors.surface}
                  />
                  <ThemedText style={{ flex: 1 }}>
                    Exclude from today's reading progress
                  </ThemedText>
                </View>
              )}
            />
          </View>
        )}
      </View>

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

      <PaceEstimateBox paceEstimate={paceEstimate} />

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
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
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
  autoFilledIndicator: {
    fontSize: 12,
    fontWeight: '500',
  },
});
