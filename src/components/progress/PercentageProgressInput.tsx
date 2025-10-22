import { useTheme } from '@/hooks/useThemeColor';
import {
  transformProgressInputText,
  transformProgressValueToText,
} from '@/utils/formUtils';
import React, { useMemo, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { ThemedText, ThemedView } from '../themed';
import { formatAudiobookTime } from './AudiobookProgressInput';

interface PercentageProgressInputProps {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  totalQuantity: number;
  format: 'physical' | 'eBook' | 'audio';
  testID?: string;
}

const PercentageProgressInput: React.FC<PercentageProgressInputProps> = ({
  value,
  onChange,
  onBlur,
  totalQuantity,
  format,
  testID,
}) => {
  const { colors } = useTheme();
  const primaryColor = colors.primary;

  const percentageFromValue = useMemo(() => {
    if (totalQuantity === 0) return 0;
    return Math.round((value / totalQuantity) * 100);
  }, [value, totalQuantity]);

  const [displayPercentage, setDisplayPercentage] = useState(
    percentageFromValue.toString()
  );

  const calculatedProgress = useMemo(() => {
    const percentage = transformProgressInputText(displayPercentage);
    if (percentage < 0 || percentage > 100) return 0;
    return Math.floor((percentage / 100) * totalQuantity);
  }, [displayPercentage, totalQuantity]);

  const handleChangeText = (text: string) => {
    setDisplayPercentage(text);
    const percentage = transformProgressInputText(text);

    if (percentage >= 0 && percentage <= 100) {
      const newProgress = Math.floor((percentage / 100) * totalQuantity);
      onChange(newProgress);
    }
  };

  const handleBlur = () => {
    const percentage = transformProgressInputText(displayPercentage);
    if (percentage < 0 || percentage > 100) {
      setDisplayPercentage(percentageFromValue.toString());
    }
    onBlur?.();
  };

  const getFormattedProgress = () => {
    if (format === 'audio') {
      return formatAudiobookTime(calculatedProgress);
    }
    return `${calculatedProgress} pages`;
  };

  return (
    <ThemedView
      style={[
        styles.container,
        {
          backgroundColor: `${primaryColor}28`,
          borderColor: `${primaryColor}50`,
        },
      ]}
    >
      <ThemedText variant="muted" style={styles.label}>
        PERCENTAGE
      </ThemedText>
      <ThemedView style={[styles.inputRow, { backgroundColor: 'transparent' }]}>
        <TextInput
          testID={testID}
          value={transformProgressValueToText(
            transformProgressInputText(displayPercentage)
          )}
          onChangeText={handleChangeText}
          onBlur={handleBlur}
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          style={[
            styles.input,
            {
              color: colors.primary,
              backgroundColor: colors.background,
              borderColor: primaryColor,
            },
          ]}
        />
        <ThemedText
          variant="default"
          style={[styles.percentText, { color: `${colors.textOnSurface}79` }]}
        >
          %
        </ThemedText>
      </ThemedView>
      <ThemedText
        variant="muted"
        style={[styles.calculatedText, { color: colors.textMuted }]}
      >
        = {getFormattedProgress()}
      </ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
  },
  label: {
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  input: {
    fontSize: 30,
    lineHeight: 34,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 2,
    fontWeight: '900',
    minWidth: 80,
  },
  percentText: {
    backgroundColor: 'transparent',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
  },
  calculatedText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PercentageProgressInput;
