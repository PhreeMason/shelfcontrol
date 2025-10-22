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
    it('should render a single toggle button', () => {
      render(
        <InputModeToggle
          modes={twoModeOptions}
          selectedMode="direct"
          onModeChange={mockOnModeChange}
        />
      );

      expect(screen.getByTestId('input-mode-toggle')).toBeTruthy();
    });

    it('should display the current mode label', () => {
      render(
        <InputModeToggle
          modes={twoModeOptions}
          selectedMode="direct"
          onModeChange={mockOnModeChange}
        />
      );

      expect(screen.getByText('Page')).toBeTruthy();
    });

    it('should display selected mode for three-mode setup', () => {
      render(
        <InputModeToggle
          modes={threeModeOptions}
          selectedMode="remaining"
          onModeChange={mockOnModeChange}
        />
      );

      expect(screen.getByText('Left')).toBeTruthy();
    });
  });

  describe('Cycling Behavior', () => {
    it('should cycle to next mode when pressed', () => {
      render(
        <InputModeToggle
          modes={twoModeOptions}
          selectedMode="direct"
          onModeChange={mockOnModeChange}
        />
      );

      const toggleButton = screen.getByTestId('input-mode-toggle');
      fireEvent.press(toggleButton);

      expect(mockOnModeChange).toHaveBeenCalledWith('percentage');
    });

    it('should wrap from last mode to first mode', () => {
      render(
        <InputModeToggle
          modes={twoModeOptions}
          selectedMode="percentage"
          onModeChange={mockOnModeChange}
        />
      );

      const toggleButton = screen.getByTestId('input-mode-toggle');
      fireEvent.press(toggleButton);

      expect(mockOnModeChange).toHaveBeenCalledWith('direct');
    });

    it('should cycle through three modes correctly', () => {
      const { rerender } = render(
        <InputModeToggle
          modes={threeModeOptions}
          selectedMode="direct"
          onModeChange={mockOnModeChange}
        />
      );

      const toggleButton = screen.getByTestId('input-mode-toggle');

      fireEvent.press(toggleButton);
      expect(mockOnModeChange).toHaveBeenCalledWith('percentage');

      rerender(
        <InputModeToggle
          modes={threeModeOptions}
          selectedMode="percentage"
          onModeChange={mockOnModeChange}
        />
      );

      fireEvent.press(toggleButton);
      expect(mockOnModeChange).toHaveBeenCalledWith('remaining');

      rerender(
        <InputModeToggle
          modes={threeModeOptions}
          selectedMode="remaining"
          onModeChange={mockOnModeChange}
        />
      );

      fireEvent.press(toggleButton);
      expect(mockOnModeChange).toHaveBeenCalledWith('direct');
    });

    it('should handle rapid cycling', () => {
      const { rerender } = render(
        <InputModeToggle
          modes={twoModeOptions}
          selectedMode="direct"
          onModeChange={mockOnModeChange}
        />
      );

      const toggleButton = screen.getByTestId('input-mode-toggle');

      fireEvent.press(toggleButton);
      expect(mockOnModeChange).toHaveBeenNthCalledWith(1, 'percentage');

      rerender(
        <InputModeToggle
          modes={twoModeOptions}
          selectedMode="percentage"
          onModeChange={mockOnModeChange}
        />
      );

      fireEvent.press(toggleButton);
      expect(mockOnModeChange).toHaveBeenNthCalledWith(2, 'direct');

      rerender(
        <InputModeToggle
          modes={twoModeOptions}
          selectedMode="direct"
          onModeChange={mockOnModeChange}
        />
      );

      fireEvent.press(toggleButton);
      expect(mockOnModeChange).toHaveBeenNthCalledWith(3, 'percentage');

      expect(mockOnModeChange).toHaveBeenCalledTimes(3);
    });
  });

  describe('Styling', () => {
    it('should use transparent background with primary border', () => {
      render(
        <InputModeToggle
          modes={twoModeOptions}
          selectedMode="direct"
          onModeChange={mockOnModeChange}
        />
      );

      const toggleButton = screen.getByTestId('input-mode-toggle');
      expect(toggleButton.props.style).toMatchObject({
        backgroundColor: 'transparent',
        borderColor: '#B8A9D9',
      });
    });

    it('should use primary color text for label', () => {
      render(
        <InputModeToggle
          modes={twoModeOptions}
          selectedMode="direct"
          onModeChange={mockOnModeChange}
        />
      );

      const labelText = screen.getByText('Page');
      expect(labelText.props.style).toContainEqual(
        expect.objectContaining({
          color: '#B8A9D9',
        })
      );
    });
  });

  describe('Label Updates', () => {
    it('should update label when mode changes', () => {
      const { rerender } = render(
        <InputModeToggle
          modes={twoModeOptions}
          selectedMode="direct"
          onModeChange={mockOnModeChange}
        />
      );

      expect(screen.getByText('Page')).toBeTruthy();

      rerender(
        <InputModeToggle
          modes={twoModeOptions}
          selectedMode="percentage"
          onModeChange={mockOnModeChange}
        />
      );

      expect(screen.getByText('%')).toBeTruthy();
    });
  });
});
