import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { StatusChangeActionSheet } from '../StatusChangeActionSheet';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { useUpdateDeadlineProgress } from '@/hooks/useDeadlines';
import { useReviewTrackingData } from '@/hooks/useReviewTrackingData';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useThemeColor';
import type { ReadingDeadlineWithProgress } from '@/types/deadline.types';

// Import Toast for assertions
const Toast = require('react-native-toast-message/lib/src/Toast').Toast;

// Get mocked dialog component for assertions
const MarkCompleteDialog =
  require('../../../review/MarkCompleteDialog').default;

// Mock external dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/providers/DeadlineProvider', () => ({
  useDeadlines: jest.fn(),
}));

jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: jest.fn(),
}));

jest.mock('@/hooks/useDeadlines', () => ({
  useUpdateDeadlineProgress: jest.fn(),
  useIsStatusMutating: jest.fn(() => false),
}));

jest.mock('@/hooks/useReviewTrackingData', () => ({
  useReviewTrackingData: jest.fn(),
}));

jest.mock('../../../review/MarkCompleteDialog', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })),
}));

jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    __esModule: true,
    default: { View },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn(value => value),
  };
});

jest.mock('@/components/themed/ThemedText', () => ({
  ThemedText: ({ children, ...props }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(
      Text,
      { testID: 'themed-text', ...props },
      children
    );
  },
}));

jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: ({ name, ...props }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'icon-symbol', ...props }, name);
  },
}));

