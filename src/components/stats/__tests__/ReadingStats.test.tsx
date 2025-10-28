import {
  ReadingDeadlineProgress,
  ReadingDeadlineStatus,
  ReadingDeadlineWithProgress,
} from '@/types/deadline.types';
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import ReadingStats from '../ReadingStats';

jest.mock('@/components/progress/ProgressBar', () => {
  return function MockProgressBar(props: any) {
    const React = require('react');
    return React.createElement(
      'View',
      { testID: 'progress-bar' },
      `ProgressBar: ${props.progressPercentage}% urgency=${props.urgencyLevel}`
    );
  };
});

jest.mock('@/components/stats/StatsSummaryCard', () => {
  return function MockStatsSummaryCard({
    label,
    dateText,
    subtitle,
    children,
  }: any) {
    const React = require('react');
    const { View, Text } = require('react-native');
    return React.createElement(View, { testID: 'stats-summary-card' }, [
      React.createElement(Text, { key: 'label' }, label),
      React.createElement(Text, { key: 'date' }, dateText),
      React.createElement(Text, { key: 'subtitle' }, subtitle),
      children,
    ]);
  };
});

jest.mock('@/components/themed', () => ({
  ThemedView: ({ children, ...props }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(
      View,
      { ...props, testID: 'themed-view' },
      children
    );
  },
  ThemedText: ({ children, variant, ...props }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(
      Text,
      { ...props, testID: `themed-text-${variant || 'default'}` },
      children
    );
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
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-15T00:00:00Z',
  acquisition_source: null,
  type: "Personal",
  publishers: null,
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

const createProgressRecord = (
  current_progress: number,
  created_at: string,
  ignore_in_calcs = false
): ReadingDeadlineProgress => ({
  id: `progress-${Math.random()}`,
  deadline_id: 'test-id',
  current_progress,
  ignore_in_calcs,
  time_spent_reading: null,
  created_at,
  updated_at: created_at,
});

describe('ReadingStats', () => {
  describe('Component Structure', () => {
    it('should render all main sections', () => {
      const deadline = createMockDeadline({
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('complete', '2025-01-15T00:00:00Z'),
        ],
        progress: [
          createProgressRecord(100, '2025-01-06T00:00:00Z'),
          createProgressRecord(200, '2025-01-10T00:00:00Z'),
          createProgressRecord(300, '2025-01-15T00:00:00Z'),
        ],
      });

      render(<ReadingStats deadline={deadline} />);

      expect(screen.getByText('Finished Reading')).toBeTruthy();
      expect(screen.getByText('Pages Read')).toBeTruthy();
      expect(screen.getByText('Reading Timeline')).toBeTruthy();
    });

    it('should render stats grid with two stat items', () => {
      const deadline = createMockDeadline({
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('complete', '2025-01-15T00:00:00Z'),
        ],
        progress: [createProgressRecord(300, '2025-01-15T00:00:00Z')],
      });

      render(<ReadingStats deadline={deadline} />);

      expect(screen.getByText('reading sessions')).toBeTruthy();
    });

    it('should render timeline items', () => {
      const deadline = createMockDeadline({
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('complete', '2025-01-15T00:00:00Z'),
        ],
      });

      render(<ReadingStats deadline={deadline} />);

      expect(screen.getByText('Started')).toBeTruthy();
      expect(screen.getByText('Finished')).toBeTruthy();
      expect(screen.getByText('Total Pages')).toBeTruthy();
      expect(screen.getByText('Format')).toBeTruthy();
    });
  });

  describe('ProgressBar Integration', () => {
    it('should display pages read fraction', () => {
      const deadline = createMockDeadline({
        total_quantity: 300,
        progress: [createProgressRecord(250, '2025-01-15T00:00:00Z')],
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('complete', '2025-01-15T00:00:00Z'),
        ],
      });

      render(<ReadingStats deadline={deadline} />);
      expect(screen.getByText('250/300')).toBeTruthy();
    });
  });

  describe('Status Labels', () => {
    it('should display Finished Reading for complete status', () => {
      const deadline = createMockDeadline({
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('complete', '2025-01-15T00:00:00Z'),
        ],
      });

      render(<ReadingStats deadline={deadline} />);
      expect(screen.getByText('Finished Reading')).toBeTruthy();
    });

    it('should display Finished Reading for to_review status', () => {
      const deadline = createMockDeadline({
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('to_review', '2025-01-15T00:00:00Z'),
        ],
      });

      render(<ReadingStats deadline={deadline} />);
      expect(screen.getByText('Finished Reading')).toBeTruthy();
    });

    it('should display Did Not Finish for did_not_finish status', () => {
      const deadline = createMockDeadline({
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('did_not_finish', '2025-01-15T00:00:00Z'),
        ],
      });

      render(<ReadingStats deadline={deadline} />);
      expect(screen.getByText('Did Not Finish')).toBeTruthy();
    });
  });

  describe('Completion Date Display', () => {
    it('should display formatted completion date', () => {
      const deadline = createMockDeadline({
        status: [
          createStatusRecord('reading', '2025-01-05T12:00:00Z'),
          createStatusRecord('complete', '2025-01-15T12:00:00Z'),
        ],
      });

      render(<ReadingStats deadline={deadline} />);
      const dates = screen.getAllByText(/Jan \d{1,2}, 2025/);
      expect(dates.length).toBeGreaterThan(0);
    });

    it('should display N/A when no completion date', () => {
      const deadline = createMockDeadline({
        status: [createStatusRecord('reading', '2025-01-05T12:00:00Z')],
      });

      render(<ReadingStats deadline={deadline} />);
      expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
    });
  });

  describe('Days to Complete Display', () => {
    it('should display singular day when completed in 1 day', () => {
      const deadline = createMockDeadline({
        status: [
          createStatusRecord('reading', '2025-01-15T08:00:00Z'),
          createStatusRecord('complete', '2025-01-15T18:00:00Z'),
        ],
      });

      render(<ReadingStats deadline={deadline} />);
      expect(screen.getByText('1 day total')).toBeTruthy();
    });

    it('should display plural days when completed in multiple days', () => {
      const deadline = createMockDeadline({
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('complete', '2025-01-15T00:00:00Z'),
        ],
      });

      render(<ReadingStats deadline={deadline} />);
      expect(screen.getByText('10 days total')).toBeTruthy();
    });

    it('should display Duration unknown when days cannot be calculated', () => {
      const deadline = createMockDeadline({
        status: [createStatusRecord('complete', '2025-01-15T00:00:00Z')],
      });

      render(<ReadingStats deadline={deadline} />);
      expect(screen.getByText('Duration unknown')).toBeTruthy();
    });
  });

  describe('Average Pace Display', () => {
    it('should display average pace for physical books', () => {
      const deadline = createMockDeadline({
        total_quantity: 300,
        format: 'physical',
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('complete', '2025-01-15T00:00:00Z'),
        ],
      });

      render(<ReadingStats deadline={deadline} />);
      expect(screen.getByText('30')).toBeTruthy();
    });

    it('should display average pace for audio books', () => {
      const deadline = createMockDeadline({
        total_quantity: 600,
        format: 'audio',
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('complete', '2025-01-15T00:00:00Z'),
        ],
        progress: [createProgressRecord(600, '2025-01-15T00:00:00Z')],
      });

      render(<ReadingStats deadline={deadline} />);
      expect(screen.getByText('1h 0m')).toBeTruthy();
    });

    it('should display N/A when pace cannot be calculated', () => {
      const deadline = createMockDeadline({
        status: [],
      });

      render(<ReadingStats deadline={deadline} />);
      expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
    });
  });

  describe('Reading Sessions Display', () => {
    it('should display correct count of reading sessions', () => {
      const deadline = createMockDeadline({
        progress: [
          createProgressRecord(100, '2025-01-06T00:00:00Z'),
          createProgressRecord(200, '2025-01-10T00:00:00Z'),
          createProgressRecord(300, '2025-01-15T00:00:00Z'),
        ],
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('complete', '2025-01-15T00:00:00Z'),
        ],
      });

      render(<ReadingStats deadline={deadline} />);
      expect(screen.getByText('3')).toBeTruthy();
      expect(screen.getByText('reading sessions')).toBeTruthy();
    });

    it('should display 0 sessions when no progress records', () => {
      const deadline = createMockDeadline({
        progress: [],
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('complete', '2025-01-15T00:00:00Z'),
        ],
      });

      render(<ReadingStats deadline={deadline} />);
      expect(screen.getByText('0')).toBeTruthy();
    });

    it('should exclude ignored progress records from session count', () => {
      const deadline = createMockDeadline({
        progress: [
          createProgressRecord(100, '2025-01-06T00:00:00Z', false),
          createProgressRecord(150, '2025-01-08T00:00:00Z', true),
          createProgressRecord(200, '2025-01-10T00:00:00Z', false),
        ],
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('complete', '2025-01-15T00:00:00Z'),
        ],
      });

      render(<ReadingStats deadline={deadline} />);
      expect(screen.getByText('2')).toBeTruthy();
    });
  });

  describe('Timeline Display', () => {
    it('should display total pages in timeline', () => {
      const deadline = createMockDeadline({
        total_quantity: 300,
        status: [
          createStatusRecord('reading', '2025-01-05T12:00:00Z'),
          createStatusRecord('complete', '2025-01-15T12:00:00Z'),
        ],
      });

      render(<ReadingStats deadline={deadline} />);
      expect(screen.getByText('Total Pages')).toBeTruthy();
      expect(screen.getByText('300 pages')).toBeTruthy();
    });

    it('should display start date in timeline', () => {
      const deadline = createMockDeadline({
        status: [
          createStatusRecord('reading', '2025-01-05T12:00:00Z'),
          createStatusRecord('complete', '2025-01-15T12:00:00Z'),
        ],
      });

      render(<ReadingStats deadline={deadline} />);
      expect(screen.getByText('Started')).toBeTruthy();
      const dates = screen.getAllByText(/Jan \d{1,2}, 2025/);
      expect(dates.length).toBeGreaterThanOrEqual(2);
    });

    it('should display N/A for start date when not available', () => {
      const deadline = createMockDeadline({
        status: [createStatusRecord('complete', '2025-01-15T00:00:00Z')],
      });

      render(<ReadingStats deadline={deadline} />);
      expect(screen.getByText('Started')).toBeTruthy();
      const naTags = screen.getAllByText('N/A');
      expect(naTags.length).toBeGreaterThan(0);
    });

    it('should display book format in timeline', () => {
      const deadline = createMockDeadline({
        format: 'physical',
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('complete', '2025-01-15T00:00:00Z'),
        ],
      });

      render(<ReadingStats deadline={deadline} />);
      expect(screen.getByText('Format')).toBeTruthy();
      expect(screen.getByText('Physical Book')).toBeTruthy();
    });
  });

  describe('Format Variations', () => {
    it('should handle eBook format correctly', () => {
      const deadline = createMockDeadline({
        format: 'eBook',
        total_quantity: 250,
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('complete', '2025-01-10T00:00:00Z'),
        ],
      });

      render(<ReadingStats deadline={deadline} />);
      expect(screen.getByText('eBook')).toBeTruthy();
      expect(screen.getByText('50')).toBeTruthy();
    });

    it('should handle audio format correctly', () => {
      const deadline = createMockDeadline({
        format: 'audio',
        total_quantity: 600,
        status: [
          createStatusRecord('reading', '2025-01-05T00:00:00Z'),
          createStatusRecord('complete', '2025-01-15T00:00:00Z'),
        ],
        progress: [createProgressRecord(600, '2025-01-15T00:00:00Z')],
      });

      render(<ReadingStats deadline={deadline} />);
      expect(screen.getByText('Audiobook')).toBeTruthy();
      expect(screen.getByText('1h 0m')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle deadline with no status records', () => {
      const deadline = createMockDeadline({
        status: [],
      });

      render(<ReadingStats deadline={deadline} />);
      expect(screen.getByText('Finished Reading')).toBeTruthy();
      expect(screen.getByText('Duration unknown')).toBeTruthy();
    });

    it('should handle deadline with only pending status', () => {
      const deadline = createMockDeadline({
        status: [createStatusRecord('pending', '2025-01-01T00:00:00Z')],
      });

      render(<ReadingStats deadline={deadline} />);
      expect(screen.getByText('Duration unknown')).toBeTruthy();
    });

    it('should handle very large session count', () => {
      const progress = Array.from({ length: 100 }, (_, i) =>
        createProgressRecord(
          i * 3,
          `2025-01-${String((i % 30) + 1).padStart(2, '0')}T00:00:00Z`,
          false
        )
      );

      const deadline = createMockDeadline({
        progress,
        status: [
          createStatusRecord('reading', '2025-01-01T00:00:00Z'),
          createStatusRecord('complete', '2025-01-31T00:00:00Z'),
        ],
      });

      render(<ReadingStats deadline={deadline} />);
      expect(screen.getByText('100')).toBeTruthy();
    });
  });
});
