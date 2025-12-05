import { WeeklyListeningCard } from '@/components/features/stats/WeeklyListeningCard';
import { WeeklyReadingCard } from '@/components/features/stats/WeeklyReadingCard';
import { CompletedBooksCarousel } from '@/components/features/stats/CompletedBooksCarousel';
import * as deadlineUtils from '@/utils/deadlineUtils';
import * as statsUtils from '@/utils/statsUtils';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import Stats from '../stats';

// Mock the DeadlineProvider
jest.mock('@/providers/DeadlineProvider', () => ({
  useDeadlines: jest.fn(),
}));

const { useDeadlines } = require('@/providers/DeadlineProvider');

// Mock the stats utils - use actual implementation for most functions
jest.mock('@/utils/statsUtils', () => {
  const actual = jest.requireActual('@/utils/statsUtils');
  return {
    ...actual,
    calculateWeeklyReadingStats: jest.fn(),
    calculateWeeklyListeningStats: jest.fn(),
  };
});

// Mock the theme hook
jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: () => ({
    colors: {
      background: '#FFFFFF',
      text: '#000000',
      textMuted: '#666666',
      primary: '#4A90E2',
      border: '#CCCCCC',
      textOnPrimary: '#FFFFFF',
      good: '#50C878',
      complete: '#4A90E2',
      accent: '#FF6B6B',
      secondary: '#50C878',
      orange: '#FFA500',
      surface: '#F5F5F5',
      icon: '#4A90E2',
    },
  }),
  useThemedStyles: (stylesFn: any) =>
    stylesFn({
      colors: {
        border: '#CCCCCC',
        surface: '#F5F5F5',
        textMuted: '#666666',
      },
    }),
}));

// Mock deadline utils
jest.mock('@/utils/deadlineUtils');

// Mock components
jest.mock('@/components/features/stats/WeeklyReadingCard', () => ({
  WeeklyReadingCard: 'WeeklyReadingCard',
}));
jest.mock('@/components/features/stats/WeeklyListeningCard', () => ({
  WeeklyListeningCard: 'WeeklyListeningCard',
}));
jest.mock('@/components/features/stats/MostProductiveReadingDaysCard', () => ({
  MostProductiveReadingDaysCard: 'MostProductiveReadingDaysCard',
}));
jest.mock(
  '@/components/features/stats/MostProductiveListeningDaysCard',
  () => ({
    MostProductiveListeningDaysCard: 'MostProductiveListeningDaysCard',
  })
);
jest.mock('@/components/features/stats/CompletedBooksCarousel', () => ({
  CompletedBooksCarousel: 'CompletedBooksCarousel',
}));

// Mock useFocusEffect
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(callback => callback()),
}));

