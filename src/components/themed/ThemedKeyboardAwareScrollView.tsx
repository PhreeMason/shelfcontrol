import React from 'react';
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps,
} from 'react-native-keyboard-aware-scroll-view';
import { useTheme } from '@/hooks/useThemeColor';
import { type ColorToken } from '@/constants/Theme';

export type ThemedKeyboardAwareScrollViewProps =
  KeyboardAwareScrollViewProps & {
    backgroundColor?: ColorToken;
  };

export const ThemedKeyboardAwareScrollView = React.forwardRef<
  KeyboardAwareScrollView,
  ThemedKeyboardAwareScrollViewProps
>((props, ref) => {
  const { style, backgroundColor: bgColorProp, ...otherProps } = props;
  const { colors } = useTheme();
  const backgroundColor = colors[bgColorProp || 'background'];

  return (
    <KeyboardAwareScrollView
      ref={ref}
      style={[{ backgroundColor }, style]}
      {...otherProps}
    />
  );
});

ThemedKeyboardAwareScrollView.displayName = 'ThemedKeyboardAwareScrollView';
