import {
  useCompleteDeadline,
  useDidNotFinishDeadline,
} from '@/hooks/useDeadlines';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';
import Toast from 'react-native-toast-message';
import CompletionFormContainer from '../CompletionFormContainer';

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

jest.mock('@/hooks/useDeadlines', () => ({
  useCompleteDeadline: jest.fn(),
  useDidNotFinishDeadline: jest.fn(),
  useToReviewDeadline: jest.fn(() => ({
    mutate: jest.fn(),
  })),
}));

jest.mock('../CompletionFormStep1', () => {
  const React = require('react');
  const { TouchableOpacity, View, Text } = require('react-native');
  return function MockCompletionFormStep1({ onContinue, deadline }: any) {
    return React.createElement(View, { testID: 'celebration-container' }, [
      React.createElement(Text, { key: 'title' }, 'You finished!'),
      React.createElement(Text, { key: 'book' }, deadline.book_title),
      React.createElement(
        TouchableOpacity,
        {
          testID: 'continue-button',
          onPress: onContinue,
          key: 'continue',
        },
        React.createElement(Text, null, 'Continue')
      ),
    ]);
  };
});

jest.mock('../CompletionFormStep2', () => {
  const React = require('react');
  const { TouchableOpacity, View, Text } = require('react-native');
  return function MockCompletionFormStep2({ onContinue, deadline }: any) {
    const [needsReview, setNeedsReview] = React.useState(null);

    return React.createElement(View, { testID: 'review-question-container' }, [
      React.createElement(Text, { key: 'title' }, 'Need to post reviews?'),
      React.createElement(Text, { key: 'book' }, deadline.book_title),
      React.createElement(
        TouchableOpacity,
        {
          testID: 'yes-button',
          onPress: () => setNeedsReview(true),
          key: 'yes',
        },
        React.createElement(Text, null, 'Yes')
      ),
      React.createElement(
        TouchableOpacity,
        {
          testID: 'no-button',
          onPress: () => setNeedsReview(false),
          key: 'no',
        },
        React.createElement(Text, null, 'No')
      ),
      needsReview !== null &&
        React.createElement(
          TouchableOpacity,
          {
            testID: 'continue-button',
            onPress: () => onContinue(needsReview),
            key: 'continue',
          },
          React.createElement(Text, null, 'Continue')
        ),
      needsReview === true &&
        React.createElement(
          Text,
          { key: 'help-text' },
          "We'll help you track your review progress"
        ),
    ]);
  };
});

jest.mock('../CompletionFormStep3', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return function MockCompletionFormStep3({ deadline, isDNF }: any) {
    return React.createElement(View, { testID: 'review-form-container' }, [
      React.createElement(Text, { key: 'title' }, 'Review Form'),
      React.createElement(Text, { key: 'book' }, deadline.book_title),
      React.createElement(
        Text,
        { key: 'dnf' },
        isDNF ? 'DNF Mode' : 'Complete Mode'
      ),
    ]);
  };
});

