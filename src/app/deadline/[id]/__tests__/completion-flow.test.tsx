import { useCompletionFlow } from '@/providers/CompletionFlowProvider';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import Toast from 'react-native-toast-message';
import CompletionFlowPage from '../completion-flow';

jest.mock('@/providers/CompletionFlowProvider');
jest.mock('@/providers/DeadlineProvider');
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn(),
}));
jest.mock('react-native-toast-message');

jest.mock('react-native', () => ({
  StyleSheet: {
    create: jest.fn(styles => styles),
    flatten: jest.fn(styles => styles),
  },
  AppState: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    currentState: 'active',
  },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  Animated: {
    Value: jest.fn(() => ({
      interpolate: jest.fn(),
    })),
    View: 'Animated.View',
    Text: 'Animated.Text',
    timing: jest.fn(() => ({
      start: jest.fn(),
    })),
    spring: jest.fn(() => ({
      start: jest.fn(),
    })),
    sequence: jest.fn(() => ({
      start: jest.fn(),
    })),
    parallel: jest.fn(() => ({
      start: jest.fn(),
    })),
    delay: jest.fn(),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 667 })),
  },
}));

jest.mock('@/components/features/completion/CelebrationScreen', () => {
  const React = require('react');
  return ({
    onContinue,
  }: {
    onContinue: () => void;
  }) =>
    React.createElement('View', { testID: 'celebration-screen' }, [
      React.createElement(
        'View',
        { testID: 'continue-button', onPress: onContinue, key: 'button' },
        null
      ),
    ]);
});

jest.mock('@/components/features/completion/ReviewQuestionScreen', () => {
  const React = require('react');
  return ({ onContinue }: { onContinue: (needsReview: boolean) => void }) =>
    React.createElement('View', { testID: 'review-question-screen' }, [
      React.createElement(
        'View',
        {
          testID: 'needs-review-yes-button',
          onPress: () => onContinue(true),
          key: 'yes',
        },
        null
      ),
      React.createElement(
        'View',
        {
          testID: 'needs-review-no-button',
          onPress: () => onContinue(false),
          key: 'no',
        },
        null
      ),
    ]);
});

const mockUseCompletionFlow = useCompletionFlow as jest.MockedFunction<
  typeof useCompletionFlow
>;
const mockUseDeadlines = useDeadlines as jest.MockedFunction<
  typeof useDeadlines
>;
const mockUseLocalSearchParams = useLocalSearchParams as jest.MockedFunction<
  typeof useLocalSearchParams
>;
const mockRouter = router as jest.Mocked<typeof router>;
const mockToast = Toast as jest.Mocked<typeof Toast>;

