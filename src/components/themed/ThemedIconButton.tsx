import React from 'react';
import { TouchableOpacity, type TouchableOpacityProps } from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import {
  ComponentVariants,
  createThemedStyle,
  type ButtonVariant,
  type ColorToken,
} from '@/constants/Theme';
import { useTheme } from '@/hooks/useThemeColor';
import * as Haptics from 'expo-haptics';

export type ThemedIconButtonProps = TouchableOpacityProps & {
  icon: Parameters<typeof IconSymbol>[0]['name'];
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  backgroundColor?: ColorToken;
  iconColor?: ColorToken;
  hapticsOnPress?: boolean;
};

const ICON_SIZES = {
  sm: 20,
  md: 24,
  lg: 28,
};

export function ThemedIconButton({
  icon,
  variant = 'primary',
  size = 'md',
  style,
  backgroundColor,
  iconColor,
  disabled,
  hapticsOnPress = false,
  ...rest
}: ThemedIconButtonProps) {
  const { colors } = useTheme();
  const buttonVariant = ComponentVariants.button[variant];

  const themeBackgroundColorResult =
    colors[backgroundColor || buttonVariant.container];
  const themeBackgroundColor =
    'transparent' in buttonVariant && buttonVariant.transparent
      ? 'transparent'
      : themeBackgroundColorResult;

  const themeIconColor = colors[iconColor || buttonVariant.content];

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
  const disabledIconColor = colors.disabledText;

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
      <IconSymbol
        name={icon}
        size={ICON_SIZES[size]}
        color={disabled ? disabledIconColor : themeIconColor}
      />
    </TouchableOpacity>
  );
}
