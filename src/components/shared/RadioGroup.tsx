import { ThemedText } from '@/components/themed';
import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface RadioOption {
  label: string;
  value: string;
}

type RadioGroupProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  options: RadioOption[];
  label?: string;
  required?: boolean;
};

const RadioGroup = <T extends FieldValues>({
  control,
  name,
  options,
  label,
  required = false,
}: RadioGroupProps<T>) => {
  const { colors } = useTheme();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <View style={styles.container}>
          {label && (
            <ThemedText variant="default" style={styles.label}>
              {label}{' '}
              {required && (
                <ThemedText style={{ color: colors.danger }}>*</ThemedText>
              )}
            </ThemedText>
          )}
          <View style={styles.optionsContainer}>
            {options.map(option => (
              <TouchableOpacity
                key={option.value}
                style={styles.radioOption}
                onPress={() => onChange(option.value)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioCircle,
                    { borderColor: colors.border },
                    value === option.value && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primary,
                    },
                  ]}
                >
                  {value === option.value && (
                    <View
                      style={[
                        styles.radioInnerCircle,
                        { backgroundColor: colors.textOnPrimary },
                      ]}
                    />
                  )}
                </View>
                <ThemedText style={styles.radioLabel}>
                  {option.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
          {error && (
            <ThemedText color="danger" style={styles.error}>
              {error.message}
            </ThemedText>
          )}
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    marginBottom: 4,
  },
  optionsContainer: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInnerCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  radioLabel: {
    fontSize: 14,
  },
  error: {
    minHeight: 18,
    marginTop: 4,
  },
});

export default RadioGroup;
