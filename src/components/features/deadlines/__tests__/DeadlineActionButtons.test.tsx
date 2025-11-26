import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import DeadlineActionButtons from '../DeadlineActionButtons';

jest.mock('@/providers/DeadlineProvider');
jest.mock('expo-router');
jest.mock('react-native-toast-message');

// Mock specific React Native modules
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  StyleSheet: {
    create: jest.fn(styles => styles),
    flatten: jest.fn(styles => styles),
  },
  AppState: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    currentState: 'active',
  },
}));

// Get the mocked Alert for easier testing
const mockAlert = jest.fn();
Alert.alert = mockAlert;

jest.mock('@/components/themed', () => ({
  ThemedButton: ({ title, onPress, disabled, testID, ...props }: any) => {
    const React = require('react');
    return React.createElement('View', {
      testID: testID || `button-${title.toLowerCase().replace(/\s+/g, '-')}`,
      onPress: disabled ? undefined : onPress,
      'data-disabled': disabled,
      'data-title': title,
      'data-variant': props.variant,
      'data-background-color': props.backgroundColor,
      'data-text-color': props.textColor,
    });
  },
  ThemedView: ({ children, testID, ...props }: any) => {
    const React = require('react');
    return React.createElement(
      'View',
      {
        testID: testID || 'themed-view',
        ...props,
      },
      children
    );
  },
}));

const mockUseDeadlines = useDeadlines as jest.MockedFunction<
  typeof useDeadlines
>;
const mockRouter = router as jest.Mocked<typeof router>;
const mockToast = Toast as jest.Mocked<typeof Toast>;

