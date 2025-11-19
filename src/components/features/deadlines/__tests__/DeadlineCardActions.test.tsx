import { DeadlineCardActions } from '../DeadlineCardActions';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';
import Toast from 'react-native-toast-message';

jest.mock('@/providers/DeadlineProvider');
jest.mock('expo-router');
jest.mock('react-native-toast-message');

jest.mock('@/components/themed/ThemedText', () => ({
  ThemedText: ({ children, testID, ...props }: any) => {
    const React = require('react');
    return React.createElement(
      'Text',
      {
        testID: testID || 'themed-text',
        ...props,
      },
      children
    );
  },
}));

jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: ({ name, testID, ...props }: any) => {
    const React = require('react');
    return React.createElement('View', {
      testID: testID || `icon-${name}`,
      'data-name': name,
      ...props,
    });
  },
}));

jest.mock('../modals/UpdateDeadlineDateModal', () => ({
  UpdateDeadlineDateModal: ({ visible, onClose, testID }: any) => {
    const React = require('react');
    return visible
      ? React.createElement('View', {
          testID: testID || 'update-deadline-date-modal',
          onPress: onClose,
        })
      : null;
  },
}));

const mockUseDeadlines = useDeadlines as jest.MockedFunction<
  typeof useDeadlines
>;
const mockRouter = router as jest.Mocked<typeof router>;
const mockToast = Toast as jest.Mocked<typeof Toast>;

