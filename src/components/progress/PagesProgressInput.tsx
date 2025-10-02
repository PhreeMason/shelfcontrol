import { useTheme } from '@/hooks/useThemeColor';
import {
  transformProgressInputText,
  transformProgressValueToText,
} from '@/utils/formUtils';
import React from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { ThemedText, ThemedView } from '../themed';

interface PagesProgressInputProps {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  totalQuantity: number;
  testID?: string;
}

const PagesProgressInput: React.FC<PagesProgressInputProps> = ({
  value,
  onChange,
  onBlur,
  totalQuantity,
  testID,
}) => {
  const { colors } = useTheme();
  const primaryColor = colors.primary;

  return (
    <ThemedView
      style={[
        styles.container,
        {
          backgroundColor: `${primaryColor}28`,
          borderColor: `${primaryColor}50`,
        },
      ]}
    >
      <ThemedText variant="muted" style={styles.label}>
        CURRENT PAGE
      </ThemedText>
      <ThemedView style={[styles.inputRow, { backgroundColor: 'transparent' }]}>
        <TextInput
          testID={testID}
          value={transformProgressValueToText(value)}
          onChangeText={text => onChange(transformProgressInputText(text))}
          onBlur={onBlur}
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          style={[
            styles.input,
            {
              color: colors.primary,
              backgroundColor: colors.background,
              borderColor: primaryColor,
            },
          ]}
        />
        <ThemedText
          variant="default"
          style={[styles.totalText, { color: `${colors.textOnSurface}79` }]}
        >
          / {totalQuantity} pages
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
  },
  label: {
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  input: {
    fontSize: 30,
    lineHeight: 34,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 2,
    fontWeight: '900',
  },
  totalText: {
    backgroundColor: 'transparent',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default PagesProgressInput;
