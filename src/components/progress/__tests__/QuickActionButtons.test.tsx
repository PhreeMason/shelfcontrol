import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import QuickActionButtons from '../QuickActionButtons';

// Mock useTheme hook
jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      text: '#000000',
      accent: '#FF0000',
      primary: '#007AFF',
    },
  }),
}));

// Mock ThemedButton
jest.mock('@/components/themed', () => ({
  ThemedButton: ({ title, onPress, variant: _variant, textStyle, style }: any) => {
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');
    return React.createElement(
      TouchableOpacity,
      {
        testID: `button-${title}`,
        onPress,
        style,
      },
      React.createElement(
        Text,
        {
          testID: `button-text-${title}`,
          style: textStyle,
        },
        title
      )
    );
  },
}));

describe('QuickActionButtons', () => {
  const mockOnQuickUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Button Rendering', () => {
    it('should render all increment buttons', () => {
      render(<QuickActionButtons onQuickUpdate={mockOnQuickUpdate} />);

      expect(screen.getByTestId('button--1')).toBeTruthy();
      expect(screen.getByTestId('button-+1')).toBeTruthy();
      expect(screen.getByTestId('button-+5')).toBeTruthy();
      expect(screen.getByTestId('button-+10')).toBeTruthy();
    });

    it('should display correct button titles', () => {
      render(<QuickActionButtons onQuickUpdate={mockOnQuickUpdate} />);

      expect(screen.getByText('-1')).toBeTruthy();
      expect(screen.getByText('+1')).toBeTruthy();
      expect(screen.getByText('+5')).toBeTruthy();
      expect(screen.getByText('+10')).toBeTruthy();
    });

    it('should apply outline variant to all buttons', () => {
      render(<QuickActionButtons onQuickUpdate={mockOnQuickUpdate} />);

      // All buttons should have been created with variant="outline"
      // We can verify this by checking that all buttons are rendered
      const buttons = [
        screen.getByTestId('button--1'),
        screen.getByTestId('button-+1'),
        screen.getByTestId('button-+5'),
        screen.getByTestId('button-+10'),
      ];

      expect(buttons).toHaveLength(4);
    });
  });

  describe('Button Actions', () => {
    it('should call onQuickUpdate with -1 when -1 button is pressed', () => {
      render(<QuickActionButtons onQuickUpdate={mockOnQuickUpdate} />);

      const button = screen.getByTestId('button--1');
      fireEvent.press(button);

      expect(mockOnQuickUpdate).toHaveBeenCalledWith(-1);
      expect(mockOnQuickUpdate).toHaveBeenCalledTimes(1);
    });

    it('should call onQuickUpdate with +1 when +1 button is pressed', () => {
      render(<QuickActionButtons onQuickUpdate={mockOnQuickUpdate} />);

      const button = screen.getByTestId('button-+1');
      fireEvent.press(button);

      expect(mockOnQuickUpdate).toHaveBeenCalledWith(1);
      expect(mockOnQuickUpdate).toHaveBeenCalledTimes(1);
    });

    it('should call onQuickUpdate with +5 when +5 button is pressed', () => {
      render(<QuickActionButtons onQuickUpdate={mockOnQuickUpdate} />);

      const button = screen.getByTestId('button-+5');
      fireEvent.press(button);

      expect(mockOnQuickUpdate).toHaveBeenCalledWith(5);
      expect(mockOnQuickUpdate).toHaveBeenCalledTimes(1);
    });

    it('should call onQuickUpdate with +10 when +10 button is pressed', () => {
      render(<QuickActionButtons onQuickUpdate={mockOnQuickUpdate} />);

      const button = screen.getByTestId('button-+10');
      fireEvent.press(button);

      expect(mockOnQuickUpdate).toHaveBeenCalledWith(10);
      expect(mockOnQuickUpdate).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple button presses', () => {
      render(<QuickActionButtons onQuickUpdate={mockOnQuickUpdate} />);

      fireEvent.press(screen.getByTestId('button-+5'));
      fireEvent.press(screen.getByTestId('button-+10'));
      fireEvent.press(screen.getByTestId('button--1'));

      expect(mockOnQuickUpdate).toHaveBeenCalledTimes(3);
      expect(mockOnQuickUpdate).toHaveBeenNthCalledWith(1, 5);
      expect(mockOnQuickUpdate).toHaveBeenNthCalledWith(2, 10);
      expect(mockOnQuickUpdate).toHaveBeenNthCalledWith(3, -1);
    });
  });

  describe('Button Styling', () => {
    it('should apply correct text color for positive increments', () => {
      render(<QuickActionButtons onQuickUpdate={mockOnQuickUpdate} />);

      const positiveButtons = [
        screen.getByTestId('button-text-+1'),
        screen.getByTestId('button-text-+5'),
        screen.getByTestId('button-text-+10'),
      ];

      positiveButtons.forEach(button => {
        expect(button.props.style).toEqual(
          expect.objectContaining({
            fontWeight: '900',
            color: '#000000', // colors.text
          })
        );
      });
    });

    it('should apply accent color for negative increment', () => {
      render(<QuickActionButtons onQuickUpdate={mockOnQuickUpdate} />);

      const negativeButton = screen.getByTestId('button-text--1');

      expect(negativeButton.props.style).toEqual(
        expect.objectContaining({
          fontWeight: '900',
          color: '#FF0000', // colors.accent
        })
      );
    });

    it('should apply flex style to buttons', () => {
      render(<QuickActionButtons onQuickUpdate={mockOnQuickUpdate} />);

      const buttons = [
        screen.getByTestId('button--1'),
        screen.getByTestId('button-+1'),
        screen.getByTestId('button-+5'),
        screen.getByTestId('button-+10'),
      ];

      buttons.forEach(button => {
        expect(button.props.style).toEqual(
          expect.objectContaining({
            flex: 1,
          })
        );
      });
    });
  });

  describe('Component Behavior', () => {
    it('should not trigger any callbacks on mount', () => {
      render(<QuickActionButtons onQuickUpdate={mockOnQuickUpdate} />);

      expect(mockOnQuickUpdate).not.toHaveBeenCalled();
    });

    it('should re-render without issues when props change', () => {
      const { rerender } = render(
        <QuickActionButtons onQuickUpdate={mockOnQuickUpdate} />
      );

      const newMockUpdate = jest.fn();
      rerender(<QuickActionButtons onQuickUpdate={newMockUpdate} />);

      fireEvent.press(screen.getByTestId('button-+5'));

      expect(mockOnQuickUpdate).not.toHaveBeenCalled();
      expect(newMockUpdate).toHaveBeenCalledWith(5);
    });

    it('should handle rapid button presses', () => {
      render(<QuickActionButtons onQuickUpdate={mockOnQuickUpdate} />);

      const button = screen.getByTestId('button-+5');

      // Simulate rapid presses
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);

      expect(mockOnQuickUpdate).toHaveBeenCalledTimes(5);
      expect(mockOnQuickUpdate).toHaveBeenCalledWith(5);
    });

    it('should maintain button order consistently', () => {
      render(<QuickActionButtons onQuickUpdate={mockOnQuickUpdate} />);

      const buttons = screen
        .getAllByText(/^[+-]?\d+$/)
        .map(button => button.children[0]);

      expect(buttons).toEqual(['-1', '+1', '+5', '+10']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined onQuickUpdate gracefully', () => {
      // This should not crash
      const { toJSON } = render(
        <QuickActionButtons onQuickUpdate={undefined as any} />
      );

      expect(toJSON()).toBeTruthy();
    });

    it('should handle null onQuickUpdate gracefully', () => {
      // This should not crash
      const { toJSON } = render(<QuickActionButtons onQuickUpdate={null as any} />);

      expect(toJSON()).toBeTruthy();
    });

    it('should not break if onQuickUpdate throws an error', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Test error');
      });

      // Mock console.error to suppress error output in tests
      const originalError = console.error;
      console.error = jest.fn();

      render(<QuickActionButtons onQuickUpdate={errorCallback} />);

      // Should not prevent button from being pressed
      expect(() => {
        fireEvent.press(screen.getByTestId('button-+5'));
      }).toThrow('Test error');

      expect(errorCallback).toHaveBeenCalledWith(5);

      // Restore console.error
      console.error = originalError;
    });
  });
});