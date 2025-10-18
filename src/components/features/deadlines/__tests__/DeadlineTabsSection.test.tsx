import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import {
  ReadingDeadlineStatus,
  ReadingDeadlineWithProgress,
} from '@/types/deadline.types';
import DeadlineTabsSection from '../DeadlineTabsSection';

jest.mock('@/components/stats/ReadingStats', () => {
  return function MockReadingStats() {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'reading-stats' }, 'ReadingStats Component');
  };
});

jest.mock('@/components/charts/DailyReadingChart', () => {
  return function MockDailyReadingChart() {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'daily-reading-chart' }, 'DailyReadingChart Component');
  };
});

jest.mock('@/components/features/review/ReviewProgressSection', () => {
  return function MockReviewProgressSection() {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'review-progress-section' }, 'ReviewProgressSection Component');
  };
});

jest.mock('@/components/themed', () => ({
  ThemedView: ({ children, ...props }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { ...props, testID: 'themed-view' }, children);
  },
}));

const createMockDeadline = (
  overrides: Partial<ReadingDeadlineWithProgress> = {}
): ReadingDeadlineWithProgress => ({
  id: 'test-id',
  user_id: 'user-123',
  book_title: 'Test Book',
  author: 'Test Author',
  book_id: null,
  total_quantity: 300,
  format: 'physical',
  deadline_date: '2025-01-20',
  flexibility: 'flexible',
  source: 'NetGalley',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-15T00:00:00Z',
  progress: [],
  status: [],
  ...overrides,
});

const createStatusRecord = (
  status: string,
  created_at: string
): ReadingDeadlineStatus => ({
  id: `status-${Math.random()}`,
  deadline_id: 'test-id',
  status: status as
    | 'pending'
    | 'reading'
    | 'to_review'
    | 'complete'
    | 'did_not_finish'
    | null,
  created_at,
  updated_at: created_at,
});

