import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { DeadlineCard } from '../DeadlineCard';

import { useDeadlineCardViewModel } from '@/hooks/useDeadlineCardViewModel';
import { useTheme } from '@/hooks/useThemeColor';
import {
  getBookCoverIcon,
  getGradientBackground,
} from '@/utils/deadlineDisplayUtils';

jest.mock('@/hooks/useDeadlineCardViewModel', () => ({
  useDeadlineCardViewModel: jest.fn(),
}));

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

jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: jest.fn(),
}));

jest.mock('@/utils/deadlineDisplayUtils', () => ({
  getBookCoverIcon: jest.fn(),
  getGradientBackground: jest.fn(),
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
  const mockTheme = {
    colors: {
      textMuted: '#9CA3AF',
    },
  };

  const createMockViewModel = (overrides = {}) => ({
    display: {
      title: 'Test Book',
      primaryText: '30 pages/day',
      secondaryText: 'Due: Jan 15, 2024',
      coverImageUrl: null,
    },
    styling: {
      borderColor: '#4CAF50',
      countdownColor: '#4CAF50',
      shadowStyle: {},
      cardContainerStyle: { borderColor: '#4CAF50' },
    },
    componentProps: {
      bookCover: {
        coverImageUrl: null,
        deadline: mockDeadline,
        daysLeft: 5,
      },
      countdown: {
        latestStatus: 'reading',
        daysLeft: 5,
        countdownColor: '#4CAF50',
        borderColor: '#4CAF50',
      },
      actionSheet: {
        deadline: mockDeadline,
        visible: false,
      },
    },
    handlers: {
      onCardPress: jest.fn(),
      onMorePress: jest.fn(),
    },
    state: {
      showActionSheet: false,
      setShowActionSheet: jest.fn(),
    },
    flags: {
      isArchived: false,
    },
    ...overrides,
  });

  let mockDeadline: ReadingDeadlineWithProgress;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDeadline = {
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

    (useTheme as jest.Mock).mockReturnValue(mockTheme);
    (useDeadlineCardViewModel as jest.Mock).mockReturnValue(
      createMockViewModel()
    );

    (getBookCoverIcon as jest.Mock).mockReturnValue('📕');
    (getGradientBackground as jest.Mock).mockReturnValue([
      '#FF6B6B',
      '#4DABF7',
    ]);
  });

  describe('Component Structure', () => {
    it('should render title from view model', () => {
      render(<DeadlineCard deadline={mockDeadline} />);

      expect(screen.getByText('Test Book')).toBeTruthy();
    });

    it('should render primary text when not archived', () => {
      render(<DeadlineCard deadline={mockDeadline} />);

      expect(screen.getByText('30 pages/day')).toBeTruthy();
    });

    it('should render secondary text when not archived', () => {
      render(<DeadlineCard deadline={mockDeadline} />);

      expect(screen.getByText('Due: Jan 15, 2024')).toBeTruthy();
    });

    it('should render archived text when archived', () => {
      (useDeadlineCardViewModel as jest.Mock).mockReturnValue(
        createMockViewModel({
          display: {
            title: 'Test Book',
            primaryText: '30 pages/day',
            secondaryText: 'Completed: Jan 15, 2024',
            coverImageUrl: null,
          },
          flags: { isArchived: true },
        })
      );

      render(<DeadlineCard deadline={mockDeadline} />);

      expect(screen.getByText('Completed: Jan 15, 2024')).toBeTruthy();
      expect(screen.queryByText('30 pages/day')).toBeNull();
    });
  });

  describe('View Model Integration', () => {
    it('should call useDeadlineCardViewModel with deadline and disableNavigation', () => {
      render(<DeadlineCard deadline={mockDeadline} disableNavigation={true} />);

      expect(useDeadlineCardViewModel).toHaveBeenCalledWith({
        deadline: mockDeadline,
        disableNavigation: true,
      });
    });

    it('should call useDeadlineCardViewModel with default disableNavigation', () => {
      render(<DeadlineCard deadline={mockDeadline} />);

      expect(useDeadlineCardViewModel).toHaveBeenCalledWith({
        deadline: mockDeadline,
        disableNavigation: false,
      });
    });
  });

  describe('Event Handlers', () => {
    it('should call onCardPress handler when card is pressed', () => {
      const mockOnCardPress = jest.fn();
      (useDeadlineCardViewModel as jest.Mock).mockReturnValue(
        createMockViewModel({
          handlers: {
            onCardPress: mockOnCardPress,
            onMorePress: jest.fn(),
          },
        })
      );

      const { getByText } = render(<DeadlineCard deadline={mockDeadline} />);

      const titleElement = getByText('Test Book');
      const pressable = titleElement.parent?.parent?.parent?.parent;
      if (pressable) {
        fireEvent.press(pressable);
      }

      expect(mockOnCardPress).toHaveBeenCalled();
    });
  });
});
