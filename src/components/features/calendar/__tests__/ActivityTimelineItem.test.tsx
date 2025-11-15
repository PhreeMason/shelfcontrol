import { EnrichedActivity } from '@/types/calendar.types';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { ActivityTimelineItem } from '../ActivityTimelineItem';

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
  IconSymbol: ({ name, ...props }: any) => {
    const React = require('react');
    return React.createElement(
      'View',
      { ...props, testID: `icon-${name}` },
      null
    );
  },
}));

// Mock useTheme
jest.mock('@/hooks/useTheme', () => ({
  useTheme: jest.fn(() => ({
    colors: {
      surface: '#FFFFFF',
      surfaceVariant: '#F1F5F9',
      text: '#11181C',
      textMuted: '#9CA3AF',
    },
  })),
}));

// Helper to create mock activities
const createMockActivity = (
  type: EnrichedActivity['activity_type'],
  metadata: Record<string, any> = {}
): EnrichedActivity => ({
  activity_date: '2025-01-15',
  activity_type: type,
  deadline_id: 'deadline-1',
  book_title: 'The Great Gatsby',
  activity_timestamp: '2025-01-15T14:30:00Z',
  metadata,
});

describe('ActivityTimelineItem', () => {
  describe('Component Structure', () => {
    it('should render all main UI elements', () => {
      const activity = createMockActivity('progress', {
        current_progress: 100,
        previous_progress: 50,
      });

      render(<ActivityTimelineItem activity={activity} />);

      // Should have time badge (will be in AM or PM depending on local timezone)
      expect(screen.getByText(/AM|PM/)).toBeTruthy();

      // Should have icon
      expect(screen.getByTestId('icon-arrow.up.right')).toBeTruthy();

      // Should have label
      expect(screen.getByText('Progress Update')).toBeTruthy();

      // Should have book title in details
      expect(screen.getByText(/The Great Gatsby/)).toBeTruthy();
    });

    it('should be pressable when onPress is provided', () => {
      const activity = createMockActivity('note');
      const onPress = jest.fn();

      const { getByTestId } = render(
        <ActivityTimelineItem activity={activity} onPress={onPress} />
      );

      const pressable = getByTestId('activity-timeline-item');
      fireEvent.press(pressable);
      expect(onPress).toHaveBeenCalled();
    });
  });

  describe('Activity Type Rendering', () => {
    it('should render progress activity correctly', () => {
      const activity = createMockActivity('progress', {
        current_progress: 165,
        previous_progress: 120,
        format: 'physical',
      });

      render(<ActivityTimelineItem activity={activity} />);

      expect(screen.getByText('Progress Update')).toBeTruthy();
      expect(
        screen.getByText('The Great Gatsby - Read 45 pages (120 → 165)')
      ).toBeTruthy();
      expect(screen.getByTestId('icon-arrow.up.right')).toBeTruthy();
    });

    it('should render audiobook progress with time formatting', () => {
      const activity = createMockActivity('progress', {
        current_progress: 150, // 2h 30m
        previous_progress: 90, // 1h 30m
        format: 'audio',
      });

      render(<ActivityTimelineItem activity={activity} />);

      expect(screen.getByText('Progress Update')).toBeTruthy();
      expect(
        screen.getByText('The Great Gatsby - Read 1h (1h 30m → 2h 30m)')
      ).toBeTruthy();
    });

    it('should render eBook progress correctly', () => {
      const activity = createMockActivity('progress', {
        current_progress: 165,
        previous_progress: 120,
        format: 'eBook',
      });

      render(<ActivityTimelineItem activity={activity} />);

      expect(
        screen.getByText('The Great Gatsby - Read 45 pages (120 → 165)')
      ).toBeTruthy();
    });

    it('should handle progress with missing metadata', () => {
      const activity = createMockActivity('progress', {});

      render(<ActivityTimelineItem activity={activity} />);

      expect(screen.getByText('Progress Update')).toBeTruthy();
      expect(
        screen.getByText('The Great Gatsby - Progress updated')
      ).toBeTruthy();
    });

    it('should render note activity correctly', () => {
      const activity = createMockActivity('note', {
        note_text: 'This chapter really highlights the themes of the book',
      });

      render(<ActivityTimelineItem activity={activity} />);

      expect(screen.getByText('Note Added')).toBeTruthy();
      // Note text is truncated at 50 chars
      expect(
        screen.getByText(
          'The Great Gatsby - "This chapter really highlights the themes of the b..."'
        )
      ).toBeTruthy();
      expect(screen.getByTestId('icon-note.text')).toBeTruthy();
    });

    it('should render short note without truncation', () => {
      const activity = createMockActivity('note', {
        note_text: 'Great book!',
      });

      render(<ActivityTimelineItem activity={activity} />);

      expect(screen.getByText('The Great Gatsby - "Great book!"')).toBeTruthy();
    });

    it('should handle note with missing text', () => {
      const activity = createMockActivity('note', {});

      render(<ActivityTimelineItem activity={activity} />);

      expect(screen.getByText('The Great Gatsby - Note added')).toBeTruthy();
    });

    it('should render status activity correctly', () => {
      const activity = createMockActivity('status', {
        status: 'reading',
        previous_status: 'pending',
      });

      render(<ActivityTimelineItem activity={activity} />);

      expect(screen.getByText('Status Change')).toBeTruthy();
      expect(
        screen.getByText('The Great Gatsby - Pending → Reading')
      ).toBeTruthy();
      expect(
        screen.getByTestId('icon-arrow.triangle.2.circlepath')
      ).toBeTruthy();
    });

    it('should handle status with underscores', () => {
      const activity = createMockActivity('status', {
        status: 'to_review',
        previous_status: 'reading',
      });

      render(<ActivityTimelineItem activity={activity} />);

      expect(
        screen.getByText('The Great Gatsby - Reading → To Review')
      ).toBeTruthy();
    });

    it('should handle status without previous status', () => {
      const activity = createMockActivity('status', {
        status: 'reading',
      });

      render(<ActivityTimelineItem activity={activity} />);

      expect(screen.getByText('The Great Gatsby - Reading')).toBeTruthy();
    });

    it('should handle status with missing metadata', () => {
      const activity = createMockActivity('status', {});

      render(<ActivityTimelineItem activity={activity} />);

      expect(
        screen.getByText('The Great Gatsby - Status changed')
      ).toBeTruthy();
    });

    it('should render review activity correctly', () => {
      const activity = createMockActivity('review', {
        platform_name: 'Goodreads',
        review_url: 'https://goodreads.com/review/123',
      });

      render(<ActivityTimelineItem activity={activity} />);

      expect(screen.getByText('Review Posted')).toBeTruthy();
      expect(
        screen.getByText('The Great Gatsby - Posted to Goodreads')
      ).toBeTruthy();
      expect(screen.getByTestId('icon-star')).toBeTruthy();
    });

    it('should handle review without platform', () => {
      const activity = createMockActivity('review', {});

      render(<ActivityTimelineItem activity={activity} />);

      expect(screen.getByText('The Great Gatsby - Review posted')).toBeTruthy();
    });

    it('should render deadline_created activity correctly', () => {
      const activity = createMockActivity('deadline_created', {
        format: 'eBook',
      });

      render(<ActivityTimelineItem activity={activity} />);

      expect(screen.getByText('Deadline Created')).toBeTruthy();
      expect(
        screen.getByText('The Great Gatsby (eBook) - Deadline created')
      ).toBeTruthy();
      expect(screen.getByTestId('icon-plus')).toBeTruthy();
    });

    it('should handle deadline_created with physical format', () => {
      const activity = createMockActivity('deadline_created', {
        format: 'physical',
      });

      render(<ActivityTimelineItem activity={activity} />);

      expect(
        screen.getByText('The Great Gatsby (Physical) - Deadline created')
      ).toBeTruthy();
    });

    it('should handle deadline_created with audio format', () => {
      const activity = createMockActivity('deadline_created', {
        format: 'audio',
      });

      render(<ActivityTimelineItem activity={activity} />);

      expect(
        screen.getByText('The Great Gatsby (Audio) - Deadline created')
      ).toBeTruthy();
    });

    it('should handle deadline_created without format', () => {
      const activity = createMockActivity('deadline_created', {});

      render(<ActivityTimelineItem activity={activity} />);

      expect(
        screen.getByText('The Great Gatsby - Deadline created')
      ).toBeTruthy();
    });
  });

  describe('Time Formatting', () => {
    it('should format morning time correctly', () => {
      const activity = createMockActivity('note', {
        note_text: 'Morning note',
      });
      activity.activity_timestamp = '2025-01-15T09:15:00Z';

      render(<ActivityTimelineItem activity={activity} />);

      // Time will be converted to local timezone, so we just check for AM/PM format
      const text = screen.getByText(/AM|PM/);
      expect(text).toBeTruthy();
    });

    it('should format afternoon time correctly', () => {
      const activity = createMockActivity('note', {
        note_text: 'Afternoon note',
      });
      activity.activity_timestamp = '2025-01-15T14:30:00Z';

      render(<ActivityTimelineItem activity={activity} />);

      const text = screen.getByText(/AM|PM/);
      expect(text).toBeTruthy();
    });

    it('should handle midnight correctly', () => {
      const activity = createMockActivity('note', {
        note_text: 'Midnight note',
      });
      activity.activity_timestamp = '2025-01-15T00:00:00Z';

      render(<ActivityTimelineItem activity={activity} />);

      const text = screen.getByText(/AM|PM/);
      expect(text).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty metadata object', () => {
      const activity = createMockActivity('note', {});

      render(<ActivityTimelineItem activity={activity} />);

      expect(screen.getByText('Note Added')).toBeTruthy();
      expect(screen.getByText('The Great Gatsby - Note added')).toBeTruthy();
    });

    it('should handle invalid timestamp gracefully', () => {
      const activity = createMockActivity('note');
      activity.activity_timestamp = 'invalid-timestamp';

      render(<ActivityTimelineItem activity={activity} />);

      // Should still render, just without a valid time
      expect(screen.getByText('Note Added')).toBeTruthy();
    });
  });

  describe('Press Interaction', () => {
    it('should call onPress when provided and pressed', () => {
      const activity = createMockActivity('progress');
      const onPress = jest.fn();

      const { getByTestId } = render(
        <ActivityTimelineItem activity={activity} onPress={onPress} />
      );

      const pressable = getByTestId('activity-timeline-item');
      fireEvent.press(pressable);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should not be pressable when onPress is not provided', () => {
      const activity = createMockActivity('progress');

      const { getByTestId } = render(
        <ActivityTimelineItem activity={activity} />
      );

      const pressable = getByTestId('activity-timeline-item');
      // Should not throw when pressed without onPress
      expect(() => fireEvent.press(pressable)).not.toThrow();
    });
  });

  describe('Styling', () => {
    it('should apply correct icon color based on activity type', () => {
      const progressActivity = createMockActivity('progress');
      const { getByTestId, rerender } = render(
        <ActivityTimelineItem activity={progressActivity} />
      );

      expect(getByTestId('icon-arrow.up.right')).toBeTruthy();

      const noteActivity = createMockActivity('note');
      rerender(<ActivityTimelineItem activity={noteActivity} />);

      expect(getByTestId('icon-note.text')).toBeTruthy();
    });

    it('should display correct labels for each activity type', () => {
      const types: {
        type: EnrichedActivity['activity_type'];
        label: string;
      }[] = [
        { type: 'progress', label: 'Progress Update' },
        { type: 'note', label: 'Note Added' },
        { type: 'status', label: 'Status Change' },
        { type: 'review', label: 'Review Posted' },
        { type: 'deadline_created', label: 'Deadline Created' },
      ];

      types.forEach(({ type, label }) => {
        const activity = createMockActivity(type);
        const { getByText, unmount } = render(
          <ActivityTimelineItem activity={activity} />
        );

        expect(getByText(label)).toBeTruthy();
        unmount();
      });
    });
  });
});
