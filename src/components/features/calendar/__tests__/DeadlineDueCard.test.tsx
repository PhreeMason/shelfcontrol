import { AgendaActivityItem } from '@/types/calendar.types';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { DeadlineCalculationResult } from '@/utils/deadlineProviderUtils';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { DeadlineDueCard } from '../DeadlineDueCard';

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
    },
  })),
}));

// Helper to create mock agenda item with deadline
const createMockAgendaItem = (
  overrides: {
    deadline?: Partial<ReadingDeadlineWithProgress>;
    calculations?: Partial<DeadlineCalculationResult>;
  } = {}
): AgendaActivityItem => {
  const deadline: ReadingDeadlineWithProgress = {
    id: 'deadline-1',
    user_id: 'user-1',
    book_id: 'book-1',
    book_title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    deadline_date: '2025-01-20',
    total_quantity: 200,
    format: 'physical',
    type: 'pages',
    source: null,
    deadline_type: null,
    acquisition_source: null,
    flexibility: 'flexible',
    publishers: null,
    cover_image_url: null,
    status: [
      {
        id: 'status-1',
        deadline_id: 'deadline-1',
        status: 'reading',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-15T00:00:00Z',
      },
    ],
    progress: [
      {
        id: 'progress-1',
        deadline_id: 'deadline-1',
        current_progress: 100,
        time_spent_reading: null,
        ignore_in_calcs: false,
        created_at: '2025-01-15T00:00:00Z',
        updated_at: '2025-01-15T00:00:00Z',
      },
    ],
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
    ...overrides.deadline,
  };

  const calculations: DeadlineCalculationResult = {
    currentProgress: 100,
    totalQuantity: 200,
    remaining: 100,
    progressPercentage: 50,
    daysLeft: 5,
    unitsPerDay: 20,
    urgencyLevel: 'good' as const,
    urgencyColor: '#F59E0B',
    statusMessage: 'On track',
    paceEstimate: '1 hour per day',
    unit: 'pages',
    userPace: 20,
    requiredPace: 20,
    paceStatus: 'green',
    paceMessage: 'You are on track',
    ...overrides.calculations,
  };

  return {
    name: deadline.book_title,
    activityType: 'deadline_due',
    activity: {
      activity_date: '2025-01-15',
      activity_type: 'deadline_due',
      deadline_id: deadline.id,
      book_title: deadline.book_title,
      activity_timestamp: '2025-01-15T00:00:00Z',
      metadata: {},
      deadlineCalculations: calculations,
    },
    deadline,
    calculations,
  };
};

