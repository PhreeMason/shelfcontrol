import { View, type ViewProps } from 'react-native';

import { useTheme } from '@/hooks/useThemeColor';
import { ComponentVariants, createThemedStyle, type SurfaceVariant, type ColorToken, type SpacingToken, type BorderRadiusToken } from '@/constants/Theme';

export type ThemedViewProps = ViewProps & {
  variant?: SurfaceVariant;
  backgroundColor?: ColorToken;
  padding?: SpacingToken;
  borderRadius?: BorderRadiusToken;
};

export function ThemedView({ 
  style, 
  variant = 'default',
  backgroundColor,
  padding,
  borderRadius,
  ...otherProps 
}: ThemedViewProps) {
  const { colors } = useTheme();
  const surfaceVariant = ComponentVariants.surface[variant];
  
  const themeBackgroundColor = colors[backgroundColor || surfaceVariant.container];
  const surfaceStyle = createThemedStyle.surface(variant, padding, borderRadius);

  return (
    <View 
      style={[
        surfaceStyle,
        { backgroundColor: themeBackgroundColor },
        style
      ]} 
      {...otherProps} 
    />
  );
}