describe('CompletionFlowPage - Integration Tests', () => {
  const mockInitializeFlow = jest.fn();
  const mockUpdateStep = jest.fn();
  const mockSetNeedsReview = jest.fn();
  const mockResetFlow = jest.fn();
  const mockCompleteDeadline = jest.fn();
  const mockDidNotFinishDeadline = jest.fn();

  const baseDeadline: ReadingDeadlineWithProgress = {
    id: 'deadline-123',
    book_title: 'Test Book',
    author: 'Test Author',
    book_id: 'book-123',
    format: 'physical',
    total_quantity: 300,
    created_at: '2024-01-01T00:00:00Z',
    deadline_date: '2024-12-31',
    flexibility: 'flexible',
    source: 'NetGalley',
    user_id: 'user-123',
    updated_at: '2024-01-01T00:00:00Z',
    status: [
      {
        id: 'status-1',
        deadline_id: 'deadline-123',
        status: 'reading',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
    progress: [
      {
        id: 'progress-1',
        deadline_id: 'deadline-123',
        current_progress: 250,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        ignore_in_calcs: false,
        time_spent_reading: null,
      },
    ],
  };

  const baseFlowState = {
    currentStep: 'celebration' as const,
    deadlineId: 'deadline-123',
    bookData: {
      title: 'Test Book',
      author: 'Test Author',
      coverUrl: '',
      totalPages: 300,
      currentProgress: 250,
      startDate: '2024-01-01T00:00:00Z',
      source: 'NetGalley',
      bookId: 'book-123',
    },
    isDNF: false,
    needsReview: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseLocalSearchParams.mockReturnValue({ id: 'deadline-123' });

    mockUseCompletionFlow.mockReturnValue({
      flowState: baseFlowState,
      initializeFlow: mockInitializeFlow,
      updateStep: mockUpdateStep,
      setNeedsReview: mockSetNeedsReview,
      resetFlow: mockResetFlow,
    });

    mockUseDeadlines.mockReturnValue({
      deadlines: [baseDeadline],
      completeDeadline: mockCompleteDeadline,
      didNotFinishDeadline: mockDidNotFinishDeadline,
    } as any);
  });

  describe('Initialization', () => {
    it('should initialize flow with isDNF=false when skipToReview is not set', () => {
      mockUseCompletionFlow.mockReturnValue({
        flowState: null,
        initializeFlow: mockInitializeFlow,
        updateStep: mockUpdateStep,
        setNeedsReview: mockSetNeedsReview,
        resetFlow: mockResetFlow,
      });

      render(<CompletionFlowPage />);

      expect(mockInitializeFlow).toHaveBeenCalledWith(baseDeadline, false);
    });

    it('should initialize flow with isDNF=true when skipToReview is true', () => {
      mockUseLocalSearchParams.mockReturnValue({
        id: 'deadline-123',
        skipToReview: 'true',
      });

      mockUseCompletionFlow.mockReturnValue({
        flowState: null,
        initializeFlow: mockInitializeFlow,
        updateStep: mockUpdateStep,
        setNeedsReview: mockSetNeedsReview,
        resetFlow: mockResetFlow,
      });

      render(<CompletionFlowPage />);

      expect(mockInitializeFlow).toHaveBeenCalledWith(baseDeadline, true);
    });

    it('should redirect to home if deadline not found', () => {
      mockUseDeadlines.mockReturnValue({
        deadlines: [],
        completeDeadline: mockCompleteDeadline,
        didNotFinishDeadline: mockDidNotFinishDeadline,
      } as any);

      render(<CompletionFlowPage />);

      expect(mockRouter.replace).toHaveBeenCalledWith('/');
    });

    it('should not render anything if flowState or deadline is null', () => {
      mockUseCompletionFlow.mockReturnValue({
        flowState: null,
        initializeFlow: mockInitializeFlow,
        updateStep: mockUpdateStep,
        setNeedsReview: mockSetNeedsReview,
        resetFlow: mockResetFlow,
      });

      render(<CompletionFlowPage />);

      expect(screen.queryByTestId('celebration-screen')).toBeNull();
      expect(screen.queryByTestId('review-question-screen')).toBeNull();
    });
  });

  describe('Complete Flow - Happy Path', () => {
    it('should complete full flow: celebration → review question → complete', async () => {
      const { rerender } = render(<CompletionFlowPage />);

      expect(screen.getByTestId('celebration-screen')).toBeTruthy();

      fireEvent.press(screen.getByTestId('continue-button'));

      expect(mockUpdateStep).toHaveBeenCalledWith('review_question');

      mockUseCompletionFlow.mockReturnValue({
        flowState: {
          ...baseFlowState,
          currentStep: 'review_question',
        },
        initializeFlow: mockInitializeFlow,
        updateStep: mockUpdateStep,
        setNeedsReview: mockSetNeedsReview,
        resetFlow: mockResetFlow,
      });

      rerender(<CompletionFlowPage />);

      expect(screen.getByTestId('review-question-screen')).toBeTruthy();

      fireEvent.press(screen.getByTestId('needs-review-no-button'));

      expect(mockSetNeedsReview).toHaveBeenCalledWith(false);
      expect(mockCompleteDeadline).toHaveBeenCalledWith(
        'deadline-123',
        expect.any(Function),
        expect.any(Function)
      );

      const successCallback = mockCompleteDeadline.mock.calls[0][1];
      successCallback();

      expect(mockToast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'All done!',
        text2: '"Test Book" marked as complete',
      });
      expect(mockResetFlow).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith('/');
    });

    it('should navigate to review form when user selects "Yes" to review question', async () => {
      mockUseCompletionFlow.mockReturnValue({
        flowState: {
          ...baseFlowState,
          currentStep: 'review_question',
        },
        initializeFlow: mockInitializeFlow,
        updateStep: mockUpdateStep,
        setNeedsReview: mockSetNeedsReview,
        resetFlow: mockResetFlow,
      });

      render(<CompletionFlowPage />);

      expect(screen.getByTestId('review-question-screen')).toBeTruthy();

      fireEvent.press(screen.getByTestId('needs-review-yes-button'));

      expect(mockSetNeedsReview).toHaveBeenCalledWith(true);
      expect(mockRouter.push).toHaveBeenCalledWith(
        '/deadline/deadline-123/review-form'
      );
    });
  });

  describe('DNF Flow', () => {
    it('should start at review_question when initialized with isDNF=true', () => {
      mockUseCompletionFlow.mockReturnValue({
        flowState: {
          ...baseFlowState,
          currentStep: 'review_question',
          isDNF: true,
        },
        initializeFlow: mockInitializeFlow,
        updateStep: mockUpdateStep,
        setNeedsReview: mockSetNeedsReview,
        resetFlow: mockResetFlow,
      });

      render(<CompletionFlowPage />);

      expect(screen.getByTestId('review-question-screen')).toBeTruthy();
      expect(screen.queryByTestId('celebration-screen')).toBeNull();
    });

    it('should complete DNF flow when navigated with skipToReview', async () => {
      mockUseLocalSearchParams.mockReturnValue({
        id: 'deadline-123',
        skipToReview: 'true',
      });

      mockUseCompletionFlow.mockReturnValue({
        flowState: {
          ...baseFlowState,
          currentStep: 'review_question',
          isDNF: true,
        },
        initializeFlow: mockInitializeFlow,
        updateStep: mockUpdateStep,
        setNeedsReview: mockSetNeedsReview,
        resetFlow: mockResetFlow,
      });

      render(<CompletionFlowPage />);

      expect(screen.getByTestId('review-question-screen')).toBeTruthy();

      fireEvent.press(screen.getByTestId('needs-review-no-button'));

      expect(mockDidNotFinishDeadline).toHaveBeenCalledWith(
        'deadline-123',
        expect.any(Function),
        expect.any(Function)
      );

      const successCallback = mockDidNotFinishDeadline.mock.calls[0][1];
      successCallback();

      expect(mockToast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'All done!',
        text2: '"Test Book" moved to DNF',
      });
      expect(mockResetFlow).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith('/');
    });
  });

  describe('Error Handling', () => {
    it('should show error toast when complete deadline fails', async () => {
      mockUseCompletionFlow.mockReturnValue({
        flowState: {
          ...baseFlowState,
          currentStep: 'review_question',
        },
        initializeFlow: mockInitializeFlow,
        updateStep: mockUpdateStep,
        setNeedsReview: mockSetNeedsReview,
        resetFlow: mockResetFlow,
      });

      render(<CompletionFlowPage />);

      fireEvent.press(screen.getByTestId('needs-review-no-button'));

      const errorCallback = mockCompleteDeadline.mock.calls[0][2];
      errorCallback(new Error('Database error'));

      expect(mockToast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Failed to complete deadline',
        text2: 'Database error',
      });
    });

    it('should show error toast when DNF deadline fails', async () => {
      mockUseCompletionFlow.mockReturnValue({
        flowState: {
          ...baseFlowState,
          currentStep: 'review_question',
          isDNF: true,
        },
        initializeFlow: mockInitializeFlow,
        updateStep: mockUpdateStep,
        setNeedsReview: mockSetNeedsReview,
        resetFlow: mockResetFlow,
      });

      render(<CompletionFlowPage />);

      fireEvent.press(screen.getByTestId('needs-review-no-button'));

      const errorCallback = mockDidNotFinishDeadline.mock.calls[0][2];
      errorCallback(new Error('Status update failed'));

      expect(mockToast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Failed to update status',
        text2: 'Status update failed',
      });
    });
  });

  describe('State Management', () => {
    it('should reset flow after successful completion', async () => {
      mockUseCompletionFlow.mockReturnValue({
        flowState: {
          ...baseFlowState,
          currentStep: 'review_question',
        },
        initializeFlow: mockInitializeFlow,
        updateStep: mockUpdateStep,
        setNeedsReview: mockSetNeedsReview,
        resetFlow: mockResetFlow,
      });

      render(<CompletionFlowPage />);

      fireEvent.press(screen.getByTestId('needs-review-no-button'));

      const successCallback = mockCompleteDeadline.mock.calls[0][1];
      successCallback();

      expect(mockResetFlow).toHaveBeenCalled();
    });
  });
});
