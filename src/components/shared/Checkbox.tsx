import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onToggle,
  disabled = false,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onToggle}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.checkbox,
          { borderColor: checked ? colors.primary : colors.border },
          checked && { backgroundColor: colors.primary },
          disabled && { opacity: 0.5 },
        ]}
      >
        {checked && (
          <IconSymbol name="checkmark" size={18} color={colors.textOnPrimary} />
        )}
      </View>
      <ThemedText style={[styles.label, disabled && { opacity: 0.5 }]}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
  },
});

export default Checkbox;
