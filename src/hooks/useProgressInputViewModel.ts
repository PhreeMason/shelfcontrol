import { useTheme } from '@/hooks/useThemeColor';
import { ProgressInputMode } from '@/types/progressInput.types';
import {
  transformProgressInputText,
  transformProgressValueToText,
} from '@/utils/formUtils';
import {
  formatAudiobookTime,
  parseAudiobookTime,
} from '@/utils/timeFormatUtils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';

interface UseProgressInputViewModelProps {
  mode: ProgressInputMode;
  format: 'physical' | 'eBook' | 'audio';
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  totalQuantity: number;
  testID?: string;
}

interface ProgressInputViewModel {
  display: {
    label: string;
    displayTotal: string;
    calculatedText?: string;
    helpText?: string;
  };
  state: {
    isValid: boolean;
    isFocused: boolean;
    showTooltip: boolean;
    displayValue: string;
    setDisplayValue: (value: string) => void;
    setIsFocused: (focused: boolean) => void;
  };
  handlers: {
    onChangeText: (text: string) => void;
    onFocus: () => void;
    onBlur: () => void;
  };
  styling: {
    inputStyle: StyleProp<TextStyle>;
    containerStyle: StyleProp<ViewStyle>;
    borderColor: string;
  };
  props: {
    keyboardType: 'numeric' | 'default';
    placeholder: string;
    testID?: string;
  };
}

