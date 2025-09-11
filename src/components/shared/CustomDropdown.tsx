import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Control, Controller } from 'react-hook-form';

interface CustomDropdownProps {
  control: Control<any>;
  name: string;
  options: { label: string; value: string }[];
  placeholder?: string;
  label?: string;
  error?: any;
  allowCustom?: boolean;
  testID?: string;
  customPlaceholder?: string;
}

const CustomDropdown = ({ control, name, options, placeholder, label, error }: CustomDropdownProps) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={value}
              onValueChange={onChange}
              style={styles.picker}
            >
              {placeholder && <Picker.Item label={placeholder} value="" />}
              {options.map((option) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  error: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
});

export default CustomDropdown;