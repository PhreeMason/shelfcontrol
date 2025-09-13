import { ThemedText } from '@/components/themed';
import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';

type CustomInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  inputType?: 'string' | 'number' | 'integer';
  transformOnBlur?: (value: string) => string;
} & Omit<TextInputProps, 'onChangeText' | 'onBlur' | 'value'>

const CustomInput = <T extends FieldValues>({
  control,
  name,
  inputType = 'string',
  transformOnBlur,
  ...props
}: CustomInputProps<T>) => {
  const { colors } = useTheme();
  const textMutedColor = colors.textMuted;
  const cardColor = colors.surface;
  const textColor = colors.text;
  const borderColor = colors.border;
  const dangerColor = colors.danger;

  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { value, onChange, onBlur },
        fieldState: { error },
      }) => (
        <View style={styles.container}>
          <TextInput
            {...props}
            value={
              inputType === 'integer' || inputType === 'number'
                ? (value === undefined || value === null ? '' : String(value))
                : (typeof value === 'number' ? String(value) : (value ?? ''))
            }
            onChangeText={(text) => {
              if (transformOnBlur) {
                // Store the text as-is, transform only on blur
                onChange(text);
              } else {
                onChange(text);
              }
            }}
            onBlur={() => {
              if (transformOnBlur && value && typeof value === 'string') {
                onChange(transformOnBlur(value));
              }
              onBlur();
            }}
            placeholderTextColor={textMutedColor}
            style={[
              styles.input,
              {
                backgroundColor: cardColor,
                color: textColor,
                borderColor: error ? dangerColor : borderColor
              },
              props.style,
            ]}
          />
          {error ? (
            <ThemedText color="danger" style={styles.error}>{error.message}</ThemedText>
          ) : (
            <View style={{ height: 18 }} />
          )}
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  input: {
    borderWidth: 2,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
  },
  error: {
    minHeight: 18,
  },
});

export default CustomInput;