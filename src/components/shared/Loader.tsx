import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedText, ThemedView } from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';

type ColorValue = string;

export type LoaderProps = {
  size?: 'small' | 'large';
  text?: string;
  fullScreen?: boolean;
  indicatorColor?: ColorValue;
};

export function Loader({
  size = 'large',
  text,
  fullScreen = false,
  indicatorColor: _indicatorColor = 'primary',
}: LoaderProps) {
  const { colors } = useTheme();

  return (
    <ThemedView style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size={size} color={colors.primary} />
      {text && (
        <ThemedText style={styles.text} variant="label">
          {text}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  text: {
    marginTop: 16,
    textAlign: 'center',
  },
});