describe('DeadlineTabsSection', () => {
  describe('Component Structure', () => {
    it('should render both tabs', () => {
      const deadline = createMockDeadline({
        status: [createStatusRecord('to_review', '2025-01-15T00:00:00Z')],
      });

      render(<DeadlineTabsSection deadline={deadline} />);

      expect(screen.getByTestId('stats-tab')).toBeTruthy();
      expect(screen.getByTestId('reviews-tab')).toBeTruthy();
      expect(screen.getByText('Stats')).toBeTruthy();
      expect(screen.getByText('Reviews')).toBeTruthy();
    });

    it('should have themed view container', () => {
      const deadline = createMockDeadline();
      render(<DeadlineTabsSection deadline={deadline} />);

      const themedViews = screen.getAllByTestId('themed-view');
      expect(themedViews.length).toBeGreaterThan(0);
    });
  });

  describe('Tab Default State', () => {
    it('should default to stats tab', () => {
      const deadline = createMockDeadline({
        status: [createStatusRecord('to_review', '2025-01-15T00:00:00Z')],
      });

      render(<DeadlineTabsSection deadline={deadline} />);

      expect(screen.getByTestId('reading-stats')).toBeTruthy();
      expect(screen.getByTestId('daily-reading-chart')).toBeTruthy();
      expect(screen.queryByTestId('review-progress-section')).toBeNull();
    });
  });

  describe('Tab Switching', () => {
    it('should switch to reviews tab when clicked', () => {
      const deadline = createMockDeadline({
        status: [createStatusRecord('to_review', '2025-01-15T00:00:00Z')],
      });

      render(<DeadlineTabsSection deadline={deadline} />);

      const reviewsTab = screen.getByTestId('reviews-tab');
      fireEvent.press(reviewsTab);

      expect(screen.getByTestId('review-progress-section')).toBeTruthy();
      expect(screen.queryByTestId('reading-stats')).toBeNull();
      expect(screen.queryByTestId('daily-reading-chart')).toBeNull();
    });

    it('should switch back to stats tab when clicked', () => {
      const deadline = createMockDeadline({
        status: [createStatusRecord('to_review', '2025-01-15T00:00:00Z')],
      });

      render(<DeadlineTabsSection deadline={deadline} />);

      const reviewsTab = screen.getByTestId('reviews-tab');
      fireEvent.press(reviewsTab);

      expect(screen.getByTestId('review-progress-section')).toBeTruthy();

      const statsTab = screen.getByTestId('stats-tab');
      fireEvent.press(statsTab);

      expect(screen.getByTestId('reading-stats')).toBeTruthy();
      expect(screen.getByTestId('daily-reading-chart')).toBeTruthy();
      expect(screen.queryByTestId('review-progress-section')).toBeNull();
    });
  });

  describe('Tab Content Rendering', () => {
    it('should render stats content in stats tab', () => {
      const deadline = createMockDeadline({
        status: [createStatusRecord('complete', '2025-01-15T00:00:00Z')],
      });

      render(<DeadlineTabsSection deadline={deadline} />);

      expect(screen.getByTestId('reading-stats')).toBeTruthy();
      expect(screen.getByText('ReadingStats Component')).toBeTruthy();
      expect(screen.getByTestId('daily-reading-chart')).toBeTruthy();
      expect(screen.getByText('DailyReadingChart Component')).toBeTruthy();
    });

    it('should render reviews content in reviews tab', () => {
      const deadline = createMockDeadline({
        status: [createStatusRecord('to_review', '2025-01-15T00:00:00Z')],
      });

      render(<DeadlineTabsSection deadline={deadline} />);

      const reviewsTab = screen.getByTestId('reviews-tab');
      fireEvent.press(reviewsTab);

      expect(screen.getByTestId('review-progress-section')).toBeTruthy();
      expect(screen.getByText('ReviewProgressSection Component')).toBeTruthy();
    });
  });

  describe('Different Deadline Statuses', () => {
    it('should work with to_review status', () => {
      const deadline = createMockDeadline({
        status: [createStatusRecord('to_review', '2025-01-15T00:00:00Z')],
      });

      render(<DeadlineTabsSection deadline={deadline} />);

      expect(screen.getByTestId('stats-tab')).toBeTruthy();
      expect(screen.getByTestId('reviews-tab')).toBeTruthy();
    });

    it('should work with complete status', () => {
      const deadline = createMockDeadline({
        status: [createStatusRecord('complete', '2025-01-15T00:00:00Z')],
      });

      render(<DeadlineTabsSection deadline={deadline} />);

      expect(screen.getByTestId('stats-tab')).toBeTruthy();
      expect(screen.getByTestId('reviews-tab')).toBeTruthy();
    });

    it('should work with did_not_finish status', () => {
      const deadline = createMockDeadline({
        status: [createStatusRecord('did_not_finish', '2025-01-15T00:00:00Z')],
      });

      render(<DeadlineTabsSection deadline={deadline} />);

      expect(screen.getByTestId('stats-tab')).toBeTruthy();
      expect(screen.getByTestId('reviews-tab')).toBeTruthy();
    });
  });

  describe('Multiple Tab Switches', () => {
    it('should handle multiple rapid tab switches', () => {
      const deadline = createMockDeadline({
        status: [createStatusRecord('to_review', '2025-01-15T00:00:00Z')],
      });

      render(<DeadlineTabsSection deadline={deadline} />);

      const statsTab = screen.getByTestId('stats-tab');
      const reviewsTab = screen.getByTestId('reviews-tab');

      fireEvent.press(reviewsTab);
      expect(screen.getByTestId('review-progress-section')).toBeTruthy();

      fireEvent.press(statsTab);
      expect(screen.getByTestId('reading-stats')).toBeTruthy();

      fireEvent.press(reviewsTab);
      expect(screen.getByTestId('review-progress-section')).toBeTruthy();

      fireEvent.press(statsTab);
      expect(screen.getByTestId('reading-stats')).toBeTruthy();
    });
  });
});
