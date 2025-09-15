import { Typography } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { requiresAudiobookInput, transformProgressInputText, transformProgressValueToText } from '@/utils/formUtils';
import React from 'react';
import { Control, Controller } from 'react-hook-form';
import { StyleSheet, TextInput } from 'react-native';
import AudiobookProgressInput from './AudiobookProgressInput';

interface ProgressInputProps {
  format: 'physical' | 'eBook' | 'audio';
  control: Control<any>;
}

const ProgressInput: React.FC<ProgressInputProps> = ({
  format,
  control
}) => {
  const { colors } = useTheme();

  if (requiresAudiobookInput(format)) {
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
          value={transformProgressValueToText(value)}
          onChangeText={(text) => onChange(transformProgressInputText(text))}
          onBlur={onBlur}
          placeholder="Enter current progress"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          style={[styles.input, { color: colors.primary, backgroundColor: colors.background, borderColor: colors.border }]}
        />
      )}
    />
  );
};

export default ProgressInput;

const styles = StyleSheet.create({
  input: {
    ...Typography.titleLarge,
    fontSize: 22, // Override typography fontSize
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
  }
});
