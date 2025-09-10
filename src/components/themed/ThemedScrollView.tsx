import { ScrollView, type ScrollViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { ComponentVariants, createThemedStyle, type SurfaceVariant, type ColorToken, type SpacingToken } from '@/constants/Theme';

export type ThemedScrollViewProps = ScrollViewProps & {
  variant?: SurfaceVariant;
  backgroundColor?: ColorToken;
  padding?: SpacingToken;
};

export function ThemedScrollView({ 
  style, 
  variant = 'default',
  backgroundColor,
  padding,
  ...otherProps 
}: ThemedScrollViewProps) {
  const surfaceVariant = ComponentVariants.surface[variant];
  
  const themeBackgroundColor = useThemeColor({}, backgroundColor || surfaceVariant.container);
  const scrollViewStyle = createThemedStyle.surface(variant, padding);

  return (
    <ScrollView 
      style={[
        scrollViewStyle,
        { backgroundColor: themeBackgroundColor },
        style
      ]} 
      {...otherProps} 
    />
  );
}