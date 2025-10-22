import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import InputModeToggle from '../InputModeToggle';
import type { ProgressInputMode } from '@/types/progressInput.types';

jest.mock('@/components/themed', () => ({
  ThemedText: ({ children, ...props }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, props, children);
  },
}));

jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: () => ({
    colors: {
      primary: '#B8A9D9',
    },
  }),
}));

describe('InputModeToggle', () => {
  const twoModeOptions = [
    { key: 'direct' as ProgressInputMode, label: 'Page' },
    { key: 'percentage' as ProgressInputMode, label: '%' },
  ];

  const threeModeOptions = [
    { key: 'direct' as ProgressInputMode, label: 'Time' },
    { key: 'percentage' as ProgressInputMode, label: '%' },
    { key: 'remaining' as ProgressInputMode, label: 'Left' },
  ];

  const mockOnModeChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render all mode options', () => {
      render(
        <InputModeToggle
          modes={twoModeOptions}
          selectedMode="direct"
          onModeChange={mockOnModeChange}
        />
      );

      expect(screen.getByText('Page')).toBeTruthy();
      expect(screen.getByText('%')).toBeTruthy();
    });

    it('should render three modes for audiobook format', () => {
      render(
        <InputModeToggle
          modes={threeModeOptions}
          selectedMode="direct"
          onModeChange={mockOnModeChange}
        />
      );

      expect(screen.getByText('Time')).toBeTruthy();
      expect(screen.getByText('%')).toBeTruthy();
      expect(screen.getByText('Left')).toBeTruthy();
    });

    it('should have testIDs for each mode button', () => {
      render(
        <InputModeToggle
          modes={twoModeOptions}
          selectedMode="direct"
          onModeChange={mockOnModeChange}
        />
      );

      expect(screen.getByTestId('input-mode-direct')).toBeTruthy();
      expect(screen.getByTestId('input-mode-percentage')).toBeTruthy();
    });
  });

  describe('Mode Selection', () => {
    it('should highlight the selected mode', () => {
      render(
        <InputModeToggle
          modes={twoModeOptions}
          selectedMode="direct"
          onModeChange={mockOnModeChange}
        />
      );

      const directButton = screen.getByTestId('input-mode-direct');
      expect(directButton.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#B8A9D9',
        })
      );
    });

    it('should not highlight non-selected modes', () => {
      render(
        <InputModeToggle
          modes={twoModeOptions}
          selectedMode="direct"
          onModeChange={mockOnModeChange}
        />
      );

      const percentageButton = screen.getByTestId('input-mode-percentage');
      expect(percentageButton.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: 'transparent',
        })
      );
    });

    it('should call onModeChange when a mode is pressed', () => {
      render(
        <InputModeToggle
          modes={twoModeOptions}
          selectedMode="direct"
          onModeChange={mockOnModeChange}
        />
      );

      const percentageButton = screen.getByTestId('input-mode-percentage');
      fireEvent.press(percentageButton);

      expect(mockOnModeChange).toHaveBeenCalledWith('percentage');
    });

    it('should allow switching between modes', () => {
      const { rerender } = render(
        <InputModeToggle
          modes={twoModeOptions}
          selectedMode="direct"
          onModeChange={mockOnModeChange}
        />
      );

      fireEvent.press(screen.getByTestId('input-mode-percentage'));
      expect(mockOnModeChange).toHaveBeenCalledWith('percentage');

      rerender(
        <InputModeToggle
          modes={twoModeOptions}
          selectedMode="percentage"
          onModeChange={mockOnModeChange}
        />
      );

      const percentageButton = screen.getByTestId('input-mode-percentage');
      expect(percentageButton.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#B8A9D9',
        })
      );
    });
  });

  describe('Three Mode Support', () => {
    it('should support three modes for audiobooks', () => {
      render(
        <InputModeToggle
          modes={threeModeOptions}
          selectedMode="direct"
          onModeChange={mockOnModeChange}
        />
      );

      expect(screen.getByTestId('input-mode-direct')).toBeTruthy();
      expect(screen.getByTestId('input-mode-percentage')).toBeTruthy();
      expect(screen.getByTestId('input-mode-remaining')).toBeTruthy();
    });

    it('should handle selecting third mode', () => {
      render(
        <InputModeToggle
          modes={threeModeOptions}
          selectedMode="direct"
          onModeChange={mockOnModeChange}
        />
      );

      const remainingButton = screen.getByTestId('input-mode-remaining');
      fireEvent.press(remainingButton);

      expect(mockOnModeChange).toHaveBeenCalledWith('remaining');
    });

    it('should highlight the selected mode in three-mode setup', () => {
      render(
        <InputModeToggle
          modes={threeModeOptions}
          selectedMode="remaining"
          onModeChange={mockOnModeChange}
        />
      );

      const remainingButton = screen.getByTestId('input-mode-remaining');
      expect(remainingButton.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#B8A9D9',
        })
      );
    });
  });

  describe('Text Color', () => {
    it('should use white text for selected mode', () => {
      render(
        <InputModeToggle
          modes={twoModeOptions}
          selectedMode="direct"
          onModeChange={mockOnModeChange}
        />
      );

      const directButton = screen.getByTestId('input-mode-direct');
      const textElement = directButton.props.children;
      expect(textElement.props.style).toContainEqual(
        expect.objectContaining({
          color: '#fff',
        })
      );
    });

    it('should use primary color for non-selected modes', () => {
      render(
        <InputModeToggle
          modes={twoModeOptions}
          selectedMode="direct"
          onModeChange={mockOnModeChange}
        />
      );

      const percentageButton = screen.getByTestId('input-mode-percentage');
      const textElement = percentageButton.props.children;
      expect(textElement.props.style).toContainEqual(
        expect.objectContaining({
          color: '#B8A9D9',
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid mode switching', () => {
      render(
        <InputModeToggle
          modes={twoModeOptions}
          selectedMode="direct"
          onModeChange={mockOnModeChange}
        />
      );

      const percentageButton = screen.getByTestId('input-mode-percentage');
      const directButton = screen.getByTestId('input-mode-direct');

      fireEvent.press(percentageButton);
      fireEvent.press(directButton);
      fireEvent.press(percentageButton);

      expect(mockOnModeChange).toHaveBeenCalledTimes(3);
      expect(mockOnModeChange).toHaveBeenLastCalledWith('percentage');
    });

    it('should handle pressing the already selected mode', () => {
      render(
        <InputModeToggle
          modes={twoModeOptions}
          selectedMode="direct"
          onModeChange={mockOnModeChange}
        />
      );

      const directButton = screen.getByTestId('input-mode-direct');
      fireEvent.press(directButton);

      expect(mockOnModeChange).toHaveBeenCalledWith('direct');
    });
  });
});
