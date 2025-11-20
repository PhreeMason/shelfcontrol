import { useFetchBookById } from '@/hooks/useBooks';
import { useDeadlineCardState } from '@/hooks/useDeadlineCardState';
import { useReviewTracking } from '@/hooks/useReviewTracking';
import { posthog } from '@/lib/posthog';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  formatCapacityMessage,
  formatRemainingDisplay,
} from '@/utils/deadlineDisplayUtils';
import { act, renderHook } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { useDeadlineCardViewModel } from '../useDeadlineCardViewModel';

jest.mock('@/hooks/useBooks', () => ({
  useFetchBookById: jest.fn(),
}));
jest.mock('@/hooks/useDeadlineCardState', () => ({
  useDeadlineCardState: jest.fn(),
}));
jest.mock('@/hooks/useReviewTracking', () => ({
  useReviewTracking: jest.fn(),
}));
jest.mock('@/providers/DeadlineProvider', () => ({
  useDeadlines: jest.fn(),
}));
jest.mock('@/utils/deadlineDisplayUtils', () => ({
  formatCapacityMessage: jest.fn(),
  formatRemainingDisplay: jest.fn(),
}));
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));
jest.mock('@/lib/posthog', () => ({
  posthog: {
    capture: jest.fn(),
  },
}));
jest.mock('@/lib/dayjs', () => {
  const createMockDayjs = (date?: string): any => {
    const mockInstance: any = {
      format: jest.fn(() => {
        if (!date) return 'Jan 15, 2024';
        if (date === '2024-02-01') return 'Feb 1, 2024';
        if (date === '2024-01-15T00:00:00Z') return 'Jan 15, 2024';
        return 'Jan 15, 2024';
      }),
      diff: jest.fn(() => {
        if (date === '2025-10-25') return 9;
        return 5;
      }),
      isValid: jest.fn(() => true),
      startOf: jest.fn(() => mockInstance),
      local: jest.fn(() => mockInstance),
    };
    return mockInstance;
  };

  const mockDayjs: any = jest.fn((date?: string) => createMockDayjs(date));
  mockDayjs.utc = jest.fn((date?: string) => createMockDayjs(date));

  return {
    dayjs: mockDayjs,
  };
});