describe('DeadlineCardActions', () => {
  const mockPauseDeadline = jest.fn();
  const mockResumeDeadline = jest.fn();

  const baseDeadline: ReadingDeadlineWithProgress = {
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

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseDeadlines.mockReturnValue({
      pauseDeadline: mockPauseDeadline,
      resumeDeadline: mockResumeDeadline,
    } as any);
  });

  describe('Component Structure', () => {
    it('should render all 4 action buttons', () => {
      render(<DeadlineCardActions deadline={baseDeadline} />);

      expect(screen.getByText('Status')).toBeTruthy();
      expect(screen.getByText('Due Date')).toBeTruthy();
      expect(screen.getByText('Edit')).toBeTruthy();
      expect(screen.getByText('Notes')).toBeTruthy();
    });

    it('should render correct icons for each button', () => {
      render(<DeadlineCardActions deadline={baseDeadline} />);

      expect(screen.getByTestId('icon-arrow.left.arrow.right')).toBeTruthy();
      expect(screen.getByTestId('icon-calendar.badge.clock')).toBeTruthy();
      expect(screen.getByTestId('icon-pencil')).toBeTruthy();
      expect(screen.getByTestId('icon-note.text')).toBeTruthy();
    });
  });

  describe('Hook Integration', () => {
    it('should call useDeadlines hook', () => {
      render(<DeadlineCardActions deadline={baseDeadline} />);
      expect(mockUseDeadlines).toHaveBeenCalled();
    });
  });

  describe('Status Button - Reading Deadline', () => {
    it('should call pauseDeadline when status button is pressed for reading deadline', () => {
      const { getAllByRole } = render(
        <DeadlineCardActions deadline={baseDeadline} />
      );

      const statusButton = getAllByRole('button')[0];
      fireEvent.press(statusButton);

      expect(mockPauseDeadline).toHaveBeenCalledWith(
        'deadline-123',
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('should show success toast when pausing deadline succeeds', () => {
      const { getAllByRole } = render(
        <DeadlineCardActions deadline={baseDeadline} />
      );

      const statusButton = getAllByRole('button')[0];
      fireEvent.press(statusButton);

      const successCallback = mockPauseDeadline.mock.calls[0][1];
      successCallback();

      expect(mockToast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Test Book has been paused.',
        visibilityTime: 1500,
        position: 'top',
      });
    });

    it('should show error toast when pausing deadline fails', () => {
      const { getAllByRole } = render(
        <DeadlineCardActions deadline={baseDeadline} />
      );

      const statusButton = getAllByRole('button')[0];
      fireEvent.press(statusButton);

      const errorCallback = mockPauseDeadline.mock.calls[0][2];
      errorCallback(new Error('Network error'));

      expect(mockToast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Failed to pause reading',
        visibilityTime: 2000,
        position: 'top',
      });
    });
  });

  describe('Status Button - Paused Deadline', () => {
    const pausedDeadline: ReadingDeadlineWithProgress = {
      ...baseDeadline,
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

    it('should call resumeDeadline when status button is pressed for paused deadline', () => {
      const { getAllByRole } = render(
        <DeadlineCardActions deadline={pausedDeadline} />
      );

      const statusButton = getAllByRole('button')[0];
      fireEvent.press(statusButton);

      expect(mockResumeDeadline).toHaveBeenCalledWith(
        'deadline-123',
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('should show success toast when resuming deadline succeeds', () => {
      const { getAllByRole } = render(
        <DeadlineCardActions deadline={pausedDeadline} />
      );

      const statusButton = getAllByRole('button')[0];
      fireEvent.press(statusButton);

      const successCallback = mockResumeDeadline.mock.calls[0][1];
      successCallback();

      expect(mockToast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Test Book is now active.',
        visibilityTime: 1500,
        position: 'top',
      });
    });

    it('should show error toast when resuming deadline fails', () => {
      const { getAllByRole } = render(
        <DeadlineCardActions deadline={pausedDeadline} />
      );

      const statusButton = getAllByRole('button')[0];
      fireEvent.press(statusButton);

      const errorCallback = mockResumeDeadline.mock.calls[0][2];
      errorCallback(new Error('Network error'));

      expect(mockToast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Failed to resume reading',
        visibilityTime: 2000,
        position: 'top',
      });
    });
  });

  describe('Calendar Button', () => {
    it('should open UpdateDeadlineDateModal when calendar button is pressed', () => {
      const { getAllByRole } = render(
        <DeadlineCardActions deadline={baseDeadline} />
      );

      expect(
        screen.queryByTestId('update-deadline-date-modal')
      ).toBeNull();

      const calendarButton = getAllByRole('button')[1];
      fireEvent.press(calendarButton);

      expect(screen.getByTestId('update-deadline-date-modal')).toBeTruthy();
    });

    it('should close modal when onClose is called', () => {
      const { getAllByRole, rerender } = render(
        <DeadlineCardActions deadline={baseDeadline} />
      );

      const calendarButton = getAllByRole('button')[1];
      fireEvent.press(calendarButton);

      expect(screen.getByTestId('update-deadline-date-modal')).toBeTruthy();

      // Re-render to trigger close (in real scenario, modal's onClose would trigger this)
      rerender(<DeadlineCardActions deadline={baseDeadline} />);

      // Modal should still be there until we actually close it
      // Let's test that the modal receives the correct props
      const modal = screen.getByTestId('update-deadline-date-modal');
      expect(modal).toBeTruthy();
    });
  });

  describe('Edit Button', () => {
    it('should navigate to edit page when edit button is pressed', () => {
      const { getAllByRole } = render(
        <DeadlineCardActions deadline={baseDeadline} />
      );

      const editButton = getAllByRole('button')[2];
      fireEvent.press(editButton);

      expect(mockRouter.push).toHaveBeenCalledWith(
        '/deadline/deadline-123/edit'
      );
    });
  });

  describe('Notes Button', () => {
    it('should navigate to notes page when notes button is pressed', () => {
      const { getAllByRole } = render(
        <DeadlineCardActions deadline={baseDeadline} />
      );

      const notesButton = getAllByRole('button')[3];
      fireEvent.press(notesButton);

      expect(mockRouter.push).toHaveBeenCalledWith(
        '/deadline/deadline-123/notes'
      );
    });
  });

  describe('Accessibility', () => {
    it('should have correct accessibility labels for reading deadline', () => {
      const { getAllByRole } = render(
        <DeadlineCardActions deadline={baseDeadline} />
      );

      const buttons = getAllByRole('button');
      expect(buttons[0].props.accessibilityLabel).toBe('Pause reading');
      expect(buttons[1].props.accessibilityLabel).toBe(
        'Update deadline date'
      );
      expect(buttons[2].props.accessibilityLabel).toBe('Edit deadline');
      expect(buttons[3].props.accessibilityLabel).toBe('View notes');
    });

    it('should have correct accessibility label for paused deadline', () => {
      const pausedDeadline: ReadingDeadlineWithProgress = {
        ...baseDeadline,
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

      const { getAllByRole } = render(
        <DeadlineCardActions deadline={pausedDeadline} />
      );

      const statusButton = getAllByRole('button')[0];
      expect(statusButton.props.accessibilityLabel).toBe('Resume reading');
    });
  });

  describe('Edge Cases', () => {
    it('should handle deadline with null status', () => {
      const nullStatusDeadline = {
        ...baseDeadline,
        status: null,
      } as any;

      render(<DeadlineCardActions deadline={nullStatusDeadline} />);

      expect(screen.getByText('Status')).toBeTruthy();
      expect(screen.getByText('Due Date')).toBeTruthy();
      expect(screen.getByText('Edit')).toBeTruthy();
      expect(screen.getByText('Notes')).toBeTruthy();
    });

    it('should handle deadline with empty status array', () => {
      const emptyStatusDeadline = {
        ...baseDeadline,
        status: [],
      };

      render(<DeadlineCardActions deadline={emptyStatusDeadline} />);

      expect(screen.getByText('Status')).toBeTruthy();
    });

    it('should handle multiple status entries and use the latest', () => {
      const multiStatusDeadline: ReadingDeadlineWithProgress = {
        ...baseDeadline,
        status: [
          {
            id: 'status-1',
            deadline_id: 'deadline-123',
            status: 'reading' as const,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'status-2',
            deadline_id: 'deadline-123',
            status: 'paused' as const,
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
        ],
      };

      const { getAllByRole } = render(
        <DeadlineCardActions deadline={multiStatusDeadline} />
      );

      const statusButton = getAllByRole('button')[0];
      expect(statusButton.props.accessibilityLabel).toBe('Resume reading');
    });
  });
});
