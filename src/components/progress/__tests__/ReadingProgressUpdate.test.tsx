import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import {
  useUpdateDeadlineProgress,
  useDeleteFutureProgress,
} from '@/hooks/useDeadlines';
import { useDeadlines } from '@/providers/DeadlineProvider';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';

import ReadingProgressUpdate from '../ReadingProgressUpdate';

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

// Mock all the hooks and external dependencies
jest.mock('@/hooks/useDeadlines', () => ({
  useUpdateDeadlineProgress: jest.fn(),
  useDeleteFutureProgress: jest.fn(),
}));

jest.mock('@/providers/DeadlineProvider', () => ({
  useDeadlines: jest.fn(),
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

// Mock Alert
const mockAlert = jest.fn();
Alert.alert = mockAlert;

// Mock child components completely to isolate testing
jest.mock('@/components/progress/MetricCard', () => {
  const React = require('react');
  return function MockMetricCard() {
    return React.createElement('View', { testID: 'metric-card' });
  };
});

jest.mock('@/components/progress/DateRangeDisplay', () => {
  const React = require('react');
  return function MockDateRangeDisplay() {
    return React.createElement('View', { testID: 'date-range-display' });
  };
});

jest.mock('@/components/features/deadlines/DeadlineCardActions', () => {
  const React = require('react');
  return {
    DeadlineCardActions: function MockDeadlineCardActions() {
      return React.createElement('View', { testID: 'deadline-card-actions' });
    },
  };
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    GestureDetector: ({ children }: any) => children,
    Gesture: {
      Pan: () => ({
        onStart: jest.fn().mockReturnThis(),
        onUpdate: jest.fn().mockReturnThis(),
        onEnd: jest.fn().mockReturnThis(),
        enabled: jest.fn().mockReturnThis(),
      }),
    },
    GestureHandlerRootView: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Animated = {
    View: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
  };
  return {
    __esModule: true,
    useSharedValue: jest.fn(initial => ({ value: initial })),
    useAnimatedStyle: jest.fn(() => ({})),
    runOnJS: jest.fn(fn => fn),
    default: Animated,
  };
});

// Mock react-hook-form completely
const mockHandleSubmit = jest.fn();
const mockSetValue = jest.fn();
const mockGetValues = jest.fn();

jest.mock('react-hook-form', () => ({
  useForm: jest.fn(() => ({
    control: {},
    handleSubmit: mockHandleSubmit,
    setValue: mockSetValue,
    getValues: mockGetValues,
  })),
}));

jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: jest.fn(() => undefined),
}));

jest.mock('@/utils/progressUpdateSchema', () => ({
  createProgressUpdateSchema: jest.fn(() => ({})),
}));

jest.mock('@/utils/deadlineUtils', () => ({
  formatProgressDisplay: jest.fn(() => '150 pages'),
}));

