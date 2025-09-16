import React from 'react';
import {
  KeyboardAvoidingView,
  KeyboardAvoidingViewProps,
  Platform,
} from 'react-native';
import { useTheme } from '@/hooks/useThemeColor';
import { type ColorToken } from '@/constants/Theme';

export type ThemedKeyboardAvoidingViewProps = KeyboardAvoidingViewProps & {
  backgroundColor?: ColorToken;
};

export function ThemedKeyboardAvoidingView(
  props: ThemedKeyboardAvoidingViewProps
) {
  const { style, backgroundColor: bgColorProp, ...otherProps } = props;
  const { colors } = useTheme();
  const backgroundColor = colors[bgColorProp || 'background'];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[{ backgroundColor, flex: 1 }, style]}
      {...otherProps}
    />
  );
}
