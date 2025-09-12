import React from 'react';
import { Control, Controller } from 'react-hook-form';
import { StyleSheet, Text, TextInput, View } from 'react-native';

interface CustomInputProps {
  control: Control<any>;
  name: string;
  placeholder?: string;
  label?: string;
  error?: any;
  transformOnBlur?: (value: string) => string;
  [key: string]: any;
}

const CustomInput = ({ control, name, placeholder, label, error, transformOnBlur, ...props }: CustomInputProps) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            onBlur={() => {
              if (transformOnBlur && value && typeof value === 'string') {
                onChange(transformOnBlur(value));
              }
              onBlur();
            }}
            onChangeText={onChange}
            value={value}
            placeholder={placeholder}
            {...props}
          />
        )}
      />
      {error && <Text style={styles.error}>{error.message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  error: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
});

export default CustomInput;