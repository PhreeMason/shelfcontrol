import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { Control, Controller } from 'react-hook-form';
import { StyleSheet, TextInput } from 'react-native';
import AudiobookProgressInput from './AudiobookProgressInput';

interface ProgressInputProps {
  format: 'physical' | 'ebook' | 'audio';
  control: Control<any>;
}

const ProgressInput: React.FC<ProgressInputProps> = ({
  format,
  control
}) => {
  const primary = useThemeColor({}, 'primary');
  const background = useThemeColor({}, 'background');
  const textMuted = useThemeColor({}, 'textMuted');
  const border = useThemeColor({}, 'border');

  if (format === 'audio') {
    return (
      <Controller
        control={control}
        name="currentProgress"
        render={({ field: { value, onChange, onBlur } }) => (
          <AudiobookProgressInput
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            testID="audiobook-progress-input"
          />
        )}
      />
    );
  }

  return (
    <Controller
      control={control}
      name="currentProgress"
      render={({ field: { value, onChange, onBlur } }) => (
        <TextInput
          value={value?.toString() || ''}
          onChangeText={(text) => onChange(text ? parseInt(text, 10) : 0)}
          onBlur={onBlur}
          placeholder="Enter current progress"
          placeholderTextColor={textMuted}
          keyboardType="numeric"
          style={[styles.input, { color: primary, backgroundColor: background, borderColor: border }]}
        />
      )}
    />
  );
};

export default ProgressInput;

const styles = StyleSheet.create({
  input: {
    fontSize: 22,
    fontFamily: 'Nunito-Bold',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  }
});
