import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Control } from 'react-hook-form';
import ProgressInput from '../ProgressInput';

// Mock dependencies
jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: () => ({
    colors: {
      primary: '#000000',
      background: '#ffffff',
      border: '#cccccc',
      textMuted: '#666666',
    },
  }),
}));

jest.mock('@/constants/Colors', () => ({
  Typography: {
    titleLarge: {
      fontSize: 18,
      fontWeight: 'bold',
    },
  },
}));

jest.mock('../AudiobookProgressInput', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockAudiobookProgressInput(props: any) {
    return React.createElement(View, {
      testID: props.testID || 'audiobook-progress-input',
    });
  };
});

jest.mock('@/utils/formUtils', () => ({
  requiresAudiobookInput: jest.fn(),
  transformProgressInputText: jest.fn(),
  transformProgressValueToText: jest.fn(),
}));

// Mock react-hook-form Controller
jest.mock('react-hook-form', () => ({
  Controller: ({ render }: any) => {
    const mockField = {
      value: 50,
      onChange: jest.fn(),
      onBlur: jest.fn(),
    };
    return render({ field: mockField });
  },
}));

describe('ProgressInput', () => {
  const mockControl = {} as Control<any>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when format is audio', () => {
    beforeEach(() => {
      const { requiresAudiobookInput } = require('@/utils/formUtils');
      requiresAudiobookInput.mockReturnValue(true);
    });

    it('should render AudiobookProgressInput', () => {
      render(
        <ProgressInput
          format="audio"
          control={mockControl}
          totalQuantity={258}
        />
      );

      expect(screen.getByTestId('audiobook-progress-input')).toBeTruthy();
    });

    it('should call requiresAudiobookInput with correct format', () => {
      const { requiresAudiobookInput } = require('@/utils/formUtils');
      render(
        <ProgressInput
          format="audio"
          control={mockControl}
          totalQuantity={258}
        />
      );

      expect(requiresAudiobookInput).toHaveBeenCalledWith('audio');
    });
  });

  describe('when format is not audio', () => {
    beforeEach(() => {
      const {
        requiresAudiobookInput,
        transformProgressValueToText,
        transformProgressInputText,
      } = require('@/utils/formUtils');
      requiresAudiobookInput.mockReturnValue(false);
      transformProgressValueToText.mockReturnValue('50');
      transformProgressInputText.mockImplementation(
        (text: string) => parseInt(text) || 0
      );
    });

    it('should render PagesProgressInput for physical format', () => {
      render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={258}
        />
      );

      expect(screen.getByTestId('pages-progress-input')).toBeTruthy();
    });

    it('should render PagesProgressInput for eBook format', () => {
      render(
        <ProgressInput
          format="eBook"
          control={mockControl}
          totalQuantity={258}
        />
      );

      expect(screen.getByTestId('pages-progress-input')).toBeTruthy();
    });

    it('should call transformProgressValueToText with field value', () => {
      const { transformProgressValueToText } = require('@/utils/formUtils');
      render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={258}
        />
      );

      expect(transformProgressValueToText).toHaveBeenCalledWith(50);
    });

    it('should have correct placeholder text', () => {
      render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={258}
        />
      );

      expect(
        screen.getByPlaceholderText('Enter current progress')
      ).toBeTruthy();
    });

    it('should have numeric keyboard type', () => {
      const { getByDisplayValue } = render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={258}
        />
      );
      const textInput = getByDisplayValue('50');

      expect(textInput.props.keyboardType).toBe('numeric');
    });

    it('should handle text input changes', () => {
      const { transformProgressInputText } = require('@/utils/formUtils');
      const { getByDisplayValue } = render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={258}
        />
      );
      const textInput = getByDisplayValue('50');

      fireEvent.changeText(textInput, '75');

      expect(transformProgressInputText).toHaveBeenCalledWith('75');
    });

    it('should apply correct styling', () => {
      const { getByDisplayValue } = render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={258}
        />
      );
      const textInput = getByDisplayValue('50');

      expect(textInput.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 30,
            borderRadius: 10,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderWidth: 2,
          }),
          expect.objectContaining({
            color: '#000000',
            backgroundColor: '#ffffff',
            borderColor: '#000000',
          }),
        ])
      );
    });

    it('should have correct placeholder text color', () => {
      const { getByPlaceholderText } = render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={258}
        />
      );
      const textInput = getByPlaceholderText('Enter current progress');

      expect(textInput.props.placeholderTextColor).toBe('#666666');
    });
  });
});
