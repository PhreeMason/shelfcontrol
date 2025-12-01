import Typeahead from '@/components/shared/Typeahead';
import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useGetAllCustomDateNames } from '@/hooks/useCustomDates';
import { useTheme } from '@/hooks/useTheme';
import {
  CustomDateFormData,
  customDateFormSchema,
} from '@/schemas/customDateFormSchema';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';

interface CustomDateFormProps {
  onSubmit: (data: CustomDateFormData) => void;
  onCancel: () => void;
  defaultValues?: CustomDateFormData;
  submitLabel?: string;
}

export const CustomDateForm = ({
  onSubmit,
  onCancel,
  defaultValues,
  submitLabel = 'Save',
}: CustomDateFormProps) => {
  const { colors } = useTheme();
  const { data: existingNames = [], isLoading: isLoadingNames } =
    useGetAllCustomDateNames();

  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomDateFormData>({
    resolver: zodResolver(customDateFormSchema),
    defaultValues: defaultValues || {
      name: '',
      date: dayjs().format('YYYY-MM-DD'),
    },
  });

  const currentDate = watch('date');
  const dateValue = currentDate ? dayjs(currentDate).toDate() : new Date();

  const handleDateChange = (_event: unknown, selectedDate?: Date) => {
    if (selectedDate) {
      setValue('date', dayjs(selectedDate).format('YYYY-MM-DD'));
    }
  };

  const handleNameSelect = (name: string) => {
    setValue('name', name);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.nameFieldContainer}>
        <View style={styles.labelRow}>
          <IconSymbol name="tag.fill" size={16} color={colors.textMuted} />
          <ThemedText variant="secondary" style={styles.label}>
            Name
          </ThemedText>
        </View>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Typeahead
              suggestions={existingNames}
              isLoading={isLoadingNames}
              placeholder="Cover reveal, blog tour, press release..."
              testID="input-custom-date-name"
              value={value}
              onChangeText={onChange}
              onSelect={handleNameSelect}
              error={errors.name?.message}
              noResultsAction="create"
              noResultsMessage="Press to use this name"
            />
          )}
        />
      </View>

      <View style={styles.dateFieldContainer}>
        <View style={styles.labelRow}>
          <IconSymbol name="calendar" size={16} color={colors.textMuted} />
          <ThemedText variant="secondary" style={styles.label}>
            Date
          </ThemedText>
        </View>
        <TouchableOpacity
          style={[
            styles.dateButton,
            {
              backgroundColor: colors.inputBlurBackground,
              borderColor: errors.date ? colors.danger : colors.border,
            },
          ]}
          onPress={() => setShowDatePicker(!showDatePicker)}
        >
          <ThemedText>
            {dayjs(currentDate).format('dddd, MMMM D, YYYY')}
          </ThemedText>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            themeVariant="light"
            value={dateValue}
            mode="date"
            display="inline"
            onChange={handleDateChange}
            testID="input-custom-date"
          />
        )}
        {errors.date && (
          <ThemedText color="danger" style={styles.error}>
            {errors.date.message}
          </ThemedText>
        )}
      </View>

      <View style={styles.buttonRow}>
        <ThemedButton
          title="Cancel"
          onPress={onCancel}
          variant="outline"
          style={styles.cancelButton}
        />
        <ThemedButton
          title={submitLabel}
          onPress={handleSubmit(onSubmit)}
          style={styles.submitButton}
        />
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  nameFieldContainer: {
    gap: Spacing.xs,
    zIndex: 10,
  },
  dateFieldContainer: {
    gap: Spacing.xs,
    zIndex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  label: {
    fontSize: 13,
  },
  dateButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  error: {
    fontSize: 13,
    marginTop: Spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  submitButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
});