describe('StatusChangeActionSheet', () => {
  // Mock functions
  const mockStartReadingDeadline = jest.fn();
  const mockResumeDeadline = jest.fn();
  const mockPauseDeadline = jest.fn();
  const mockRejectDeadline = jest.fn();
  const mockWithdrawDeadline = jest.fn();
  const mockCompleteDeadline = jest.fn();
  const mockDidNotFinishDeadline = jest.fn();
  const mockUpdateProgress = jest.fn();
  const mockRouterPush = jest.fn();
  const mockOnClose = jest.fn();

  // Mock deadline fixtures
  const createMockDeadline = (
    status: string,
    currentProgress = 100
  ): ReadingDeadlineWithProgress => ({
    id: 'test-deadline-id',
    user_id: 'test-user-id',
    book_id: 'test-book-id',
    book_title: 'Test Book Title',
    author: 'Test Author',
    deadline_date: '2025-12-31',
    total_quantity: 300,
    format: 'physical',
    type: 'arc',
    flexibility: 'flexible',
    acquisition_source: 'NetGalley',
    publishers: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    cover_image_url: null,
    progress: [
      {
        id: 'progress-1',
        deadline_id: 'test-deadline-id',
        current_progress: currentProgress,
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z',
        ignore_in_calcs: false,
        time_spent_reading: null,
      },
    ],
    status: [
      {
        id: 'status-1',
        deadline_id: 'test-deadline-id',
        status: status as any,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ],
  });

  const mockColors = {
    surface: '#FFFFFF',
    primary: '#B8A9D9',
    textSecondary: '#687076',
    border: '#E5E7EB',
    text: '#11181C',
    surfaceVariant: '#F1F5F9',
    good: '#7a5a8c',
    error: '#E8B4B8',
    warning: '#E8B4A0',
    pending: '#9CA3AF',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useDeadlines as jest.Mock).mockReturnValue({
      startReadingDeadline: mockStartReadingDeadline,
      resumeDeadline: mockResumeDeadline,
      pauseDeadline: mockPauseDeadline,
      rejectDeadline: mockRejectDeadline,
      withdrawDeadline: mockWithdrawDeadline,
      completeDeadline: mockCompleteDeadline,
      didNotFinishDeadline: mockDidNotFinishDeadline,
    });

    (useUpdateDeadlineProgress as jest.Mock).mockReturnValue({
      mutate: mockUpdateProgress,
    });

    (useReviewTrackingData as jest.Mock).mockReturnValue({
      platforms: [],
      isLoading: false,
      reviewTracking: null,
      completionPercentage: 0,
      error: null,
      refetch: jest.fn(),
    });

    (useRouter as jest.Mock).mockReturnValue({
      push: mockRouterPush,
    });

    (useTheme as jest.Mock).mockReturnValue({
      colors: mockColors,
    });

    // Reset dialog component mock
    (MarkCompleteDialog as jest.Mock).mockImplementation(() => null);

    // Mock Alert.alert
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  describe('Component Structure', () => {
    it('should render modal when visible is true', () => {
      const deadline = createMockDeadline('pending');
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Change Status')).toBeTruthy();
    });

    it('should show current status badge', () => {
      const deadline = createMockDeadline('reading');
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Active')).toBeTruthy();
    });

    it('should render available transition options based on current status', () => {
      const deadline = createMockDeadline('pending');
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('status-option-reading')).toBeTruthy();
      expect(screen.getByTestId('status-option-rejected')).toBeTruthy();
      expect(screen.getByTestId('status-option-withdrew')).toBeTruthy();
    });

    it('should show cancel button', () => {
      const deadline = createMockDeadline('pending');
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Cancel')).toBeTruthy();
    });

    it('should not render when visible is false', () => {
      const deadline = createMockDeadline('pending');
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={false}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText('Change Status')).toBeNull();
    });
  });

  describe('Valid Transitions Display', () => {
    it('should show correct options for pending status', () => {
      const deadline = createMockDeadline('pending');
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('status-option-reading')).toBeTruthy();
      expect(screen.getByTestId('status-option-rejected')).toBeTruthy();
      expect(screen.getByTestId('status-option-withdrew')).toBeTruthy();
      expect(screen.queryByTestId('status-option-paused')).toBeNull();
    });

    it('should show correct options for reading status', () => {
      const deadline = createMockDeadline('reading');
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('status-option-paused')).toBeTruthy();
      expect(screen.getByTestId('status-option-to_review')).toBeTruthy();
      expect(screen.getByTestId('status-option-complete')).toBeTruthy();
      expect(screen.getByTestId('status-option-did_not_finish')).toBeTruthy();
      expect(screen.queryByTestId('status-option-rejected')).toBeNull();
    });

    it('should show correct options for paused status', () => {
      const deadline = createMockDeadline('paused');
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('status-option-reading')).toBeTruthy();
      expect(screen.getByTestId('status-option-complete')).toBeTruthy();
      expect(screen.getByTestId('status-option-did_not_finish')).toBeTruthy();
      expect(screen.queryByTestId('status-option-to_review')).toBeNull();
    });

    it('should show correct options for to_review status', () => {
      const deadline = createMockDeadline('to_review');
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('status-option-complete')).toBeTruthy();
      expect(screen.getByTestId('status-option-did_not_finish')).toBeTruthy();
      expect(screen.queryByTestId('status-option-reading')).toBeNull();
    });

    it('should display correct labels and descriptions for each option', () => {
      const deadline = createMockDeadline('pending');
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Start Reading')).toBeTruthy();
      expect(screen.getByText('Begin tracking your progress')).toBeTruthy();
      expect(screen.getByText('Reject Book')).toBeTruthy();
      expect(screen.getByText('Withdraw')).toBeTruthy();
    });
  });

  describe('Instant Transition Handling', () => {
    it('should call startReadingDeadline for pending to reading transition', () => {
      const deadline = createMockDeadline('pending');

      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const readingButton = screen.getByTestId('status-option-reading');
      fireEvent.press(readingButton);

      expect(mockStartReadingDeadline).toHaveBeenCalledWith(
        deadline.id,
        expect.any(Function),
        expect.any(Function)
      );

      // Manually invoke the success callback to test toast
      const onSuccess = mockStartReadingDeadline.mock.calls[0][1];
      onSuccess();

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Started reading Test Book Title',
      });
    });

    it('should call resumeDeadline for paused to reading transition', () => {
      const deadline = createMockDeadline('paused');

      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const readingButton = screen.getByTestId('status-option-reading');
      fireEvent.press(readingButton);

      expect(mockResumeDeadline).toHaveBeenCalledWith(
        deadline.id,
        expect.any(Function),
        expect.any(Function)
      );

      // Manually invoke the success callback
      const onSuccess = mockResumeDeadline.mock.calls[0][1];
      onSuccess();

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Resumed Test Book Title',
      });
    });

    it('should call pauseDeadline for reading to paused transition', () => {
      const deadline = createMockDeadline('reading');

      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const pausedButton = screen.getByTestId('status-option-paused');
      fireEvent.press(pausedButton);

      expect(mockPauseDeadline).toHaveBeenCalledWith(
        deadline.id,
        expect.any(Function),
        expect.any(Function)
      );

      // Manually invoke the success callback
      const onSuccess = mockPauseDeadline.mock.calls[0][1];
      onSuccess();

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Paused Test Book Title',
      });
    });

    it('should call rejectDeadline for pending to rejected transition', () => {
      const deadline = createMockDeadline('pending');

      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const rejectedButton = screen.getByTestId('status-option-rejected');
      fireEvent.press(rejectedButton);

      expect(mockRejectDeadline).toHaveBeenCalledWith(
        deadline.id,
        expect.any(Function),
        expect.any(Function)
      );

      // Manually invoke the success callback
      const onSuccess = mockRejectDeadline.mock.calls[0][1];
      onSuccess();

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Rejected Test Book Title',
      });
    });

    it('should call withdrawDeadline for pending to withdrew transition', () => {
      const deadline = createMockDeadline('pending');

      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const withdrewButton = screen.getByTestId('status-option-withdrew');
      fireEvent.press(withdrewButton);

      expect(mockWithdrawDeadline).toHaveBeenCalledWith(
        deadline.id,
        expect.any(Function),
        expect.any(Function)
      );

      // Manually invoke the success callback
      const onSuccess = mockWithdrawDeadline.mock.calls[0][1];
      onSuccess();

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Withdrew from Test Book Title',
      });
    });

    it('should show error toast when transition fails', () => {
      const deadline = createMockDeadline('pending');
      const mockError = new Error('Transition failed');

      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const readingButton = screen.getByTestId('status-option-reading');
      fireEvent.press(readingButton);

      // Manually invoke the error callback
      const onError = mockStartReadingDeadline.mock.calls[0][2];
      onError(mockError);

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Failed to start reading',
        text2: 'Please try again',
      });
    });
  });

  describe('Completion Flow Navigation', () => {
    it('should navigate to completion flow for reading to complete transition', () => {
      const deadline = createMockDeadline('reading', 300); // 100% progress
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const completeButton = screen.getByTestId('status-option-complete');
      fireEvent.press(completeButton);

      expect(mockRouterPush).toHaveBeenCalledWith(
        `/deadline/${deadline.id}/completion-flow`
      );
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should show Alert.alert for reading to to_review when progress < 100%', () => {
      const deadline = createMockDeadline('reading', 100); // progress < total_quantity (300)
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const toReviewButton = screen.getByTestId('status-option-to_review');
      fireEvent.press(toReviewButton);

      // Should show native Alert.alert, not navigate directly
      expect(Alert.alert).toHaveBeenCalled();
      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it('should navigate directly to completion flow for to_review when progress is 100%', () => {
      const deadline = createMockDeadline('reading', 300); // progress === total_quantity (300)
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const toReviewButton = screen.getByTestId('status-option-to_review');
      fireEvent.press(toReviewButton);

      // Should navigate directly without showing dialog
      expect(mockRouterPush).toHaveBeenCalledWith(
        `/deadline/${deadline.id}/completion-flow`
      );
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should navigate to completion flow for reading to did_not_finish', () => {
      const deadline = createMockDeadline('reading');
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const dnfButton = screen.getByTestId('status-option-did_not_finish');
      fireEvent.press(dnfButton);

      expect(mockRouterPush).toHaveBeenCalledWith(
        `/deadline/${deadline.id}/completion-flow`
      );
    });

    it('should navigate to completion flow for paused to complete transition', () => {
      const deadline = createMockDeadline('paused', 300); // 100% progress
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const completeButton = screen.getByTestId('status-option-complete');
      fireEvent.press(completeButton);

      expect(mockRouterPush).toHaveBeenCalledWith(
        `/deadline/${deadline.id}/completion-flow`
      );
    });

    it('should navigate to completion flow for paused to did_not_finish transition', () => {
      const deadline = createMockDeadline('paused');
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const dnfButton = screen.getByTestId('status-option-did_not_finish');
      fireEvent.press(dnfButton);

      expect(mockRouterPush).toHaveBeenCalledWith(
        `/deadline/${deadline.id}/completion-flow`
      );
    });
  });

  describe('Terminal State Handling', () => {
    it('should show archived message for complete status', () => {
      const deadline = createMockDeadline('complete');
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('This book is archived')).toBeTruthy();
      expect(
        screen.getByText('No status changes available for archived books')
      ).toBeTruthy();
      expect(screen.queryByTestId('status-option-reading')).toBeNull();
    });

    it('should show archived message for did_not_finish status', () => {
      const deadline = createMockDeadline('did_not_finish');
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('This book is archived')).toBeTruthy();
      expect(
        screen.getByText('No status changes available for archived books')
      ).toBeTruthy();
      expect(screen.queryByTestId('status-option-reading')).toBeNull();
    });

    it('should show archived message for rejected status', () => {
      const deadline = createMockDeadline('rejected');
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('This book is archived')).toBeTruthy();
      expect(
        screen.getByText('No status changes available for archived books')
      ).toBeTruthy();
      expect(screen.queryByTestId('status-option-reading')).toBeNull();
    });

    it('should show archived message for withdrew status', () => {
      const deadline = createMockDeadline('withdrew');
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('This book is archived')).toBeTruthy();
      expect(
        screen.getByText('No status changes available for archived books')
      ).toBeTruthy();
      expect(screen.queryByTestId('status-option-reading')).toBeNull();
    });
  });

  describe('Modal Behavior', () => {
    it('should call onClose when cancel button is pressed', () => {
      const deadline = createMockDeadline('pending');
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.press(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when backdrop is pressed', () => {
      const deadline = createMockDeadline('pending');
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const backdrop = screen.getByLabelText('Close status change sheet');
      fireEvent.press(backdrop);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose after successful instant transition', () => {
      const deadline = createMockDeadline('pending');
      mockStartReadingDeadline.mockImplementation((_id, onSuccess) => {
        onSuccess();
      });

      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const readingButton = screen.getByTestId('status-option-reading');
      fireEvent.press(readingButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose before navigating to completion flow', () => {
      const deadline = createMockDeadline('reading', 300); // 100% progress
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const completeButton = screen.getByTestId('status-option-complete');
      fireEvent.press(completeButton);

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockRouterPush).toHaveBeenCalled();
    });
  });

  describe('Toast Notifications', () => {
    it('should show success toast with book title for instant transitions', () => {
      const deadline = createMockDeadline('pending');
      deadline.book_title = 'The Great Gatsby';

      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const readingButton = screen.getByTestId('status-option-reading');
      fireEvent.press(readingButton);

      // Manually invoke the success callback
      const onSuccess = mockStartReadingDeadline.mock.calls[0][1];
      onSuccess();

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Started reading The Great Gatsby',
      });
    });

    it('should show error toast on mutation failure', () => {
      const deadline = createMockDeadline('reading');

      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const pausedButton = screen.getByTestId('status-option-paused');
      fireEvent.press(pausedButton);

      // Manually invoke the error callback
      const onError = mockPauseDeadline.mock.calls[0][2];
      onError(new Error('Network error'));

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Failed to pause reading',
        text2: 'Please try again',
      });
    });

    it('should show action-specific toast messages', () => {
      const deadline = createMockDeadline('paused');

      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const readingButton = screen.getByTestId('status-option-reading');
      fireEvent.press(readingButton);

      // Manually invoke the success callback
      const onSuccess = mockResumeDeadline.mock.calls[0][1];
      onSuccess();

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: `Resumed ${deadline.book_title}`,
      });
    });
  });

  describe('Status Options Display', () => {
    it('should render correct icon for each option', () => {
      const deadline = createMockDeadline('pending');
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const icons = screen.getAllByTestId('icon-symbol');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should apply correct color to status option icons', () => {
      const deadline = createMockDeadline('reading');
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      // Options rendered with different semantic colors
      expect(screen.getByTestId('status-option-paused')).toBeTruthy();
      expect(screen.getByTestId('status-option-to_review')).toBeTruthy();
      expect(screen.getByTestId('status-option-complete')).toBeTruthy();
      expect(screen.getByTestId('status-option-did_not_finish')).toBeTruthy();
    });

    it('should show chevron icon on all status options', () => {
      const deadline = createMockDeadline('pending');
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const chevrons = screen.getAllByText('chevron.right');
      expect(chevrons.length).toBeGreaterThan(0);
    });
  });

  describe('Disabled State Behavior', () => {
    it('should disable complete option when progress < 100%', () => {
      const deadline = createMockDeadline('reading', 150); // 150/300 = 50%
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const completeButton = screen.getByTestId('status-option-complete');
      expect(completeButton.props.accessibilityState?.disabled).toBe(true);
      expect(
        screen.getByText('Update progress to 100% to mark as complete')
      ).toBeTruthy();
    });

    it('should enable complete option when progress = 100%', () => {
      const deadline = createMockDeadline('reading', 300); // 300/300 = 100%
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const completeButton = screen.getByTestId('status-option-complete');
      expect(completeButton.props.accessibilityState?.disabled).toBeFalsy();
      expect(screen.getByText('➜ No review needed')).toBeTruthy();
      expect(
        screen.queryByText('Update progress to 100% to mark as complete')
      ).toBeNull();
    });

    it('should disable did_not_finish option when progress = 100%', () => {
      const deadline = createMockDeadline('reading', 300); // 300/300 = 100%
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const dnfButton = screen.getByTestId('status-option-did_not_finish');
      expect(dnfButton.props.accessibilityState?.disabled).toBe(true);
      expect(
        screen.getByText("Book is complete - use 'Mark Complete' instead")
      ).toBeTruthy();
    });

    it('should enable did_not_finish option when progress < 100%', () => {
      const deadline = createMockDeadline('reading', 150); // 150/300 = 50%
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const dnfButton = screen.getByTestId('status-option-did_not_finish');
      expect(dnfButton.props.accessibilityState?.disabled).toBeFalsy();
      expect(
        screen.queryByText("Book is complete - use 'Mark Complete' instead")
      ).toBeNull();
    });

    it('should prevent click on disabled complete option', () => {
      const deadline = createMockDeadline('reading', 150); // 150/300 = 50%
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const completeButton = screen.getByTestId('status-option-complete');
      fireEvent.press(completeButton);

      // Should not navigate when disabled
      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it('should prevent click on disabled did_not_finish option', () => {
      const deadline = createMockDeadline('reading', 300); // 300/300 = 100%
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const dnfButton = screen.getByTestId('status-option-did_not_finish');
      fireEvent.press(dnfButton);

      // Should not navigate when disabled
      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it('should apply disabled styling to complete option when progress < 100%', () => {
      const deadline = createMockDeadline('paused', 200); // 200/300 = 67%
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const completeButton = screen.getByTestId('status-option-complete');
      expect(completeButton.props.style).toMatchObject({
        opacity: 0.6,
      });
    });

    it('should apply disabled styling to did_not_finish option when progress = 100%', () => {
      const deadline = createMockDeadline('paused', 300); // 300/300 = 100%
      render(
        <StatusChangeActionSheet
          deadline={deadline}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const dnfButton = screen.getByTestId('status-option-did_not_finish');
      expect(dnfButton.props.style).toMatchObject({
        opacity: 0.6,
      });
    });
  });
});
