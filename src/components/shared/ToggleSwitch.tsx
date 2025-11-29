import { ThemedText } from '@/components/themed';
import { Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

interface ToggleSwitchProps {
  /** Current toggle state */
  value: boolean;
  /** Called when toggle is pressed */
  onValueChange: (value: boolean) => void;
  /** Primary label text */
  label: string;
  /** Optional secondary description text */
  description?: string;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Optional testID for E2E testing */
  testID?: string;
  /** Optional style for the container */
  style?: ViewStyle;
}

/**
 * A reusable toggle switch component with optional label and description.
 * Follows the app's design system and theming.
 */
export function ToggleSwitch({
  value,
  onValueChange,
  label,
  description,
  disabled = false,
  testID,
  style,
}: ToggleSwitchProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      style={[styles.container, disabled && styles.containerDisabled, style]}
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
    >
      <View style={styles.labelContainer}>
        <ThemedText typography="titleSmall">{label}</ThemedText>
        {description && (
          <ThemedText typography="bodySmall" color="textSecondary">
            {description}
          </ThemedText>
        )}
      </View>
      <View
        style={[
          styles.track,
          {
            backgroundColor: value ? colors.primary : colors.surfaceVariant,
          },
        ]}
        testID={testID ? `${testID}-track` : undefined}
      >
        <View
          style={[
            styles.thumb,
            { backgroundColor: colors.surface },
            value && styles.thumbActive,
          ]}
          testID={testID ? `${testID}-thumb` : undefined}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  containerDisabled: {
    opacity: 0.5,
  },
  labelContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  track: {
    width: 48,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  thumbActive: {
    transform: [{ translateX: 24 }],
  },
});
