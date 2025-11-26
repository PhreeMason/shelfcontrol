/**
 * Tests for DailyChartTooltip component
 * Following Phase 6-7 integration testing pattern from TESTING.md
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { DailyChartTooltip } from '../DailyChartTooltip';

// Mock useTheme hook
jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      text: '#000000',
      background: '#FFFFFF',
      border: '#E5E5E5',
      primary: '#007AFF',
      textMuted: '#6B7280',
    },
    theme: 'light',
  }),
}));

// Mock Theme constants
jest.mock('@/constants/Theme', () => ({
  ComponentVariants: {
    text: {
      default: {
        color: 'text',
        typography: 'bodyLarge',
      },
      defaultSemiBold: {
        color: 'text',
        typography: 'titleMedium',
      },
      muted: {
        color: 'textMuted',
        typography: 'bodyMedium',
      },
    },
    surface: {
      default: {
        container: 'background',
        onContainer: 'text',
      },
    },
  },
  createThemedStyle: {
    text: () => ({
      fontSize: 14,
      fontFamily: 'Nunito-Regular',
    }),
    surface: () => ({}),
  },
}));

describe('DailyChartTooltip', () => {
  describe('Component Rendering', () => {
    it('should render tooltip with required and actual values for physical book', () => {
      const items = [
        { value: 100, label: '1/15' }, // required
        { value: 120, label: '1/15' }, // actual
      ];

      render(<DailyChartTooltip items={items} format="physical" />);

      expect(screen.getByTestId('chart-tooltip')).toBeTruthy();
      expect(screen.getByText('1/15')).toBeTruthy();
      expect(screen.getByText('Required: 100 pages')).toBeTruthy();
      expect(screen.getByText('Actual: 120 pages')).toBeTruthy();
    });

    it('should render tooltip with required value only when actual is missing', () => {
      const items = [{ value: 100, label: '1/15' }];

      render(<DailyChartTooltip items={items} format="physical" />);

      expect(screen.getByTestId('chart-tooltip')).toBeTruthy();
      expect(screen.getByText('1/15')).toBeTruthy();
      expect(screen.getByText('Required: 100 pages')).toBeTruthy();
      expect(screen.queryByTestId('tooltip-actual')).toBeNull();
    });

    it('should not render actual value when it is 0', () => {
      const items = [
        { value: 100, label: '1/15' }, // required
        { value: 0, label: '1/15' }, // actual (future date, no progress yet)
      ];

      render(<DailyChartTooltip items={items} format="physical" />);

      expect(screen.getByText('Required: 100 pages')).toBeTruthy();
      expect(screen.queryByTestId('tooltip-actual')).toBeNull();
    });

    it('should return null when no items provided', () => {
      const { queryByTestId } = render(
        <DailyChartTooltip items={[]} format="physical" />
      );

      // Should not render the tooltip
      expect(queryByTestId('chart-tooltip')).toBeNull();
    });
  });

  describe('Format-Specific Display', () => {
    it('should show pages for physical books', () => {
      const items = [
        { value: 150, label: '1/15' },
        { value: 175, label: '1/15' },
      ];

      render(<DailyChartTooltip items={items} format="physical" />);

      expect(screen.getByText('Required: 150 pages')).toBeTruthy();
      expect(screen.getByText('Actual: 175 pages')).toBeTruthy();
    });

    it('should show pages for eBooks', () => {
      const items = [
        { value: 200, label: '1/16' },
        { value: 210, label: '1/16' },
      ];

      render(<DailyChartTooltip items={items} format="eBook" />);

      expect(screen.getByText('Required: 200 pages')).toBeTruthy();
      expect(screen.getByText('Actual: 210 pages')).toBeTruthy();
    });

    it('should show formatted time for audiobooks', () => {
      const items = [
        { value: 125.5, label: '3:30 PM' }, // 125.5 minutes = 2:05:30
        { value: 140, label: '3:30 PM' }, // 140 minutes = 2:20:00
      ];

      render(<DailyChartTooltip items={items} format="audio" />);

      // formatAudiobookTime should handle the conversion
      expect(screen.getByTestId('tooltip-required')).toBeTruthy();
      expect(screen.getByTestId('tooltip-actual')).toBeTruthy();
    });
  });

  describe('Date Label Display', () => {
    it('should show multi-day format date labels', () => {
      const items = [{ value: 100, label: '1/15' }];

      render(<DailyChartTooltip items={items} format="physical" />);

      expect(screen.getByText('1/15')).toBeTruthy();
    });

    it('should show intraday time labels', () => {
      const items = [{ value: 50, label: '9:30 AM' }];

      render(<DailyChartTooltip items={items} format="audio" />);

      expect(screen.getByText('9:30 AM')).toBeTruthy();
    });
  });

  describe('Value Rounding', () => {
    it('should round page values for physical books', () => {
      const items = [
        { value: 100.7, label: '1/15' },
        { value: 120.3, label: '1/15' },
      ];

      render(<DailyChartTooltip items={items} format="physical" />);

      expect(screen.getByText('Required: 101 pages')).toBeTruthy();
      expect(screen.getByText('Actual: 120 pages')).toBeTruthy();
    });

    it('should round page values for eBooks', () => {
      const items = [
        { value: 99.9, label: '1/16' },
        { value: 105.1, label: '1/16' },
      ];

      render(<DailyChartTooltip items={items} format="eBook" />);

      expect(screen.getByText('Required: 100 pages')).toBeTruthy();
      expect(screen.getByText('Actual: 105 pages')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large values', () => {
      const items = [
        { value: 9999, label: '1/20' },
        { value: 10500, label: '1/20' },
      ];

      render(<DailyChartTooltip items={items} format="physical" />);

      expect(screen.getByText('Required: 9999 pages')).toBeTruthy();
      expect(screen.getByText('Actual: 10500 pages')).toBeTruthy();
    });

    it('should handle very small values', () => {
      const items = [
        { value: 1, label: '1/5' },
        { value: 2, label: '1/5' },
      ];

      render(<DailyChartTooltip items={items} format="physical" />);

      expect(screen.getByText('Required: 1 pages')).toBeTruthy();
      expect(screen.getByText('Actual: 2 pages')).toBeTruthy();
    });

    it('should handle decimal values for audio format', () => {
      const items = [
        { value: 45.5, label: '2:00 PM' },
        { value: 60.75, label: '2:00 PM' },
      ];

      render(<DailyChartTooltip items={items} format="audio" />);

      expect(screen.getByTestId('tooltip-required')).toBeTruthy();
      expect(screen.getByTestId('tooltip-actual')).toBeTruthy();
    });
  });

  describe('TestID Accessibility', () => {
    it('should have correct testIDs for all elements', () => {
      const items = [
        { value: 100, label: '1/15' },
        { value: 120, label: '1/15' },
      ];

      render(<DailyChartTooltip items={items} format="physical" />);

      expect(screen.getByTestId('chart-tooltip')).toBeTruthy();
      expect(screen.getByTestId('tooltip-required')).toBeTruthy();
      expect(screen.getByTestId('tooltip-actual')).toBeTruthy();
    });

    it('should not have tooltip-actual testID when actual value missing', () => {
      const items = [{ value: 100, label: '1/15' }];

      render(<DailyChartTooltip items={items} format="physical" />);

      expect(screen.getByTestId('chart-tooltip')).toBeTruthy();
      expect(screen.getByTestId('tooltip-required')).toBeTruthy();
      expect(screen.queryByTestId('tooltip-actual')).toBeNull();
    });
  });
});