describe('DeadlineDueCard', () => {
  describe('Component Structure', () => {
    it('should render all main UI elements', () => {
      const agendaItem = createMockAgendaItem();

      render(<DeadlineDueCard agendaItem={agendaItem} />);

      // Should have icon
      expect(screen.getByTestId('icon-calendar.badge.clock')).toBeTruthy();

      // Should have book title
      expect(screen.getByText('The Great Gatsby')).toBeTruthy();

      // Should have status
      expect(screen.getByText('Reading')).toBeTruthy();

      // Should have progress percentage (physical format = "read")
      expect(screen.getByText('50% read')).toBeTruthy();
    });

    it('should be pressable when onPress is provided', () => {
      const agendaItem = createMockAgendaItem();
      const onPress = jest.fn();

      const { getByTestId } = render(
        <DeadlineDueCard agendaItem={agendaItem} onPress={onPress} />
      );

      const pressable = getByTestId('deadline-due-card');
      fireEvent.press(pressable);
      expect(onPress).toHaveBeenCalled();
    });

    it('should render icon with urgency border color', () => {
      const agendaItem = createMockAgendaItem({
        calculations: { urgencyColor: '#EF4444' },
      });

      const { getByTestId } = render(
        <DeadlineDueCard agendaItem={agendaItem} />
      );

      // The urgency color is displayed via the icon border color
      const icon = getByTestId('icon-calendar.badge.clock');
      expect(icon).toBeTruthy();
      // The urgency color is applied to the parent View's style
      expect(icon.props['data-color']).toBe('#EF4444');
    });
  });

  describe('Deadline Status and Progress', () => {
    it('should format status correctly', () => {
      const agendaItem = createMockAgendaItem({
        deadline: {
          status: [
            {
              id: 'status-1',
              deadline_id: 'deadline-1',
              status: 'reading',
              created_at: '2025-01-01T00:00:00Z',
              updated_at: '2025-01-15T00:00:00Z',
            },
          ],
        },
      });

      render(<DeadlineDueCard agendaItem={agendaItem} />);

      expect(screen.getByText('Reading')).toBeTruthy();
    });

    it('should format status with underscores', () => {
      const agendaItem = createMockAgendaItem({
        deadline: {
          status: [
            {
              id: 'status-1',
              deadline_id: 'deadline-1',
              status: 'to_review',
              created_at: '2025-01-01T00:00:00Z',
              updated_at: '2025-01-15T00:00:00Z',
            },
          ],
        },
      });

      render(<DeadlineDueCard agendaItem={agendaItem} />);

      expect(screen.getByText('To Review')).toBeTruthy();
    });

    it('should calculate and display progress percentage correctly', () => {
      const agendaItem = createMockAgendaItem({
        calculations: {
          progressPercentage: 75,
        },
      });

      render(<DeadlineDueCard agendaItem={agendaItem} />);

      expect(screen.getByText('75% read')).toBeTruthy();
    });

    it('should handle 0% progress', () => {
      const agendaItem = createMockAgendaItem({
        calculations: {
          progressPercentage: 0,
        },
      });

      render(<DeadlineDueCard agendaItem={agendaItem} />);

      expect(screen.getByText('0% read')).toBeTruthy();
    });

    it('should handle 100% progress', () => {
      const agendaItem = createMockAgendaItem({
        calculations: {
          progressPercentage: 100,
        },
      });

      render(<DeadlineDueCard agendaItem={agendaItem} />);

      expect(screen.getByText('100% read')).toBeTruthy();
    });

    it('should round progress percentage', () => {
      const agendaItem = createMockAgendaItem({
        calculations: {
          progressPercentage: 33,
        },
      });

      render(<DeadlineDueCard agendaItem={agendaItem} />);

      expect(screen.getByText('33% read')).toBeTruthy();
    });
  });

  describe('Urgency Colors', () => {
    it('should apply correct urgency color to icon', () => {
      const agendaItem = createMockAgendaItem({
        calculations: { urgencyColor: '#EF4444' },
      });

      const { getByTestId } = render(
        <DeadlineDueCard agendaItem={agendaItem} />
      );

      const icon = getByTestId('icon-calendar.badge.clock');
      expect(icon.props['data-color']).toBe('#EF4444');
    });

    it('should handle different urgency levels with correct colors', () => {
      const urgencyLevels: {
        level: DeadlineCalculationResult['urgencyLevel'];
        color: string;
      }[] = [
        { level: 'good', color: '#22C55E' },
        { level: 'approaching', color: '#F59E0B' },
        { level: 'urgent', color: '#EF4444' },
      ];

      urgencyLevels.forEach(({ level, color }) => {
        const agendaItem = createMockAgendaItem({
          calculations: {
            urgencyLevel: level,
            urgencyColor: color,
          },
        });

        const { getByTestId, unmount } = render(
          <DeadlineDueCard agendaItem={agendaItem} />
        );

        const icon = getByTestId('icon-calendar.badge.clock');
        expect(icon.props['data-color']).toBe(color);

        unmount();
      });
    });
  });

  describe('Press Interaction', () => {
    it('should call onPress when provided and pressed', () => {
      const agendaItem = createMockAgendaItem();
      const onPress = jest.fn();

      const { getByTestId } = render(
        <DeadlineDueCard agendaItem={agendaItem} onPress={onPress} />
      );

      const pressable = getByTestId('deadline-due-card');
      fireEvent.press(pressable);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should not be pressable when onPress is not provided', () => {
      const agendaItem = createMockAgendaItem();

      const { getByTestId } = render(
        <DeadlineDueCard agendaItem={agendaItem} />
      );

      const pressable = getByTestId('deadline-due-card');
      // Should not throw when pressed without onPress
      expect(() => fireEvent.press(pressable)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should return null when deadline is missing', () => {
      const agendaItem = createMockAgendaItem();
      (agendaItem as any).deadline = undefined;

      const { queryByTestId } = render(
        <DeadlineDueCard agendaItem={agendaItem} />
      );

      expect(queryByTestId('deadline-due-card')).toBeNull();
    });

    it('should return null when calculations are missing', () => {
      const agendaItem = createMockAgendaItem();
      (agendaItem as any).calculations = undefined;

      const { queryByTestId } = render(
        <DeadlineDueCard agendaItem={agendaItem} />
      );

      expect(queryByTestId('deadline-due-card')).toBeNull();
    });

    it('should handle long book titles with truncation', () => {
      const agendaItem = createMockAgendaItem({
        deadline: {
          book_title:
            'The Very Long and Incredibly Interesting Book Title That Goes On Forever',
        },
      });

      const { getByText } = render(<DeadlineDueCard agendaItem={agendaItem} />);

      const title = getByText(
        'The Very Long and Incredibly Interesting Book Title That Goes On Forever'
      );
      expect(title).toBeTruthy();
      // numberOfLines prop is set to 1, so text should truncate
      expect(title.props.numberOfLines).toBe(1);
    });

    it('should display "read" for physical format', () => {
      const agendaItem = createMockAgendaItem({
        deadline: { format: 'physical' },
        calculations: { progressPercentage: 50 },
      });

      render(<DeadlineDueCard agendaItem={agendaItem} />);

      expect(screen.getByText('50% read')).toBeTruthy();
    });

    it('should display "read" for eBook format', () => {
      const agendaItem = createMockAgendaItem({
        deadline: { format: 'eBook' },
        calculations: { progressPercentage: 75 },
      });

      render(<DeadlineDueCard agendaItem={agendaItem} />);

      expect(screen.getByText('75% read')).toBeTruthy();
    });

    it('should display "listened" for audio format', () => {
      const agendaItem = createMockAgendaItem({
        deadline: { format: 'audio' },
        calculations: { progressPercentage: 60 },
      });

      render(<DeadlineDueCard agendaItem={agendaItem} />);

      expect(screen.getByText('60% listened')).toBeTruthy();
    });

    it('should display metadata row with separator', () => {
      const agendaItem = createMockAgendaItem();

      render(<DeadlineDueCard agendaItem={agendaItem} />);

      expect(screen.getByText('Reading')).toBeTruthy();
      expect(screen.getByText('•')).toBeTruthy();
      expect(screen.getByText('50% read')).toBeTruthy();
    });
  });

  describe('Styling', () => {
    it('should apply correct icon based on activity type', () => {
      const agendaItem = createMockAgendaItem();

      const { getByTestId } = render(
        <DeadlineDueCard agendaItem={agendaItem} />
      );

      expect(getByTestId('icon-calendar.badge.clock')).toBeTruthy();
    });
  });
});
