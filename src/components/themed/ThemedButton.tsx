import React from 'react';
import {
  TextStyle,
  TouchableOpacity,
  type TouchableOpacityProps,
} from 'react-native';

import {
  ComponentVariants,
  createThemedStyle,
  type ButtonVariant,
  type ColorToken,
} from '@/constants/Theme';
import { useTheme } from '@/hooks/useThemeColor';
import * as Haptics from 'expo-haptics';
import { ThemedText } from './ThemedText';

export type ThemedButtonProps = TouchableOpacityProps & {
  title: string;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  backgroundColor?: ColorToken;
  textColor?: ColorToken;
  textStyle?: TextStyle;
  hapticsOnPress?: boolean;
};

export function ThemedButton({
  title,
  variant = 'primary',
  size = 'md',
  style,
  backgroundColor,
  textColor,
  disabled,
  hapticsOnPress = false,
  textStyle = {},
  ...rest
}: ThemedButtonProps) {
  const { colors } = useTheme();
  const buttonVariant = ComponentVariants.button[variant];

  const themeBackgroundColorResult =
    colors[backgroundColor || buttonVariant.container];
  const themeBackgroundColor =
    'transparent' in buttonVariant && buttonVariant.transparent
      ? 'transparent'
      : themeBackgroundColorResult;

  const themeTextColor = colors[textColor || buttonVariant.content];

  const borderColorResult =
    colors[
      'border' in buttonVariant
        ? (buttonVariant.border as ColorToken)
        : 'outline'
    ];
  const borderColor =
    (variant === 'outline' || variant === 'dangerOutline') &&
    'border' in buttonVariant
      ? borderColorResult
      : undefined;

  const disabledBackgroundColor = colors.disabled;
  const disabledTextColor = colors.disabledText;

  const buttonStyle = createThemedStyle.button(variant, size);

  return (
    <TouchableOpacity
      onPressIn={() => {
        if (hapticsOnPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }}
      style={[
        buttonStyle,
        {
          backgroundColor: disabled
            ? disabledBackgroundColor
            : themeBackgroundColor,
          ...(borderColor && {
            borderColor: disabled ? disabledBackgroundColor : borderColor,
          }),
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      disabled={disabled}
      {...rest}
    >
      <ThemedText
        variant="default"
        style={{
          color: disabled ? disabledTextColor : themeTextColor,
          textAlign: 'center',
          ...textStyle,
        }}
      >
        {title}
      </ThemedText>
    </TouchableOpacity>
  );
}