describe('useDeadlineCardViewModel', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };

  const mockDeadlines = {
    getDeadlineCalculations: jest.fn(),
    formatUnitsPerDayForDisplay: jest.fn(),
  };

  const mockDeadline: ReadingDeadlineWithProgress = {
    id: '1',
    user_id: 'user-123',
    book_id: 'book-123',
    book_title: 'Test Book',
    author: 'Test Author',
    format: 'physical',
    deadline_date: '2024-02-01',
    flexibility: 'flexible',
    total_quantity: 300,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    acquisition_source: null,
    type: 'Personal',
    publishers: null,
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

  const defaultMockCardState = {
    latestStatus: 'reading',
    latestStatusRecord: null,
    isPending: false,
    isToReview: false,
    isArchived: false,
    isNotReading: false,
    borderColor: '#4CAF50',
    countdownColor: '#4CAF50',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useDeadlines as jest.Mock).mockReturnValue(mockDeadlines);
    (useFetchBookById as jest.Mock).mockReturnValue({ data: null });
    (useDeadlineCardState as jest.Mock).mockReturnValue(defaultMockCardState);
    (useReviewTracking as jest.Mock).mockReturnValue({
      reviewDueDate: null,
      unpostedCount: 0,
      totalPlatformCount: 0,
      isLoading: false,
    });

    mockDeadlines.getDeadlineCalculations.mockReturnValue(
      defaultMockCalculations
    );
    mockDeadlines.formatUnitsPerDayForDisplay.mockReturnValue('30 pages/day');

    (formatCapacityMessage as jest.Mock).mockImplementation(
      (msg: string) => msg
    );
    (formatRemainingDisplay as jest.Mock).mockReturnValue(
      '150 pages remaining'
    );
  });

  describe('Hook Integration', () => {
    it('should call useDeadlines hook', () => {
      renderHook(() => useDeadlineCardViewModel({ deadline: mockDeadline }));

      expect(useDeadlines).toHaveBeenCalled();
    });

    it('should call useRouter hook', () => {
      renderHook(() => useDeadlineCardViewModel({ deadline: mockDeadline }));

      expect(useRouter).toHaveBeenCalled();
    });

    it('should call useFetchBookById with deadline book_id', () => {
      renderHook(() => useDeadlineCardViewModel({ deadline: mockDeadline }));

      expect(useFetchBookById).toHaveBeenCalledWith('book-123');
    });

    it('should call getDeadlineCalculations with deadline', () => {
      renderHook(() => useDeadlineCardViewModel({ deadline: mockDeadline }));

      expect(mockDeadlines.getDeadlineCalculations).toHaveBeenCalledWith(
        mockDeadline
      );
    });

    it('should call useDeadlineCardState with deadline and urgencyLevel', () => {
      renderHook(() => useDeadlineCardViewModel({ deadline: mockDeadline }));

      expect(useDeadlineCardState).toHaveBeenCalledWith(mockDeadline, 'good');
    });

    it('should call formatUnitsPerDayForDisplay with correct params', () => {
      renderHook(() => useDeadlineCardViewModel({ deadline: mockDeadline }));

      expect(mockDeadlines.formatUnitsPerDayForDisplay).toHaveBeenCalledWith(
        30,
        'physical',
        150,
        5
      );
    });

    it('should call formatCapacityMessage with base message and isNotReading', () => {
      renderHook(() => useDeadlineCardViewModel({ deadline: mockDeadline }));

      expect(formatCapacityMessage).toHaveBeenCalledWith('30 pages/day', false);
    });
  });

  describe('Display Data', () => {
    it('should return correct title from deadline', () => {
      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.display.title).toBe('Test Book');
    });

    it('should return formatted capacity message as primaryText for active deadline', () => {
      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.display.primaryText).toBe('30 pages/day');
    });

    it('should return formatted remaining display as primaryText for overdue deadline', () => {
      mockDeadlines.getDeadlineCalculations.mockReturnValue({
        ...defaultMockCalculations,
        urgencyLevel: 'overdue',
      });

      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(formatRemainingDisplay).toHaveBeenCalledWith(150, 'physical');
      expect(result.current.display.primaryText).toBe('150 pages remaining');
    });

    it('should return due date as secondaryText for active deadline', () => {
      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.display.secondaryText).toBe('Due: Feb 1, 2024');
    });

    it('should return completion date as secondaryText for completed deadline', () => {
      (useDeadlineCardState as jest.Mock).mockReturnValue({
        ...defaultMockCardState,
        latestStatus: 'complete',
        isArchived: true,
        latestStatusRecord: {
          created_at: '2024-01-15T00:00:00Z',
        },
      });

      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.display.secondaryText).toBe(
        'Completed: Jan 15, 2024'
      );
    });

    it('should return archived date as secondaryText for did_not_finish deadline', () => {
      (useDeadlineCardState as jest.Mock).mockReturnValue({
        ...defaultMockCardState,
        latestStatus: 'did_not_finish',
        isArchived: true,
        latestStatusRecord: {
          created_at: '2024-01-15T00:00:00Z',
        },
      });

      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.display.secondaryText).toBe(
        'Archived: Jan 15, 2024'
      );
    });

    it('should return N/A when no status record for archived deadline', () => {
      (useDeadlineCardState as jest.Mock).mockReturnValue({
        ...defaultMockCardState,
        latestStatus: 'complete',
        isArchived: true,
        latestStatusRecord: null,
      });

      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.display.secondaryText).toBe('Completed: N/A');
    });

    it('should return undefined coverImageUrl when no book data', () => {
      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.display.coverImageUrl).toBeUndefined();
    });

    it('should return coverImageUrl from book data when available', () => {
      (useFetchBookById as jest.Mock).mockReturnValue({
        data: { cover_image_url: 'https://example.com/cover.jpg' },
      });

      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.display.coverImageUrl).toBe(
        'https://example.com/cover.jpg'
      );
    });
  });

  describe('Styling Data', () => {
    it('should return borderColor from card state', () => {
      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.styling.borderColor).toBe('#4CAF50');
    });

    it('should return countdownColor from card state', () => {
      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.styling.countdownColor).toBe('#4CAF50');
    });

    it('should return styling with cardContainerStyle', () => {
      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.styling.cardContainerStyle).toBeDefined();
      expect(result.current.styling.borderColor).toBeDefined();
      expect(result.current.styling.countdownColor).toBeDefined();
    });

    it('should include shadow in cardContainerStyle when archived', () => {
      (useDeadlineCardState as jest.Mock).mockReturnValue({
        ...defaultMockCardState,
        isArchived: true,
      });

      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.styling.cardContainerStyle).toHaveProperty(
        'borderColor',
        '#4CAF50'
      );
    });

    it('should not include shadow properties in cardContainerStyle when not archived', () => {
      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.styling.cardContainerStyle).toEqual({
        borderColor: '#4CAF50',
      });
    });
  });

  describe('Component Props', () => {
    it('should return correct bookCover props', () => {
      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.componentProps.bookCover).toEqual({
        coverImageUrl: undefined,
        deadline: mockDeadline,
        daysLeft: 5,
      });
    });

    it('should return correct countdown props', () => {
      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.componentProps.countdown).toEqual({
        latestStatus: 'reading',
        daysLeft: 5,
        countdownColor: '#4CAF50',
        borderColor: '#4CAF50',
        unpostedPlatformCount: 0,
      });
    });

    it('should return correct actionSheet props with visible false initially', () => {
      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.componentProps.actionSheet).toEqual({
        deadline: mockDeadline,
        visible: false,
      });
    });

    it('should update actionSheet visible state when setShowActionSheet is called', () => {
      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.componentProps.actionSheet.visible).toBe(false);

      act(() => {
        result.current.state.setShowActionSheet(true);
      });

      expect(result.current.componentProps.actionSheet.visible).toBe(true);
    });
  });

  describe('Event Handlers', () => {
    it('should navigate to deadline detail when onCardPress is called', () => {
      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      result.current.handlers.onCardPress();

      expect(mockRouter.push).toHaveBeenCalledWith('/deadline/1');
    });

    it('should capture posthog event when onCardPress is called', () => {
      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      result.current.handlers.onCardPress();

      expect(posthog.capture).toHaveBeenCalledWith('deadline_card_clicked', {
        deadline_status: 'reading',
        deadline_format: 'physical',
        deadline_title: 'Test Book',
      });
    });

    it('should not navigate when disableNavigation is true', () => {
      const { result } = renderHook(() =>
        useDeadlineCardViewModel({
          deadline: mockDeadline,
          disableNavigation: true,
        })
      );

      result.current.handlers.onCardPress();

      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(posthog.capture).not.toHaveBeenCalled();
    });

    it('should set showActionSheet to true when onMorePress is called', () => {
      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      const mockEvent = {
        stopPropagation: jest.fn(),
      } as any;

      act(() => {
        result.current.handlers.onMorePress(mockEvent);
      });

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(result.current.state.showActionSheet).toBe(true);
    });
  });

  describe('State Management', () => {
    it('should initialize showActionSheet to false', () => {
      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.state.showActionSheet).toBe(false);
    });

    it('should update showActionSheet when setShowActionSheet is called', () => {
      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      act(() => {
        result.current.state.setShowActionSheet(true);
      });

      expect(result.current.state.showActionSheet).toBe(true);

      act(() => {
        result.current.state.setShowActionSheet(false);
      });

      expect(result.current.state.showActionSheet).toBe(false);
    });
  });

  describe('Flags', () => {
    it('should return isArchived false for active deadline', () => {
      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.flags.isArchived).toBe(false);
    });

    it('should return isArchived true for completed deadline', () => {
      (useDeadlineCardState as jest.Mock).mockReturnValue({
        ...defaultMockCardState,
        isArchived: true,
      });

      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.flags.isArchived).toBe(true);
    });
  });

  describe('Different Deadline Formats', () => {
    it('should handle physical book format', () => {
      const physicalDeadline = { ...mockDeadline, format: 'physical' as const };

      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: physicalDeadline })
      );

      expect(mockDeadlines.formatUnitsPerDayForDisplay).toHaveBeenCalledWith(
        30,
        'physical',
        150,
        5
      );
      expect(result.current.componentProps.bookCover.deadline.format).toBe(
        'physical'
      );
    });

    it('should handle eBook format', () => {
      const eBookDeadline = { ...mockDeadline, format: 'eBook' as const };

      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: eBookDeadline })
      );

      expect(mockDeadlines.formatUnitsPerDayForDisplay).toHaveBeenCalledWith(
        30,
        'eBook',
        150,
        5
      );
      expect(result.current.componentProps.bookCover.deadline.format).toBe(
        'eBook'
      );
    });

    it('should handle audio format', () => {
      const audioDeadline = { ...mockDeadline, format: 'audio' as const };

      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: audioDeadline })
      );

      expect(mockDeadlines.formatUnitsPerDayForDisplay).toHaveBeenCalledWith(
        30,
        'audio',
        150,
        5
      );
      expect(result.current.componentProps.bookCover.deadline.format).toBe(
        'audio'
      );
    });
  });

  describe('Different Status States', () => {
    it('should handle pending status', () => {
      (useDeadlineCardState as jest.Mock).mockReturnValue({
        ...defaultMockCardState,
        latestStatus: 'pending',
        isPending: true,
        isNotReading: true,
      });

      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.componentProps.countdown.latestStatus).toBe(
        'pending'
      );
      expect(formatCapacityMessage).toHaveBeenCalledWith('30 pages/day', true);
    });

    it('should handle to_review status', () => {
      (useDeadlineCardState as jest.Mock).mockReturnValue({
        ...defaultMockCardState,
        latestStatus: 'to_review',
        isToReview: true,
        isNotReading: true,
      });

      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.componentProps.countdown.latestStatus).toBe(
        'to_review'
      );
    });

    it('should show review platform progress for to_review status', () => {
      (useDeadlineCardState as jest.Mock).mockReturnValue({
        ...defaultMockCardState,
        latestStatus: 'to_review',
        isToReview: true,
        isNotReading: true,
      });
      (useReviewTracking as jest.Mock).mockReturnValue({
        reviewDueDate: '2025-10-25',
        unpostedCount: 2,
        totalPlatformCount: 4,
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.display.primaryText).toBe('2 of 4 reviews posted');
    });

    it('should show all reviews posted when unpostedCount is 0', () => {
      (useDeadlineCardState as jest.Mock).mockReturnValue({
        ...defaultMockCardState,
        latestStatus: 'to_review',
        isToReview: true,
        isNotReading: true,
      });
      (useReviewTracking as jest.Mock).mockReturnValue({
        reviewDueDate: '2025-10-25',
        unpostedCount: 0,
        totalPlatformCount: 4,
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.display.primaryText).toBe('All reviews posted');
    });

    it('should show no reviews to post when totalPlatformCount is 0', () => {
      (useDeadlineCardState as jest.Mock).mockReturnValue({
        ...defaultMockCardState,
        latestStatus: 'to_review',
        isToReview: true,
        isNotReading: true,
      });
      (useReviewTracking as jest.Mock).mockReturnValue({
        reviewDueDate: '2025-10-25',
        unpostedCount: 0,
        totalPlatformCount: 0,
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.display.primaryText).toBe('No reviews to post');
    });

    it('should handle complete status', () => {
      (useDeadlineCardState as jest.Mock).mockReturnValue({
        ...defaultMockCardState,
        latestStatus: 'complete',
        isArchived: true,
        latestStatusRecord: {
          created_at: '2024-01-15T00:00:00Z',
        },
      });

      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.componentProps.countdown.latestStatus).toBe(
        'complete'
      );
      expect(result.current.flags.isArchived).toBe(true);
    });

    it('should handle did_not_finish status', () => {
      (useDeadlineCardState as jest.Mock).mockReturnValue({
        ...defaultMockCardState,
        latestStatus: 'did_not_finish',
        isArchived: true,
        latestStatusRecord: {
          created_at: '2024-01-15T00:00:00Z',
        },
      });

      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.componentProps.countdown.latestStatus).toBe(
        'did_not_finish'
      );
      expect(result.current.flags.isArchived).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero days left', () => {
      mockDeadlines.getDeadlineCalculations.mockReturnValue({
        ...defaultMockCalculations,
        daysLeft: 0,
      });

      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.componentProps.countdown.daysLeft).toBe(0);
    });

    it('should handle negative days left', () => {
      mockDeadlines.getDeadlineCalculations.mockReturnValue({
        ...defaultMockCalculations,
        daysLeft: -3,
      });

      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: mockDeadline })
      );

      expect(result.current.componentProps.countdown.daysLeft).toBe(-3);
    });

    it('should handle deadline with no book_id', () => {
      const noBookDeadline = { ...mockDeadline, book_id: null };

      renderHook(() =>
        useDeadlineCardViewModel({ deadline: noBookDeadline as any })
      );

      expect(useFetchBookById).toHaveBeenCalledWith(null);
    });

    it('should handle deadline with string ID', () => {
      const stringIdDeadline = {
        ...mockDeadline,
        id: 'deadline-abc-123',
      };

      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: stringIdDeadline })
      );

      result.current.handlers.onCardPress();

      expect(mockRouter.push).toHaveBeenCalledWith(
        '/deadline/deadline-abc-123'
      );
    });

    it('should handle very long book titles', () => {
      const longTitleDeadline = {
        ...mockDeadline,
        book_title:
          'This is a very long book title that should be handled properly',
      };

      const { result } = renderHook(() =>
        useDeadlineCardViewModel({ deadline: longTitleDeadline })
      );

      expect(result.current.display.title).toBe(
        'This is a very long book title that should be handled properly'
      );
    });
  });
});
