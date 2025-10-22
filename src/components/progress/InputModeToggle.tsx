import { ThemedText } from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';
import { ProgressInputMode } from '@/types/progressInput.types';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface InputModeToggleProps {
  modes: { key: ProgressInputMode; label: string }[];
  selectedMode: ProgressInputMode;
  onModeChange: (mode: ProgressInputMode) => void;
}

const InputModeToggle: React.FC<InputModeToggleProps> = ({
  modes,
  selectedMode,
  onModeChange,
}) => {
  const { colors } = useTheme();
  const primaryColor = colors.primary;

  return (
    <View style={[styles.container, { borderColor: primaryColor }]}>
      {modes.map(mode => {
        const isSelected = selectedMode === mode.key;
        return (
          <TouchableOpacity
            key={mode.key}
            testID={`input-mode-${mode.key}`}
            style={[
              styles.button,
              {
                backgroundColor: isSelected ? primaryColor : 'transparent',
                borderColor: primaryColor,
              },
              modes.length === 2 && mode.key === modes[0].key && styles.firstButton,
              modes.length === 2 && mode.key === modes[1].key && styles.lastButton,
              modes.length === 3 && mode.key === modes[0].key && styles.firstButton,
              modes.length === 3 && mode.key === modes[2].key && styles.lastButton,
            ]}
            onPress={() => onModeChange(mode.key)}
          >
            <ThemedText
              style={[
                styles.buttonText,
                { color: isSelected ? '#fff' : primaryColor },
              ]}
            >
              {mode.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRightWidth: 1,
  },
  firstButton: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  lastButton: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    borderRightWidth: 0,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default InputModeToggle;
