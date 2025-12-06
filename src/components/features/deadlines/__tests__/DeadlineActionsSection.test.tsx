import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { DeadlineActionsSection } from '../DeadlineActionsSection';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';

// Mock DeadlineCardActions
jest.mock('../DeadlineCardActions', () => ({
  DeadlineCardActions: ({ deadline }: any) => {
    const React = require('react');
    return React.createElement('View', {
      testID: 'deadline-card-actions',
      'data-deadline-id': deadline.id,
    });
  },
}));

jest.mock('@/components/themed/ThemedText', () => ({
  ThemedText: ({ children, variant, testID, ...props }: any) => {
    const React = require('react');
    return React.createElement(
      'Text',
      {
        testID: testID || 'themed-text',
        'data-variant': variant,
        ...props,
      },
      children
    );
  },
}));

jest.mock('@/components/themed/ThemedView', () => ({
  ThemedView: ({ children, style, testID, ...props }: any) => {
    const React = require('react');
    return React.createElement(
      'View',
      {
        testID: testID || 'themed-view',
        style,
        ...props,
      },
      children
    );
  },
}));

describe('DeadlineActionsSection', () => {
  const mockDeadline: ReadingDeadlineWithProgress = {
    id: 'deadline-123',
    book_title: 'Test Book',
    author: 'Test Author',
    book_id: null,
    format: 'physical' as const,
    total_quantity: 300,
    created_at: '2024-01-01T00:00:00Z',
    deadline_date: '2024-12-31',
    flexibility: 'flexible' as const,
    user_id: 'user-123',
    updated_at: '2024-01-01T00:00:00Z',
    acquisition_source: null,
    type: 'Personal',
    publishers: null,
    cover_image_url: null,
    status: [
      {
        id: 'status-1',
        deadline_id: 'deadline-123',
        status: 'reading' as const,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
    progress: [],
  };

  describe('Component Structure', () => {
    it('should render the section with Quick Actions header', () => {
      render(<DeadlineActionsSection deadline={mockDeadline} />);

      expect(screen.getByText('Quick Actions')).toBeTruthy();
    });

    it('should render header with title variant', () => {
      render(<DeadlineActionsSection deadline={mockDeadline} />);

      const headerText = screen.getByText('Quick Actions');
      expect(headerText.props['data-variant']).toBe('title');
    });

    it('should render DeadlineCardActions component', () => {
      render(<DeadlineActionsSection deadline={mockDeadline} />);

      const actionsComponent = screen.getByTestId('deadline-card-actions');
      expect(actionsComponent).toBeTruthy();
    });

    it('should pass deadline prop to DeadlineCardActions', () => {
      render(<DeadlineActionsSection deadline={mockDeadline} />);

      const actionsComponent = screen.getByTestId('deadline-card-actions');
      expect(actionsComponent.props['data-deadline-id']).toBe('deadline-123');
    });
  });

  describe('Section Styling', () => {
    it('should render with ThemedView wrapper', () => {
      const { getAllByTestId } = render(
        <DeadlineActionsSection deadline={mockDeadline} />
      );

      const themedViews = getAllByTestId('themed-view');
      expect(themedViews.length).toBeGreaterThan(0);
    });

    it('should apply section styles to outer container', () => {
      const { getAllByTestId } = render(
        <DeadlineActionsSection deadline={mockDeadline} />
      );

      const outerView = getAllByTestId('themed-view')[0];
      expect(outerView.props.style).toBeTruthy();
    });
  });

  describe('Different Deadline States', () => {
    it('should render for reading deadline', () => {
      render(<DeadlineActionsSection deadline={mockDeadline} />);

      expect(screen.getByText('Quick Actions')).toBeTruthy();
      expect(screen.getByTestId('deadline-card-actions')).toBeTruthy();
    });

    it('should render for paused deadline', () => {
      const pausedDeadline: ReadingDeadlineWithProgress = {
        ...mockDeadline,
        status: [
          {
            id: 'status-2',
            deadline_id: 'deadline-123',
            status: 'paused' as const,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      render(<DeadlineActionsSection deadline={pausedDeadline} />);

      expect(screen.getByText('Quick Actions')).toBeTruthy();
      expect(screen.getByTestId('deadline-card-actions')).toBeTruthy();
    });

    it('should render for completed deadline', () => {
      const completedDeadline: ReadingDeadlineWithProgress = {
        ...mockDeadline,
        status: [
          {
            id: 'status-3',
            deadline_id: 'deadline-123',
            status: 'complete' as const,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      render(<DeadlineActionsSection deadline={completedDeadline} />);

      expect(screen.getByText('Quick Actions')).toBeTruthy();
      expect(screen.getByTestId('deadline-card-actions')).toBeTruthy();
    });

    it('should render for different book formats', () => {
      const audioDeadline: ReadingDeadlineWithProgress = {
        ...mockDeadline,
        format: 'audio' as const,
      };

      render(<DeadlineActionsSection deadline={audioDeadline} />);

      expect(screen.getByText('Quick Actions')).toBeTruthy();
      expect(screen.getByTestId('deadline-card-actions')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle deadline with null status', () => {
      const nullStatusDeadline = {
        ...mockDeadline,
        status: null,
      } as any;

      render(<DeadlineActionsSection deadline={nullStatusDeadline} />);

      expect(screen.getByText('Quick Actions')).toBeTruthy();
      expect(screen.getByTestId('deadline-card-actions')).toBeTruthy();
    });

    it('should handle deadline with empty status array', () => {
      const emptyStatusDeadline = {
        ...mockDeadline,
        status: [],
      };

      render(<DeadlineActionsSection deadline={emptyStatusDeadline} />);

      expect(screen.getByText('Quick Actions')).toBeTruthy();
      expect(screen.getByTestId('deadline-card-actions')).toBeTruthy();
    });
  });
});
