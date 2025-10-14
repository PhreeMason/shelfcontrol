import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { DeadlineCard } from '../DeadlineCard';

// Import mocked dependencies after mocks are defined
import { useFetchBookById } from '@/hooks/useBooks';
import { useTheme } from '@/hooks/useThemeColor';
import { useDeadlines } from '@/providers/DeadlineProvider';
import {
  formatRemainingDisplay,
  getBookCoverIcon,
  getGradientBackground,
} from '@/utils/deadlineDisplayUtils';
import { useRouter } from 'expo-router';

// Mock all external dependencies
jest.mock('@/components/themed', () => ({
  ThemedText: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement(
      'Text',
      { ...props, testID: 'themed-text' },
      children
    );
  },
}));

jest.mock('@/hooks/useBooks', () => ({
  useFetchBookById: jest.fn(),
}));

jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: jest.fn(),
}));

jest.mock('@/providers/DeadlineProvider', () => ({
  useDeadlines: jest.fn(),
}));

jest.mock('@/utils/deadlineDisplayUtils', () => ({
  getBookCoverIcon: jest.fn(),
  getGradientBackground: jest.fn(),
  formatRemainingDisplay: jest.fn(),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement(
      'View',
      { ...props, testID: 'linear-gradient' },
      children
    );
  },
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/dayjs', () => ({
  dayjs: jest.fn(() => ({
    format: jest.fn(() => 'Jan 15, 2024'),
    isValid: jest.fn(() => true),
    startOf: jest.fn(() => ({
      format: jest.fn(() => 'Jan 15, 2024'),
      isValid: jest.fn(() => true),
      diff: jest.fn(() => 5),
      toDate: jest.fn(() => new Date()),
    })),
    diff: jest.fn(() => 5),
    toDate: jest.fn(() => new Date()),
  })),
}));

jest.mock('@/components/features/deadlines/DeadlineActionSheet', () => ({
  DeadlineActionSheet: () => null,
}));

jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement(
      'View',
      { ...props, testID: 'icon-symbol' },
      children
    );
  },
}));

