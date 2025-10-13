import { useTheme } from '@/hooks/useThemeColor';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { isDateThisMonth, isDateThisWeek } from '@/utils/dateUtils';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { FilterSheet } from '../FilterSheet';

jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: jest.fn(),
}));

jest.mock('@/utils/dateUtils', () => ({
  isDateThisWeek: jest.fn(),
  isDateThisMonth: jest.fn(),
}));

jest.mock('@/components/themed/ThemedButton', () => ({
  ThemedButton: ({ title, onPress, ...props }: any) => {
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');
    return React.createElement(
      TouchableOpacity,
      { ...props, onPress, testID: 'themed-button' },
      React.createElement(Text, null, title)
    );
  },
}));

jest.mock('@/components/themed/ThemedText', () => ({
  ThemedText: ({ children, ...props }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(
      Text,
      { ...props, testID: 'themed-text' },
      children
    );
  },
}));

jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    __esModule: true,
    default: {
      View,
    },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn(value => value),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })),
}));

describe('FilterSheet', () => {
  const mockTheme = {
    colors: {
      surface: '#FFFFFF',
      border: '#E0E0E0',
      darkPink: '#FF1493',
    },
  };

  const mockDeadlines: ReadingDeadlineWithProgress[] = [
    {
      id: '1',
      user_id: 'user-1',
      book_id: 'book-1',
      book_title: 'Book 1',
      author: 'Author 1',
      source: 'Library',
      format: 'physical',
      deadline_date: '2024-01-20',
      flexibility: 'flexible',
      total_quantity: 300,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      status: [],
      progress: [],
    },
    {
      id: '2',
      user_id: 'user-1',
      book_id: 'book-2',
      book_title: 'Book 2',
      author: 'Author 2',
      source: 'Amazon',
      format: 'eBook',
      deadline_date: '2024-01-15',
      flexibility: 'flexible',
      total_quantity: 250,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      status: [],
      progress: [],
    },
    {
      id: '3',
      user_id: 'user-1',
      book_id: 'book-3',
      book_title: 'Book 3',
      author: 'Author 3',
      source: 'Library',
      format: 'audio',
      deadline_date: '2024-01-25',
      flexibility: 'flexible',
      total_quantity: 500,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      status: [],
      progress: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue(mockTheme);
    (isDateThisWeek as jest.Mock).mockReturnValue(false);
    (isDateThisMonth as jest.Mock).mockReturnValue(true);
  });

  describe('Component Structure', () => {
    it('should render modal when visible', () => {
      render(
        <FilterSheet
          visible={true}
          onClose={jest.fn()}
          deadlines={mockDeadlines}
          timeRangeFilter="all"
          onTimeRangeChange={jest.fn()}
          selectedFormats={['physical', 'eBook', 'audio']}
          onFormatsChange={jest.fn()}
          selectedSources={[]}
          onSourcesChange={jest.fn()}
          availableSources={['Library', 'Amazon']}
        />
      );

      expect(screen.getByText('Filters')).toBeTruthy();
    });

    it('should render all filter sections', () => {
      render(
        <FilterSheet
          visible={true}
          onClose={jest.fn()}
          deadlines={mockDeadlines}
          timeRangeFilter="all"
          onTimeRangeChange={jest.fn()}
          selectedFormats={['physical', 'eBook', 'audio']}
          onFormatsChange={jest.fn()}
          selectedSources={[]}
          onSourcesChange={jest.fn()}
          availableSources={['Library', 'Amazon']}
        />
      );

      expect(screen.getByText('Time Range')).toBeTruthy();
      expect(screen.getByText('Format')).toBeTruthy();
      expect(screen.getByText('Source')).toBeTruthy();
    });

    it('should render Done button', () => {
      render(
        <FilterSheet
          visible={true}
          onClose={jest.fn()}
          deadlines={mockDeadlines}
          timeRangeFilter="all"
          onTimeRangeChange={jest.fn()}
          selectedFormats={['physical', 'eBook', 'audio']}
          onFormatsChange={jest.fn()}
          selectedSources={[]}
          onSourcesChange={jest.fn()}
          availableSources={['Library', 'Amazon']}
        />
      );

      expect(screen.getByText('Done')).toBeTruthy();
    });
  });

  describe('Time Range Filter', () => {
    it('should render all time range options with counts', () => {
      render(
        <FilterSheet
          visible={true}
          onClose={jest.fn()}
          deadlines={mockDeadlines}
          timeRangeFilter="all"
          onTimeRangeChange={jest.fn()}
          selectedFormats={['physical', 'eBook', 'audio']}
          onFormatsChange={jest.fn()}
          selectedSources={[]}
          onSourcesChange={jest.fn()}
          availableSources={['Library', 'Amazon']}
        />
      );

      expect(screen.getByText('All Time 3')).toBeTruthy();
      expect(screen.getByText(/This Week/)).toBeTruthy();
      expect(screen.getByText(/This Month/)).toBeTruthy();
    });

    it('should call onTimeRangeChange when time range is selected', () => {
      const onTimeRangeChange = jest.fn();

      render(
        <FilterSheet
          visible={true}
          onClose={jest.fn()}
          deadlines={mockDeadlines}
          timeRangeFilter="all"
          onTimeRangeChange={onTimeRangeChange}
          selectedFormats={['physical', 'eBook', 'audio']}
          onFormatsChange={jest.fn()}
          selectedSources={[]}
          onSourcesChange={jest.fn()}
          availableSources={['Library', 'Amazon']}
        />
      );

      fireEvent.press(screen.getByText(/This Week/));

      expect(onTimeRangeChange).toHaveBeenCalledWith('thisWeek');
    });

    it('should calculate time range counts correctly', () => {
      (isDateThisWeek as jest.Mock).mockImplementation((date: string) => {
        return date === '2024-01-15';
      });

      render(
        <FilterSheet
          visible={true}
          onClose={jest.fn()}
          deadlines={mockDeadlines}
          timeRangeFilter="all"
          onTimeRangeChange={jest.fn()}
          selectedFormats={['physical', 'eBook', 'audio']}
          onFormatsChange={jest.fn()}
          selectedSources={[]}
          onSourcesChange={jest.fn()}
          availableSources={['Library', 'Amazon']}
        />
      );

      expect(screen.getByText('This Week 1')).toBeTruthy();
    });
  });

  describe('Format Filter', () => {
    it('should render all format options with counts', () => {
      render(
        <FilterSheet
          visible={true}
          onClose={jest.fn()}
          deadlines={mockDeadlines}
          timeRangeFilter="all"
          onTimeRangeChange={jest.fn()}
          selectedFormats={['physical', 'eBook', 'audio']}
          onFormatsChange={jest.fn()}
          selectedSources={[]}
          onSourcesChange={jest.fn()}
          availableSources={['Library', 'Amazon']}
        />
      );

      expect(screen.getByText('Physical 1')).toBeTruthy();
      expect(screen.getByText('eBook 1')).toBeTruthy();
      expect(screen.getByText('Audio 1')).toBeTruthy();
    });

    it('should toggle format selection', () => {
      const onFormatsChange = jest.fn();

      render(
        <FilterSheet
          visible={true}
          onClose={jest.fn()}
          deadlines={mockDeadlines}
          timeRangeFilter="all"
          onTimeRangeChange={jest.fn()}
          selectedFormats={['physical', 'eBook', 'audio']}
          onFormatsChange={onFormatsChange}
          selectedSources={[]}
          onSourcesChange={jest.fn()}
          availableSources={['Library', 'Amazon']}
        />
      );

      fireEvent.press(screen.getByText('Physical 1'));

      expect(onFormatsChange).toHaveBeenCalledWith(['eBook', 'audio']);
    });

    it('should add format when toggling unselected format', () => {
      const onFormatsChange = jest.fn();

      render(
        <FilterSheet
          visible={true}
          onClose={jest.fn()}
          deadlines={mockDeadlines}
          timeRangeFilter="all"
          onTimeRangeChange={jest.fn()}
          selectedFormats={['physical']}
          onFormatsChange={onFormatsChange}
          selectedSources={[]}
          onSourcesChange={jest.fn()}
          availableSources={['Library', 'Amazon']}
        />
      );

      fireEvent.press(screen.getByText('eBook 1'));

      expect(onFormatsChange).toHaveBeenCalledWith(['physical', 'eBook']);
    });
  });

  describe('Source Filter', () => {
    it('should render source options with counts', () => {
      render(
        <FilterSheet
          visible={true}
          onClose={jest.fn()}
          deadlines={mockDeadlines}
          timeRangeFilter="all"
          onTimeRangeChange={jest.fn()}
          selectedFormats={['physical', 'eBook', 'audio']}
          onFormatsChange={jest.fn()}
          selectedSources={[]}
          onSourcesChange={jest.fn()}
          availableSources={['Library', 'Amazon']}
        />
      );

      expect(screen.getByText('Library 2')).toBeTruthy();
      expect(screen.getByText('Amazon 1')).toBeTruthy();
    });

    it('should toggle source selection', () => {
      const onSourcesChange = jest.fn();

      render(
        <FilterSheet
          visible={true}
          onClose={jest.fn()}
          deadlines={mockDeadlines}
          timeRangeFilter="all"
          onTimeRangeChange={jest.fn()}
          selectedFormats={['physical', 'eBook', 'audio']}
          onFormatsChange={jest.fn()}
          selectedSources={['Library']}
          onSourcesChange={onSourcesChange}
          availableSources={['Library', 'Amazon']}
        />
      );

      fireEvent.press(screen.getByText('Library 2'));

      expect(onSourcesChange).toHaveBeenCalledWith([]);
    });

    it('should add source when toggling unselected source', () => {
      const onSourcesChange = jest.fn();

      render(
        <FilterSheet
          visible={true}
          onClose={jest.fn()}
          deadlines={mockDeadlines}
          timeRangeFilter="all"
          onTimeRangeChange={jest.fn()}
          selectedFormats={['physical', 'eBook', 'audio']}
          onFormatsChange={jest.fn()}
          selectedSources={[]}
          onSourcesChange={onSourcesChange}
          availableSources={['Library', 'Amazon']}
        />
      );

      fireEvent.press(screen.getByText('Amazon 1'));

      expect(onSourcesChange).toHaveBeenCalledWith(['Amazon']);
    });

    it('should not render sources with zero count', () => {
      render(
        <FilterSheet
          visible={true}
          onClose={jest.fn()}
          deadlines={mockDeadlines}
          timeRangeFilter="all"
          onTimeRangeChange={jest.fn()}
          selectedFormats={['physical', 'eBook', 'audio']}
          onFormatsChange={jest.fn()}
          selectedSources={[]}
          onSourcesChange={jest.fn()}
          availableSources={['Library', 'Amazon', 'Bookstore']}
        />
      );

      expect(screen.queryByText(/Bookstore/)).toBeNull();
    });
  });

  describe('Clear All Filters', () => {
    it('should show Clear All button when filters are active', () => {
      render(
        <FilterSheet
          visible={true}
          onClose={jest.fn()}
          deadlines={mockDeadlines}
          timeRangeFilter="thisWeek"
          onTimeRangeChange={jest.fn()}
          selectedFormats={['physical', 'eBook', 'audio']}
          onFormatsChange={jest.fn()}
          selectedSources={[]}
          onSourcesChange={jest.fn()}
          availableSources={['Library', 'Amazon']}
        />
      );

      expect(screen.getByText('Clear All')).toBeTruthy();
    });

    it('should not show Clear All button when no filters are active', () => {
      render(
        <FilterSheet
          visible={true}
          onClose={jest.fn()}
          deadlines={mockDeadlines}
          timeRangeFilter="all"
          onTimeRangeChange={jest.fn()}
          selectedFormats={['physical', 'eBook', 'audio']}
          onFormatsChange={jest.fn()}
          selectedSources={[]}
          onSourcesChange={jest.fn()}
          availableSources={['Library', 'Amazon']}
        />
      );

      expect(screen.queryByText('Clear All')).toBeNull();
    });

    it('should reset all filters when Clear All is pressed', () => {
      const onTimeRangeChange = jest.fn();
      const onFormatsChange = jest.fn();
      const onSourcesChange = jest.fn();

      render(
        <FilterSheet
          visible={true}
          onClose={jest.fn()}
          deadlines={mockDeadlines}
          timeRangeFilter="thisWeek"
          onTimeRangeChange={onTimeRangeChange}
          selectedFormats={['physical']}
          onFormatsChange={onFormatsChange}
          selectedSources={['Library']}
          onSourcesChange={onSourcesChange}
          availableSources={['Library', 'Amazon']}
        />
      );

      fireEvent.press(screen.getByText('Clear All'));

      expect(onTimeRangeChange).toHaveBeenCalledWith('all');
      expect(onFormatsChange).toHaveBeenCalledWith([
        'physical',
        'eBook',
        'audio',
      ]);
      expect(onSourcesChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Filtered Count Display', () => {
    it('should display correct filtered deadline count', () => {
      render(
        <FilterSheet
          visible={true}
          onClose={jest.fn()}
          deadlines={mockDeadlines}
          timeRangeFilter="all"
          onTimeRangeChange={jest.fn()}
          selectedFormats={['physical', 'eBook', 'audio']}
          onFormatsChange={jest.fn()}
          selectedSources={[]}
          onSourcesChange={jest.fn()}
          availableSources={['Library', 'Amazon']}
        />
      );

      expect(screen.getByText('SHOW 3 DEADLINES')).toBeTruthy();
    });

    it('should update count when filters change', () => {
      render(
        <FilterSheet
          visible={true}
          onClose={jest.fn()}
          deadlines={mockDeadlines}
          timeRangeFilter="all"
          onTimeRangeChange={jest.fn()}
          selectedFormats={['physical']}
          onFormatsChange={jest.fn()}
          selectedSources={[]}
          onSourcesChange={jest.fn()}
          availableSources={['Library', 'Amazon']}
        />
      );

      expect(screen.getByText('SHOW 1 DEADLINES')).toBeTruthy();
    });
  });

  describe('Close Behavior', () => {
    it('should call onClose when Done is pressed', () => {
      const onClose = jest.fn();

      render(
        <FilterSheet
          visible={true}
          onClose={onClose}
          deadlines={mockDeadlines}
          timeRangeFilter="all"
          onTimeRangeChange={jest.fn()}
          selectedFormats={['physical', 'eBook', 'audio']}
          onFormatsChange={jest.fn()}
          selectedSources={[]}
          onSourcesChange={jest.fn()}
          availableSources={['Library', 'Amazon']}
        />
      );

      fireEvent.press(screen.getByText('Done'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is pressed', () => {
      const onClose = jest.fn();

      render(
        <FilterSheet
          visible={true}
          onClose={onClose}
          deadlines={mockDeadlines}
          timeRangeFilter="all"
          onTimeRangeChange={jest.fn()}
          selectedFormats={['physical', 'eBook', 'audio']}
          onFormatsChange={jest.fn()}
          selectedSources={[]}
          onSourcesChange={jest.fn()}
          availableSources={['Library', 'Amazon']}
        />
      );

      const backdrop = screen.getByLabelText('Close filter sheet');
      fireEvent.press(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when apply button is pressed', () => {
      const onClose = jest.fn();

      render(
        <FilterSheet
          visible={true}
          onClose={onClose}
          deadlines={mockDeadlines}
          timeRangeFilter="all"
          onTimeRangeChange={jest.fn()}
          selectedFormats={['physical', 'eBook', 'audio']}
          onFormatsChange={jest.fn()}
          selectedSources={[]}
          onSourcesChange={jest.fn()}
          availableSources={['Library', 'Amazon']}
        />
      );

      fireEvent.press(screen.getByText('SHOW 3 DEADLINES'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty deadlines array', () => {
      render(
        <FilterSheet
          visible={true}
          onClose={jest.fn()}
          deadlines={[]}
          timeRangeFilter="all"
          onTimeRangeChange={jest.fn()}
          selectedFormats={['physical', 'eBook', 'audio']}
          onFormatsChange={jest.fn()}
          selectedSources={[]}
          onSourcesChange={jest.fn()}
          availableSources={[]}
        />
      );

      expect(screen.getByText('SHOW 0 DEADLINES')).toBeTruthy();
    });

    it('should handle empty available sources', () => {
      render(
        <FilterSheet
          visible={true}
          onClose={jest.fn()}
          deadlines={mockDeadlines}
          timeRangeFilter="all"
          onTimeRangeChange={jest.fn()}
          selectedFormats={['physical', 'eBook', 'audio']}
          onFormatsChange={jest.fn()}
          selectedSources={[]}
          onSourcesChange={jest.fn()}
          availableSources={[]}
        />
      );

      expect(screen.getByText('Source')).toBeTruthy();
    });
  });
});
