import { requiresAudiobookInput } from '@/utils/formUtils';
import React, { useMemo } from 'react';
import { Control, Controller } from 'react-hook-form';
import { View, StyleSheet } from 'react-native';
import AudiobookProgressInput from './AudiobookProgressInput';
import PagesProgressInput from './PagesProgressInput';
import PercentageProgressInput from './PercentageProgressInput';
import TimeRemainingInput from './TimeRemainingInput';
import InputModeToggle from './InputModeToggle';
import { usePreferences } from '@/providers/PreferencesProvider';
import {
  getAvailableModesForFormat,
  getModeLabelForFormat,
} from '@/types/progressInput.types';

interface ProgressInputProps {
  format: 'physical' | 'eBook' | 'audio';
  control: Control<any>;
  totalQuantity: number;
}

const ProgressInput: React.FC<ProgressInputProps> = ({
  format,
  control,
  totalQuantity,
}) => {
  const { getProgressInputMode, setProgressInputMode } = usePreferences();
  const selectedMode = getProgressInputMode(format);

  const availableModes = useMemo(
    () => getAvailableModesForFormat(format),
    [format]
  );

  const modeOptions = useMemo(
    () =>
      availableModes.map(mode => ({
        key: mode,
        label: getModeLabelForFormat(mode, format),
      })),
    [availableModes, format]
  );

  const renderInput = (value: number, onChange: (v: number) => void, onBlur?: () => void) => {
    if (selectedMode === 'percentage') {
      return (
        <PercentageProgressInput
          value={value}
          onChange={onChange}
          {...(onBlur && { onBlur })}
          totalQuantity={totalQuantity}
          format={format}
          testID="percentage-progress-input"
        />
      );
    }

    if (selectedMode === 'remaining' && format === 'audio') {
      return (
        <TimeRemainingInput
          value={value}
          onChange={onChange}
          {...(onBlur && { onBlur })}
          totalQuantity={totalQuantity}
          testID="time-remaining-input"
        />
      );
    }

    if (requiresAudiobookInput(format)) {
      return (
        <AudiobookProgressInput
          value={value}
          onChange={onChange}
          {...(onBlur && { onBlur })}
          totalQuantity={totalQuantity}
          testID="audiobook-progress-input"
        />
      );
    }

    return (
      <PagesProgressInput
        value={value}
        onChange={onChange}
        {...(onBlur && { onBlur })}
        totalQuantity={totalQuantity}
        testID="pages-progress-input"
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
        <InputModeToggle
          modes={modeOptions}
          selectedMode={selectedMode}
          onModeChange={mode => setProgressInputMode(format, mode)}
        />
      </View>
      <Controller
        control={control}
        name="currentProgress"
        render={({ field: { value, onChange, onBlur } }) =>
          renderInput(value, onChange, onBlur)
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  toggleContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
});

export default ProgressInput;
