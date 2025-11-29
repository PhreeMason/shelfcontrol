import { BorderRadius, Spacing } from '@/constants/Colors';
import { useProgressInputViewModel } from '@/hooks/useProgressInputViewModel';
import { useTheme } from '@/hooks/useThemeColor';
import { ProgressInputMode } from '@/types/progressInput.types';
import React from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { ThemedText, ThemedView } from '../themed';

interface ProgressInputBaseProps {
  mode: ProgressInputMode;
  format: 'physical' | 'eBook' | 'audio';
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  totalQuantity: number;
  testID?: string;
  disabled?: boolean;
}

const ProgressInputBase: React.FC<ProgressInputBaseProps> = props => {
  const viewModel = useProgressInputViewModel(props);
  const { colors } = useTheme();

  return (
    <ThemedView style={[styles.container, viewModel.styling.containerStyle]}>
      <ThemedText variant="secondary" style={styles.label}>
        {viewModel.display.label}
      </ThemedText>
      <ThemedView style={[styles.inputRow, { backgroundColor: 'transparent' }]}>
        <TextInput
          testID={viewModel.props.testID}
          value={viewModel.state.displayValue}
          onChangeText={viewModel.handlers.onChangeText}
          onFocus={viewModel.handlers.onFocus}
          onBlur={viewModel.handlers.onBlur}
          placeholder={viewModel.props.placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={viewModel.props.keyboardType}
          editable={!props.disabled}
          style={[
            styles.input,
            viewModel.styling.inputStyle,
            { borderColor: viewModel.styling.borderColor },
          ]}
        />
        {viewModel.display.displayTotal && (
          <ThemedText
            variant="default"
            style={styles.totalText}
            color="secondary"
          >
            {viewModel.display.displayTotal}
          </ThemedText>
        )}
      </ThemedView>
      {viewModel.display.helpText && (
        <ThemedText
          variant="muted"
          style={styles.helpText}
          color={!viewModel.state.isValid ? 'error' : 'textMuted'}
        >
          {viewModel.display.helpText}
        </ThemedText>
      )}
      {viewModel.display.calculatedText && (
        <ThemedText
          variant="muted"
          style={styles.calculatedText}
          color="textMuted"
        >
          {viewModel.display.calculatedText}
        </ThemedText>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
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
    gap: Spacing.md,
  },
  input: {
    fontSize: 30,
    lineHeight: 34,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 2,
    fontWeight: '900',
    textAlignVertical: 'center',
  },
  totalText: {
    backgroundColor: 'transparent',
    fontSize: 18,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  calculatedText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProgressInputBase;
