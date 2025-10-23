import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import ReviewProgressSection from '../ReviewProgressSection';

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: View,
    },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(callback => {
      return callback();
    }),
    withSpring: jest.fn(value => value),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
  },
}));

jest.mock('@/components/themed', () => ({
  ThemedButton: ({ title, onPress, testID }: any) => {
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');
    return React.createElement(
      TouchableOpacity,
      { testID, onPress },
      React.createElement(Text, null, title)
    );
  },
  ThemedView: ({ children, style, testID }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { style, testID }, children);
  },
  ThemedText: ({ children, style }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { style }, children);
  },
}));

jest.mock('@/hooks/useReviewTrackingData', () => ({
  useReviewTrackingData: jest.fn(() => ({
    reviewTracking: {
      id: 'rt_123',
      review_due_date: '2025-02-01',
      needs_link_submission: false,
    },
    platforms: [
      {
        id: 'rp_1',
        platform_name: 'Goodreads',
        posted: true,
        posted_date: '2025-01-20',
        review_url: null,
      },
    ],
    isLoading: false,
  })),
}));

jest.mock('@/hooks/useReviewTrackingMutation', () => ({
  useReviewTrackingMutation: jest.fn(() => ({
    updatePlatforms: jest.fn(),
  })),
}));

const mockCompleteDeadline = jest.fn();
const mockDidNotFinishDeadline = jest.fn();

jest.mock('@/providers/DeadlineProvider', () => ({
  useDeadlines: jest.fn(() => ({
    completeDeadline: mockCompleteDeadline,
    didNotFinishDeadline: mockDidNotFinishDeadline,
  })),
}));

jest.mock('../MarkCompleteDialog', () => {
  return function MockMarkCompleteDialog({ visible, onComplete, onCancel }: any) {
    const React = require('react');
    const { View, TouchableOpacity, Text } = require('react-native');
    if (!visible) return null;
    return React.createElement(
      View,
      { testID: 'mark-complete-dialog' },
      React.createElement(
        TouchableOpacity,
        { testID: 'confirm-complete-button', onPress: onComplete },
        React.createElement(Text, null, 'Confirm Complete')
      ),
      React.createElement(
        TouchableOpacity,
        { testID: 'cancel-button', onPress: onCancel },
        React.createElement(Text, null, 'Cancel')
      )
    );
  };
});

jest.mock('../PlatformChecklist', () => {
  return function MockPlatformChecklist() {
    const React = require('react');
    const { View, Text } = require('react-native');
    return React.createElement(
      View,
      { testID: 'platform-checklist' },
      React.createElement(Text, null, 'Platform Checklist')
    );
  };
});

jest.mock('../ReviewDueDateBadge', () => {
  return function MockReviewDueDateBadge() {
    const React = require('react');
    const { View, Text } = require('react-native');
    return React.createElement(
      View,
      { testID: 'review-due-date-badge' },
      React.createElement(Text, null, 'Review Due Date Badge')
    );
  };
});