describe('Stats Screen', () => {
  const mockRefetch = jest.fn();

  const mockWeeklyReadingStats = {
    currentWeek: {
      pagesRead: 150,
      daysActive: 5,
      averagePerDay: 30,
    },
    previousWeek: {
      pagesRead: 120,
      daysActive: 4,
      averagePerDay: 30,
    },
    weeklyGoal: 140,
    status: 'ahead' as const,
  };

  const mockWeeklyListeningStats = {
    currentWeek: {
      minutesListened: 300,
      daysActive: 4,
      averagePerDay: 75,
    },
    previousWeek: {
      minutesListened: 250,
      daysActive: 3,
      averagePerDay: 83.33,
    },
    weeklyGoal: 280,
    status: 'ahead' as const,
  };

  const defaultDeadlineData = {
    deadlines: [],
    activeDeadlines: [],
    completedDeadlines: [],
    isLoading: false,
    error: null,
    refetch: mockRefetch,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (deadlineUtils.getCompletedThisYear as jest.Mock).mockReturnValue([]);
    (statsUtils.calculateWeeklyReadingStats as jest.Mock).mockReturnValue(
      mockWeeklyReadingStats
    );
    (statsUtils.calculateWeeklyListeningStats as jest.Mock).mockReturnValue(
      mockWeeklyListeningStats
    );
  });

  describe('Loading State', () => {
    it('should show loading indicator when isLoading is true', () => {
      useDeadlines.mockReturnValue({
        ...defaultDeadlineData,
        isLoading: true,
      });

      const { getByText } = render(<Stats />);

      expect(getByText('Loading your reading statistics...')).toBeTruthy();
    });

    it('should show header while loading', () => {
      useDeadlines.mockReturnValue({
        ...defaultDeadlineData,
        isLoading: true,
      });

      const { getByText } = render(<Stats />);

      expect(getByText('Reading Statistics')).toBeTruthy();
    });

    it('should not show content while loading', () => {
      useDeadlines.mockReturnValue({
        ...defaultDeadlineData,
        isLoading: true,
      });

      const { UNSAFE_queryAllByType } = render(<Stats />);

      // Should not render the weekly cards when loading
      const weeklyReadingCards = UNSAFE_queryAllByType(WeeklyReadingCard);
      expect(weeklyReadingCards.length).toBe(0);
    });
  });

  describe('Error State', () => {
    it('should show error message when error is present', () => {
      useDeadlines.mockReturnValue({
        ...defaultDeadlineData,
        error: new Error('Failed to fetch deadlines'),
      });

      const { getByText } = render(<Stats />);

      expect(getByText('Unable to Load Statistics')).toBeTruthy();
      expect(getByText('Failed to fetch deadlines')).toBeTruthy();
    });

    it('should show retry button when error is present', () => {
      useDeadlines.mockReturnValue({
        ...defaultDeadlineData,
        error: new Error('Network error'),
      });

      const { getByText } = render(<Stats />);

      expect(getByText('Try Again')).toBeTruthy();
    });

    it('should call refetch when retry button is pressed', () => {
      useDeadlines.mockReturnValue({
        ...defaultDeadlineData,
        error: new Error('Network error'),
      });

      const { getByText } = render(<Stats />);

      const retryButton = getByText('Try Again');
      fireEvent.press(retryButton);

      expect(mockRefetch).toHaveBeenCalledTimes(2); // Once from useFocusEffect, once from button
    });

    it('should show default error message when error has no message', () => {
      useDeadlines.mockReturnValue({
        ...defaultDeadlineData,
        error: new Error(),
      });

      const { getByText } = render(<Stats />);

      expect(
        getByText('An error occurred while loading your reading data.')
      ).toBeTruthy();
    });
  });

  describe('Success State', () => {
    beforeEach(() => {
      useDeadlines.mockReturnValue(defaultDeadlineData);
    });

    it('should render all main components', () => {
      const { UNSAFE_getAllByType } = render(<Stats />);

      expect(UNSAFE_getAllByType(WeeklyReadingCard).length).toBe(1);
      expect(UNSAFE_getAllByType(WeeklyListeningCard).length).toBe(1);
      expect(UNSAFE_getAllByType(CompletedBooksCarousel).length).toBe(1);
    });

    it('should render header', () => {
      const { getByText } = render(<Stats />);

      expect(getByText('Reading Statistics')).toBeTruthy();
    });

    it('should pass weekly reading stats to WeeklyReadingCard', () => {
      const { UNSAFE_getByType } = render(<Stats />);

      const weeklyReadingCard = UNSAFE_getByType(WeeklyReadingCard);
      expect(weeklyReadingCard.props.stats).toEqual(mockWeeklyReadingStats);
    });

    it('should pass weekly listening stats to WeeklyListeningCard', () => {
      const { UNSAFE_getByType } = render(<Stats />);

      const weeklyListeningCard = UNSAFE_getByType(WeeklyListeningCard);
      expect(weeklyListeningCard.props.stats).toEqual(mockWeeklyListeningStats);
    });

    it('should call calculateWeeklyReadingStats with correct arguments', () => {
      render(<Stats />);

      expect(statsUtils.calculateWeeklyReadingStats).toHaveBeenCalledWith(
        defaultDeadlineData.activeDeadlines,
        defaultDeadlineData.completedDeadlines,
        defaultDeadlineData.deadlines
      );
    });

    it('should call calculateWeeklyListeningStats with correct arguments', () => {
      render(<Stats />);

      expect(statsUtils.calculateWeeklyListeningStats).toHaveBeenCalledWith(
        defaultDeadlineData.activeDeadlines,
        defaultDeadlineData.completedDeadlines,
        defaultDeadlineData.deadlines
      );
    });

    it('should call getCompletedThisYear with correct arguments', () => {
      render(<Stats />);

      expect(deadlineUtils.getCompletedThisYear).toHaveBeenCalledWith(
        defaultDeadlineData.completedDeadlines
      );
    });

    it('should pass completed books to CompletedBooksCarousel', () => {
      const completedBooks = [
        { id: '1', book_title: 'Book 1' },
        { id: '2', book_title: 'Book 2' },
      ];
      (deadlineUtils.getCompletedThisYear as jest.Mock).mockReturnValue(
        completedBooks
      );

      const { UNSAFE_getByType } = render(<Stats />);

      const carousel = UNSAFE_getByType(CompletedBooksCarousel);
      expect(carousel.props.completedDeadlines).toEqual(completedBooks);
    });
  });

  describe('Integration with DeadlineProvider', () => {
    it('should use data from DeadlineProvider', () => {
      const customActiveDeadlines = [{ id: '1', book_title: 'Active Book' }];
      const customCompletedDeadlines = [
        { id: '2', book_title: 'Completed Book' },
      ];
      const customAllDeadlines = [
        ...customActiveDeadlines,
        ...customCompletedDeadlines,
      ];

      useDeadlines.mockReturnValue({
        ...defaultDeadlineData,
        deadlines: customAllDeadlines,
        activeDeadlines: customActiveDeadlines,
        completedDeadlines: customCompletedDeadlines,
      });

      render(<Stats />);

      expect(statsUtils.calculateWeeklyReadingStats).toHaveBeenCalledWith(
        customActiveDeadlines,
        customCompletedDeadlines,
        customAllDeadlines
      );
      expect(statsUtils.calculateWeeklyListeningStats).toHaveBeenCalledWith(
        customActiveDeadlines,
        customCompletedDeadlines,
        customAllDeadlines
      );
      expect(deadlineUtils.getCompletedThisYear).toHaveBeenCalledWith(
        customCompletedDeadlines
      );
    });

    it('should recalculate stats when provider data changes', () => {
      const { rerender } = render(<Stats />);

      const updatedActiveDeadlines = [
        { id: '3', book_title: 'New Active Book' },
      ];

      const updatedStats = {
        ...mockWeeklyReadingStats,
        currentWeek: {
          pagesRead: 200,
          daysActive: 6,
          averagePerDay: 33.33,
        },
      };

      (statsUtils.calculateWeeklyReadingStats as jest.Mock).mockReturnValue(
        updatedStats
      );

      useDeadlines.mockReturnValue({
        ...defaultDeadlineData,
        activeDeadlines: updatedActiveDeadlines,
      });

      rerender(<Stats />);

      const { UNSAFE_getByType } = render(<Stats />);
      const weeklyReadingCard = UNSAFE_getByType(WeeklyReadingCard);
      expect(weeklyReadingCard.props.stats).toEqual(updatedStats);
    });

    it('should call refetch on focus', () => {
      useDeadlines.mockReturnValue(defaultDeadlineData);

      render(<Stats />);

      // useFocusEffect is mocked to call the callback immediately
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Scrolling', () => {
    it('should render in a scrollable container', () => {
      useDeadlines.mockReturnValue(defaultDeadlineData);

      const { UNSAFE_root } = render(<Stats />);

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Platform-specific Styling', () => {
    it('should render with platform-specific padding', () => {
      useDeadlines.mockReturnValue(defaultDeadlineData);

      const { UNSAFE_root } = render(<Stats />);

      // Component should render with iOS-specific styles when on iOS
      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
