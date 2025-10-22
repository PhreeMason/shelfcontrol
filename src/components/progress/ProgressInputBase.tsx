import { useProgressInputViewModel } from '@/hooks/useProgressInputViewModel';
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
}

const ProgressInputBase: React.FC<ProgressInputBaseProps> = props => {
  const viewModel = useProgressInputViewModel(props);


  return (
    <ThemedView
      style={[
        styles.container,
        viewModel.styling.containerStyle,
      ]}
    >
      <ThemedText
        variant="muted"
        style={styles.label}
      >
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
          placeholderTextColor="#666666"
          keyboardType={viewModel.props.keyboardType}
          style={[
            styles.input,
            viewModel.styling.inputStyle,
            { borderColor: viewModel.styling.borderColor },
          ]}
        />
        {viewModel.display.displayTotal && (
          <ThemedText
            variant="default"
            style={[styles.totalText, { color: '#33333379' }]}
          >
            {viewModel.display.displayTotal}
          </ThemedText>
        )}
      </ThemedView>
      {viewModel.display.helpText && (
        <ThemedText
          variant="muted"
          style={[
            styles.helpText,
            { color: !viewModel.state.isValid ? '#ff0000' : '#666666' },
          ]}
        >
          {viewModel.display.helpText}
        </ThemedText>
      )}
      {viewModel.display.calculatedText && (
        <ThemedText
          variant="muted"
          style={[styles.calculatedText, { color: '#666666' }]}
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
    marginTop: 4,
    paddingHorizontal: 8,
  },
  calculatedText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProgressInputBase;
