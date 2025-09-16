import { ScrollView, type ScrollViewProps } from 'react-native';

import { useTheme } from '@/hooks/useThemeColor';
import {
  ComponentVariants,
  createThemedStyle,
  type SurfaceVariant,
  type ColorToken,
  type SpacingToken,
} from '@/constants/Theme';

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
  const { colors } = useTheme();
  const surfaceVariant = ComponentVariants.surface[variant];

  const themeBackgroundColor =
    colors[backgroundColor || surfaceVariant.container];
  const scrollViewStyle = createThemedStyle.surface(variant, padding);

  return (
    <ScrollView
      style={[
        scrollViewStyle,
        { backgroundColor: themeBackgroundColor },
        style,
      ]}
      {...otherProps}
    />
  );
}
