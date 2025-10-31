import React, { useMemo } from 'react';
import { Control, Controller } from 'react-hook-form';
import { View, StyleSheet } from 'react-native';
import ProgressInputBase from './ProgressInputBase';
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
  disabled?: boolean;
}

const ProgressInput: React.FC<ProgressInputProps> = ({
  format,
  control,
  totalQuantity,
  disabled = false,
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

  const renderInput = (
    value: number,
    onChange: (v: number) => void,
    onBlur?: () => void
  ) => {
    const testID =
      selectedMode === 'percentage'
        ? 'percentage-progress-input'
        : selectedMode === 'remaining' && format === 'audio'
          ? 'time-remaining-input'
          : format === 'audio'
            ? 'audiobook-progress-input'
            : 'pages-progress-input';

    return (
      <ProgressInputBase
        mode={selectedMode}
        format={format}
        value={value}
        onChange={onChange}
        {...(onBlur && { onBlur })}
        totalQuantity={totalQuantity}
        testID={testID}
        disabled={disabled}
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
          disabled={disabled}
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
