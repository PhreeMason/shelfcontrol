import { Text, type TextProps } from 'react-native';

import { useTheme } from '@/hooks/useThemeColor';
import {
  ComponentVariants,
  createThemedStyle,
  type TextVariant,
  type ColorToken,
  type TypographyToken,
} from '@/constants/Theme';

export type ThemedTextProps = TextProps & {
  /**
   * Semantic variant combining typography + color (e.g., 'title', 'secondary')
   * Use this for common semantic patterns. Can be overridden by typography/color props.
   */
  variant?: TextVariant;
  /**
   * Direct typography token for explicit size/weight control (e.g., 'titleLarge', 'bodySmall')
   * Use this when you need specific typography independent of semantic variants.
   * Overrides the variant's typography if both are provided.
   *
   * IMPORTANT: When using this prop, do NOT spread Typography tokens in your StyleSheet.
   * The typography prop automatically applies the token. Use the style prop only for
   * non-typography styles like spacing, alignment, and layout.
   *
   * ❌ DON'T:
   * <ThemedText typography="bodySmall" style={styles.label}>
   * const styles = { label: { ...Typography.bodySmall, textAlign: 'center' } }
   *
   * ✅ DO:
   * <ThemedText typography="bodySmall" style={styles.label}>
   * const styles = { label: { textAlign: 'center' } }
   */
  typography?: TypographyToken;
  /**
   * Color token for text color (e.g., 'textInverse', 'primary')
   * Overrides the variant's color if both are provided.
   */
  color?: ColorToken;
};

export function ThemedText({
  style,
  variant = 'default',
  typography,
  color,
  ...rest
}: ThemedTextProps) {
  const { colors } = useTheme();
  const textVariant = ComponentVariants.text[variant];

  // Priority: color prop > variant color
  const themeColor = colors[color || textVariant.color];

  // Priority: typography prop > variant typography
  const textStyle = createThemedStyle.text(
    variant,
    color,
    typography || textVariant.typography
  );

  return <Text style={[textStyle, { color: themeColor }, style]} {...rest} />;
}
