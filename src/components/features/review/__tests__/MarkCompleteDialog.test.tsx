import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import MarkCompleteDialog from '../MarkCompleteDialog';

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: View,
    },
  };
});

jest.mock('@/components/themed', () => ({
  ThemedButton: ({ title, onPress, testID }: any) => {
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');
    return React.createElement(
      TouchableOpacity,
      { testID, onPress },
      React.createElement(Text, null, title)
    );
  },
  ThemedView: ({ children, style, testID }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { style, testID }, children);
  },
  ThemedText: ({ children, style }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { style }, children);
  },
}));

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#B8A9D9',
      background: '#FFFFFF',
      text: '#000000',
    },
  }),
}));

describe('MarkCompleteDialog', () => {
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

  const mockPlatformsAllPosted = [
    {
      id: 'rp_1',
      platform_name: 'Goodreads',
      posted: true,
      posted_date: '2025-01-20',
      review_url: null,
    },
    {
      id: 'rp_2',
      platform_name: 'Amazon',
      posted: true,
      posted_date: '2025-01-21',
      review_url: 'https://amazon.com/review',
    },
  ];

  const mockPlatformsSomeUnposted = [
    {
      id: 'rp_1',
      platform_name: 'Goodreads',
      posted: true,
      posted_date: '2025-01-20',
      review_url: null,
    },
    {
      id: 'rp_2',
      platform_name: 'Amazon',
      posted: false,
      posted_date: null,
      review_url: null,
    },
  ];

  const createMockDeadline = (
    currentProgress: number,
    totalQuantity: number
  ) => ({
    id: 'dl_123',
    user_id: 'user_1',
    book_id: 'book_1',
    book_title: 'Test Book',
    format: 'physical' as const,
    total_quantity: totalQuantity,
    deadline_date: '2025-02-01',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    progress: [
      {
        id: 'prog_1',
        deadline_id: 'dl_123',
        current_progress: currentProgress,
        ignore_in_calcs: false,
        time_spent_reading: null,
        created_at: '2025-01-20T00:00:00Z',
        updated_at: '2025-01-20T00:00:00Z',
      },
    ],
    status: [
      {
        id: 'st_1',
        deadline_id: 'dl_123',
        status: 'to_review',
        created_at: '2025-01-20T00:00:00Z',
        updated_at: '2025-01-20T00:00:00Z',
      },
    ],
  } as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Completed Book (100% progress)', () => {
    it('should show "All reviews posted!" when all platforms are posted and book is completed', () => {
      const completedDeadline = createMockDeadline(300, 300);

      render(
        <MarkCompleteDialog
          visible={true}
          platforms={mockPlatformsAllPosted}
          deadline={completedDeadline}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('All reviews posted!')).toBeTruthy();
      expect(screen.getByText('Move this book to Completed?')).toBeTruthy();
      expect(screen.getByText('Yes, Complete It →')).toBeTruthy();
    });

    it('should show "Just checking" when some platforms are unposted and book is completed', () => {
      const completedDeadline = createMockDeadline(300, 300);

      render(
        <MarkCompleteDialog
          visible={true}
          platforms={mockPlatformsSomeUnposted}
          deadline={completedDeadline}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Just checking')).toBeTruthy();
      expect(screen.getByText("That's okay, mark complete")).toBeTruthy();
    });

    it('should call onComplete when "Yes, Complete It" is pressed', () => {
      const completedDeadline = createMockDeadline(300, 300);

      render(
        <MarkCompleteDialog
          visible={true}
          platforms={mockPlatformsAllPosted}
          deadline={completedDeadline}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      const completeButton = screen.getByText('Yes, Complete It →');
      fireEvent.press(completeButton);

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('DNF Book (< 100% progress)', () => {
    it('should show "Did Not Finish" when all platforms are posted and book is incomplete', () => {
      const dnfDeadline = createMockDeadline(150, 300);

      render(
        <MarkCompleteDialog
          visible={true}
          platforms={mockPlatformsAllPosted}
          deadline={dnfDeadline}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Did Not Finish')).toBeTruthy();
      expect(screen.getByText('Move this book to DNF?')).toBeTruthy();
      expect(screen.getByText('Yes, Mark as DNF →')).toBeTruthy();
    });

    it('should show "Just checking" when some platforms are unposted and book is incomplete', () => {
      const dnfDeadline = createMockDeadline(150, 300);

      render(
        <MarkCompleteDialog
          visible={true}
          platforms={mockPlatformsSomeUnposted}
          deadline={dnfDeadline}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Just checking')).toBeTruthy();
      expect(screen.getByText("That's okay, mark as DNF")).toBeTruthy();
    });

    it('should call onComplete when "Yes, Mark as DNF" is pressed', () => {
      const dnfDeadline = createMockDeadline(150, 300);

      render(
        <MarkCompleteDialog
          visible={true}
          platforms={mockPlatformsAllPosted}
          deadline={dnfDeadline}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      const dnfButton = screen.getByText('Yes, Mark as DNF →');
      fireEvent.press(dnfButton);

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle 0% progress as DNF', () => {
      const noProgressDeadline = createMockDeadline(0, 300);

      render(
        <MarkCompleteDialog
          visible={true}
          platforms={mockPlatformsAllPosted}
          deadline={noProgressDeadline}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Did Not Finish')).toBeTruthy();
      expect(screen.getByText('Move this book to DNF?')).toBeTruthy();
    });

    it('should handle over 100% progress as completed', () => {
      const overProgressDeadline = createMockDeadline(350, 300);

      render(
        <MarkCompleteDialog
          visible={true}
          platforms={mockPlatformsAllPosted}
          deadline={overProgressDeadline}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('All reviews posted!')).toBeTruthy();
      expect(screen.getByText('Move this book to Completed?')).toBeTruthy();
    });

    it('should call onCancel when "Not Yet" is pressed', () => {
      const completedDeadline = createMockDeadline(300, 300);

      render(
        <MarkCompleteDialog
          visible={true}
          platforms={mockPlatformsAllPosted}
          deadline={completedDeadline}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByText('Not Yet');
      fireEvent.press(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should not render when visible is false', () => {
      const completedDeadline = createMockDeadline(300, 300);

      render(
        <MarkCompleteDialog
          visible={false}
          platforms={mockPlatformsAllPosted}
          deadline={completedDeadline}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText('All reviews posted!')).toBeNull();
    });
  });
});