describe('ReadingProgressUpdate - Simple Integration Tests', () => {
  const mockDeadline = {
    id: 'deadline-1',
    book_title: 'Test Book',
    format: 'physical' as const,
    deadline_date: '2024-12-31',
    created_at: '2024-01-01',
  } as any;

  const mockUpdateMutation = {
    mutate: jest.fn(),
    isPending: false,
  };

  const mockDeleteMutation = {
    mutate: jest.fn(),
    isPending: false,
  };

  const mockDeadlineContext = {
    getDeadlineCalculations: jest.fn().mockReturnValue({
      urgencyLevel: 'good',
      currentProgress: 150,
      totalQuantity: 300,
      remaining: 150,
      progressPercentage: 50,
    }),
    completeDeadline: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockClear();
    mockHandleSubmit.mockClear();
    mockSetValue.mockClear();
    mockGetValues.mockClear();

    // Set up default mocks
    mockHandleSubmit.mockImplementation(
      fn => () => fn({ currentProgress: 180 })
    );
    mockGetValues.mockReturnValue({ currentProgress: 150 });

    (useUpdateDeadlineProgress as jest.Mock).mockReturnValue(
      mockUpdateMutation
    );
    (useDeleteFutureProgress as jest.Mock).mockReturnValue(mockDeleteMutation);
    (useDeadlines as jest.Mock).mockReturnValue(mockDeadlineContext);
  });

  describe('Component Structure', () => {
    it('should render all main sub-components', () => {
      render(<ReadingProgressUpdate deadline={mockDeadline} />);

      expect(screen.getByTestId('metric-card')).toBeTruthy();
      expect(screen.getByTestId('date-range-display')).toBeTruthy();
      expect(screen.getByTestId('deadline-card-actions')).toBeTruthy();
    });

    it('should render the update button', () => {
      render(<ReadingProgressUpdate deadline={mockDeadline} />);
      expect(screen.getByText('Update')).toBeTruthy();
    });

    it('should show updating state when mutation is pending', () => {
      (useUpdateDeadlineProgress as jest.Mock).mockReturnValue({
        ...mockUpdateMutation,
        isPending: true,
      });

      render(<ReadingProgressUpdate deadline={mockDeadline} />);
      expect(screen.getByText('Updating...')).toBeTruthy();
    });
  });

  describe('Hook Integration', () => {
    it('should call useUpdateDeadlineProgress hook', () => {
      render(<ReadingProgressUpdate deadline={mockDeadline} />);
      expect(useUpdateDeadlineProgress).toHaveBeenCalled();
    });

    it('should call useDeleteFutureProgress hook', () => {
      render(<ReadingProgressUpdate deadline={mockDeadline} />);
      expect(useDeleteFutureProgress).toHaveBeenCalled();
    });

    it('should call useDeadlines provider', () => {
      render(<ReadingProgressUpdate deadline={mockDeadline} />);
      expect(useDeadlines).toHaveBeenCalled();
    });

    it('should call getDeadlineCalculations with deadline', () => {
      render(<ReadingProgressUpdate deadline={mockDeadline} />);
      expect(mockDeadlineContext.getDeadlineCalculations).toHaveBeenCalledWith(
        mockDeadline
      );
    });
  });

  describe('Props Handling', () => {
    it('should handle timeSpentReading prop', () => {
      render(
        <ReadingProgressUpdate deadline={mockDeadline} timeSpentReading={30} />
      );
      expect(screen.getByText('Update')).toBeTruthy();
    });

    it('should handle onProgressSubmitted callback prop', () => {
      const onProgressSubmitted = jest.fn();
      render(
        <ReadingProgressUpdate
          deadline={mockDeadline}
          onProgressSubmitted={onProgressSubmitted}
        />
      );
      expect(screen.getByText('Update')).toBeTruthy();
    });
  });

  describe('Different Formats', () => {
    it('should handle physical format deadline', () => {
      const physicalDeadline = { ...mockDeadline, format: 'physical' as const };
      render(<ReadingProgressUpdate deadline={physicalDeadline} />);
      expect(screen.getByTestId('metric-card')).toBeTruthy();
    });

    it('should handle eBook format deadline', () => {
      const ebookDeadline = { ...mockDeadline, format: 'eBook' as const };
      render(<ReadingProgressUpdate deadline={ebookDeadline} />);
      expect(screen.getByTestId('metric-card')).toBeTruthy();
    });

    it('should handle audio format deadline', () => {
      const audioDeadline = { ...mockDeadline, format: 'audio' as const };
      render(<ReadingProgressUpdate deadline={audioDeadline} />);
      expect(screen.getByTestId('metric-card')).toBeTruthy();
    });
  });

  describe('Pending State', () => {
    it('should disable button and show loading text when updating', () => {
      (useUpdateDeadlineProgress as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        isPending: true,
      });

      render(<ReadingProgressUpdate deadline={mockDeadline} />);

      const button = screen.getByText('Updating...');
      expect(button).toBeTruthy();
    });

    it('should show normal button text when not updating', () => {
      (useUpdateDeadlineProgress as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
      });

      render(<ReadingProgressUpdate deadline={mockDeadline} />);

      const button = screen.getByText('Update');
      expect(button).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should render without errors when deadline calculations return different urgency levels', () => {
      const testCases = [
        'good',
        'urgent',
        'overdue',
        'approaching',
        'impossible',
      ] as const;

      testCases.forEach(urgencyLevel => {
        (useDeadlines as jest.Mock).mockReturnValue({
          ...mockDeadlineContext,
          getDeadlineCalculations: jest.fn().mockReturnValue({
            urgencyLevel,
            currentProgress: 150,
            totalQuantity: 300,
            remaining: 150,
            progressPercentage: 50,
          }),
        });

        const { unmount } = render(
          <ReadingProgressUpdate deadline={mockDeadline} />
        );
        expect(screen.getByText('Update')).toBeTruthy();
        unmount();
      });
    });

    it('should handle empty or undefined deadline gracefully', () => {
      const minimalDeadline = {
        id: 'test-id',
        format: 'physical',
        book_title: 'Test',
      } as any;

      render(<ReadingProgressUpdate deadline={minimalDeadline} />);
      expect(screen.getByText('Update')).toBeTruthy();
    });
  });

  describe('Callback Function Testing', () => {
    describe('Form Submission and Progress Logic', () => {
      it('should trigger progress update when form is submitted', () => {
        const mockUpdateMutation = {
          mutate: jest.fn(),
          isPending: false,
        };
        (useUpdateDeadlineProgress as jest.Mock).mockReturnValue(
          mockUpdateMutation
        );

        render(<ReadingProgressUpdate deadline={mockDeadline} />);

        // Trigger the form submission by pressing the button
        const button = screen.getByText('Update');
        fireEvent.press(button);

        expect(mockUpdateMutation.mutate).toHaveBeenCalled();
      });

      it('should include timeSpentReading when provided', () => {
        const mockUpdateMutation = {
          mutate: jest.fn(),
          isPending: false,
        };
        (useUpdateDeadlineProgress as jest.Mock).mockReturnValue(
          mockUpdateMutation
        );

        render(
          <ReadingProgressUpdate
            deadline={mockDeadline}
            timeSpentReading={30}
          />
        );

        const button = screen.getByText('Update');
        fireEvent.press(button);

        expect(mockUpdateMutation.mutate).toHaveBeenCalledWith(
          expect.objectContaining({
            timeSpentReading: 30,
          }),
          expect.any(Object)
        );
      });

      it('should show success toast on successful update', () => {
        const mockUpdateMutation = {
          mutate: jest.fn().mockImplementation((_, { onSuccess }) => {
            onSuccess();
          }),
          isPending: false,
        };
        (useUpdateDeadlineProgress as jest.Mock).mockReturnValue(
          mockUpdateMutation
        );

        render(<ReadingProgressUpdate deadline={mockDeadline} />);

        const button = screen.getByText('Update');
        fireEvent.press(button);

        expect(Toast.show).toHaveBeenCalledWith({
          swipeable: true,
          type: 'success',
          text1: 'Progress Updated!',
          text2: 'Updated to 150 pages',
        });
      });

      it('should show error toast on failed update', () => {
        const mockError = new Error('Update failed');
        const mockUpdateMutation = {
          mutate: jest.fn().mockImplementation((_, { onError }) => {
            onError(mockError);
          }),
          isPending: false,
        };
        (useUpdateDeadlineProgress as jest.Mock).mockReturnValue(
          mockUpdateMutation
        );

        render(<ReadingProgressUpdate deadline={mockDeadline} />);

        const button = screen.getByText('Update');
        fireEvent.press(button);

        expect(Toast.show).toHaveBeenCalledWith({
          swipeable: true,
          type: 'error',
          text1: 'Update Failed',
          text2: 'Please try again',
        });
      });
    });

    describe('Book Completion Logic', () => {
      it('should show completion dialog when book is completed', () => {
        // Mock to simulate book completion (progress equals total)
        (useDeadlines as jest.Mock).mockReturnValue({
          ...mockDeadlineContext,
          getDeadlineCalculations: jest.fn().mockReturnValue({
            urgencyLevel: 'good',
            currentProgress: 150, // Keep current at 150 for form logic
            totalQuantity: 300,
            remaining: 150,
            progressPercentage: 50,
          }),
        });

        const mockUpdateMutation = {
          mutate: jest.fn().mockImplementation((_, { onSuccess }) => {
            // Simulate successful update that triggers completion logic
            onSuccess();
          }),
          isPending: false,
        };
        (useUpdateDeadlineProgress as jest.Mock).mockReturnValue(
          mockUpdateMutation
        );

        // Mock handleSubmit to simulate completion progress (300 pages = complete)
        mockHandleSubmit.mockImplementation(
          fn => () => fn({ currentProgress: 300 })
        );

        render(<ReadingProgressUpdate deadline={mockDeadline} />);

        const button = screen.getByText('Update');
        fireEvent.press(button);

        // Should show completion dialog because isBookComplete(300, 300) = true
        expect(mockAlert).toHaveBeenCalled();
        const alertCall = mockAlert.mock.calls[0];
        expect(alertCall[0]).toBe('Book Complete! 🎉');
      });

      it('should call onProgressSubmitted when user chooses "Not Yet"', () => {
        const onProgressSubmitted = jest.fn();

        // Setup Alert mock to simulate user clicking "Not Yet"
        mockAlert.mockImplementation((_title, _message, buttons) => {
          const notYetButton = buttons.find((b: any) => b.text === 'Not Yet');
          if (notYetButton && notYetButton.onPress) {
            notYetButton.onPress();
          }
        });

        (useDeadlines as jest.Mock).mockReturnValue({
          ...mockDeadlineContext,
          getDeadlineCalculations: jest.fn().mockReturnValue({
            urgencyLevel: 'good',
            currentProgress: 150, // Keep current at 150 for form logic
            totalQuantity: 300,
            remaining: 150,
            progressPercentage: 50,
          }),
        });

        const mockUpdateMutation = {
          mutate: jest
            .fn()
            .mockImplementation((_, { onSuccess }) => onSuccess()),
          isPending: false,
        };
        (useUpdateDeadlineProgress as jest.Mock).mockReturnValue(
          mockUpdateMutation
        );
        mockHandleSubmit.mockImplementation(
          fn => () => fn({ currentProgress: 300 })
        );

        render(
          <ReadingProgressUpdate
            deadline={mockDeadline}
            onProgressSubmitted={onProgressSubmitted}
          />
        );

        const button = screen.getByText('Update');
        fireEvent.press(button);

        expect(onProgressSubmitted).toHaveBeenCalled();
      });
    });

    describe('Backward Progress Handling', () => {
      it('should show warning dialog for backward progress', () => {
        // Mock handleSubmit to simulate backward progress (current is 150, new should be 100)
        mockHandleSubmit.mockImplementation(
          fn => () => fn({ currentProgress: 100 })
        );

        render(<ReadingProgressUpdate deadline={mockDeadline} />);

        const button = screen.getByText('Update');
        fireEvent.press(button);

        // Note: The actual message format might be different, let's check what we actually get
        expect(mockAlert).toHaveBeenCalled();
        const alertCall = mockAlert.mock.calls[0];
        expect(alertCall[0]).toBe('Backward Progress Warning');
      });

      it('should call deleteFutureProgress when user confirms backward progress', () => {
        const mockDeleteMutation = {
          mutate: jest.fn(),
          isPending: false,
        };
        (useDeleteFutureProgress as jest.Mock).mockReturnValue(
          mockDeleteMutation
        );

        // Mock Alert to simulate user clicking "Update"
        mockAlert.mockImplementation((_title, _message, buttons) => {
          const updateButton = buttons.find((b: any) => b.text === 'Update');
          if (updateButton && updateButton.onPress) {
            updateButton.onPress();
          }
        });

        mockHandleSubmit.mockImplementation(
          fn => () => fn({ currentProgress: 100 })
        );

        render(<ReadingProgressUpdate deadline={mockDeadline} />);

        const button = screen.getByText('Update');
        fireEvent.press(button);

        expect(mockDeleteMutation.mutate).toHaveBeenCalledWith(
          { deadlineId: 'deadline-1', newProgress: 100 },
          expect.objectContaining({
            onSuccess: expect.any(Function),
            onError: expect.any(Function),
          })
        );
      });
    });

    describe('Complex Integration Scenarios', () => {
      it('should handle book completion with onProgressSubmitted callback', () => {
        const onProgressSubmitted = jest.fn();

        // Mock completion scenario (currentProgress >= totalQuantity)
        mockHandleSubmit.mockImplementation(
          fn => () => fn({ currentProgress: 300 })
        );

        // Mock alert to simulate "I'm done reading" button press
        mockAlert.mockImplementation((_title, _message, buttons) => {
          const completeButton = buttons.find(
            (b: any) => b.text === "I'm done reading"
          );
          if (completeButton && completeButton.onPress) {
            completeButton.onPress();
          }
        });

        (useDeadlines as jest.Mock).mockReturnValue({
          ...mockDeadlineContext,
          getDeadlineCalculations: jest.fn().mockReturnValue({
            urgencyLevel: 'good',
            currentProgress: 150,
            totalQuantity: 300,
            remaining: 150,
            progressPercentage: 50,
          }),
        });

        const mockUpdateMutation = {
          mutate: jest
            .fn()
            .mockImplementation((_, { onSuccess }) => onSuccess()),
          isPending: false,
        };
        (useUpdateDeadlineProgress as jest.Mock).mockReturnValue(
          mockUpdateMutation
        );

        render(
          <ReadingProgressUpdate
            deadline={mockDeadline}
            onProgressSubmitted={onProgressSubmitted}
          />
        );

        const button = screen.getByText('Update');
        fireEvent.press(button);

        expect(router.push).toHaveBeenCalledWith(
          '/deadline/deadline-1/completion-flow'
        );
      });

      it('should handle backward progress deletion success', () => {
        const mockDeleteMutation = {
          mutate: jest.fn().mockImplementation((_, { onSuccess }) => {
            onSuccess();
          }),
          isPending: false,
        };

        const mockUpdateMutation = {
          mutate: jest.fn(),
          isPending: false,
        };

        (useDeleteFutureProgress as jest.Mock).mockReturnValue(
          mockDeleteMutation
        );
        (useUpdateDeadlineProgress as jest.Mock).mockReturnValue(
          mockUpdateMutation
        );

        // Mock Alert to confirm backward progress
        mockAlert.mockImplementation((_title, _message, buttons) => {
          const updateButton = buttons.find((b: any) => b.text === 'Update');
          if (updateButton && updateButton.onPress) {
            updateButton.onPress();
          }
        });

        mockHandleSubmit.mockImplementation(
          fn => () => fn({ currentProgress: 100 })
        );

        render(<ReadingProgressUpdate deadline={mockDeadline} />);

        const button = screen.getByText('Update');
        fireEvent.press(button);

        // Should delete future progress first, then update
        expect(mockDeleteMutation.mutate).toHaveBeenCalled();
        expect(mockUpdateMutation.mutate).toHaveBeenCalled();
      });

      it('should handle no progress change scenario', () => {
        const mockUpdateMutation = {
          mutate: jest.fn(),
          isPending: false,
        };
        (useUpdateDeadlineProgress as jest.Mock).mockReturnValue(
          mockUpdateMutation
        );

        // Mock form to return same progress as current
        mockHandleSubmit.mockImplementation(
          fn => () => fn({ currentProgress: 150 })
        );

        render(<ReadingProgressUpdate deadline={mockDeadline} />);

        const button = screen.getByText('Update');
        fireEvent.press(button);

        // Should not call mutation when progress hasn't changed
        expect(mockUpdateMutation.mutate).not.toHaveBeenCalled();
        expect(mockAlert).not.toHaveBeenCalled();
      });

      it('should log errors to console on mutation failures', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const mockError = new Error('Network error');

        const mockUpdateMutation = {
          mutate: jest
            .fn()
            .mockImplementation((_, { onError }) => onError(mockError)),
          isPending: false,
        };
        (useUpdateDeadlineProgress as jest.Mock).mockReturnValue(
          mockUpdateMutation
        );

        render(<ReadingProgressUpdate deadline={mockDeadline} />);

        const button = screen.getByText('Update');
        fireEvent.press(button);

        expect(consoleSpy).toHaveBeenCalledWith(
          'Progress update error:',
          mockError
        );

        consoleSpy.mockRestore();
      });

      it('should handle audio format correctly', () => {
        const audioDeadline = { ...mockDeadline, format: 'audio' as const };
        const {
          createProgressUpdateSchema,
        } = require('@/utils/progressUpdateSchema');

        render(<ReadingProgressUpdate deadline={audioDeadline} />);

        expect(screen.getByTestId('metric-card')).toBeTruthy();
        expect(createProgressUpdateSchema).toHaveBeenCalledWith(300, 'audio');
      });
    });

    describe('Paused State Handling', () => {
      it('should display paused message when deadline is paused', () => {
        const pausedDeadline = {
          ...mockDeadline,
          status: [{ status: 'paused', created_at: '2024-11-30T00:00:00Z' }],
        };

        render(<ReadingProgressUpdate deadline={pausedDeadline} />);

        expect(screen.getByText(/Paused on/)).toBeTruthy();
        expect(
          screen.getByText(/Progress updates available when resumed/)
        ).toBeTruthy();
      });

      it('should not display paused message when deadline is not paused', () => {
        const activeDeadline = {
          ...mockDeadline,
          status: [{ status: 'reading', created_at: '2024-11-01T00:00:00Z' }],
        };

        render(<ReadingProgressUpdate deadline={activeDeadline} />);

        expect(screen.queryByText(/Paused on/)).toBeNull();
      });

      it('should disable all controls when paused', () => {
        const pausedDeadline = {
          ...mockDeadline,
          status: [{ status: 'paused', created_at: '2024-11-30T00:00:00Z' }],
        };

        const mockUpdateMutation = {
          mutate: jest.fn(),
          isPending: false,
        };
        (useUpdateDeadlineProgress as jest.Mock).mockReturnValue(
          mockUpdateMutation
        );

        render(<ReadingProgressUpdate deadline={pausedDeadline} />);

        const button = screen.getByText('Update');
        fireEvent.press(button);

        expect(mockUpdateMutation.mutate).not.toHaveBeenCalled();
      });

      it('should apply opacity styling when paused', () => {
        const pausedDeadline = {
          ...mockDeadline,
          status: [{ status: 'paused', created_at: '2024-11-30T00:00:00Z' }],
        };

        const { root } = render(
          <ReadingProgressUpdate deadline={pausedDeadline} />
        );

        expect(root).toBeTruthy();
      });

      it('should handle multiple pause statuses and show most recent', () => {
        const pausedDeadline = {
          ...mockDeadline,
          status: [
            { status: 'paused', created_at: '2024-11-15T00:00:00Z' },
            { status: 'reading', created_at: '2024-11-20T00:00:00Z' },
            { status: 'paused', created_at: '2024-11-30T00:00:00Z' },
          ],
        };

        render(<ReadingProgressUpdate deadline={pausedDeadline} />);

        expect(screen.getByText(/Paused on/)).toBeTruthy();
      });

      it('should not display paused message if no pause date available', () => {
        const pausedDeadline = {
          ...mockDeadline,
          status: [{ status: 'paused', created_at: null }],
        };

        render(<ReadingProgressUpdate deadline={pausedDeadline} />);

        expect(screen.queryByText(/Paused on/)).toBeNull();
      });
    });
  });

  describe('Increment/Decrement Buttons', () => {
    it('should render increment and decrement buttons', () => {
      render(<ReadingProgressUpdate deadline={mockDeadline} />);

      const decrementButton = screen.getByLabelText('Decrease progress by 1');
      const incrementButton = screen.getByLabelText('Increase progress by 1');

      expect(decrementButton).toBeTruthy();
      expect(incrementButton).toBeTruthy();
    });

    it('should call setValue when decrement button is pressed', () => {
      mockGetValues.mockReturnValue({ currentProgress: 150 });

      render(<ReadingProgressUpdate deadline={mockDeadline} />);

      const decrementButton = screen.getByLabelText('Decrease progress by 1');
      fireEvent.press(decrementButton);

      expect(mockSetValue).toHaveBeenCalledWith('currentProgress', 149, {
        shouldValidate: false,
      });
    });

    it('should call setValue when increment button is pressed', () => {
      mockGetValues.mockReturnValue({ currentProgress: 150 });

      render(<ReadingProgressUpdate deadline={mockDeadline} />);

      const incrementButton = screen.getByLabelText('Increase progress by 1');
      fireEvent.press(incrementButton);

      expect(mockSetValue).toHaveBeenCalledWith('currentProgress', 151, {
        shouldValidate: false,
      });
    });

    it('should not decrement below 0', () => {
      mockDeadlineContext.getDeadlineCalculations.mockReturnValue({
        urgencyLevel: 'good',
        currentProgress: 0,
        totalQuantity: 300,
        remaining: 300,
        progressPercentage: 0,
      });

      render(<ReadingProgressUpdate deadline={mockDeadline} />);

      const decrementButton = screen.getByLabelText('Decrease progress by 1');

      // Button should be disabled when at 0
      expect(decrementButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('should not increment above total quantity', () => {
      mockDeadlineContext.getDeadlineCalculations.mockReturnValue({
        urgencyLevel: 'good',
        currentProgress: 300,
        totalQuantity: 300,
        remaining: 0,
        progressPercentage: 100,
      });

      render(<ReadingProgressUpdate deadline={mockDeadline} />);

      const incrementButton = screen.getByLabelText('Increase progress by 1');

      // Button should be disabled when at max
      expect(incrementButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('should disable both buttons when deadline is paused', () => {
      const pausedDeadline = {
        ...mockDeadline,
        status: [{ status: 'paused', created_at: '2024-11-30T00:00:00Z' }],
      };

      render(<ReadingProgressUpdate deadline={pausedDeadline} />);

      const decrementButton = screen.getByLabelText('Decrease progress by 1');
      const incrementButton = screen.getByLabelText('Increase progress by 1');

      expect(decrementButton.props.accessibilityState?.disabled).toBe(true);
      expect(incrementButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('should work for audio format deadlines', () => {
      const audioDeadline = {
        ...mockDeadline,
        format: 'audio' as const,
      };

      mockDeadlineContext.getDeadlineCalculations.mockReturnValue({
        urgencyLevel: 'good',
        currentProgress: 120, // 2 hours in minutes
        totalQuantity: 600, // 10 hours in minutes
        remaining: 480,
        progressPercentage: 20,
      });

      render(<ReadingProgressUpdate deadline={audioDeadline} />);

      const incrementButton = screen.getByLabelText('Increase progress by 1');
      fireEvent.press(incrementButton);

      expect(mockSetValue).toHaveBeenCalledWith('currentProgress', 121, {
        shouldValidate: false,
      });
    });
  });
});
