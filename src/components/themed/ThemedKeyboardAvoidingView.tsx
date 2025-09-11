import React from 'react';
import { KeyboardAvoidingView, KeyboardAvoidingViewProps, Platform } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedKeyboardAvoidingViewProps = KeyboardAvoidingViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedKeyboardAvoidingView(props: ThemedKeyboardAvoidingViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const colorOverrides: { light?: string; dark?: string } = {};
  if (lightColor !== undefined) colorOverrides.light = lightColor;
  if (darkColor !== undefined) colorOverrides.dark = darkColor;
  const backgroundColor = useThemeColor(colorOverrides, 'background');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[{ backgroundColor, flex: 1 }, style]}
      {...otherProps}
    />
  );
}