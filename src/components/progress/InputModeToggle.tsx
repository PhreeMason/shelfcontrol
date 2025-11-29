import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { ProgressInputMode } from '@/types/progressInput.types';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface InputModeToggleProps {
  modes: { key: ProgressInputMode; label: string }[];
  selectedMode: ProgressInputMode;
  onModeChange: (mode: ProgressInputMode) => void;
  disabled?: boolean;
}

const InputModeToggle: React.FC<InputModeToggleProps> = ({
  modes,
  selectedMode,
  onModeChange,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const primaryColor = colors.success;

  const currentIndex = modes.findIndex(mode => mode.key === selectedMode);
  const currentLabel = modes[currentIndex]?.label || '';

  const handleCycle = () => {
    const nextIndex = (currentIndex + 1) % modes.length;
    onModeChange(modes[nextIndex].key);
  };

  return (
    <TouchableOpacity
      testID="input-mode-toggle"
      style={[
        styles.container,
        { borderColor: primaryColor, backgroundColor: 'transparent' },
      ]}
      onPress={handleCycle}
      disabled={disabled}
    >
      <ThemedText style={[styles.label, { color: primaryColor }]}>
        {currentLabel}
      </ThemedText>
      <IconSymbol
        name="chevron.up.chevron.down"
        size={16}
        color={primaryColor}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    paddingLeft: 1,
  },
});

export default InputModeToggle;
