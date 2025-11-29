import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import {
  ImpactPreviewSection,
  ImpactPreviewData,
} from '../ImpactPreviewSection';

// Mock dependencies following minimal mocking strategy from TESTING.md
jest.mock('@/components/themed', () => ({
  ThemedText: ({ children, ...props }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, props, children);
  },
}));

jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: ({ name, size }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, {
      testID: `icon-${name}`,
      style: { width: size, height: size },
    });
  },
}));

jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: () => ({
    colors: {
      surface: '#FFFFFF',
      border: '#E0E0E0',
      primary: '#007AFF',
      textMuted: '#9CA3AF',
      good: '#7a5a8c',
      approaching: '#d4a46a',
      urgent: '#c8696e',
      overdue: '#c8696e',
      impossible: '#9CA3AF',
    },
  }),
}));

// Mock paceCalculations - use the real formatPaceDisplay implementation
jest.mock('@/utils/paceCalculations', () => ({
  formatPaceDisplay: (pace: number, format: 'physical' | 'eBook' | 'audio') => {
    if (format === 'audio') {
      const minutes = Math.round(pace);
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (hours > 0) {
        return remainingMinutes > 0
          ? `${hours}h ${remainingMinutes}m/day`
          : `${hours}h/day`;
      }
      return `${minutes}m/day`;
    }
    return `${Math.round(pace)} pages/day`;
  },
}));

