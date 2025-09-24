import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ReadingProgressUpdate from '../ReadingProgressUpdate';
import { useUpdateDeadlineProgress, useDeleteFutureProgress } from '@/hooks/useDeadlines';
import { useDeadlines } from '@/providers/DeadlineProvider';

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

// Mock child components completely to isolate testing
jest.mock('@/components/progress/ProgressBar', () => {
  const React = require('react');
  return function MockProgressBar() {
    return React.createElement('View', { testID: 'progress-bar' });
  };
});

jest.mock('@/components/progress/ProgressHeader', () => {
  const React = require('react');
  return function MockProgressHeader() {
    return React.createElement('View', { testID: 'progress-header' });
  };
});

jest.mock('@/components/progress/ProgressInput', () => {
  const React = require('react');
  return function MockProgressInput() {
    return React.createElement('View', { testID: 'progress-input' });
  };
});

jest.mock('@/components/progress/ProgressStats', () => {
  const React = require('react');
  return function MockProgressStats() {
    return React.createElement('View', { testID: 'progress-stats' });
  };
});

jest.mock('@/components/progress/QuickActionButtons', () => {
  const React = require('react');
  return function MockQuickActionButtons() {
    return React.createElement('View', { testID: 'quick-action-buttons' });
  };
});

// Mock react-hook-form completely
jest.mock('react-hook-form', () => ({
  useForm: jest.fn(() => ({
    control: {},
    handleSubmit: jest.fn(fn => () => fn({ currentProgress: 180 })),
    setValue: jest.fn(),
    getValues: jest.fn(() => ({ currentProgress: 150 })),
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
    (useUpdateDeadlineProgress as jest.Mock).mockReturnValue(mockUpdateMutation);
    (useDeleteFutureProgress as jest.Mock).mockReturnValue(mockDeleteMutation);
    (useDeadlines as jest.Mock).mockReturnValue(mockDeadlineContext);
  });

  describe('Component Structure', () => {
    it('should render all main sub-components', () => {
      render(<ReadingProgressUpdate deadline={mockDeadline} />);

      expect(screen.getByTestId('progress-header')).toBeTruthy();
      expect(screen.getByTestId('progress-input')).toBeTruthy();
      expect(screen.getByTestId('progress-stats')).toBeTruthy();
      expect(screen.getByTestId('progress-bar')).toBeTruthy();
      expect(screen.getByTestId('quick-action-buttons')).toBeTruthy();
    });

    it('should render the update progress button', () => {
      render(<ReadingProgressUpdate deadline={mockDeadline} />);
      expect(screen.getByText('Update Progress')).toBeTruthy();
    });

    it('should render correct label for physical format', () => {
      render(<ReadingProgressUpdate deadline={mockDeadline} />);
      expect(screen.getByText('Quick update pages:')).toBeTruthy();
    });

    it('should render correct label for audio format', () => {
      const audioDeadline = { ...mockDeadline, format: 'audio' as const };
      render(<ReadingProgressUpdate deadline={audioDeadline} />);
      expect(screen.getByText('Quick update time (minutes):')).toBeTruthy();
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
      expect(mockDeadlineContext.getDeadlineCalculations).toHaveBeenCalledWith(mockDeadline);
    });
  });

  describe('Props Handling', () => {
    it('should handle timeSpentReading prop', () => {
      render(<ReadingProgressUpdate deadline={mockDeadline} timeSpentReading={30} />);
      // Component should render without errors
      expect(screen.getByText('Update Progress')).toBeTruthy();
    });

    it('should handle onProgressSubmitted callback prop', () => {
      const onProgressSubmitted = jest.fn();
      render(
        <ReadingProgressUpdate
          deadline={mockDeadline}
          onProgressSubmitted={onProgressSubmitted}
        />
      );
      // Component should render without errors
      expect(screen.getByText('Update Progress')).toBeTruthy();
    });
  });

  describe('Different Formats', () => {
    it('should handle physical format deadline', () => {
      const physicalDeadline = { ...mockDeadline, format: 'physical' as const };
      render(<ReadingProgressUpdate deadline={physicalDeadline} />);
      expect(screen.getByText('Quick update pages:')).toBeTruthy();
    });

    it('should handle eBook format deadline', () => {
      const ebookDeadline = { ...mockDeadline, format: 'eBook' as const };
      render(<ReadingProgressUpdate deadline={ebookDeadline} />);
      expect(screen.getByText('Quick update pages:')).toBeTruthy();
    });

    it('should handle audio format deadline', () => {
      const audioDeadline = { ...mockDeadline, format: 'audio' as const };
      render(<ReadingProgressUpdate deadline={audioDeadline} />);
      expect(screen.getByText('Quick update time (minutes):')).toBeTruthy();
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

      const button = screen.getByText('Update Progress');
      expect(button).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should render without errors when deadline calculations return different urgency levels', () => {
      const testCases = ['good', 'urgent', 'overdue', 'approaching', 'impossible'] as const;

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

        const { unmount } = render(<ReadingProgressUpdate deadline={mockDeadline} />);
        expect(screen.getByText('Update Progress')).toBeTruthy();
        unmount();
      });
    });

    it('should handle empty or undefined deadline gracefully', () => {
      // Test with minimal deadline data
      const minimalDeadline = {
        id: 'test-id',
        format: 'physical',
        book_title: 'Test',
      } as any;

      render(<ReadingProgressUpdate deadline={minimalDeadline} />);
      expect(screen.getByText('Update Progress')).toBeTruthy();
    });
  });
});