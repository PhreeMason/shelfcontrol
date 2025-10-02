import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import AudiobookProgressInput from '../AudiobookProgressInput';

jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: () => ({
    colors: {
      primary: '#000000',
      background: '#ffffff',
      border: '#cccccc',
      textMuted: '#666666',
      danger: '#ff0000',
      textOnSurface: '#333333',
    },
  }),
}));

describe('AudiobookProgressInput', () => {
  const defaultProps = {
    value: 90,
    onChange: jest.fn(),
    onBlur: jest.fn(),
    totalQuantity: 300,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render with correct label', () => {
      render(<AudiobookProgressInput {...defaultProps} />);
      expect(screen.getByText('CURRENT TIME')).toBeTruthy();
    });

    it('should render text input with correct testID', () => {
      render(<AudiobookProgressInput {...defaultProps} testID="test-input" />);
      expect(screen.getByTestId('test-input')).toBeTruthy();
    });

    it('should display total time when totalQuantity provided', () => {
      render(<AudiobookProgressInput {...defaultProps} />);
      expect(screen.getByText('/ 5h')).toBeTruthy();
    });

    it('should not display total time when totalQuantity not provided', () => {
      const { totalQuantity: _totalQuantity, ...propsWithoutTotal } =
        defaultProps;
      render(<AudiobookProgressInput {...propsWithoutTotal} />);
      expect(screen.queryByText(/\//)).toBeFalsy();
    });
  });

  describe('Value Display and Formatting', () => {
    it('should display formatted time value in input', () => {
      render(<AudiobookProgressInput {...defaultProps} />);
      expect(screen.getByDisplayValue('1h 30m')).toBeTruthy();
    });

    it('should display formatted time for minutes only', () => {
      render(<AudiobookProgressInput {...defaultProps} value={45} />);
      expect(screen.getByDisplayValue('45m')).toBeTruthy();
    });

    it('should display formatted time for hours only', () => {
      render(<AudiobookProgressInput {...defaultProps} value={120} />);
      expect(screen.getByDisplayValue('2h')).toBeTruthy();
    });

    it('should display 0m for zero value', () => {
      render(<AudiobookProgressInput {...defaultProps} value={0} />);
      expect(screen.getByDisplayValue('0m')).toBeTruthy();
    });
  });

  describe('Input Props and Styling', () => {
    it('should show tooltip when focused on blank field', () => {
      render(<AudiobookProgressInput {...defaultProps} value={90} testID="audiobook-progress-input" />);
      const input = screen.getByTestId('audiobook-progress-input');

      fireEvent(input, 'focus');
      fireEvent.changeText(input, '');

      expect(screen.getByText('Use formats like: 3h 2m, 3:02, or 45m')).toBeTruthy();
    });

    it('should hide tooltip when user starts typing', () => {
      render(<AudiobookProgressInput {...defaultProps} value={90} testID="audiobook-progress-input" />);
      const input = screen.getByTestId('audiobook-progress-input');

      fireEvent(input, 'focus');
      fireEvent.changeText(input, '');
      fireEvent.changeText(input, '1');

      expect(screen.queryByText('Use formats like: 3h 2m, 3:02, or 45m')).toBeNull();
    });

    it('should hide tooltip on blur', () => {
      render(<AudiobookProgressInput {...defaultProps} value={90} testID="audiobook-progress-input" />);
      const input = screen.getByTestId('audiobook-progress-input');

      fireEvent(input, 'focus');
      fireEvent.changeText(input, '');
      fireEvent(input, 'blur');

      expect(screen.queryByText('Use formats like: 3h 2m, 3:02, or 45m')).toBeNull();
    });

    it('should apply correct styling to input', () => {
      const { getByDisplayValue } = render(
        <AudiobookProgressInput {...defaultProps} />
      );
      const input = getByDisplayValue('1h 30m');

      expect(input.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 30,
            borderRadius: 10,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderWidth: 2,
            fontWeight: '900',
            textAlignVertical: 'center',
          }),
          expect.objectContaining({
            backgroundColor: '#ffffff',
            color: '#000000',
            borderColor: '#000000',
          }),
        ])
      );
    });
  });

  describe('Input Interaction', () => {
    it('should call onChange when text changes with valid input', () => {
      const mockOnChange = jest.fn();
      const { getByDisplayValue } = render(
        <AudiobookProgressInput {...defaultProps} onChange={mockOnChange} />
      );
      const input = getByDisplayValue('1h 30m');

      fireEvent.changeText(input, '2h 15m');

      expect(mockOnChange).toHaveBeenCalledWith(135);
    });

    it('should call onChange with parsed numeric value', () => {
      const mockOnChange = jest.fn();
      const { getByDisplayValue } = render(
        <AudiobookProgressInput {...defaultProps} onChange={mockOnChange} />
      );
      const input = getByDisplayValue('1h 30m');

      fireEvent.changeText(input, '60');

      expect(mockOnChange).toHaveBeenCalledWith(60);
    });

    it('should not call onChange when text changes with invalid input', () => {
      const mockOnChange = jest.fn();
      const { getByDisplayValue } = render(
        <AudiobookProgressInput {...defaultProps} onChange={mockOnChange} />
      );
      const input = getByDisplayValue('1h 30m');

      mockOnChange.mockClear();
      fireEvent.changeText(input, 'invalid input');

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should call onBlur when input loses focus', () => {
      const mockOnBlur = jest.fn();
      const { getByDisplayValue } = render(
        <AudiobookProgressInput {...defaultProps} onBlur={mockOnBlur} />
      );
      const input = getByDisplayValue('1h 30m');

      fireEvent(input, 'blur');

      expect(mockOnBlur).toHaveBeenCalled();
    });
  });

  describe('Focus and Validation States', () => {
    it('should show validation error for invalid input when focused', () => {
      const { getByDisplayValue } = render(
        <AudiobookProgressInput {...defaultProps} />
      );
      const input = getByDisplayValue('1h 30m');

      fireEvent(input, 'focus');
      fireEvent.changeText(input, 'invalid input');

      expect(
        screen.getByText('Use formats like: 3h 2m, 3:02, or 45m')
      ).toBeTruthy();
    });

    it('should not show validation error when not focused', () => {
      const { getByDisplayValue } = render(
        <AudiobookProgressInput {...defaultProps} />
      );
      const input = getByDisplayValue('1h 30m');

      fireEvent.changeText(input, 'invalid input');

      expect(
        screen.queryByText('Use formats like: 3h 2m, 3:02, or 45m')
      ).toBeFalsy();
    });

    it('should apply danger border color for invalid input when focused', () => {
      const { getByDisplayValue } = render(
        <AudiobookProgressInput {...defaultProps} />
      );
      const input = getByDisplayValue('1h 30m');

      fireEvent(input, 'focus');
      fireEvent.changeText(input, 'invalid');

      expect(input.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            borderColor: '#ff0000',
          }),
        ])
      );
    });

    it('should apply normal border color for valid input', () => {
      const { getByDisplayValue } = render(
        <AudiobookProgressInput {...defaultProps} />
      );
      const input = getByDisplayValue('1h 30m');

      fireEvent(input, 'focus');
      fireEvent.changeText(input, '2h 30m');

      expect(input.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            borderColor: '#000000',
          }),
        ])
      );
    });
  });

  describe('Blur Handling', () => {
    it('should call onChange and onBlur with valid input', () => {
      const mockOnChange = jest.fn();
      const mockOnBlur = jest.fn();
      const { getByDisplayValue } = render(
        <AudiobookProgressInput
          {...defaultProps}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );
      const input = getByDisplayValue('1h 30m');

      fireEvent(input, 'focus');
      fireEvent.changeText(input, '3:15');
      fireEvent(input, 'blur');

      expect(mockOnChange).toHaveBeenCalledWith(195);
      expect(mockOnBlur).toHaveBeenCalled();
    });

    it('should not call onChange with invalid input during typing', () => {
      const mockOnChange = jest.fn();
      const { getByDisplayValue } = render(
        <AudiobookProgressInput {...defaultProps} onChange={mockOnChange} />
      );
      const input = getByDisplayValue('1h 30m');

      mockOnChange.mockClear();
      fireEvent(input, 'focus');
      fireEvent.changeText(input, 'invalid input');

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should call onChange with 0 when empty input is blurred', () => {
      const mockOnChange = jest.fn();
      const { getByDisplayValue } = render(
        <AudiobookProgressInput {...defaultProps} onChange={mockOnChange} />
      );
      const input = getByDisplayValue('1h 30m');

      mockOnChange.mockClear();
      fireEvent(input, 'focus');
      fireEvent.changeText(input, '');
      fireEvent(input, 'blur');

      expect(mockOnChange).toHaveBeenCalledWith(0);
    });
  });

  describe('Container Styling', () => {
    it('should render with themed container styling', () => {
      render(<AudiobookProgressInput {...defaultProps} />);
      expect(screen.getByText('CURRENT TIME')).toBeTruthy();
    });

    it('should render total text with themed colors when totalQuantity provided', () => {
      render(<AudiobookProgressInput {...defaultProps} />);
      const totalText = screen.getByText('/ 5h');
      expect(totalText).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined onBlur prop', () => {
      const { onBlur: _onBlur, ...propsWithoutOnBlur } = defaultProps;
      const { getByDisplayValue } = render(
        <AudiobookProgressInput {...propsWithoutOnBlur} />
      );
      const input = getByDisplayValue('1h 30m');

      expect(() => fireEvent(input, 'blur')).not.toThrow();
    });

    it('should handle very large values correctly', () => {
      render(
        <AudiobookProgressInput
          {...defaultProps}
          value={6030}
          totalQuantity={7200}
        />
      );
      expect(screen.getByDisplayValue('100h 30m')).toBeTruthy();
      expect(screen.getByText('/ 120h')).toBeTruthy();
    });

    it('should handle decimal minutes with precise formatting', () => {
      render(<AudiobookProgressInput {...defaultProps} value={90.7} />);
      expect(screen.getByDisplayValue(/1h 30/)).toBeTruthy();
    });
  });
});