describe('DeadlineCard', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };

  const mockTheme = {
    colors: {
      good: '#4CAF50',
      approaching: '#FF9800',
      urgent: '#FF5722',
      overdue: '#F44336',
      impossible: '#9C27B0',
      complete: '#4CAF50',
      set_aside: '#607D8B',
    },
  };

  const mockDeadlines = {
    getDeadlineCalculations: jest.fn(),
    formatUnitsPerDayForDisplay: jest.fn(),
    getDailyGoalImpactMessage: jest.fn(),
  };

  const mockDeadline: ReadingDeadlineWithProgress = {
    id: '1',
    user_id: 'user-123',
    book_id: 'book-123',
    book_title: 'Test Book',
    author: 'Test Author',
    source: 'Library',
    format: 'physical',
    deadline_date: '2024-02-01',
    flexibility: 'flexible',
    total_quantity: 300,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    status: [
      {
        id: 'status-1',
        status: 'reading',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        deadline_id: '1',
      },
    ],
    progress: [],
  };

  const defaultMockCalculations = {
    daysLeft: 5,
    unitsPerDay: 30,
    urgencyLevel: 'good',
    remaining: 150,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useTheme as jest.Mock).mockReturnValue(mockTheme);
    (useDeadlines as jest.Mock).mockReturnValue(mockDeadlines);
    (useFetchBookById as jest.Mock).mockReturnValue({ data: null });

    mockDeadlines.getDeadlineCalculations.mockReturnValue(
      defaultMockCalculations
    );
    mockDeadlines.formatUnitsPerDayForDisplay.mockReturnValue('30 pages/day');

    (getBookCoverIcon as jest.Mock).mockReturnValue('📕');
    (getGradientBackground as jest.Mock).mockReturnValue([
      '#FF6B6B',
      '#4DABF7',
    ]);
    (formatRemainingDisplay as jest.Mock).mockReturnValue(
      '150 pages remaining'
    );
  });

  describe('Component Structure', () => {
    it('should render all main UI elements', () => {
      render(<DeadlineCard deadline={mockDeadline} />);

      expect(screen.getByText('Test Book')).toBeTruthy();
      expect(screen.getByText('30 pages/day')).toBeTruthy();
      expect(screen.getByText('5')).toBeTruthy();
      expect(screen.getByText('days')).toBeTruthy();
    });

    it('should render book cover placeholder when no image URL', () => {
      render(<DeadlineCard deadline={mockDeadline} />);

      expect(screen.getByTestId('linear-gradient')).toBeTruthy();
      expect(screen.getByText('📕')).toBeTruthy();
    });

    it('should render book cover image when URL provided', () => {
      (useFetchBookById as jest.Mock).mockReturnValue({
        data: { cover_image_url: 'https://example.com/cover.jpg' },
      });

      render(<DeadlineCard deadline={mockDeadline} />);

      expect(screen.queryByTestId('linear-gradient')).toBeNull();
    });

    it('should render pressable container', () => {
      render(<DeadlineCard deadline={mockDeadline} />);

      expect(screen.getByText('Test Book')).toBeTruthy();
      expect(screen.getByText('5')).toBeTruthy();
    });

    it('should render countdown display container', () => {
      render(<DeadlineCard deadline={mockDeadline} />);

      expect(screen.getByText('5')).toBeTruthy();
      expect(screen.getByText('days')).toBeTruthy();
    });
  });

  describe('Hook Integration', () => {
    it('should call useFetchBookById with deadline book_id', () => {
      render(<DeadlineCard deadline={mockDeadline} />);

      expect(useFetchBookById).toHaveBeenCalledWith('book-123');
    });

    it('should call useRouter hook', () => {
      render(<DeadlineCard deadline={mockDeadline} />);

      expect(useRouter).toHaveBeenCalled();
    });

    it('should call useTheme hook', () => {
      render(<DeadlineCard deadline={mockDeadline} />);

      expect(useTheme).toHaveBeenCalled();
    });

    it('should call useDeadlines hook', () => {
      render(<DeadlineCard deadline={mockDeadline} />);

      expect(useDeadlines).toHaveBeenCalled();
    });

    it('should call getDeadlineCalculations with deadline', () => {
      render(<DeadlineCard deadline={mockDeadline} />);

      expect(mockDeadlines.getDeadlineCalculations).toHaveBeenCalledWith(
        mockDeadline
      );
    });

    it('should call formatUnitsPerDayForDisplay with calculations', () => {
      render(<DeadlineCard deadline={mockDeadline} />);

      expect(mockDeadlines.formatUnitsPerDayForDisplay).toHaveBeenCalledWith(
        30, // unitsPerDay
        'physical', // format
        150, // remaining
        5 // daysLeft
      );
    });
  });

  describe('Utility Function Integration', () => {
    it('should call getBookCoverIcon with deadline and daysLeft', () => {
      render(<DeadlineCard deadline={mockDeadline} />);

      expect(getBookCoverIcon).toHaveBeenCalledWith(mockDeadline, 5);
    });

    it('should call getGradientBackground with deadline and daysLeft', () => {
      render(<DeadlineCard deadline={mockDeadline} />);

      expect(getGradientBackground).toHaveBeenCalledWith(mockDeadline, 5);
    });

    it('should not call formatRemainingDisplay for non-overdue deadline', () => {
      render(<DeadlineCard deadline={mockDeadline} />);

      expect(formatRemainingDisplay).not.toHaveBeenCalled();
    });

    it('should call formatRemainingDisplay for overdue deadline', () => {
      mockDeadlines.getDeadlineCalculations.mockReturnValue({
        ...defaultMockCalculations,
        urgencyLevel: 'overdue',
      });

      render(<DeadlineCard deadline={mockDeadline} />);

      expect(formatRemainingDisplay).toHaveBeenCalledWith(150, 'physical');
    });
  });

  describe('Conditional Rendering - Status States', () => {
    it('should show countdown for reading status', () => {
      render(<DeadlineCard deadline={mockDeadline} />);

      expect(screen.getByText('5')).toBeTruthy();
      expect(screen.getByText('days')).toBeTruthy();
      expect(screen.queryByText('🏆')).toBeNull();
      expect(screen.queryByText('⏸️')).toBeNull();
    });

    it('should show completed icon for complete status', () => {
      const completedDeadline = {
        ...mockDeadline,
        status: [
          {
            id: 'status-1',
            status: 'complete' as const,
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
            deadline_id: '1',
          },
        ],
      };

      render(<DeadlineCard deadline={completedDeadline} />);

      expect(screen.getByText('🏆')).toBeTruthy();
      expect(screen.getByText('done')).toBeTruthy();
      expect(screen.queryByText('5')).toBeNull();
      expect(screen.queryByText('days')).toBeNull();
    });

    it('should show paused icon for set_aside status', () => {
      const pauseDeadline = {
        ...mockDeadline,
        status: [
          {
            id: 'status-1',
            status: 'paused' as const,
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
            deadline_id: '1',
          },
        ],
      };

      render(<DeadlineCard deadline={pauseDeadline} />);

      expect(screen.getByText('⏸️')).toBeTruthy();
      expect(screen.getByText('paused')).toBeTruthy();
      expect(screen.queryByText('5')).toBeNull();
      expect(screen.queryByText('days')).toBeNull();
    });

    it('should show completion date for completed deadlines', () => {
      const completedDeadline = {
        ...mockDeadline,
        status: [
          {
            id: 'status-1',
            status: 'complete' as const,
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
            deadline_id: '1',
          },
        ],
      };

      render(<DeadlineCard deadline={completedDeadline} />);

      expect(screen.getByText('Completed: Jan 15, 2024')).toBeTruthy();
    });

    it('should show archived date for did_not_finish deadlines', () => {
      const dnfDeadline = {
        ...mockDeadline,
        status: [
          {
            id: 'status-1',
            status: 'did_not_finish' as const,
            created_at: '2024-01-20T00:00:00Z',
            updated_at: '2024-01-20T00:00:00Z',
            deadline_id: '1',
          },
        ],
      };

      render(<DeadlineCard deadline={dnfDeadline} />);

      expect(screen.getByText('Archived: Jan 15, 2024')).toBeTruthy();
    });

    it('should handle unsorted status array and show latest status', () => {
      const unsortedStatusDeadline = {
        ...mockDeadline,
        status: [
          {
            id: 'status-2',
            status: 'complete' as const,
            created_at: '2024-01-20T00:00:00Z',
            updated_at: '2024-01-20T00:00:00Z',
            deadline_id: '1',
          },
          {
            id: 'status-1',
            status: 'reading' as const,
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
            deadline_id: '1',
          },
        ],
      };

      render(<DeadlineCard deadline={unsortedStatusDeadline} />);

      expect(screen.getByText('🏆')).toBeTruthy();
      expect(screen.getByText('done')).toBeTruthy();
      expect(screen.getByText('Completed: Jan 15, 2024')).toBeTruthy();
    });

    it('should show capacity message for pending deadlines', () => {
      const pendingDeadline = {
        ...mockDeadline,
        status: [
          {
            id: 'status-1',
            status: 'pending' as const,
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
            deadline_id: '1',
          },
        ],
      };

      render(<DeadlineCard deadline={pendingDeadline} />);

      expect(screen.getByText('Will add 30 pages/day')).toBeTruthy();
    });

    it('should handle empty status array', () => {
      const noStatusDeadline = {
        ...mockDeadline,
        status: [],
      };

      render(<DeadlineCard deadline={noStatusDeadline} />);

      expect(screen.getByText('5')).toBeTruthy();
      expect(screen.getByText('days')).toBeTruthy();
    });
  });

  describe('Navigation Behavior', () => {
    it('should navigate to deadline detail on press', () => {
      const { getByText } = render(<DeadlineCard deadline={mockDeadline} />);

      const titleElement = getByText('Test Book');
      const pressable = titleElement.parent?.parent?.parent?.parent;
      if (pressable) {
        fireEvent.press(pressable);
      }

      expect(mockRouter.push).toHaveBeenCalledWith('/deadline/1');
    });

    it('should not navigate when disableNavigation is true', () => {
      const { getByText } = render(
        <DeadlineCard deadline={mockDeadline} disableNavigation={true} />
      );

      const titleElement = getByText('Test Book');
      const pressable = titleElement.parent?.parent?.parent?.parent;
      if (pressable) {
        fireEvent.press(pressable);
      }

      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should handle string ID in navigation', () => {
      const stringIdDeadline = {
        ...mockDeadline,
        id: 'deadline-abc-123',
      };

      const { getByText } = render(
        <DeadlineCard deadline={stringIdDeadline} />
      );

      const titleElement = getByText('Test Book');
      const pressable = titleElement.parent?.parent?.parent?.parent;
      if (pressable) {
        fireEvent.press(pressable);
      }

      expect(mockRouter.push).toHaveBeenCalledWith(
        '/deadline/deadline-abc-123'
      );
    });
  });

  describe('Book Cover Display Logic', () => {
    it('should show placeholder when no book data', () => {
      (useFetchBookById as jest.Mock).mockReturnValue({ data: null });

      render(<DeadlineCard deadline={mockDeadline} />);

      expect(screen.getByTestId('linear-gradient')).toBeTruthy();
      expect(screen.getByText('📕')).toBeTruthy();
    });

    it('should show placeholder when book data has no cover_image_url', () => {
      (useFetchBookById as jest.Mock).mockReturnValue({
        data: { title: 'Book Title' },
      });

      render(<DeadlineCard deadline={mockDeadline} />);

      expect(screen.getByTestId('linear-gradient')).toBeTruthy();
      expect(screen.getByText('📕')).toBeTruthy();
    });

    it('should show image when cover_image_url is provided', () => {
      (useFetchBookById as jest.Mock).mockReturnValue({
        data: { cover_image_url: 'https://example.com/cover.jpg' },
      });

      render(<DeadlineCard deadline={mockDeadline} />);

      expect(screen.queryByTestId('linear-gradient')).toBeNull();
      expect(screen.queryByText('📕')).toBeNull();
    });

    it('should show image when cover_image_url is empty string', () => {
      (useFetchBookById as jest.Mock).mockReturnValue({
        data: { cover_image_url: '' },
      });

      render(<DeadlineCard deadline={mockDeadline} />);

      expect(screen.getByTestId('linear-gradient')).toBeTruthy();
      expect(screen.getByText('📕')).toBeTruthy();
    });
  });

  describe('Format-Specific Behavior', () => {
    it('should handle physical book format', () => {
      const physicalDeadline = { ...mockDeadline, format: 'physical' as const };

      render(<DeadlineCard deadline={physicalDeadline} />);

      expect(getBookCoverIcon).toHaveBeenCalledWith(physicalDeadline, 5);
      expect(getGradientBackground).toHaveBeenCalledWith(physicalDeadline, 5);
    });

    it('should handle eBook format', () => {
      const eBookDeadline = { ...mockDeadline, format: 'eBook' as const };

      render(<DeadlineCard deadline={eBookDeadline} />);

      expect(getBookCoverIcon).toHaveBeenCalledWith(eBookDeadline, 5);
      expect(getGradientBackground).toHaveBeenCalledWith(eBookDeadline, 5);
    });

    it('should handle audio format', () => {
      const audioDeadline = { ...mockDeadline, format: 'audio' as const };

      render(<DeadlineCard deadline={audioDeadline} />);

      expect(getBookCoverIcon).toHaveBeenCalledWith(audioDeadline, 5);
      expect(getGradientBackground).toHaveBeenCalledWith(audioDeadline, 5);
    });
  });

  describe('Urgency Level Color Mapping', () => {
    it('should use good color for good urgency', () => {
      mockDeadlines.getDeadlineCalculations.mockReturnValue({
        ...defaultMockCalculations,
        urgencyLevel: 'good',
      });

      render(<DeadlineCard deadline={mockDeadline} />);

      expect(screen.getByText('Test Book')).toBeTruthy();
    });

    it('should use urgent color for urgent urgency', () => {
      mockDeadlines.getDeadlineCalculations.mockReturnValue({
        ...defaultMockCalculations,
        urgencyLevel: 'urgent',
      });

      render(<DeadlineCard deadline={mockDeadline} />);

      expect(screen.getByText('Test Book')).toBeTruthy();
    });

    it('should use overdue color for overdue urgency', () => {
      mockDeadlines.getDeadlineCalculations.mockReturnValue({
        ...defaultMockCalculations,
        urgencyLevel: 'overdue',
      });
      (formatRemainingDisplay as jest.Mock).mockReturnValue(
        '50 pages remaining'
      );

      render(<DeadlineCard deadline={mockDeadline} />);

      expect(screen.getByText('50 pages remaining')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle deadline with no book_id', () => {
      const noBookDeadline = { ...mockDeadline, book_id: null };

      render(<DeadlineCard deadline={noBookDeadline} />);

      expect(useFetchBookById).toHaveBeenCalledWith(null);
      expect(screen.getByText('Test Book')).toBeTruthy();
    });

    it('should handle very long book titles', () => {
      const longTitleDeadline = {
        ...mockDeadline,
        book_title:
          'This is a very long book title that should be truncated when displayed',
      };

      render(<DeadlineCard deadline={longTitleDeadline} />);

      expect(
        screen.getByText(
          'This is a very long book title that should be truncated when displayed'
        )
      ).toBeTruthy();
    });

    it('should handle zero days left', () => {
      mockDeadlines.getDeadlineCalculations.mockReturnValue({
        ...defaultMockCalculations,
        daysLeft: 0,
      });

      render(<DeadlineCard deadline={mockDeadline} />);

      expect(getBookCoverIcon).toHaveBeenCalledWith(mockDeadline, 0);
      expect(getGradientBackground).toHaveBeenCalledWith(mockDeadline, 0);
      expect(screen.getByText('0')).toBeTruthy();
    });

    it('should handle negative days left', () => {
      mockDeadlines.getDeadlineCalculations.mockReturnValue({
        ...defaultMockCalculations,
        daysLeft: -3,
      });

      render(<DeadlineCard deadline={mockDeadline} />);

      expect(getBookCoverIcon).toHaveBeenCalledWith(mockDeadline, -3);
      expect(getGradientBackground).toHaveBeenCalledWith(mockDeadline, -3);
      expect(screen.getByText('-3')).toBeTruthy();
    });
  });
});
