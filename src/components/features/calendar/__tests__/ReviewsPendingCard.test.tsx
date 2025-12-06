import { DailyActivity } from '@/types/calendar.types';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { ReviewsPendingCard } from '../ReviewsPendingCard';

// Mock ThemedText
jest.mock('@/components/themed', () => ({
  ThemedText: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement(
      'Text',
      { ...props, testID: props.testID || 'themed-text' },
      children
    );
  },
}));

// Mock IconSymbol
jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: ({ name, color, ...props }: any) => {
    const React = require('react');
    return React.createElement(
      'View',
      { ...props, testID: `icon-${name}`, 'data-color': color },
      null
    );
  },
}));

// Mock useTheme
jest.mock('@/hooks/useTheme', () => ({
  useTheme: jest.fn(() => ({
    colors: {
      surface: '#FFFFFF',
      text: '#11181C',
      textMuted: '#9CA3AF',
      border: '#E2E8F0',
    },
  })),
}));

// Helper to create mock activity
const createMockActivity = (
  overrides: Partial<DailyActivity> = {}
): DailyActivity => ({
  activity_date: '2025-01-15',
  activity_type: 'reviews_pending',
  deadline_id: 'deadline-1',
  book_title: 'The Great Gatsby',
  activity_timestamp: '2025-01-15T00:00:00Z',
  metadata: {
    format: 'physical',
    author: 'F. Scott Fitzgerald',
    cover_image_url: null,
    unposted_count: 2,
    total_platforms: 3,
    platform_names: ['Amazon', 'Goodreads'],
  },
  ...overrides,
});

describe('ReviewsPendingCard', () => {
  describe('Component Structure', () => {
    it('should render all main UI elements', () => {
      const activity = createMockActivity();

      render(<ReviewsPendingCard activity={activity} />);

      // Should have icon (square.and.pencil is the reviews_pending icon)
      expect(screen.getByTestId('icon-square.and.pencil')).toBeTruthy();

      // Should have book title
      expect(screen.getByText('The Great Gatsby')).toBeTruthy();

      // Should have "Reminder" label
      expect(screen.getByText('Reminder')).toBeTruthy();

      // Should have pending count
      expect(screen.getByText('2 reviews pending')).toBeTruthy();
    });

    it('should be pressable when onPress is provided', () => {
      const activity = createMockActivity();
      const onPress = jest.fn();

      const { getByTestId } = render(
        <ReviewsPendingCard activity={activity} onPress={onPress} />
      );

      const pressable = getByTestId('reviews-pending-card');
      fireEvent.press(pressable);
      expect(onPress).toHaveBeenCalled();
    });

    it('should render icon with teal color', () => {
      const activity = createMockActivity();

      const { getByTestId } = render(
        <ReviewsPendingCard activity={activity} />
      );

      const icon = getByTestId('icon-square.and.pencil');
      expect(icon).toBeTruthy();
      // The teal color from ACTIVITY_TYPE_CONFIG.reviews_pending
      expect(icon.props['data-color']).toBe('#14B8A6');
    });
  });

  describe('Review Count Display', () => {
    it('should display singular text for 1 review pending', () => {
      const activity = createMockActivity({
        metadata: {
          unposted_count: 1,
          total_platforms: 2,
          platform_names: ['Amazon'],
        },
      });

      render(<ReviewsPendingCard activity={activity} />);

      expect(screen.getByText('1 review pending')).toBeTruthy();
    });

    it('should display plural text for multiple reviews pending', () => {
      const activity = createMockActivity({
        metadata: {
          unposted_count: 3,
          total_platforms: 4,
          platform_names: ['Amazon', 'Goodreads', 'BookBub'],
        },
      });

      render(<ReviewsPendingCard activity={activity} />);

      expect(screen.getByText('3 reviews pending')).toBeTruthy();
    });

    it('should handle 0 reviews pending gracefully', () => {
      const activity = createMockActivity({
        metadata: {
          unposted_count: 0,
          total_platforms: 2,
          platform_names: [],
        },
      });

      render(<ReviewsPendingCard activity={activity} />);

      expect(screen.getByText('0 reviews pending')).toBeTruthy();
    });

    it('should handle missing metadata gracefully', () => {
      const activity = createMockActivity();
      // Remove metadata to test fallback behavior
      delete (activity as any).metadata;

      render(<ReviewsPendingCard activity={activity} />);

      // Should fall back to 0 when metadata is missing
      expect(screen.getByText('0 reviews pending')).toBeTruthy();
    });

    it('should handle missing unposted_count in metadata', () => {
      const activity = createMockActivity({
        metadata: {
          total_platforms: 2,
          platform_names: ['Amazon'],
        },
      });

      render(<ReviewsPendingCard activity={activity} />);

      // Should fall back to 0 when unposted_count is missing
      expect(screen.getByText('0 reviews pending')).toBeTruthy();
    });
  });

  describe('Press Interaction', () => {
    it('should call onPress when provided and pressed', () => {
      const activity = createMockActivity();
      const onPress = jest.fn();

      const { getByTestId } = render(
        <ReviewsPendingCard activity={activity} onPress={onPress} />
      );

      const pressable = getByTestId('reviews-pending-card');
      fireEvent.press(pressable);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should not throw when pressed without onPress', () => {
      const activity = createMockActivity();

      const { getByTestId } = render(
        <ReviewsPendingCard activity={activity} />
      );

      const pressable = getByTestId('reviews-pending-card');
      expect(() => fireEvent.press(pressable)).not.toThrow();
    });

    it('should be disabled when onPress is not provided', () => {
      const activity = createMockActivity();

      const { getByTestId } = render(
        <ReviewsPendingCard activity={activity} />
      );

      const pressable = getByTestId('reviews-pending-card');
      // The disabled prop should be true when no onPress is provided
      expect(pressable.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle long book titles', () => {
      const activity = createMockActivity({
        book_title:
          'The Very Long and Incredibly Interesting Book Title That Goes On Forever',
      });

      const { getByText } = render(<ReviewsPendingCard activity={activity} />);

      const title = getByText(
        'The Very Long and Incredibly Interesting Book Title That Goes On Forever'
      );
      expect(title).toBeTruthy();
      // numberOfLines prop is set to 1, so text should truncate
      expect(title.props.numberOfLines).toBe(1);
    });

    it('should handle large review counts', () => {
      const activity = createMockActivity({
        metadata: {
          unposted_count: 99,
          total_platforms: 100,
          platform_names: Array(99).fill('Platform'),
        },
      });

      render(<ReviewsPendingCard activity={activity} />);

      expect(screen.getByText('99 reviews pending')).toBeTruthy();
    });
  });

  describe('Styling', () => {
    it('should apply correct icon based on activity type', () => {
      const activity = createMockActivity();

      const { getByTestId } = render(
        <ReviewsPendingCard activity={activity} />
      );

      // reviews_pending uses square.and.pencil icon
      expect(getByTestId('icon-square.and.pencil')).toBeTruthy();
    });

    it('should display "Reminder" as the time column label', () => {
      const activity = createMockActivity();

      render(<ReviewsPendingCard activity={activity} />);

      expect(screen.getByText('Reminder')).toBeTruthy();
    });
  });
});