export function useProgressInputViewModel({
  mode,
  format,
  value,
  onChange,
  onBlur,
  totalQuantity,
  testID,
}: UseProgressInputViewModelProps): ProgressInputViewModel {
  const { colors } = useTheme();
  const primaryColor = colors.primary;

  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const displayValueRef = useRef(displayValue);

  useEffect(() => {
    displayValueRef.current = displayValue;
  }, [displayValue]);

  const effectiveMode =
    mode === 'remaining' && format !== 'audio' ? 'direct' : mode;

  const isDirectPages = effectiveMode === 'direct' && format !== 'audio';
  const isDirectAudio = effectiveMode === 'direct' && format === 'audio';
  const isPercentage = effectiveMode === 'percentage';
  const isRemaining = effectiveMode === 'remaining' && format === 'audio';

  const label = useMemo(() => {
    if (isPercentage) return 'PERCENTAGE';
    if (isRemaining) return 'TIME REMAINING';
    if (isDirectAudio) return 'CURRENT TIME';
    return 'CURRENT PAGE';
  }, [isPercentage, isRemaining, isDirectAudio]);

  const percentageFromValue = useMemo(() => {
    if (!isPercentage || totalQuantity === 0) return 0;
    return Math.floor((value / totalQuantity) * 100);
  }, [isPercentage, value, totalQuantity]);

  const remainingTimeFromValue = useMemo(() => {
    if (!isRemaining) return 0;
    return Math.max(0, totalQuantity - value);
  }, [isRemaining, value, totalQuantity]);

  useEffect(() => {
    if (isDirectPages) {
      setDisplayValue(transformProgressValueToText(value));
    } else if (isDirectAudio) {
      const formattedValue = formatAudiobookTime(value);
      if (!isFocused) {
        setDisplayValue(formattedValue);
      } else {
        const currentParsed = parseAudiobookTime(displayValueRef.current);
        if (currentParsed !== value) {
          setDisplayValue(formattedValue);
        }
      }
    } else if (isPercentage) {
      setDisplayValue(percentageFromValue.toString());
    } else if (isRemaining) {
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
    }
  }, [
    value,
    isDirectPages,
    isDirectAudio,
    isPercentage,
    isRemaining,
    isFocused,
    percentageFromValue,
    remainingTimeFromValue,
    totalQuantity,
  ]);

  const calculatedProgress = useMemo(() => {
    if (!isPercentage) return 0;
    const percentage = transformProgressInputText(displayValue);
    if (percentage < 0 || percentage > 100) return 0;
    return Math.floor((percentage / 100) * totalQuantity);
  }, [isPercentage, displayValue, totalQuantity]);

  const calculatedCurrentTime = useMemo(() => {
    if (!isRemaining) return value;
    const parsed = parseAudiobookTime(displayValue);
    if (parsed === null) return value;
    return Math.max(0, totalQuantity - parsed);
  }, [isRemaining, displayValue, totalQuantity, value]);

  const displayTotal = useMemo(() => {
    if (isPercentage) return '/ 100%';
    if (isRemaining) return `/ ${formatAudiobookTime(totalQuantity)}`;
    if (isDirectAudio)
      return totalQuantity ? `/ ${formatAudiobookTime(totalQuantity)}` : '';
    return `/ ${totalQuantity} pages`;
  }, [isPercentage, isRemaining, isDirectAudio, totalQuantity]);

  const calculatedText = useMemo(() => {
    if (isPercentage) {
      const formatted =
        format === 'audio'
          ? formatAudiobookTime(calculatedProgress)
          : `${calculatedProgress} pages`;
      return `= ${formatted}`;
    }
    if (isRemaining) {
      return `= ${formatAudiobookTime(calculatedCurrentTime)} current`;
    }
    return ' ';
  }, [
    isPercentage,
    isRemaining,
    format,
    calculatedProgress,
    calculatedCurrentTime,
  ]);

  const helpText = useMemo(() => {
    if (
      (isDirectAudio || isRemaining) &&
      (showTooltip || (!isValid && isFocused))
    ) {
      return 'Use formats like: 3h 2m, 3:02, or 45m';
    }
    return undefined;
  }, [isDirectAudio, isRemaining, showTooltip, isValid, isFocused]);

  const handleChangeText = (text: string) => {
    setDisplayValue(text);

    if (isDirectPages) {
      const newValue = transformProgressInputText(text);
      onChange(newValue);
    } else if (isDirectAudio) {
      setShowTooltip(isFocused && !text.trim());
      const parsed = parseAudiobookTime(text);
      setIsValid(parsed !== null);
      if (parsed !== null) {
        onChange(parsed);
      }
    } else if (isPercentage) {
      const percentage = transformProgressInputText(text);
      if (percentage >= 0 && percentage <= 100) {
        const newProgress = Math.floor((percentage / 100) * totalQuantity);
        onChange(newProgress);
      }
    } else if (isRemaining) {
      setShowTooltip(isFocused && !text.trim());
      const parsed = parseAudiobookTime(text);
      setIsValid(parsed !== null);
      if (parsed !== null) {
        const currentTime = Math.max(0, totalQuantity - parsed);
        onChange(currentTime);
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if ((isDirectAudio || isRemaining) && !displayValue.trim()) {
      setShowTooltip(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setShowTooltip(false);

    if (isDirectAudio || isRemaining) {
      const parsed = parseAudiobookTime(displayValue);

      if (parsed !== null) {
        const finalValue = isRemaining
          ? Math.max(0, totalQuantity - parsed)
          : parsed;
        onChange(finalValue);
        const formattedValue = formatAudiobookTime(parsed);
        setDisplayValue(formattedValue);
        setIsValid(true);
      } else if (displayValue.trim() === '') {
        const finalValue = isRemaining ? totalQuantity : 0;
        onChange(finalValue);
        setDisplayValue('0m');
        setIsValid(true);
      } else {
        const currentValue = isRemaining ? remainingTimeFromValue : value;
        setDisplayValue(formatAudiobookTime(currentValue));
        setIsValid(true);
      }
    } else if (isPercentage) {
      const percentage = transformProgressInputText(displayValue);
      if (percentage < 0 || percentage > 100) {
        setDisplayValue(percentageFromValue.toString());
      }
    }

    onBlur?.();
  };

  const keyboardType = isDirectPages || isPercentage ? 'numeric' : 'default';

  const inputStyle: StyleProp<TextStyle> = {
    color: primaryColor,
    backgroundColor: colors.background,
    borderColor: isValid ? primaryColor : colors.danger,
  };

  const containerStyle: StyleProp<ViewStyle> = {
    backgroundColor: `${primaryColor}28`,
    borderColor: `${primaryColor}50`,
  };

  return {
    display: {
      label,
      displayTotal,
      ...(calculatedText && { calculatedText }),
      ...(helpText && { helpText }),
    },
    state: {
      isValid,
      isFocused,
      showTooltip,
      displayValue,
      setDisplayValue,
      setIsFocused,
    },
    handlers: {
      onChangeText: handleChangeText,
      onFocus: handleFocus,
      onBlur: handleBlur,
    },
    styling: {
      inputStyle,
      containerStyle,
      borderColor: isValid ? primaryColor : colors.danger,
    },
    props: {
      keyboardType,
      placeholder: '',
      ...(testID && { testID }),
    },
  };
}
