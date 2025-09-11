import React from 'react';
import { KeyboardAwareScrollView, KeyboardAwareScrollViewProps } from 'react-native-keyboard-aware-scroll-view';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedKeyboardAwareScrollViewProps = KeyboardAwareScrollViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedKeyboardAwareScrollView(props: ThemedKeyboardAwareScrollViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const colorOverrides: { light?: string; dark?: string } = {};
  if (lightColor !== undefined) colorOverrides.light = lightColor;
  if (darkColor !== undefined) colorOverrides.dark = darkColor;
  const backgroundColor = useThemeColor(colorOverrides, 'background');

  return (
    <KeyboardAwareScrollView
      style={[{ backgroundColor }, style]}
      {...otherProps}
    />
  );
}