describe('ImpactPreviewSection', () => {
  const createMockImpactData = (
    overrides: Partial<ImpactPreviewData> = {}
  ): ImpactPreviewData => ({
    format: 'physical',
    thisBookPacePerDay: 25,
    activeBookCount: 2,
    activeTotalPacePerDay: 50,
    activeWithThisPacePerDay: 75,
    activeUrgency: 'good',
    pendingBookCount: 1,
    pendingTotalPacePerDay: 100,
    pendingUrgency: 'approaching',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the impact preview container', () => {
      render(
        <ImpactPreviewSection impactData={createMockImpactData()} mode="new" />
      );

      expect(screen.getByText('If you add this book:')).toBeTruthy();
    });

    it('should render active books section', () => {
      render(
        <ImpactPreviewSection impactData={createMockImpactData()} mode="new" />
      );

      expect(screen.getByText('With your active books')).toBeTruthy();
    });

    it('should display pace value for active books', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({ activeWithThisPacePerDay: 75 })}
          mode="new"
        />
      );

      expect(screen.getByText('75 pages/day')).toBeTruthy();
    });

    it('should return null when activeWithThisPacePerDay is 0', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({ activeWithThisPacePerDay: 0 })}
          mode="new"
        />
      );

      expect(screen.queryByText('If you add this book:')).toBeNull();
    });

    it('should return null when activeWithThisPacePerDay is negative', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({ activeWithThisPacePerDay: -5 })}
          mode="new"
        />
      );

      expect(screen.queryByText('If you add this book:')).toBeNull();
    });
  });

  describe('Book Count Labels', () => {
    it('should show correct book count for new mode with existing active books', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({ activeBookCount: 2 })}
          mode="new"
        />
      );

      // In new mode: activeBookCount + 1
      expect(screen.getByText('3 books')).toBeTruthy();
    });

    it('should show singular "book" for new mode with no active books', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({ activeBookCount: 0 })}
          mode="new"
        />
      );

      // In new mode with 0 active: shows "1 book" (singular)
      expect(screen.getByText('1 book')).toBeTruthy();
    });

    it('should show correct book count for edit mode', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({ activeBookCount: 3 })}
          mode="edit"
        />
      );

      // In edit mode: shows activeBookCount with "(includes this one)"
      expect(screen.getByText('3 books (includes this one)')).toBeTruthy();
    });

    it('should show singular "book" for edit mode with 1 active book', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({ activeBookCount: 1 })}
          mode="edit"
        />
      );

      expect(screen.getByText('1 book (includes this one)')).toBeTruthy();
    });
  });

  describe('Urgency Labels', () => {
    it('should display "Comfortable" label for good urgency', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({ activeUrgency: 'good' })}
          mode="new"
        />
      );

      expect(screen.getByText('Comfortable')).toBeTruthy();
    });

    it('should display "Tight" label for approaching urgency', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({ activeUrgency: 'approaching' })}
          mode="new"
        />
      );

      expect(screen.getByText('Tight')).toBeTruthy();
    });

    it('should display "Tight" label for urgent urgency', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({ activeUrgency: 'urgent' })}
          mode="new"
        />
      );

      expect(screen.getByText('Tight')).toBeTruthy();
    });

    it('should display "Past due" label for overdue urgency', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({ activeUrgency: 'overdue' })}
          mode="new"
        />
      );

      expect(screen.getByText('Past due')).toBeTruthy();
    });

    it('should display "Tough" label for impossible urgency', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({ activeUrgency: 'impossible' })}
          mode="new"
        />
      );

      expect(screen.getByText('Tough')).toBeTruthy();
    });

    it('should not display urgency label when urgency is null', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({ activeUrgency: null })}
          mode="new"
        />
      );

      expect(screen.queryByText('Comfortable')).toBeNull();
      expect(screen.queryByText('Tight')).toBeNull();
      expect(screen.queryByText('Past due')).toBeNull();
      expect(screen.queryByText('Tough')).toBeNull();
    });
  });

  describe('Format Display', () => {
    it('should display pages per day for physical format', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({
            format: 'physical',
            activeWithThisPacePerDay: 50,
          })}
          mode="new"
        />
      );

      expect(screen.getByText('50 pages/day')).toBeTruthy();
    });

    it('should display pages per day for eBook format', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({
            format: 'eBook',
            activeWithThisPacePerDay: 45,
          })}
          mode="new"
        />
      );

      expect(screen.getByText('45 pages/day')).toBeTruthy();
    });

    it('should display minutes for audio format under 60 minutes', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({
            format: 'audio',
            activeWithThisPacePerDay: 45,
          })}
          mode="new"
        />
      );

      expect(screen.getByText('45m/day')).toBeTruthy();
    });

    it('should display hours and minutes for audio format over 60 minutes', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({
            format: 'audio',
            activeWithThisPacePerDay: 90,
          })}
          mode="new"
        />
      );

      expect(screen.getByText('1h 30m/day')).toBeTruthy();
    });

    it('should display just hours for audio format with exact hour value', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({
            format: 'audio',
            activeWithThisPacePerDay: 120,
          })}
          mode="new"
        />
      );

      expect(screen.getByText('2h/day')).toBeTruthy();
    });
  });

  describe('Pending Books Section', () => {
    it('should show pending books toggle when there are pending books', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({ pendingBookCount: 2 })}
          mode="new"
        />
      );

      expect(screen.getByText('What if my pending books start?')).toBeTruthy();
    });

    it('should not show pending books toggle when there are no pending books', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({ pendingBookCount: 0 })}
          mode="new"
        />
      );

      expect(screen.queryByText('What if my pending books start?')).toBeNull();
    });

    it('should expand pending section when toggle is pressed', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({
            pendingBookCount: 2,
            pendingTotalPacePerDay: 100,
          })}
          mode="new"
        />
      );

      // Initially, pending details should not be visible
      expect(screen.queryByText('If all pending become active')).toBeNull();

      // Press the toggle
      fireEvent.press(screen.getByText('What if my pending books start?'));

      // Now pending details should be visible
      expect(screen.getByText('If all pending become active')).toBeTruthy();
      expect(screen.getByText('100 pages/day')).toBeTruthy();
    });

    it('should collapse pending section when toggle is pressed again', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({
            pendingBookCount: 2,
            pendingTotalPacePerDay: 100,
          })}
          mode="new"
        />
      );

      // Expand
      fireEvent.press(screen.getByText('What if my pending books start?'));
      expect(screen.getByText('If all pending become active')).toBeTruthy();

      // Collapse
      fireEvent.press(screen.getByText('What if my pending books start?'));
      expect(screen.queryByText('If all pending become active')).toBeNull();
    });

    it('should show correct pending book count label', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({ pendingBookCount: 3 })}
          mode="new"
        />
      );

      fireEvent.press(screen.getByText('What if my pending books start?'));
      expect(screen.getByText('+3 pending books')).toBeTruthy();
    });

    it('should show singular pending book label for 1 pending book', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({ pendingBookCount: 1 })}
          mode="new"
        />
      );

      fireEvent.press(screen.getByText('What if my pending books start?'));
      expect(screen.getByText('+1 pending book')).toBeTruthy();
    });

    it('should display pending urgency label when available', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({
            pendingBookCount: 2,
            pendingUrgency: 'approaching',
          })}
          mode="new"
        />
      );

      fireEvent.press(screen.getByText('What if my pending books start?'));

      // The pending section should show "Tight" for approaching urgency
      // Note: We already have "Tight" from active section if activeUrgency is also approaching,
      // so we check getAllByText
      const tightLabels = screen.getAllByText('Tight');
      expect(tightLabels.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button for pending toggle', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({ pendingBookCount: 2 })}
          mode="new"
        />
      );

      const toggle = screen.getByRole('button');
      expect(toggle).toBeTruthy();
      expect(toggle.props.accessibilityLabel).toBe(
        'Show impact if pending books start'
      );
    });

    it('should update accessibility state when expanded', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({ pendingBookCount: 2 })}
          mode="new"
        />
      );

      const toggle = screen.getByRole('button');
      expect(toggle.props.accessibilityState).toEqual({ expanded: false });

      fireEvent.press(toggle);
      expect(toggle.props.accessibilityState).toEqual({ expanded: true });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large pace values', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({ activeWithThisPacePerDay: 9999 })}
          mode="new"
        />
      );

      expect(screen.getByText('9999 pages/day')).toBeTruthy();
    });

    it('should round pace values to integers', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({ activeWithThisPacePerDay: 75.7 })}
          mode="new"
        />
      );

      expect(screen.getByText('76 pages/day')).toBeTruthy();
    });

    it('should handle audio format with very large minutes', () => {
      render(
        <ImpactPreviewSection
          impactData={createMockImpactData({
            format: 'audio',
            activeWithThisPacePerDay: 240,
          })}
          mode="new"
        />
      );

      expect(screen.getByText('4h/day')).toBeTruthy();
    });
  });
});