describe('ReviewProgressSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleMarkComplete - Completed Books', () => {
    it('should call completeDeadline when progress equals total quantity', async () => {
      const deadline = {
        id: 'rd_123',
        book_title: 'Test Book',
        total_quantity: 300,
        progress: [
          {
            id: 'rdp_1',
            current_progress: 300,
            created_at: '2025-01-20T10:00:00Z',
          },
        ],
        status: [
          {
            id: 'ds_1',
            status: 'to_review' as const,
            created_at: '2025-01-20T10:00:00Z',
          },
        ],
      } as any;

      mockCompleteDeadline.mockImplementation((_id, onSuccess) => {
        onSuccess();
      });

      render(<ReviewProgressSection deadline={deadline} />);

      const markCompleteButton = screen.getByText('Mark All Complete');
      fireEvent.press(markCompleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('mark-complete-dialog')).toBeTruthy();
      });

      const confirmButton = screen.getByTestId('confirm-complete-button');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(mockCompleteDeadline).toHaveBeenCalledWith(
          'rd_123',
          expect.any(Function),
          expect.any(Function)
        );
        expect(mockDidNotFinishDeadline).not.toHaveBeenCalled();
      });
    });

    it('should call completeDeadline when progress exceeds total quantity', async () => {
      const deadline = {
        id: 'rd_123',
        book_title: 'Test Book',
        total_quantity: 300,
        progress: [
          {
            id: 'rdp_1',
            current_progress: 350,
            created_at: '2025-01-20T10:00:00Z',
          },
        ],
        status: [
          {
            id: 'ds_1',
            status: 'to_review' as const,
            created_at: '2025-01-20T10:00:00Z',
          },
        ],
      } as any;

      mockCompleteDeadline.mockImplementation((_id, onSuccess) => {
        onSuccess();
      });

      render(<ReviewProgressSection deadline={deadline} />);

      const markCompleteButton = screen.getByText('Mark All Complete');
      fireEvent.press(markCompleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('mark-complete-dialog')).toBeTruthy();
      });

      const confirmButton = screen.getByTestId('confirm-complete-button');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(mockCompleteDeadline).toHaveBeenCalled();
        expect(mockDidNotFinishDeadline).not.toHaveBeenCalled();
      });
    });
  });

  describe('handleMarkComplete - DNF Books', () => {
    it('should call didNotFinishDeadline when progress is less than total quantity', async () => {
      const deadline = {
        id: 'rd_123',
        book_title: 'Test Book',
        total_quantity: 300,
        progress: [
          {
            id: 'rdp_1',
            current_progress: 150,
            created_at: '2025-01-20T10:00:00Z',
          },
        ],
        status: [
          {
            id: 'ds_1',
            status: 'to_review' as const,
            created_at: '2025-01-20T10:00:00Z',
          },
        ],
      } as any;

      mockDidNotFinishDeadline.mockImplementation((_id, onSuccess) => {
        onSuccess();
      });

      render(<ReviewProgressSection deadline={deadline} />);

      const markCompleteButton = screen.getByText('Mark All Complete');
      fireEvent.press(markCompleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('mark-complete-dialog')).toBeTruthy();
      });

      const confirmButton = screen.getByTestId('confirm-complete-button');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(mockDidNotFinishDeadline).toHaveBeenCalledWith(
          'rd_123',
          expect.any(Function),
          expect.any(Function)
        );
        expect(mockCompleteDeadline).not.toHaveBeenCalled();
      });
    });

    it('should call didNotFinishDeadline when progress is zero', async () => {
      const deadline = {
        id: 'rd_123',
        book_title: 'Test Book',
        total_quantity: 300,
        progress: [
          {
            id: 'rdp_1',
            current_progress: 0,
            created_at: '2025-01-20T10:00:00Z',
          },
        ],
        status: [
          {
            id: 'ds_1',
            status: 'to_review' as const,
            created_at: '2025-01-20T10:00:00Z',
          },
        ],
      } as any;

      mockDidNotFinishDeadline.mockImplementation((_id, onSuccess) => {
        onSuccess();
      });

      render(<ReviewProgressSection deadline={deadline} />);

      const markCompleteButton = screen.getByText('Mark All Complete');
      fireEvent.press(markCompleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('mark-complete-dialog')).toBeTruthy();
      });

      const confirmButton = screen.getByTestId('confirm-complete-button');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(mockDidNotFinishDeadline).toHaveBeenCalled();
        expect(mockCompleteDeadline).not.toHaveBeenCalled();
      });
    });
  });

  describe('Multiple Progress Entries', () => {
    it('should use the most recent progress entry to determine completion', async () => {
      const deadline = {
        id: 'rd_123',
        book_title: 'Test Book',
        total_quantity: 300,
        progress: [
          {
            id: 'rdp_1',
            current_progress: 100,
            created_at: '2025-01-18T10:00:00Z',
          },
          {
            id: 'rdp_2',
            current_progress: 200,
            created_at: '2025-01-19T10:00:00Z',
          },
          {
            id: 'rdp_3',
            current_progress: 300,
            created_at: '2025-01-20T10:00:00Z',
          },
        ],
        status: [
          {
            id: 'ds_1',
            status: 'to_review' as const,
            created_at: '2025-01-20T10:00:00Z',
          },
        ],
      } as any;

      mockCompleteDeadline.mockImplementation((_id, onSuccess) => {
        onSuccess();
      });

      render(<ReviewProgressSection deadline={deadline} />);

      const markCompleteButton = screen.getByText('Mark All Complete');
      fireEvent.press(markCompleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('mark-complete-dialog')).toBeTruthy();
      });

      const confirmButton = screen.getByTestId('confirm-complete-button');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(mockCompleteDeadline).toHaveBeenCalled();
        expect(mockDidNotFinishDeadline).not.toHaveBeenCalled();
      });
    });
  });
});