describe('CompletionFormContainer', () => {
  const mockCompleteDeadline = jest.fn();
  const mockDidNotFinishDeadline = jest.fn();

  const mockDeadline: ReadingDeadlineWithProgress = {
    id: 'test-deadline-id',
    user_id: 'test-user-id',
    book_id: 'test-book-id',
    book_title: 'Test Book Title',
    author: 'Test Author',
    deadline_date: '2024-12-31',
    flexibility: 'flexible',
    format: 'physical',
    total_quantity: 300,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    acquisition_source: null,
    type: 'Personal',
    publishers: null,
    cover_image_url: null,
    progress: [
      {
        id: 'progress-1',
        deadline_id: 'test-deadline-id',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        current_progress: 300,
        time_spent_reading: null,
        ignore_in_calcs: false,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useCompleteDeadline as jest.Mock).mockReturnValue({
      mutate: mockCompleteDeadline,
    });

    (useDidNotFinishDeadline as jest.Mock).mockReturnValue({
      mutate: mockDidNotFinishDeadline,
    });
  });

  describe('Component Rendering', () => {
    it('should render step 1 (celebration) for non-DNF completion', () => {
      render(<CompletionFormContainer deadline={mockDeadline} isDNF={false} />);

      expect(screen.getByTestId('celebration-container')).toBeTruthy();
      expect(screen.getByText('You finished!')).toBeTruthy();
      expect(screen.getByText('Test Book Title')).toBeTruthy();
    });

    it('should render step 2 (review question) for DNF completion', () => {
      render(<CompletionFormContainer deadline={mockDeadline} isDNF={true} />);

      expect(screen.getByTestId('review-question-container')).toBeTruthy();
      expect(screen.getByText('Need to post reviews?')).toBeTruthy();
    });

    it('should show correct deadline data in celebration screen', () => {
      render(<CompletionFormContainer deadline={mockDeadline} isDNF={false} />);

      expect(screen.getByTestId('celebration-container')).toBeTruthy();
      expect(screen.getByText('Test Book Title')).toBeTruthy();
    });
  });

  describe('Step Navigation', () => {
    it('should advance from celebration to review question when continue pressed', async () => {
      render(<CompletionFormContainer deadline={mockDeadline} isDNF={false} />);

      expect(screen.getByTestId('celebration-container')).toBeTruthy();

      const continueButton = screen.getByTestId('continue-button');
      fireEvent.press(continueButton);

      await waitFor(() => {
        expect(screen.getByTestId('review-question-container')).toBeTruthy();
        expect(screen.getByText('Need to post reviews?')).toBeTruthy();
      });
    });

    it('should advance to review form when user selects yes for reviews', async () => {
      render(<CompletionFormContainer deadline={mockDeadline} isDNF={false} />);

      fireEvent.press(screen.getByTestId('continue-button'));

      await waitFor(() => {
        expect(screen.getByTestId('review-question-container')).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId('yes-button'));

      await waitFor(() => {
        expect(screen.getByTestId('continue-button')).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId('continue-button'));

      await waitFor(() => {
        expect(screen.getByTestId('review-form-container')).toBeTruthy();
      });
    });

    it('should complete directly when user selects no for reviews', async () => {
      mockCompleteDeadline.mockImplementation((_deadlineId, callbacks) => {
        callbacks.onSuccess();
      });

      render(<CompletionFormContainer deadline={mockDeadline} isDNF={false} />);

      fireEvent.press(screen.getByTestId('continue-button'));

      await waitFor(() => {
        expect(screen.getByTestId('review-question-container')).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId('no-button'));

      await waitFor(() => {
        expect(screen.getByTestId('continue-button')).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId('continue-button'));

      await waitFor(() => {
        expect(mockCompleteDeadline).toHaveBeenCalledWith(
          expect.objectContaining({
            deadlineId: mockDeadline.id,
            deadline: expect.objectContaining({
              total_quantity: mockDeadline.total_quantity,
              progress: mockDeadline.progress,
            }),
          }),
          expect.objectContaining({
            onSuccess: expect.any(Function),
            onError: expect.any(Function),
          })
        );
      });
    });

    it('should skip celebration screen for DNF mode', () => {
      render(<CompletionFormContainer deadline={mockDeadline} isDNF={true} />);

      expect(screen.queryByTestId('celebration-container')).toBeNull();
      expect(screen.getByTestId('review-question-container')).toBeTruthy();
    });
  });

  describe('Mutation Integration - Complete', () => {
    it('should call completeDeadline mutation for non-DNF direct completion', async () => {
      mockCompleteDeadline.mockImplementation((_deadlineId, callbacks) => {
        callbacks.onSuccess();
      });

      render(<CompletionFormContainer deadline={mockDeadline} isDNF={false} />);

      fireEvent.press(screen.getByTestId('continue-button'));
      await waitFor(() => screen.getByTestId('review-question-container'));

      fireEvent.press(screen.getByTestId('no-button'));
      await waitFor(() => screen.getByTestId('continue-button'));

      fireEvent.press(screen.getByTestId('continue-button'));

      await waitFor(() => {
        expect(mockCompleteDeadline).toHaveBeenCalledWith(
          expect.objectContaining({
            deadlineId: mockDeadline.id,
          }),
          expect.any(Object)
        );
      });
    });

    it('should show success toast on successful completion', async () => {
      mockCompleteDeadline.mockImplementation((_deadlineId, callbacks) => {
        callbacks.onSuccess();
      });

      render(<CompletionFormContainer deadline={mockDeadline} isDNF={false} />);

      fireEvent.press(screen.getByTestId('continue-button'));
      await waitFor(() => screen.getByTestId('review-question-container'));

      fireEvent.press(screen.getByTestId('no-button'));
      await waitFor(() => screen.getByTestId('continue-button'));

      fireEvent.press(screen.getByTestId('continue-button'));

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'success',
          text1: 'All done!',
          text2: `"${mockDeadline.book_title}" marked as complete`,
        });
      });
    });

    it('should navigate to home on successful completion', async () => {
      mockCompleteDeadline.mockImplementation((_deadlineId, callbacks) => {
        callbacks.onSuccess();
      });

      render(<CompletionFormContainer deadline={mockDeadline} isDNF={false} />);

      fireEvent.press(screen.getByTestId('continue-button'));
      await waitFor(() => screen.getByTestId('review-question-container'));

      fireEvent.press(screen.getByTestId('no-button'));
      await waitFor(() => screen.getByTestId('continue-button'));

      fireEvent.press(screen.getByTestId('continue-button'));

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Mutation Integration - DNF', () => {
    it('should call didNotFinishDeadline mutation for DNF completion', async () => {
      mockDidNotFinishDeadline.mockImplementation((_deadlineId, callbacks) => {
        callbacks.onSuccess();
      });

      render(<CompletionFormContainer deadline={mockDeadline} isDNF={true} />);

      expect(screen.getByTestId('review-question-container')).toBeTruthy();

      fireEvent.press(screen.getByTestId('no-button'));
      await waitFor(() => screen.getByTestId('continue-button'));

      fireEvent.press(screen.getByTestId('continue-button'));

      await waitFor(() => {
        expect(mockDidNotFinishDeadline).toHaveBeenCalledWith(
          mockDeadline.id,
          expect.any(Object)
        );
      });
    });

    it('should show DNF-specific toast on successful DNF', async () => {
      mockDidNotFinishDeadline.mockImplementation((_deadlineId, callbacks) => {
        callbacks.onSuccess();
      });

      render(<CompletionFormContainer deadline={mockDeadline} isDNF={true} />);

      fireEvent.press(screen.getByTestId('no-button'));
      await waitFor(() => screen.getByTestId('continue-button'));

      fireEvent.press(screen.getByTestId('continue-button'));

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'success',
          text1: 'All done!',
          text2: `"${mockDeadline.book_title}" moved to DNF`,
        });
      });
    });

    it('should pass isDNF flag to review form', async () => {
      render(<CompletionFormContainer deadline={mockDeadline} isDNF={true} />);

      fireEvent.press(screen.getByTestId('yes-button'));
      await waitFor(() => screen.getByTestId('continue-button'));

      fireEvent.press(screen.getByTestId('continue-button'));

      await waitFor(() => {
        expect(screen.getByText('DNF Mode')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error toast on completion failure', async () => {
      const testError = new Error('Network error');
      mockCompleteDeadline.mockImplementation((_deadlineId, callbacks) => {
        callbacks.onError(testError);
      });

      render(<CompletionFormContainer deadline={mockDeadline} isDNF={false} />);

      fireEvent.press(screen.getByTestId('continue-button'));
      await waitFor(() => screen.getByTestId('review-question-container'));

      fireEvent.press(screen.getByTestId('no-button'));
      await waitFor(() => screen.getByTestId('continue-button'));

      fireEvent.press(screen.getByTestId('continue-button'));

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'error',
          text1: 'Something went wrong',
          text2: 'Network error',
        });
      });
    });

    it('should not navigate on completion error', async () => {
      const testError = new Error('Network error');
      mockCompleteDeadline.mockImplementation((_deadlineId, callbacks) => {
        callbacks.onError(testError);
      });

      render(<CompletionFormContainer deadline={mockDeadline} isDNF={false} />);

      fireEvent.press(screen.getByTestId('continue-button'));
      await waitFor(() => screen.getByTestId('review-question-container'));

      fireEvent.press(screen.getByTestId('no-button'));
      await waitFor(() => screen.getByTestId('continue-button'));

      fireEvent.press(screen.getByTestId('continue-button'));

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalled();
      });

      expect(router.replace).not.toHaveBeenCalled();
    });

    it('should handle DNF error gracefully', async () => {
      const testError = new Error('Database error');
      mockDidNotFinishDeadline.mockImplementation((_deadlineId, callbacks) => {
        callbacks.onError(testError);
      });

      render(<CompletionFormContainer deadline={mockDeadline} isDNF={true} />);

      fireEvent.press(screen.getByTestId('no-button'));
      await waitFor(() => screen.getByTestId('continue-button'));

      fireEvent.press(screen.getByTestId('continue-button'));

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
          })
        );
      });

      expect(router.replace).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle deadline without book title gracefully', async () => {
      const deadlineNoTitle = {
        ...mockDeadline,
        book_title: null,
      } as unknown as ReadingDeadlineWithProgress;

      mockCompleteDeadline.mockImplementation((_deadlineId, callbacks) => {
        callbacks.onSuccess();
      });

      render(
        <CompletionFormContainer deadline={deadlineNoTitle} isDNF={false} />
      );

      fireEvent.press(screen.getByTestId('continue-button'));
      await waitFor(() => screen.getByTestId('review-question-container'));

      fireEvent.press(screen.getByTestId('no-button'));
      await waitFor(() => screen.getByTestId('continue-button'));

      fireEvent.press(screen.getByTestId('continue-button'));

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            text2: expect.stringContaining('marked as complete'),
          })
        );
      });
    });

    it('should handle deadline without progress array', () => {
      const deadlineNoProgress = {
        ...mockDeadline,
        progress: [],
      };

      render(
        <CompletionFormContainer deadline={deadlineNoProgress} isDNF={false} />
      );

      expect(screen.getByTestId('celebration-container')).toBeTruthy();
    });

    it('should handle undefined book_title', () => {
      const deadlineUndefinedTitle = {
        ...mockDeadline,
        book_title: undefined,
      };

      render(
        <CompletionFormContainer
          deadline={deadlineUndefinedTitle as any}
          isDNF={false}
        />
      );

      expect(screen.getByTestId('celebration-container')).toBeTruthy();
    });
  });

  describe('Integration Workflows', () => {
    it('should complete full non-DNF workflow with review tracking', async () => {
      render(<CompletionFormContainer deadline={mockDeadline} isDNF={false} />);

      expect(screen.getByTestId('celebration-container')).toBeTruthy();

      fireEvent.press(screen.getByTestId('continue-button'));
      await waitFor(() => screen.getByTestId('review-question-container'));

      fireEvent.press(screen.getByTestId('yes-button'));
      await waitFor(() => {
        expect(
          screen.getByText("We'll help you track your review progress")
        ).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId('continue-button'));

      await waitFor(() => {
        expect(screen.getByTestId('review-form-container')).toBeTruthy();
        expect(screen.getByText('Complete Mode')).toBeTruthy();
      });
    });

    it('should complete full DNF workflow without review', async () => {
      mockDidNotFinishDeadline.mockImplementation((_deadlineId, callbacks) => {
        callbacks.onSuccess();
      });

      render(<CompletionFormContainer deadline={mockDeadline} isDNF={true} />);

      expect(screen.getByTestId('review-question-container')).toBeTruthy();

      fireEvent.press(screen.getByTestId('no-button'));
      await waitFor(() => screen.getByTestId('continue-button'));

      fireEvent.press(screen.getByTestId('continue-button'));

      await waitFor(() => {
        expect(mockDidNotFinishDeadline).toHaveBeenCalled();
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            text2: expect.stringContaining('DNF'),
          })
        );
      });
    });

    it('should handle full workflow with review tracking for DNF', async () => {
      render(<CompletionFormContainer deadline={mockDeadline} isDNF={true} />);

      expect(screen.getByTestId('review-question-container')).toBeTruthy();

      fireEvent.press(screen.getByTestId('yes-button'));
      await waitFor(() => screen.getByTestId('continue-button'));

      fireEvent.press(screen.getByTestId('continue-button'));

      await waitFor(() => {
        expect(screen.getByTestId('review-form-container')).toBeTruthy();
        expect(screen.getByText('DNF Mode')).toBeTruthy();
      });
    });
  });

  describe('State Management', () => {
    it('should maintain needsReview state across navigation', async () => {
      render(<CompletionFormContainer deadline={mockDeadline} isDNF={false} />);

      fireEvent.press(screen.getByTestId('continue-button'));
      await waitFor(() => screen.getByTestId('review-question-container'));

      fireEvent.press(screen.getByTestId('yes-button'));

      await waitFor(() => {
        expect(
          screen.getByText("We'll help you track your review progress")
        ).toBeTruthy();
      });
    });

    it('should clear needsReview selection when toggling between yes/no', async () => {
      render(<CompletionFormContainer deadline={mockDeadline} isDNF={false} />);

      fireEvent.press(screen.getByTestId('continue-button'));
      await waitFor(() => screen.getByTestId('review-question-container'));

      fireEvent.press(screen.getByTestId('yes-button'));
      await waitFor(() => {
        expect(
          screen.getByText("We'll help you track your review progress")
        ).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId('no-button'));
      await waitFor(() => {
        expect(
          screen.queryByText("We'll help you track your review progress")
        ).toBeNull();
      });
    });

    it('should initialize currentStep to 1 for non-DNF completion', () => {
      render(<CompletionFormContainer deadline={mockDeadline} isDNF={false} />);
      expect(screen.getByTestId('celebration-container')).toBeTruthy();
      expect(screen.queryByTestId('review-question-container')).toBeNull();
    });

    it('should initialize currentStep to 2 for DNF completion', () => {
      render(<CompletionFormContainer deadline={mockDeadline} isDNF={true} />);
      expect(screen.getByTestId('review-question-container')).toBeTruthy();
      expect(screen.queryByTestId('celebration-container')).toBeNull();
    });
  });

  describe('Utility Function Integration', () => {
    it('should use getCompletionStatus utility correctly for non-DNF', async () => {
      mockCompleteDeadline.mockImplementation((_deadlineId, callbacks) => {
        callbacks.onSuccess();
      });

      render(<CompletionFormContainer deadline={mockDeadline} isDNF={false} />);

      fireEvent.press(screen.getByTestId('continue-button'));
      await waitFor(() => screen.getByTestId('review-question-container'));

      fireEvent.press(screen.getByTestId('no-button'));
      await waitFor(() => screen.getByTestId('continue-button'));

      fireEvent.press(screen.getByTestId('continue-button'));

      await waitFor(() => {
        expect(mockCompleteDeadline).toHaveBeenCalled();
        expect(mockDidNotFinishDeadline).not.toHaveBeenCalled();
      });
    });

    it('should use getCompletionStatus utility correctly for DNF', async () => {
      mockDidNotFinishDeadline.mockImplementation((_deadlineId, callbacks) => {
        callbacks.onSuccess();
      });

      render(<CompletionFormContainer deadline={mockDeadline} isDNF={true} />);

      fireEvent.press(screen.getByTestId('no-button'));
      await waitFor(() => screen.getByTestId('continue-button'));

      fireEvent.press(screen.getByTestId('continue-button'));

      await waitFor(() => {
        expect(mockDidNotFinishDeadline).toHaveBeenCalled();
        expect(mockCompleteDeadline).not.toHaveBeenCalled();
      });
    });

    it('should use createCompletionCallbacks utility with correct parameters', async () => {
      mockCompleteDeadline.mockImplementation((params, callbacks) => {
        expect(params.deadlineId).toBe(mockDeadline.id);
        expect(typeof callbacks.onSuccess).toBe('function');
        expect(typeof callbacks.onError).toBe('function');
        callbacks.onSuccess();
      });

      render(<CompletionFormContainer deadline={mockDeadline} isDNF={false} />);

      fireEvent.press(screen.getByTestId('continue-button'));
      await waitFor(() => screen.getByTestId('review-question-container'));

      fireEvent.press(screen.getByTestId('no-button'));
      await waitFor(() => screen.getByTestId('continue-button'));

      fireEvent.press(screen.getByTestId('continue-button'));

      await waitFor(() => {
        expect(mockCompleteDeadline).toHaveBeenCalled();
      });
    });
  });

  describe('Step Visibility Logic', () => {
    it('should use shouldShowCelebration utility correctly', () => {
      const { rerender } = render(
        <CompletionFormContainer deadline={mockDeadline} isDNF={false} />
      );
      expect(screen.getByTestId('celebration-container')).toBeTruthy();

      rerender(
        <CompletionFormContainer deadline={mockDeadline} isDNF={true} />
      );
      expect(screen.queryByTestId('celebration-container')).toBeNull();
    });

    it('should use shouldShowReviewQuestion utility correctly', async () => {
      render(<CompletionFormContainer deadline={mockDeadline} isDNF={false} />);

      expect(screen.queryByTestId('review-question-container')).toBeNull();

      fireEvent.press(screen.getByTestId('continue-button'));

      await waitFor(() => {
        expect(screen.getByTestId('review-question-container')).toBeTruthy();
      });
    });

    it('should use shouldShowReviewForm utility correctly', async () => {
      render(<CompletionFormContainer deadline={mockDeadline} isDNF={false} />);

      fireEvent.press(screen.getByTestId('continue-button'));
      await waitFor(() => screen.getByTestId('review-question-container'));

      expect(screen.queryByTestId('review-form-container')).toBeNull();

      fireEvent.press(screen.getByTestId('yes-button'));
      await waitFor(() => screen.getByTestId('continue-button'));

      fireEvent.press(screen.getByTestId('continue-button'));

      await waitFor(() => {
        expect(screen.getByTestId('review-form-container')).toBeTruthy();
      });
    });
  });
});
