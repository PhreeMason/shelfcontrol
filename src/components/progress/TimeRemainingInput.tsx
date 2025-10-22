import { useTheme } from '@/hooks/useThemeColor';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { ThemedText, ThemedView } from '../themed';
import {
  formatAudiobookTime,
  parseAudiobookTime,
} from './AudiobookProgressInput';

interface TimeRemainingInputProps {
  value: number;
  onChange: (minutes: number) => void;
  onBlur?: () => void;
  totalQuantity: number;
  testID?: string;
}

const TimeRemainingInput: React.FC<TimeRemainingInputProps> = ({
  value,
  onChange,
  onBlur,
  totalQuantity,
  testID,
}) => {
  const { colors } = useTheme();
  const primaryColor = colors.primary;

  const remainingTimeFromValue = useMemo(() => {
    return Math.max(0, totalQuantity - value);
  }, [value, totalQuantity]);

  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const displayValueRef = useRef(displayValue);

  useEffect(() => {
    displayValueRef.current = displayValue;
  }, [displayValue]);

  useEffect(() => {
    const formattedValue = formatAudiobookTime(remainingTimeFromValue);

    if (!isFocused) {
      setDisplayValue(formattedValue);
    } else {
      const currentParsed = parseAudiobookTime(displayValueRef.current);
      if (currentParsed !== null) {
        const currentProgress = totalQuantity - currentParsed;
        if (currentProgress !== value) {
          setDisplayValue(formattedValue);
        }
      }
    }
  }, [value, totalQuantity, isFocused, remainingTimeFromValue]);

  const calculatedCurrentTime = useMemo(() => {
    const parsed = parseAudiobookTime(displayValue);
    if (parsed === null) return value;
    return Math.max(0, totalQuantity - parsed);
  }, [displayValue, totalQuantity, value]);

  const handleChangeText = (text: string) => {
    setDisplayValue(text);
    setShowTooltip(isFocused && !text.trim());

    const parsed = parseAudiobookTime(text);
    setIsValid(parsed !== null);

    if (parsed !== null) {
      const currentTime = Math.max(0, totalQuantity - parsed);
      onChange(currentTime);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (!displayValue.trim()) {
      setShowTooltip(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setShowTooltip(false);

    const parsed = parseAudiobookTime(displayValue);

    if (parsed !== null) {
      const currentTime = Math.max(0, totalQuantity - parsed);
      onChange(currentTime);
      setDisplayValue(formatAudiobookTime(parsed));
      setIsValid(true);
    } else if (displayValue.trim() === '') {
      onChange(totalQuantity);
      setDisplayValue('0m');
      setIsValid(true);
    } else {
      setDisplayValue(formatAudiobookTime(remainingTimeFromValue));
      setIsValid(true);
    }

    onBlur?.();
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
        TIME REMAINING
      </ThemedText>
      <ThemedView style={[styles.inputRow, { backgroundColor: 'transparent' }]}>
        <TextInput
          testID={testID}
          value={displayValue}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder=""
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              backgroundColor: colors.background,
              color: colors.primary,
              borderColor: isValid ? primaryColor : colors.danger,
            },
          ]}
        />
      </ThemedView>
      {(showTooltip || (!isValid && isFocused)) && (
        <ThemedText
          variant="muted"
          style={[
            styles.helpText,
            { color: !isValid ? colors.danger : colors.textMuted },
          ]}
        >
          Use formats like: 3h 2m, 3:02, or 45m
        </ThemedText>
      )}
      <ThemedText
        variant="muted"
        style={[styles.calculatedText, { color: colors.textMuted }]}
      >
        = {formatAudiobookTime(calculatedCurrentTime)} current
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
    textAlignVertical: 'center',
  },
  helpText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    paddingHorizontal: 8,
  },
  calculatedText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TimeRemainingInput;
