import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Stats from '../stats';
import * as deadlineUtils from '@/utils/deadlineUtils';

// Mock the DeadlineProvider
jest.mock('@/providers/DeadlineProvider', () => ({
  useDeadlines: jest.fn(),
}));

const { useDeadlines } = require('@/providers/DeadlineProvider');

// Mock the chart data utils
jest.mock('@/utils/chartDataUtils', () => ({
  getAllUserActivityDays: jest.fn(() => []),
}));

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
jest.mock(
  '@/components/charts/UserReadingLineChart',
  () => 'UserReadingLineChart'
);
jest.mock('@/components/features/profile/CompletedBooksCarousel', () => ({
  CompletedBooksCarousel: 'CompletedBooksCarousel',
}));
jest.mock('react-native-gifted-charts', () => ({
  LineChart: () => null,
  CurveType: { QUADRATIC: 'QUADRATIC' },
}));

describe('Stats Screen', () => {
  const mockFormatPaceForFormat = jest.fn((pace, format) => {
    if (format === 'audio') return `${pace}m/day`;
    return `${pace} pages/day`;
  });

  const mockRefetch = jest.fn();

  const defaultDeadlineData = {
    deadlines: [],
    completedDeadlines: [],
    userPaceData: {
      averagePace: 25,
      isReliable: true,
      readingDaysCount: 10,
    },
    userListeningPaceData: {
      averagePace: 30,
      isReliable: true,
      listeningDaysCount: 8,
    },
    formatPaceForFormat: mockFormatPaceForFormat,
    isLoading: false,
    error: null,
    refetch: mockRefetch,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (deadlineUtils.getCompletedThisMonth as jest.Mock).mockReturnValue(5);
    (deadlineUtils.getOnTrackDeadlines as jest.Mock).mockReturnValue(3);
    (deadlineUtils.getCompletedThisYear as jest.Mock).mockReturnValue(12);
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

      const { queryByText } = render(<Stats />);

      expect(queryByText("This Month's Reading Progress")).toBeNull();
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

      expect(mockRefetch).toHaveBeenCalledTimes(1);
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

    it('should render all main sections', () => {
      const { getByText } = render(<Stats />);

      expect(getByText('Reading Statistics')).toBeTruthy();
      expect(getByText("This Month's Reading Progress")).toBeTruthy();
      expect(getByText('Reading & Listening Pace')).toBeTruthy();
      expect(getByText('How Pace is Calculated')).toBeTruthy();
    });

    it('should display monthly progress stats', () => {
      const { getByText } = render(<Stats />);

      expect(getByText('3')).toBeTruthy(); // onTrackCount
      expect(getByText('5')).toBeTruthy(); // completedCount
      expect(getByText('ON TRACK')).toBeTruthy();
      expect(getByText('COMPLETED')).toBeTruthy();
    });

    it('should display reading pace', () => {
      const { getByText } = render(<Stats />);

      expect(getByText('Reading')).toBeTruthy();
      expect(mockFormatPaceForFormat).toHaveBeenCalledWith(25, 'physical');
    });

    it('should display listening pace', () => {
      const { getByText } = render(<Stats />);

      expect(getByText('Listening')).toBeTruthy();
      expect(mockFormatPaceForFormat).toHaveBeenCalledWith(30, 'audio');
    });

    it('should call deadline utils with correct arguments', () => {
      render(<Stats />);

      expect(deadlineUtils.getCompletedThisMonth).toHaveBeenCalledWith([]);
      expect(deadlineUtils.getOnTrackDeadlines).toHaveBeenCalledWith(
        [],
        defaultDeadlineData.userPaceData,
        defaultDeadlineData.userListeningPaceData
      );
      expect(deadlineUtils.getCompletedThisYear).toHaveBeenCalledWith([]);
    });
  });

  describe('Integration with DeadlineProvider', () => {
    it('should use data from DeadlineProvider', () => {
      const customDeadlines = [{ id: '1', book_title: 'Test Book' }];
      const customCompleted = [{ id: '2', book_title: 'Completed Book' }];

      useDeadlines.mockReturnValue({
        ...defaultDeadlineData,
        deadlines: customDeadlines,
        completedDeadlines: customCompleted,
      });

      render(<Stats />);

      expect(deadlineUtils.getCompletedThisMonth).toHaveBeenCalledWith(
        customCompleted
      );
      expect(deadlineUtils.getOnTrackDeadlines).toHaveBeenCalledWith(
        customDeadlines,
        defaultDeadlineData.userPaceData,
        defaultDeadlineData.userListeningPaceData
      );
    });

    it('should update when provider data changes', () => {
      const { rerender } = render(<Stats />);

      const updatedData = {
        ...defaultDeadlineData,
        userPaceData: {
          averagePace: 50,
          isReliable: true,
          readingDaysCount: 15,
        },
      };

      useDeadlines.mockReturnValue(updatedData);

      rerender(<Stats />);

      expect(mockFormatPaceForFormat).toHaveBeenCalledWith(50, 'physical');
    });
  });

  describe('Calculations', () => {
    it('should calculate completedCount correctly', () => {
      (deadlineUtils.getCompletedThisMonth as jest.Mock).mockReturnValue(7);

      useDeadlines.mockReturnValue(defaultDeadlineData);

      const { getByText } = render(<Stats />);

      expect(getByText('7')).toBeTruthy();
    });

    it('should calculate onTrackCount correctly', () => {
      (deadlineUtils.getOnTrackDeadlines as jest.Mock).mockReturnValue(4);

      useDeadlines.mockReturnValue(defaultDeadlineData);

      const { getByText } = render(<Stats />);

      expect(getByText('4')).toBeTruthy();
    });

    it('should handle zero counts', () => {
      (deadlineUtils.getCompletedThisMonth as jest.Mock).mockReturnValue(0);
      (deadlineUtils.getOnTrackDeadlines as jest.Mock).mockReturnValue(0);

      useDeadlines.mockReturnValue(defaultDeadlineData);

      const { getAllByText } = render(<Stats />);

      const zeros = getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(2);
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
