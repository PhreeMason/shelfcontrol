import React from 'react';
import { TouchableOpacity, type TouchableOpacityProps } from 'react-native';

import { useTheme } from '@/hooks/useThemeColor';
import { ThemedText } from './ThemedText';
import { ComponentVariants, createThemedStyle, type ButtonVariant, type ColorToken } from '@/constants/Theme';

export type ThemedButtonProps = TouchableOpacityProps & {
  title: string;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  backgroundColor?: ColorToken;
  textColor?: ColorToken;
};

export function ThemedButton({
  title,
  variant = 'primary',
  size = 'md',
  style,
  backgroundColor,
  textColor,
  disabled,
  ...rest
}: ThemedButtonProps) {
  const { colors } = useTheme();
  const buttonVariant = ComponentVariants.button[variant];
  
  // Resolve colors
  const themeBackgroundColorResult = colors[backgroundColor || buttonVariant.container];
  const themeBackgroundColor = ('transparent' in buttonVariant && buttonVariant.transparent) ? 'transparent' : themeBackgroundColorResult;
  
  const themeTextColor = colors[textColor || buttonVariant.content];

  // Resolve border color for outline variants
  const borderColorResult = colors['border' in buttonVariant ? buttonVariant.border as ColorToken : 'outline'];
  const borderColor = (variant === 'outline' || variant === 'dangerOutline') && 'border' in buttonVariant ? 
    borderColorResult : undefined;

  // Disabled colors
  const disabledBackgroundColor = colors.disabled;
  const disabledTextColor = colors.disabledText;

  const buttonStyle = createThemedStyle.button(variant, size);

  return (
    <TouchableOpacity
      style={[
        buttonStyle,
        {
          backgroundColor: disabled ? disabledBackgroundColor : themeBackgroundColor,
          ...(borderColor && { borderColor: disabled ? disabledBackgroundColor : borderColor }),
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      disabled={disabled}
      {...rest}
    >
      <ThemedText
        variant="label"
        style={{ 
          color: disabled ? disabledTextColor : themeTextColor,
          textAlign: 'center',
        }}
      >
        {title}
      </ThemedText>
    </TouchableOpacity>
  );
}