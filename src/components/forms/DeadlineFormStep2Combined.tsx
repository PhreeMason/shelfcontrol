import AcquisitionSourceTypeaheadInput from '@/components/shared/AcquisitionSourceTypeaheadInput';
import CustomInput from '@/components/shared/CustomInput';
import TypeTypeaheadInput from '@/components/shared/TypeTypeaheadInput';
import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/hooks/useThemeColor';
import { DeadlineFormData } from '@/utils/deadlineFormSchema';
import { toTitleCase } from '@/utils/stringUtils';
import DateTimePicker from '@react-native-community/datetimepicker';
import React from 'react';
import { Control, Controller, useWatch } from 'react-hook-form';
import { StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { FormatSelector } from './FormatSelector';
import { PaceEstimateBox } from './PaceEstimateBox';
import { PrioritySelector } from './PrioritySelector';
import { StatusSelector } from './StatusSelector';

interface DeadlineFormStep2CombinedProps {
  control: Control<DeadlineFormData>;
  selectedFormat: 'physical' | 'eBook' | 'audio';
  onFormatChange: (format: 'physical' | 'eBook' | 'audio') => void;
  selectedStatus: 'pending' | 'active';
  onStatusChange: (status: 'pending' | 'active') => void;
  selectedPriority: 'flexible' | 'strict';
  onPriorityChange: (priority: 'flexible' | 'strict') => void;
  setValue: (name: keyof DeadlineFormData, value: any) => void;
  showDatePicker: boolean;
  onDatePickerToggle: () => void;
  onDateChange: (event: any, selectedDate?: Date) => void;
  deadline: Date;
  paceEstimate: string;
  mode: 'new' | 'edit';
  deadlineFromPublicationDate?: boolean;
  hasExistingProgressRecords?: boolean;
}

export const DeadlineFormStep2Combined = ({
  control,
  selectedFormat,
  onFormatChange,
  selectedStatus,
  onStatusChange,
  selectedPriority,
  onPriorityChange,
  setValue,
  showDatePicker,
  onDatePickerToggle,
  onDateChange,
  deadline,
  paceEstimate,
  mode,
  deadlineFromPublicationDate = false,
  hasExistingProgressRecords = false,
}: DeadlineFormStep2CombinedProps) => {
  const { colors } = useTheme();

  // Watch values
  const watchedBookId = useWatch({ control, name: 'book_id' });
  const isPublisherAutofilled = useWatch({
    control,
    name: 'isPublisherAutofilled',
  });
  const publishers = useWatch({ control, name: 'publishers' }) || [];
  const watchedValues = {
    bookTitle: useWatch({ control, name: 'bookTitle' }),
    currentProgress: useWatch({ control, name: 'currentProgress' }),
    currentMinutes: useWatch({ control, name: 'currentMinutes' }),
    deadline: useWatch({ control, name: 'deadline' }),
  };

  // Publisher management
  const addPublisher = () => {
    if (publishers.length < 5) {
      setValue('publishers', [...publishers, '']);
    }
  };

  const removePublisher = (index: number) => {
    const newPublishers = publishers.filter((_, i) => i !== index);
    setValue(
      'publishers',
      newPublishers.length > 0 ? newPublishers : undefined
    );
    if (index === 0 && isPublisherAutofilled) {
      setValue('isPublisherAutofilled', false);
    }
  };

  // Dynamic labels
  const getTotalQuantityLabel = () => {
    switch (selectedFormat) {
      case 'audio':
        return (
          <>
            Total Time <ThemedText style={{ color: '#dc2626' }}>*</ThemedText>
          </>
        );
      default:
        return (
          <>
            Total Pages <ThemedText style={{ color: '#dc2626' }}>*</ThemedText>
          </>
        );
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

  const getProgressLabel = () => {
    switch (selectedFormat) {
      case 'audio':
        return 'Time Already Listened';
      default:
        return 'Pages Already Read';
    }
  };

  const getProgressPlaceholder = () => {
    switch (selectedFormat) {
      case 'audio':
        return 'Hours so far';
      default:
        return 'Pages so far?';
    }
  };

  const isEditMode = mode === 'edit';

  return (
    <View style={{ flex: 1, gap: 24 }}>
      {/* ========== BOOK DETAILS SECTION ========== */}
      <ThemedText style={styles.sectionHeader}>BOOK DETAILS</ThemedText>

      <View>
        <ThemedText variant="defaultSemiBold" style={{ marginBottom: 8 }}>
          Book Title <ThemedText style={{ color: '#dc2626' }}>*</ThemedText>
        </ThemedText>
        <CustomInput
          control={control}
          name="bookTitle"
          testID="input-bookTitle"
          placeholder="Enter the book title"
          transformOnBlur={toTitleCase}
        />
        {watchedBookId && (
          <ThemedText color="primary" style={styles.autoFilledIndicator}>
            ✓ Linked from library
          </ThemedText>
        )}
      </View>

      <View>
        <ThemedText variant="defaultSemiBold" style={{ marginBottom: 8 }}>
          Author
        </ThemedText>
        <CustomInput
          control={control}
          name="bookAuthor"
          testID="input-bookAuthor"
          placeholder="Author name (optional)"
        />
        {watchedBookId && (
          <ThemedText color="primary" style={styles.autoFilledIndicator}>
            ✓ Linked from library
          </ThemedText>
        )}
      </View>

      <View>
        <ThemedText variant="defaultSemiBold" style={{ marginBottom: 8 }}>
          Status
        </ThemedText>
        <StatusSelector
          selectedStatus={selectedStatus}
          onSelectStatus={onStatusChange}
        />
        <ThemedText color="textMuted" style={{ marginTop: 6, lineHeight: 18 }}>
          Is this book actively being read or pending?
        </ThemedText>
      </View>

      <View>
        <ThemedText variant="defaultSemiBold" style={{ marginBottom: 8 }}>
          Format
        </ThemedText>
        <FormatSelector
          selectedFormat={selectedFormat}
          onSelectFormat={onFormatChange}
          disabled={isEditMode}
        />
        {isEditMode ? (
          <ThemedText
            color="textMuted"
            style={{ marginTop: 6, lineHeight: 18 }}
          >
            Format cannot be changed after creation
          </ThemedText>
        ) : null}
      </View>

      <View>
        <ThemedText variant="defaultSemiBold" style={{ marginBottom: 8 }}>
          {getTotalQuantityLabel()}
        </ThemedText>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <CustomInput
              control={control}
              name="totalQuantity"
              inputType="integer"
              placeholder={getTotalQuantityPlaceholder()}
              keyboardType="numeric"
              testID="input-totalQuantity"
            />
          </View>
          {selectedFormat === 'audio' ? (
            <View style={{ flex: 1 }}>
              <CustomInput
                control={control}
                name="totalMinutes"
                inputType="integer"
                placeholder="Minutes (optional)"
                keyboardType="numeric"
                testID="input-totalMinutes"
              />
            </View>
          ) : null}
        </View>
        <ThemedText color="textMuted" style={{ lineHeight: 18 }}>
          We'll use this to calculate your daily reading pace
        </ThemedText>
      </View>

      {/* ========== ADDITIONAL INFORMATION SECTION ========== */}
      <View style={styles.sectionDivider} />
      <ThemedText style={styles.sectionHeader}>ADDITIONAL INFORMATION</ThemedText>

      <View style={{ zIndex: 3 }}>
        <ThemedText variant="defaultSemiBold" style={{ marginBottom: 8 }}>
          Book Type <ThemedText style={{ color: '#dc2626' }}>*</ThemedText>
        </ThemedText>
        <TypeTypeaheadInput
          control={control}
          name="type"
          placeholder="Select a type or add your own"
          testID="input-type"
        />
      </View>

      <View style={{ zIndex: 2 }}>
        <ThemedText variant="defaultSemiBold" style={{ marginBottom: 8 }}>
          Source
        </ThemedText>
        <AcquisitionSourceTypeaheadInput
          control={control}
          name="acquisition_source"
          testID="input-acquisition-source"
          placeholder="Select a source or add a new new one"
        />
      </View>

      <View style={{ zIndex: 1 }}>
        <ThemedText variant="defaultSemiBold" style={{ marginBottom: 8 }}>
          Publishers
        </ThemedText>
        {publishers.length === 0 ? (
          <TouchableOpacity
            style={[
              styles.addButton,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
            onPress={addPublisher}
            testID="add-publisher-button"
          >
            <IconSymbol name="plus" size={20} color={colors.primary} />
            <ThemedText color="primary">Add Publisher</ThemedText>
          </TouchableOpacity>
        ) : (
          <View style={{ gap: 12 }}>
            {publishers.map((_: string, index: number) => (
              <View key={index} style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <CustomInput
                    control={control}
                    name={`publishers.${index}` as any}
                    testID={`input-publisher-${index}`}
                    placeholder="Publisher name"
                  />
                  {index === 0 && isPublisherAutofilled && (
                    <ThemedText
                      color="primary"
                      style={styles.autoFilledIndicator}
                    >
                      ✓ Linked from library
                    </ThemedText>
                  )}
                </View>
                <TouchableOpacity
                  style={[
                    styles.removeButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => removePublisher(index)}
                  testID={`remove-publisher-${index}`}
                >
                  <IconSymbol name="trash" size={30} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={[
                styles.addButton,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  opacity: publishers.length >= 5 ? 0.5 : 1,
                },
              ]}
              onPress={addPublisher}
              disabled={publishers.length >= 5}
              testID="add-publisher-button"
            >
              <IconSymbol name="plus" size={20} color={colors.primary} />
              <ThemedText color="primary">Add Another Publisher</ThemedText>
            </TouchableOpacity>
          </View>
        )}
        <ThemedText color="textMuted" style={{ marginTop: 6, lineHeight: 18 }}>
          {publishers.length >= 5
            ? 'Maximum of 5 publishers reached'
            : 'Add up to 5 publishers for this book'}
        </ThemedText>
      </View>

      {/* ========== READING SCHEDULE SECTION ========== */}
      <View style={styles.sectionDivider} />
      <ThemedText style={styles.sectionHeader}>READING SCHEDULE</ThemedText>

      <View>
        <ThemedText variant="default" style={{ marginBottom: 8 }}>
          Due Date <ThemedText style={{ color: '#dc2626' }}>*</ThemedText>
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
          <ThemedText color="primary" style={[styles.autoFilledIndicator,  { marginTop: 5 }]}>
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
              placeholder={getProgressPlaceholder()}
              keyboardType="numeric"
              editable={!hasExistingProgressRecords}
              style={{ opacity: hasExistingProgressRecords ? 0.5 : 1 }}
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
                editable={!hasExistingProgressRecords}
                style={{ opacity: hasExistingProgressRecords ? 0.5 : 1 }}
              />
            </View>
          ) : null}
        </View>
        {hasExistingProgressRecords && (
          <ThemedText
            color="textMuted"
            style={{ marginTop: 6, lineHeight: 18 }}
          >
            Starting progress cannot be changed after progress records have been
            added
          </ThemedText>
        )}
        {((watchedValues.currentProgress ?? 0) > 0 ||
          (watchedValues.currentMinutes ?? 0) > 0) && (
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
          Due Date Flexibility
        </ThemedText>
        <PrioritySelector
          selectedPriority={selectedPriority}
          onSelectPriority={onPriorityChange}
        />
        <ThemedText color="textMuted" style={{ marginTop: 6, lineHeight: 18 }}>
          Can this date be adjusted if needed?
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
          ✓ Ready to {mode === 'new' ? 'Add' : 'Update'}
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
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: -8,
    opacity: 0.7,
    letterSpacing: 0.5,
  },
  sectionDivider: {
    height: 16,
  },
  autoFilledIndicator: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: -15,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  removeButton: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateInput: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
  },
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
});
