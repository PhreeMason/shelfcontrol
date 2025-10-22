import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import TimeRemainingInput from '../TimeRemainingInput';

jest.mock('@/components/themed', () => ({
  ThemedText: ({ children, ...props }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, props, children);
  },
  ThemedView: ({ children, ...props }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, props, children);
  },
}));

jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: () => ({
    colors: {
      primary: '#B8A9D9',
      background: '#FFFFFF',
      textMuted: '#999999',
      textOnSurface: '#000000',
      danger: '#FF0000',
    },
  }),
}));

describe('TimeRemainingInput', () => {
  const defaultProps = {
    value: 0,
    onChange: jest.fn(),
    totalQuantity: 600,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render with label "TIME REMAINING"', () => {
      render(<TimeRemainingInput {...defaultProps} />);
      expect(screen.getByText('TIME REMAINING')).toBeTruthy();
    });

    it('should render calculated current time', () => {
      render(<TimeRemainingInput {...defaultProps} value={300} totalQuantity={600} />);
      expect(screen.getByText(/5h/)).toBeTruthy();
      expect(screen.getByText(/current/)).toBeTruthy();
    });

    it('should render total quantity', () => {
      render(<TimeRemainingInput {...defaultProps} totalQuantity={600} />);
      expect(screen.getByText(/10h/)).toBeTruthy();
    });

    it('should display help text on focus with empty input', () => {
      render(<TimeRemainingInput {...defaultProps} testID="time-input" />);

      const input = screen.getByPlaceholderText('');
      fireEvent.changeText(input, '');
      fireEvent(input, 'focus');

      expect(screen.getByText(/Use formats like/)).toBeTruthy();
    });
  });

  describe('Time Remaining Calculation', () => {
    it('should calculate current time from remaining time (hours and minutes)', () => {
      const onChange = jest.fn();
      render(<TimeRemainingInput {...defaultProps} totalQuantity={600} onChange={onChange} />);

      const input = screen.getByPlaceholderText('');
      fireEvent.changeText(input, '3h 0m');

      expect(onChange).toHaveBeenCalledWith(420);
    });

    it('should calculate current time from remaining time (minutes only)', () => {
      const onChange = jest.fn();
      render(<TimeRemainingInput {...defaultProps} totalQuantity={180} onChange={onChange} />);

      const input = screen.getByPlaceholderText('');
      fireEvent.changeText(input, '60m');

      expect(onChange).toHaveBeenCalledWith(120);
    });

    it('should calculate current time from remaining time (colon format)', () => {
      const onChange = jest.fn();
      render(<TimeRemainingInput {...defaultProps} totalQuantity={600} onChange={onChange} />);

      const input = screen.getByPlaceholderText('');
      fireEvent.changeText(input, '2:30');

      expect(onChange).toHaveBeenCalledWith(450);
    });

    it('should handle zero remaining time (book complete)', () => {
      const onChange = jest.fn();
      render(<TimeRemainingInput {...defaultProps} totalQuantity={600} onChange={onChange} />);

      const input = screen.getByPlaceholderText('');
      fireEvent.changeText(input, '0m');

      expect(onChange).toHaveBeenCalledWith(600);
    });

    it('should not allow negative current time', () => {
      const onChange = jest.fn();
      render(<TimeRemainingInput {...defaultProps} totalQuantity={100} onChange={onChange} />);

      const input = screen.getByPlaceholderText('');
      fireEvent.changeText(input, '200m');

      expect(onChange).toHaveBeenCalledWith(0);
    });
  });

  describe('Input Validation', () => {
    it('should show validation error for invalid input', () => {
      render(<TimeRemainingInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('');
      fireEvent(input, 'focus');
      fireEvent.changeText(input, 'invalid');

      expect(screen.getByText(/Use formats like/)).toBeTruthy();
    });

    it('should accept valid time formats', () => {
      const onChange = jest.fn();
      render(<TimeRemainingInput {...defaultProps} totalQuantity={600} onChange={onChange} />);

      const input = screen.getByPlaceholderText('');

      fireEvent.changeText(input, '3h 30m');
      expect(onChange).toHaveBeenCalled();

      jest.clearAllMocks();
      fireEvent.changeText(input, '3:30');
      expect(onChange).toHaveBeenCalled();

      jest.clearAllMocks();
      fireEvent.changeText(input, '90m');
      expect(onChange).toHaveBeenCalled();
    });

    it('should handle blur with valid input', () => {
      const onBlur = jest.fn();
      const onChange = jest.fn();
      render(<TimeRemainingInput {...defaultProps} onBlur={onBlur} onChange={onChange} />);

      const input = screen.getByPlaceholderText('');
      fireEvent.changeText(input, '2h 30m');
      fireEvent(input, 'blur');

      expect(onBlur).toHaveBeenCalled();
    });

    it('should reset to previous value on blur with invalid input', () => {
      render(<TimeRemainingInput {...defaultProps} value={300} totalQuantity={600} />);

      const input = screen.getByPlaceholderText('');
      fireEvent.changeText(input, 'invalid');
      fireEvent(input, 'blur');

      expect(screen.getByText(/5h/)).toBeTruthy();
    });

    it('should set to 0m on blur with empty input', () => {
      const onChange = jest.fn();
      render(<TimeRemainingInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByPlaceholderText('');
      fireEvent.changeText(input, '');
      fireEvent(input, 'blur');

      expect(onChange).toHaveBeenCalledWith(600);
    });
  });

  describe('Display Updates', () => {
    it('should update displayed remaining time when value changes', () => {
      const { rerender } = render(
        <TimeRemainingInput {...defaultProps} value={300} totalQuantity={600} />
      );

      const input = screen.getByPlaceholderText('');
      expect(input.props.value).toBe('5h');

      rerender(<TimeRemainingInput {...defaultProps} value={450} totalQuantity={600} />);

      expect(input.props.value).toBe('2h 30m');
    });

    it('should show tooltip on focus with empty value', () => {
      render(<TimeRemainingInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('');
      fireEvent.changeText(input, '');
      fireEvent(input, 'focus');

      expect(screen.getByText(/Use formats like/)).toBeTruthy();
    });

    it('should hide tooltip on blur', () => {
      render(<TimeRemainingInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('');
      fireEvent(input, 'focus');
      fireEvent(input, 'blur');

      expect(screen.queryByText(/Use formats like/)).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle totalQuantity of 0', () => {
      const onChange = jest.fn();
      render(<TimeRemainingInput {...defaultProps} totalQuantity={0} onChange={onChange} />);

      const input = screen.getByPlaceholderText('');
      fireEvent.changeText(input, '0m');

      expect(onChange).toHaveBeenCalledWith(0);
    });

    it('should handle very large totalQuantity', () => {
      const onChange = jest.fn();
      render(<TimeRemainingInput {...defaultProps} totalQuantity={10000} onChange={onChange} />);

      const input = screen.getByPlaceholderText('');
      fireEvent.changeText(input, '100h');

      expect(onChange).toHaveBeenCalledWith(4000);
    });

    it('should handle current time at start (remaining equals total)', () => {
      const onChange = jest.fn();
      render(<TimeRemainingInput {...defaultProps} totalQuantity={600} onChange={onChange} />);

      const input = screen.getByPlaceholderText('');
      fireEvent.changeText(input, '10h 0m');

      expect(onChange).toHaveBeenCalledWith(0);
    });

    it('should handle current time at end (remaining is 0)', () => {
      const onChange = jest.fn();
      render(<TimeRemainingInput {...defaultProps} totalQuantity={600} onChange={onChange} />);

      const input = screen.getByPlaceholderText('');
      fireEvent.changeText(input, '0m');

      expect(onChange).toHaveBeenCalledWith(600);
    });
  });

  describe('Format Preservation', () => {
    it('should preserve user input format while focused', () => {
      render(<TimeRemainingInput {...defaultProps} totalQuantity={600} />);

      const input = screen.getByPlaceholderText('');
      fireEvent(input, 'focus');
      fireEvent.changeText(input, '3:30');

      expect(input.props.value).toBe('3:30');
    });

    it('should format time on blur', () => {
      const TestWrapper = () => {
        const [value, setValue] = React.useState(0);
        return (
          <TimeRemainingInput
            value={value}
            onChange={setValue}
            totalQuantity={600}
          />
        );
      };

      render(<TestWrapper />);

      const input = screen.getByPlaceholderText('');
      fireEvent(input, 'focus');
      fireEvent.changeText(input, '210');
      fireEvent(input, 'blur');

      expect(input.props.value).toBe('3h 30m');
    });
  });
});