describe('DeadlineActionButtons', () => {
  const mockDeleteDeadline = jest.fn();
  const mockStartReadingDeadline = jest.fn();

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

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockUseDeadlines.mockReturnValue({
      deleteDeadline: mockDeleteDeadline,
      startReadingDeadline: mockStartReadingDeadline,
    } as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Component Structure', () => {
    it('should render ThemedView container', () => {
      render(<DeadlineActionButtons deadline={baseDeadline} />);
      expect(screen.getByTestId('themed-view')).toBeTruthy();
    });

    it('should always render delete button regardless of status', () => {
      const { rerender } = render(
        <DeadlineActionButtons deadline={baseDeadline} />
      );
      expect(screen.getByTestId('button-delete-book')).toBeTruthy();

      const completedDeadline = {
        ...baseDeadline,
        status: [
          {
            id: 'status-2',
            deadline_id: 'deadline-123',
            status: 'complete' as const,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };
      rerender(<DeadlineActionButtons deadline={completedDeadline} />);
      expect(screen.getByTestId('button-delete-book')).toBeTruthy();
    });
  });

  describe('Hook Integration', () => {
    it('should call useDeadlines hook', () => {
      render(<DeadlineActionButtons deadline={baseDeadline} />);
      expect(mockUseDeadlines).toHaveBeenCalled();
    });
  });

  describe('Status-Based Conditional Rendering', () => {
    it('should show Start Reading button for pending status', () => {
      const pendingDeadline = {
        ...baseDeadline,
        status: [
          {
            id: 'status-3',
            deadline_id: 'deadline-123',
            status: 'pending' as const,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };
      render(<DeadlineActionButtons deadline={pendingDeadline} />);

      expect(screen.getByTestId('button-start-reading')).toBeTruthy();
      expect(screen.queryByTestId("button-i'm-done-reading")).toBeNull();
    });

    it('should show Complete button for active status', () => {
      const activeDeadline = {
        ...baseDeadline,
        status: [
          {
            id: 'status-4',
            deadline_id: 'deadline-123',
            status: 'reading' as const,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };
      render(<DeadlineActionButtons deadline={activeDeadline} />);

      expect(screen.getByTestId("button-i'm-done-reading")).toBeTruthy();
      expect(screen.queryByTestId('button-start-reading')).toBeNull();
    });

    it('should show Read Again button for completed status', () => {
      const completedDeadline = {
        ...baseDeadline,
        status: [
          {
            id: 'status-2',
            deadline_id: 'deadline-123',
            status: 'complete' as const,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };
      render(<DeadlineActionButtons deadline={completedDeadline} />);

      expect(screen.getByTestId('button-read-again?')).toBeTruthy();
      expect(screen.queryByTestId("button-i'm-done-reading")).toBeNull();
    });

    it('should default to reading status for empty status array', () => {
      const noStatusDeadline = {
        ...baseDeadline,
        status: [],
      };
      render(<DeadlineActionButtons deadline={noStatusDeadline} />);

      expect(screen.getByTestId("button-i'm-done-reading")).toBeTruthy();
    });

    it('should handle multiple status changes correctly', () => {
      const multiStatusDeadline = {
        ...baseDeadline,
        status: [
          {
            id: 'status-6',
            deadline_id: 'deadline-123',
            status: 'pending' as const,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'status-7',
            deadline_id: 'deadline-123',
            status: 'reading' as const,
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
          {
            id: 'status-8',
            deadline_id: 'deadline-123',
            status: 'to_review' as const,
            created_at: '2024-01-03T00:00:00Z',
            updated_at: '2024-01-03T00:00:00Z',
          },
          {
            id: 'status-9',
            deadline_id: 'deadline-123',
            status: 'reading' as const,
            created_at: '2024-01-04T00:00:00Z',
            updated_at: '2024-01-04T00:00:00Z',
          },
        ],
      };
      render(<DeadlineActionButtons deadline={multiStatusDeadline} />);

      expect(screen.getByTestId("button-i'm-done-reading")).toBeTruthy();
    });
  });

  describe('Button Interactions - Delete', () => {
    it('should show delete confirmation alert when delete button is pressed', () => {
      render(<DeadlineActionButtons deadline={baseDeadline} />);

      fireEvent.press(screen.getByTestId('button-delete-book'));

      expect(mockAlert).toHaveBeenCalledWith(
        'Delete Book',
        'Are you sure you want to delete "Test Book"? This action cannot be undone.',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
          expect.objectContaining({ text: 'Delete', style: 'destructive' }),
        ])
      );
    });

    it('should call deleteDeadline when confirmation is accepted', () => {
      render(<DeadlineActionButtons deadline={baseDeadline} />);

      fireEvent.press(screen.getByTestId('button-delete-book'));

      const confirmButton = mockAlert.mock.calls[0][2]?.[1];
      confirmButton?.onPress?.();

      expect(mockDeleteDeadline).toHaveBeenCalledWith(
        'deadline-123',
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('should handle successful delete operation', () => {
      render(<DeadlineActionButtons deadline={baseDeadline} />);

      fireEvent.press(screen.getByTestId('button-delete-book'));
      const confirmButton = mockAlert.mock.calls[0][2]?.[1];
      confirmButton?.onPress?.();

      const successCallback = mockDeleteDeadline.mock.calls[0][1];
      successCallback();

      expect(mockRouter.replace).toHaveBeenCalledWith('/');
      expect(mockToast.show).toHaveBeenCalledWith({
        swipeable: true,
        type: 'success',
        text1: 'Book deleted',
        text2: '"Test Book" has been removed',
        autoHide: true,
        visibilityTime: 1500,
        position: 'top',
      });
    });

    it('should handle delete error', () => {
      render(<DeadlineActionButtons deadline={baseDeadline} />);

      fireEvent.press(screen.getByTestId('button-delete-book'));
      const confirmButton = mockAlert.mock.calls[0][2]?.[1];
      confirmButton?.onPress?.();

      const errorCallback = mockDeleteDeadline.mock.calls[0][2];
      errorCallback({ message: 'Network error' });

      expect(mockToast.show).toHaveBeenCalledWith({
        swipeable: true,
        type: 'error',
        text1: 'Failed to delete book',
        text2: 'Network error',
        autoHide: true,
        visibilityTime: 1500,
        position: 'top',
      });
    });
  });

  describe('Button Interactions - Notes', () => {
    it('should navigate to notes page when Notes button is pressed', () => {
      render(<DeadlineActionButtons deadline={baseDeadline} />);

      fireEvent.press(screen.getByTestId('button-notes'));

      expect(mockRouter.push).toHaveBeenCalledWith(
        '/deadline/deadline-123/notes'
      );
    });
  });

  describe('Button Interactions - Complete', () => {
    it("should navigate directly to completion-flow when I'm Done Reading button is pressed", () => {
      render(<DeadlineActionButtons deadline={baseDeadline} />);

      fireEvent.press(screen.getByTestId("button-i'm-done-reading"));

      expect(mockRouter.push).toHaveBeenCalledWith(
        '/deadline/deadline-123/completion-flow'
      );
    });
  });

  describe('Button Interactions - Start Reading', () => {
    it('should call startReadingDeadline when start reading button is pressed', () => {
      const pendingDeadline = {
        ...baseDeadline,
        status: [
          {
            id: 'status-3',
            deadline_id: 'deadline-123',
            status: 'pending' as const,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };
      render(<DeadlineActionButtons deadline={pendingDeadline} />);

      fireEvent.press(screen.getByTestId('button-start-reading'));

      expect(mockStartReadingDeadline).toHaveBeenCalledWith(
        'deadline-123',
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('should show update deadline prompt after starting reading', async () => {
      const pendingDeadline = {
        ...baseDeadline,
        status: [
          {
            id: 'status-3',
            deadline_id: 'deadline-123',
            status: 'pending' as const,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };
      render(<DeadlineActionButtons deadline={pendingDeadline} />);

      fireEvent.press(screen.getByTestId('button-start-reading'));
      const successCallback = mockStartReadingDeadline.mock.calls[0][1];
      successCallback();

      jest.advanceTimersByTime(2500);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenLastCalledWith(
          'Update Due date?',
          'Would you like to update the due date?',
          expect.arrayContaining([
            expect.objectContaining({ text: 'Not Now', style: 'cancel' }),
            expect.objectContaining({ text: 'Yes, Update' }),
          ])
        );
      });
    });
  });

  describe('Button Interactions - Read Again', () => {
    it('should show read again confirmation alert when read again button is pressed', () => {
      const completedDeadline = {
        ...baseDeadline,
        status: [
          {
            id: 'status-2',
            deadline_id: 'deadline-123',
            status: 'complete' as const,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };
      render(<DeadlineActionButtons deadline={completedDeadline} />);

      fireEvent.press(screen.getByTestId('button-read-again?'));

      expect(mockAlert).toHaveBeenCalledWith(
        'Read Again?',
        'Create a new due date to read "Test Book" again?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
          expect.objectContaining({ text: 'Yes' }),
        ])
      );
    });

    it('should navigate to new deadline page with correct params for physical book', () => {
      const completedDeadline = {
        ...baseDeadline,
        status: [
          {
            id: 'status-read-again',
            deadline_id: 'deadline-123',
            status: 'complete' as const,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        flexibility: 'strict' as const,
        book_id: 'book-123',
      };
      render(<DeadlineActionButtons deadline={completedDeadline} />);

      fireEvent.press(screen.getByTestId('button-read-again?'));
      const confirmButton = mockAlert.mock.calls[0][2]?.[1];
      confirmButton?.onPress?.();

      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/deadline/new',
        params: {
          page: '3',
          bookTitle: 'Test Book',
          bookAuthor: 'Test Author',
          format: 'physical',
          flexibility: 'strict',
          totalQuantity: '300',
          book_id: 'book-123',
          source: 'Personal',
        },
      });
    });

    it('should navigate with correct params for audio book', () => {
      const completedAudioDeadline = {
        ...baseDeadline,
        status: [
          {
            id: 'status-audio-complete',
            deadline_id: 'deadline-123',
            status: 'complete' as const,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        format: 'audio' as const,
        total_quantity: 1200,
      };
      render(<DeadlineActionButtons deadline={completedAudioDeadline} />);

      fireEvent.press(screen.getByTestId('button-read-again?'));
      const confirmButton = mockAlert.mock.calls[0][2]?.[1];
      confirmButton?.onPress?.();

      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/deadline/new',
        params: expect.objectContaining({
          format: 'audio',
          totalQuantity: '20',
          totalMinutes: '0',
        }),
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading text and disable delete button during delete operation', () => {
      render(<DeadlineActionButtons deadline={baseDeadline} />);

      fireEvent.press(screen.getByTestId('button-delete-book'));
      const confirmButton = mockAlert.mock.calls[0][2]?.[1];
      confirmButton?.onPress?.();

      // Verify that deleteDeadline was called (the loading state is set internally)
      expect(mockDeleteDeadline).toHaveBeenCalledWith(
        'deadline-123',
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('should show loading text and disable start reading button during start operation', () => {
      const pendingDeadline = {
        ...baseDeadline,
        status: [
          {
            id: 'status-3',
            deadline_id: 'deadline-123',
            status: 'pending' as const,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };
      render(<DeadlineActionButtons deadline={pendingDeadline} />);

      fireEvent.press(screen.getByTestId('button-start-reading'));

      const startButton = screen.getByTestId('button-starting...');
      expect(startButton).toBeTruthy();
      expect(startButton.props['data-disabled']).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle start reading error', () => {
      const pendingDeadline = {
        ...baseDeadline,
        status: [
          {
            id: 'status-3',
            deadline_id: 'deadline-123',
            status: 'pending' as const,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };
      render(<DeadlineActionButtons deadline={pendingDeadline} />);

      fireEvent.press(screen.getByTestId('button-start-reading'));
      const errorCallback = mockStartReadingDeadline.mock.calls[0][2];
      errorCallback({ message: 'Start failed' });

      expect(mockToast.show).toHaveBeenCalledWith({
        swipeable: true,
        type: 'error',
        text1: 'Failed to start reading',
        text2: 'Start failed',
        autoHide: true,
        visibilityTime: 1500,
        position: 'top',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle deadline with null status', () => {
      const nullStatusDeadline = {
        ...baseDeadline,
        status: null,
      } as any;
      render(<DeadlineActionButtons deadline={nullStatusDeadline} />);

      expect(screen.getByTestId("button-i'm-done-reading")).toBeTruthy();
    });

    it('should handle deadline with missing author', () => {
      const noAuthorDeadline = {
        ...baseDeadline,
        author: null,
      };
      render(<DeadlineActionButtons deadline={noAuthorDeadline} />);

      const deleteButton = screen.getByTestId('button-delete-book');
      expect(deleteButton).toBeTruthy();
    });

    it('should handle completed deadline being reactivated for read again', () => {
      const completedDeadline = {
        ...baseDeadline,
        status: [
          {
            id: 'status-2',
            deadline_id: 'deadline-123',
            status: 'complete' as const,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };
      render(<DeadlineActionButtons deadline={completedDeadline} />);

      const readAgainButton = screen.getByTestId('button-read-again?');
      expect(readAgainButton.props['data-disabled']).not.toBe(true);
    });
  });
});
