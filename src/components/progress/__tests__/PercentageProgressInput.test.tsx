import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import PercentageProgressInput from '../PercentageProgressInput';

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

jest.mock('../AudiobookProgressInput', () => ({
  formatAudiobookTime: (minutes: number) => {
    if (!minutes || minutes < 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  },
}));

describe('PercentageProgressInput', () => {
  const defaultProps = {
    value: 0,
    onChange: jest.fn(),
    totalQuantity: 400,
    format: 'physical' as const,
    testID: 'percentage-progress-input',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render with label "PERCENTAGE"', () => {
      render(<PercentageProgressInput {...defaultProps} />);
      expect(screen.getByText('PERCENTAGE')).toBeTruthy();
    });

    it('should render percentage symbol', () => {
      render(<PercentageProgressInput {...defaultProps} />);
      expect(screen.getByText('/ 100%')).toBeTruthy();
    });

    it('should render calculated progress for physical books', () => {
      render(<PercentageProgressInput {...defaultProps} value={200} />);
      expect(screen.getByText(/= 200 pages/)).toBeTruthy();
    });

    it('should render calculated progress for ebooks', () => {
      render(
        <PercentageProgressInput {...defaultProps} format="eBook" value={150} />
      );
      // 37% of 400 = 148 pages
      expect(screen.getByText(/= 148 pages/)).toBeTruthy();
    });

    it('should render formatted time for audiobooks', () => {
      render(
        <PercentageProgressInput
          {...defaultProps}
          format="audio"
          value={180}
          totalQuantity={600}
        />
      );
      expect(screen.getByText(/= 3h/)).toBeTruthy();
    });
  });

  describe('Percentage Calculation', () => {
    it('should calculate progress from percentage (conservative rounding)', () => {
      const onChange = jest.fn();
      render(
        <PercentageProgressInput
          {...defaultProps}
          totalQuantity={400}
          onChange={onChange}
        />
      );

      const input = screen.getByTestId('percentage-progress-input');
      fireEvent.changeText(input, '65');

      expect(onChange).toHaveBeenCalledWith(260);
    });

    it('should round down conservatively for decimal results', () => {
      const onChange = jest.fn();
      render(
        <PercentageProgressInput
          {...defaultProps}
          totalQuantity={300}
          onChange={onChange}
        />
      );

      const input = screen.getByTestId('percentage-progress-input');
      fireEvent.changeText(input, '33');

      expect(onChange).toHaveBeenCalledWith(99);
    });

    it('should handle 0 percentage', () => {
      const onChange = jest.fn();
      render(
        <PercentageProgressInput
          {...defaultProps}
          totalQuantity={400}
          onChange={onChange}
        />
      );

      const input = screen.getByTestId('percentage-progress-input');
      fireEvent.changeText(input, '0');

      expect(onChange).toHaveBeenCalledWith(0);
    });

    it('should handle 100 percentage', () => {
      const onChange = jest.fn();
      render(
        <PercentageProgressInput
          {...defaultProps}
          totalQuantity={400}
          onChange={onChange}
        />
      );

      const input = screen.getByTestId('percentage-progress-input');
      fireEvent.changeText(input, '100');

      expect(onChange).toHaveBeenCalledWith(400);
    });

    it('should not call onChange for percentage > 100', () => {
      const onChange = jest.fn();
      render(
        <PercentageProgressInput
          {...defaultProps}
          totalQuantity={400}
          onChange={onChange}
        />
      );

      const input = screen.getByTestId('percentage-progress-input');
      fireEvent.changeText(input, '150');

      expect(onChange).not.toHaveBeenCalled();
    });

    it('should not call onChange for negative percentage', () => {
      const onChange = jest.fn();
      render(
        <PercentageProgressInput
          {...defaultProps}
          totalQuantity={400}
          onChange={onChange}
        />
      );

      const input = screen.getByTestId('percentage-progress-input');
      fireEvent.changeText(input, '-10');

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Input Handling', () => {
    it('should handle text input changes', () => {
      const onChange = jest.fn();
      render(<PercentageProgressInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByTestId('percentage-progress-input');
      fireEvent.changeText(input, '50');

      expect(onChange).toHaveBeenCalled();
    });

    it('should handle blur event', () => {
      const onBlur = jest.fn();
      render(<PercentageProgressInput {...defaultProps} onBlur={onBlur} />);

      const input = screen.getByTestId('percentage-progress-input');
      fireEvent(input, 'blur');

      expect(onBlur).toHaveBeenCalled();
    });

    it('should reset to calculated percentage on blur with invalid input', () => {
      render(
        <PercentageProgressInput
          {...defaultProps}
          value={200}
          totalQuantity={400}
        />
      );

      const input = screen.getByTestId('percentage-progress-input');
      fireEvent.changeText(input, '150');
      fireEvent(input, 'blur');

      expect(screen.getByText(/= 200 pages/)).toBeTruthy();
    });

    it('should handle empty input', () => {
      const onChange = jest.fn();
      render(<PercentageProgressInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByTestId('percentage-progress-input');
      fireEvent.changeText(input, '');

      expect(onChange).toHaveBeenCalledWith(0);
    });
  });

  describe('Format-Specific Display', () => {
    it('should display "pages" for physical format', () => {
      render(
        <PercentageProgressInput
          {...defaultProps}
          format="physical"
          totalQuantity={400}
        />
      );

      const input = screen.getByTestId('percentage-progress-input');
      fireEvent.changeText(input, '50');

      expect(screen.getByText(/= 200 pages/)).toBeTruthy();
    });

    it('should display "pages" for eBook format', () => {
      render(
        <PercentageProgressInput
          {...defaultProps}
          format="eBook"
          totalQuantity={400}
        />
      );

      const input = screen.getByTestId('percentage-progress-input');
      fireEvent.changeText(input, '50');

      expect(screen.getByText(/= 200 pages/)).toBeTruthy();
    });

    it('should display formatted time for audio format', () => {
      render(
        <PercentageProgressInput
          {...defaultProps}
          format="audio"
          totalQuantity={600}
        />
      );

      const input = screen.getByTestId('percentage-progress-input');
      fireEvent.changeText(input, '53');

      expect(screen.getByText(/= 5h/)).toBeTruthy();
    });

    it('should handle minutes for audio format', () => {
      render(
        <PercentageProgressInput
          {...defaultProps}
          format="audio"
          totalQuantity={120}
        />
      );

      const input = screen.getByTestId('percentage-progress-input');
      fireEvent.changeText(input, '50');

      expect(screen.getByText(/= 1h/)).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle totalQuantity of 0', () => {
      const onChange = jest.fn();
      render(
        <PercentageProgressInput
          {...defaultProps}
          totalQuantity={0}
          onChange={onChange}
        />
      );

      const input = screen.getByTestId('percentage-progress-input');
      fireEvent.changeText(input, '50');

      expect(onChange).toHaveBeenCalledWith(0);
    });

    it('should handle very large totalQuantity', () => {
      const onChange = jest.fn();
      render(
        <PercentageProgressInput
          {...defaultProps}
          totalQuantity={10000}
          onChange={onChange}
        />
      );

      const input = screen.getByTestId('percentage-progress-input');
      fireEvent.changeText(input, '50');

      expect(onChange).toHaveBeenCalledWith(5000);
    });

    it('should display calculated progress updates in real-time', () => {
      const { rerender } = render(
        <PercentageProgressInput {...defaultProps} totalQuantity={400} />
      );

      expect(screen.getByText(/= 0 pages/)).toBeTruthy();

      rerender(
        <PercentageProgressInput
          {...defaultProps}
          value={200}
          totalQuantity={400}
        />
      );

      expect(screen.getByText(/= 200 pages/)).toBeTruthy();
    });
  });
});
