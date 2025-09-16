import { Text, type TextProps } from 'react-native';

import { useTheme } from '@/hooks/useThemeColor';
import {
  ComponentVariants,
  createThemedStyle,
  type TextVariant,
  type ColorToken,
} from '@/constants/Theme';

export type ThemedTextProps = TextProps & {
  variant?: TextVariant;
  color?: ColorToken;
};

export function ThemedText({
  style,
  variant = 'default',
  color,
  ...rest
}: ThemedTextProps) {
  const { colors } = useTheme();
  const textVariant = ComponentVariants.text[variant];

  const themeColor = colors[color || textVariant.color];
  const textStyle = createThemedStyle.text(
    variant,
    color,
    textVariant.typography
  );

  return <Text style={[textStyle, { color: themeColor }, style]} {...rest} />;
}
