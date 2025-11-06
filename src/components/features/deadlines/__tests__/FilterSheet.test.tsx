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

const mockUseGetAllTags = jest.fn();
const mockUseGetAllDeadlineTags = jest.fn();

jest.mock('@/hooks/useTags', () => ({
  useGetAllTags: () => mockUseGetAllTags(),
  useGetAllDeadlineTags: () => mockUseGetAllDeadlineTags(),
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
      format: 'physical',
      deadline_date: '2024-01-20',
      flexibility: 'flexible',
      total_quantity: 300,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      acquisition_source: null,
      type: 'Library',
      publishers: null,
      status: [],
      progress: [],
    },
    {
      id: '2',
      user_id: 'user-1',
      book_id: 'book-2',
      book_title: 'Book 2',
      author: 'Author 2',
      format: 'eBook',
      deadline_date: '2024-01-15',
      flexibility: 'flexible',
      total_quantity: 250,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      acquisition_source: null,
      type: 'Library',
      publishers: null,
      status: [],
      progress: [],
    },
    {
      id: '3',
      user_id: 'user-1',
      book_id: 'book-3',
      book_title: 'Book 3',
      author: 'Author 3',
      format: 'audio',
      deadline_date: '2024-01-25',
      flexibility: 'flexible',
      total_quantity: 500,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      acquisition_source: null,
      type: 'Amazon',
      publishers: null,
      status: [],
      progress: [],
    },
  ];

  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    deadlines: mockDeadlines,
    selectedFilter: 'active',
    timeRangeFilter: 'all' as 'all',
    onTimeRangeChange: jest.fn(),
    selectedFormats: [] as ('physical' | 'eBook' | 'audio')[],
    onFormatsChange: jest.fn(),
    selectedPageRanges: [] as ('under300' | '300to500' | 'over500')[],
    onPageRangesChange: jest.fn(),
    selectedTypes: [] as string[],
    onTypesChange: jest.fn(),
    selectedTags: [] as string[],
    onTagsChange: jest.fn(),
    excludedStatuses: [] as (
      | 'active'
      | 'pending'
      | 'paused'
      | 'overdue'
      | 'toReview'
      | 'completed'
      | 'didNotFinish'
      | 'all'
    )[],
    onExcludedStatusesChange: jest.fn(),
    sortOrder: 'default' as
      | 'default'
      | 'soonest'
      | 'latest'
      | 'lowestPace'
      | 'highestPace',
    onSortOrderChange: jest.fn(),
    statusCounts: {
      active: 5,
      pending: 3,
      paused: 2,
      overdue: 1,
      toReview: 4,
      completed: 10,
      didNotFinish: 2,
      all: 27,
    },
    availableTypes: ['Library', 'Amazon'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue(mockTheme);
    (isDateThisWeek as jest.Mock).mockReturnValue(false);
    (isDateThisMonth as jest.Mock).mockReturnValue(true);
    mockUseGetAllTags.mockReturnValue({ data: [] });
    mockUseGetAllDeadlineTags.mockReturnValue({ data: [] });
  });

  describe('Component Structure', () => {
    it('should render modal when visible', () => {
      render(<FilterSheet {...defaultProps} />);

      expect(screen.getByText('Filter Active')).toBeTruthy();
    });

    it('should render all filter sections', () => {
      render(<FilterSheet {...defaultProps} />);

      expect(screen.getByText('Due Date')).toBeTruthy();
      expect(screen.getByText('Format')).toBeTruthy();
      expect(screen.getByText('Type')).toBeTruthy();
    });

    it('should render Done button', () => {
      render(<FilterSheet {...defaultProps} />);

      expect(screen.getByText('Done')).toBeTruthy();
    });
  });

  describe('Due Date Filter', () => {
    it('should render all due date options with counts', () => {
      render(<FilterSheet {...defaultProps} />);

      expect(screen.getByText('All Time 3')).toBeTruthy();
      expect(screen.getByText(/This Week/)).toBeTruthy();
      expect(screen.getByText(/This Month/)).toBeTruthy();
    });

    it('should call onTimeRangeChange when due date is selected', () => {
      const onTimeRangeChange = jest.fn();

      render(
        <FilterSheet {...defaultProps} onTimeRangeChange={onTimeRangeChange} />
      );

      fireEvent.press(screen.getByText(/This Week/));

      expect(onTimeRangeChange).toHaveBeenCalledWith('thisWeek');
    });

    it('should calculate due date counts correctly', () => {
      (isDateThisWeek as jest.Mock).mockImplementation((date: string) => {
        return date === '2024-01-15';
      });

      render(<FilterSheet {...defaultProps} />);

      expect(screen.getByText('This Week 1')).toBeTruthy();
    });
  });

  describe('Format Filter', () => {
    it('should render all format options with counts', () => {
      render(<FilterSheet {...defaultProps} />);

      expect(screen.getByText('Physical 1')).toBeTruthy();
      expect(screen.getByText('eBook 1')).toBeTruthy();
      expect(screen.getByText('Audio 1')).toBeTruthy();
    });

    it('should render All button', () => {
      render(<FilterSheet {...defaultProps} />);

      const allButtons = screen.getAllByText('All 3');
      expect(allButtons.length).toBeGreaterThan(0);
    });

    it('should toggle format selection', () => {
      const onFormatsChange = jest.fn();

      render(
        <FilterSheet
          {...defaultProps}
          selectedFormats={['physical', 'eBook', 'audio']}
          onFormatsChange={onFormatsChange}
        />
      );

      fireEvent.press(screen.getByText('Physical 1'));

      expect(onFormatsChange).toHaveBeenCalledWith(['eBook', 'audio']);
    });

    it('should add format when toggling unselected format', () => {
      const onFormatsChange = jest.fn();

      render(
        <FilterSheet
          {...defaultProps}
          selectedFormats={['physical']}
          onFormatsChange={onFormatsChange}
        />
      );

      fireEvent.press(screen.getByText('eBook 1'));

      expect(onFormatsChange).toHaveBeenCalledWith(['physical', 'eBook']);
    });

    it('should set formats to empty array when All is clicked', () => {
      const onFormatsChange = jest.fn();

      render(
        <FilterSheet
          {...defaultProps}
          selectedFormats={['physical']}
          onFormatsChange={onFormatsChange}
        />
      );

      const allButtons = screen.getAllByText('All 3');
      fireEvent.press(allButtons[0]);

      expect(onFormatsChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Type Filter', () => {
    it('should render type options with counts', () => {
      render(<FilterSheet {...defaultProps} />);

      expect(screen.getByText('Library 2')).toBeTruthy();
      expect(screen.getByText('Amazon 1')).toBeTruthy();
    });

    it('should toggle typeselection', () => {
      const onTypesChange = jest.fn();

      render(
        <FilterSheet
          {...defaultProps}
          selectedTypes={['Library']}
          onTypesChange={onTypesChange}
        />
      );

      fireEvent.press(screen.getByText('Library 2'));

      expect(onTypesChange).toHaveBeenCalledWith([]);
    });

    it('should add typewhen toggling unselected source', () => {
      const onTypesChange = jest.fn();

      render(<FilterSheet {...defaultProps} onTypesChange={onTypesChange} />);

      fireEvent.press(screen.getByText('Amazon 1'));

      expect(onTypesChange).toHaveBeenCalledWith(['Amazon']);
    });

    it('should not render typeswith zero count', () => {
      render(
        <FilterSheet
          visible={true}
          onClose={jest.fn()}
          deadlines={mockDeadlines}
          selectedFilter="active"
          timeRangeFilter="all"
          onTimeRangeChange={jest.fn()}
          selectedFormats={[]}
          onFormatsChange={jest.fn()}
          selectedTypes={[]}
          onTypesChange={jest.fn()}
          selectedTags={[]}
          onTagsChange={jest.fn()}
          excludedStatuses={[]}
          onExcludedStatusesChange={jest.fn()}
          sortOrder="default"
          onSortOrderChange={jest.fn()}
          statusCounts={defaultProps.statusCounts}
          availableTypes={['Library', 'Amazon', 'Bookstore']}
          selectedPageRanges={[]}
          onPageRangesChange={jest.fn()}
        />
      );

      expect(screen.queryByText(/Bookstore/)).toBeNull();
    });
  });

  describe('Clear All Filters', () => {
    it('should show Clear All button when filters are active', () => {
      render(<FilterSheet {...defaultProps} timeRangeFilter="thisWeek" />);

      expect(screen.getByText('Clear All')).toBeTruthy();
    });

    it('should not show Clear All button when no filters are active', () => {
      render(<FilterSheet {...defaultProps} />);

      expect(screen.queryByText('Clear All')).toBeNull();
    });

    it('should reset all filters when Clear All is pressed', () => {
      const onTimeRangeChange = jest.fn();
      const onFormatsChange = jest.fn();
      const onPageRangesChange = jest.fn();
      const onTypesChange = jest.fn();

      render(
        <FilterSheet
          {...defaultProps}
          timeRangeFilter="thisWeek"
          onTimeRangeChange={onTimeRangeChange}
          selectedFormats={['physical']}
          onFormatsChange={onFormatsChange}
          onPageRangesChange={onPageRangesChange}
          selectedTypes={['Library']}
          onTypesChange={onTypesChange}
        />
      );

      fireEvent.press(screen.getByText('Clear All'));

      expect(onTimeRangeChange).toHaveBeenCalledWith('all');
      expect(onFormatsChange).toHaveBeenCalledWith([]);
      expect(onPageRangesChange).toHaveBeenCalledWith([]);
      expect(onTypesChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Filtered Count Display', () => {
    it('should display correct filtered deadline count', () => {
      render(<FilterSheet {...defaultProps} />);

      expect(screen.getByText('SHOW 3 DEADLINES')).toBeTruthy();
    });

    it('should update count when filters change', () => {
      render(
        <FilterSheet
          visible={true}
          onClose={jest.fn()}
          deadlines={mockDeadlines}
          selectedFilter="active"
          timeRangeFilter="all"
          onTimeRangeChange={jest.fn()}
          selectedFormats={['physical']}
          onFormatsChange={jest.fn()}
          selectedTypes={[]}
          onTypesChange={jest.fn()}
          selectedTags={[]}
          onTagsChange={jest.fn()}
          excludedStatuses={[]}
          onExcludedStatusesChange={jest.fn()}
          sortOrder="default"
          onSortOrderChange={jest.fn()}
          statusCounts={defaultProps.statusCounts}
          availableTypes={['Library', 'Amazon']}
          selectedPageRanges={[]}
          onPageRangesChange={jest.fn()}
        />
      );

      expect(screen.getByText('SHOW 1 DEADLINES')).toBeTruthy();
    });
  });

  describe('Close Behavior', () => {
    it('should call onClose when Done is pressed', () => {
      const onClose = jest.fn();

      render(<FilterSheet {...defaultProps} onClose={onClose} />);

      fireEvent.press(screen.getByText('Done'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is pressed', () => {
      const onClose = jest.fn();

      render(<FilterSheet {...defaultProps} onClose={onClose} />);

      const backdrop = screen.getByLabelText('Close filter sheet');
      fireEvent.press(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when apply button is pressed', () => {
      const onClose = jest.fn();

      render(<FilterSheet {...defaultProps} onClose={onClose} />);

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
          selectedFilter="active"
          timeRangeFilter="all"
          onTimeRangeChange={jest.fn()}
          selectedFormats={[]}
          onFormatsChange={jest.fn()}
          selectedTypes={[]}
          onTypesChange={jest.fn()}
          selectedTags={[]}
          onTagsChange={jest.fn()}
          excludedStatuses={[]}
          onExcludedStatusesChange={jest.fn()}
          sortOrder="default"
          onSortOrderChange={jest.fn()}
          statusCounts={defaultProps.statusCounts}
          availableTypes={[]}
          selectedPageRanges={[]}
          onPageRangesChange={jest.fn()}
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
          excludedStatuses={[]}
          onExcludedStatusesChange={jest.fn()}
          sortOrder="default"
          onSortOrderChange={jest.fn()}
          statusCounts={defaultProps.statusCounts}
          selectedFilter="active"
          timeRangeFilter="all"
          onTimeRangeChange={jest.fn()}
          selectedFormats={[]}
          onFormatsChange={jest.fn()}
          selectedTypes={[]}
          onTypesChange={jest.fn()}
          selectedTags={[]}
          onTagsChange={jest.fn()}
          availableTypes={[]}
          selectedPageRanges={[]}
          onPageRangesChange={jest.fn()}
        />
      );

      expect(screen.getByText('Type')).toBeTruthy();
    });
  });

  describe('Status Exclusion Filters', () => {
    it('should show excluded status section when selectedFilter is "all"', () => {
      render(<FilterSheet {...defaultProps} selectedFilter="all" />);

      expect(screen.getByText('Exclude Statuses')).toBeTruthy();
    });

    it('should not show excluded status section when selectedFilter is not "all"', () => {
      render(<FilterSheet {...defaultProps} selectedFilter="active" />);

      expect(screen.queryByText('Exclude Statuses')).toBeNull();
    });

    it('should show status counts in exclusion buttons', () => {
      render(<FilterSheet {...defaultProps} selectedFilter="all" />);

      expect(screen.getByText('Active 5')).toBeTruthy();
      expect(screen.getByText('Pending 3')).toBeTruthy();
      expect(screen.getByText('Completed 10')).toBeTruthy();
      expect(screen.getByText('DNF 2')).toBeTruthy();
    });

    it('should call onExcludedStatusesChange when status is toggled', () => {
      const onExcludedStatusesChange = jest.fn();
      render(
        <FilterSheet
          {...defaultProps}
          selectedFilter="all"
          onExcludedStatusesChange={onExcludedStatusesChange}
        />
      );

      fireEvent.press(screen.getByText('Completed 10'));

      expect(onExcludedStatusesChange).toHaveBeenCalledWith(['completed']);
    });

    it('should update filtered count when statuses are excluded', () => {
      render(
        <FilterSheet
          {...defaultProps}
          selectedFilter="all"
          excludedStatuses={['completed']}
          statusCounts={{
            active: 1,
            pending: 0,
            paused: 0,
            overdue: 0,
            toReview: 0,
            completed: 2,
            didNotFinish: 0,
            all: 3,
          }}
        />
      );

      expect(screen.getByText(/SHOW 1 DEADLINES/)).toBeTruthy();
    });

    it('should update filtered count when multiple statuses are excluded', () => {
      render(
        <FilterSheet
          {...defaultProps}
          selectedFilter="all"
          excludedStatuses={['active', 'completed']}
          statusCounts={{
            active: 1,
            pending: 0,
            paused: 0,
            overdue: 0,
            toReview: 0,
            completed: 1,
            didNotFinish: 1,
            all: 3,
          }}
        />
      );

      expect(screen.getByText(/SHOW 1 DEADLINES/)).toBeTruthy();
    });

    it('should not apply status exclusions to count when not on "all" filter', () => {
      render(
        <FilterSheet
          {...defaultProps}
          selectedFilter="active"
          excludedStatuses={['completed']}
        />
      );

      expect(screen.getByText(/SHOW 3 DEADLINES/)).toBeTruthy();
    });
  });

  describe('Sort Order', () => {
    it('should render all sort order options on "all" tab', () => {
      render(<FilterSheet {...defaultProps} selectedFilter="all" />);

      expect(screen.getByText('Default')).toBeTruthy();
      expect(screen.getByText('Soonest First')).toBeTruthy();
      expect(screen.getByText('Latest First')).toBeTruthy();
      expect(screen.getByText('Lowest Pace')).toBeTruthy();
      expect(screen.getByText('Highest Pace')).toBeTruthy();
    });

    it('should render only pace sort options on non-"all" tabs', () => {
      render(<FilterSheet {...defaultProps} selectedFilter="active" />);

      expect(screen.getByText('Default')).toBeTruthy();
      expect(screen.queryByText('Soonest First')).toBeNull();
      expect(screen.queryByText('Latest First')).toBeNull();
      expect(screen.getByText('Lowest Pace')).toBeTruthy();
      expect(screen.getByText('Highest Pace')).toBeTruthy();
    });

    it('should call onSortOrderChange when lowest pace is selected', () => {
      const onSortOrderChange = jest.fn();

      render(
        <FilterSheet {...defaultProps} onSortOrderChange={onSortOrderChange} />
      );

      fireEvent.press(screen.getByText('Lowest Pace'));

      expect(onSortOrderChange).toHaveBeenCalledWith('lowestPace');
    });

    it('should call onSortOrderChange when highest pace is selected', () => {
      const onSortOrderChange = jest.fn();

      render(
        <FilterSheet {...defaultProps} onSortOrderChange={onSortOrderChange} />
      );

      fireEvent.press(screen.getByText('Highest Pace'));

      expect(onSortOrderChange).toHaveBeenCalledWith('highestPace');
    });
  });
});
