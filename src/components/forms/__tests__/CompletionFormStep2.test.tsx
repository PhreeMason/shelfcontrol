import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react-native';
import CompletionFormStep2 from '../CompletionFormStep2';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { useFetchBookById } from '@/hooks/useBooks';

jest.mock('@/hooks/useBooks', () => ({
  useFetchBookById: jest.fn(),
}));

jest.mock('@/hooks/useTheme', () => ({
  useTheme: jest.fn(() => ({
    colors: {
      background: '#FFFFFF',
      primary: '#000000',
      accent: '#666666',
      text: '#000000',
      textOnPrimary: '#FFFFFF',
      secondary: '#333333',
    },
    typography: {
      headlineMedium: {
        fontSize: 24,
        fontWeight: '600',
      },
    },
  })),
}));

describe('CompletionFormStep2', () => {
  const mockOnContinue = jest.fn();

  const mockDeadline: ReadingDeadlineWithProgress = {
    id: 'test-deadline-id',
    user_id: 'test-user-id',
    book_id: 'test-book-id',
    book_title: 'Test Book Title',
    author: 'Test Author',
    source: 'manual',
    deadline_date: '2024-12-31',
    flexibility: 'flexible',
    format: 'physical',
    total_quantity: 300,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    acquisition_source: null,
    type: "Personal",
    publishers: null,
    progress: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useFetchBookById as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });
  });

  describe('Component Rendering', () => {
    it('should render review question screen with testID', () => {
      render(
        <CompletionFormStep2
          deadline={mockDeadline}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByTestId('review-question-container')).toBeTruthy();
    });

    it('should display the main question text', () => {
      render(
        <CompletionFormStep2
          deadline={mockDeadline}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('Need to post reviews?')).toBeTruthy();
    });

    it('should render yes and no buttons', () => {
      render(
        <CompletionFormStep2
          deadline={mockDeadline}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByTestId('yes-button')).toBeTruthy();
      expect(screen.getByTestId('no-button')).toBeTruthy();
      expect(screen.getByText('Yes, I need to post reviews')).toBeTruthy();
      expect(screen.getByText("No, I'm all done")).toBeTruthy();
    });

    it('should not show continue button initially', () => {
      render(
        <CompletionFormStep2
          deadline={mockDeadline}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.queryByTestId('continue-button')).toBeNull();
    });

    it('should not show help text initially', () => {
      render(
        <CompletionFormStep2
          deadline={mockDeadline}
          onContinue={mockOnContinue}
        />
      );

      expect(
        screen.queryByText("We'll help you track your review progress")
      ).toBeNull();
    });
  });

  describe('Book Cover Display', () => {
    it('should display book cover image when available', () => {
      (useFetchBookById as jest.Mock).mockReturnValue({
        data: {
          id: 'test-book-id',
          title: 'Test Book',
          cover_image_url: 'https://example.com/cover.jpg',
        },
        isLoading: false,
      });

      render(
        <CompletionFormStep2
          deadline={mockDeadline}
          onContinue={mockOnContinue}
        />
      );

      const image = screen.UNSAFE_getByType(require('expo-image').Image);
      expect(image.props.source.uri).toBe('https://example.com/cover.jpg');
    });

    it('should display placeholder emoji when no cover image', () => {
      (useFetchBookById as jest.Mock).mockReturnValue({
        data: {
          id: 'test-book-id',
          title: 'Test Book',
          cover_image_url: null,
        },
        isLoading: false,
      });

      render(
        <CompletionFormStep2
          deadline={mockDeadline}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('📖')).toBeTruthy();
    });

    it('should display placeholder when book data not fetched', () => {
      (useFetchBookById as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
      });

      render(
        <CompletionFormStep2
          deadline={mockDeadline}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('📖')).toBeTruthy();
    });

    it('should call useFetchBookById with correct book_id', () => {
      render(
        <CompletionFormStep2
          deadline={mockDeadline}
          onContinue={mockOnContinue}
        />
      );

      expect(useFetchBookById).toHaveBeenCalledWith('test-book-id');
    });

    it('should handle deadline without book_id', () => {
      const deadlineNoBookId = { ...mockDeadline, book_id: null };

      render(
        <CompletionFormStep2
          deadline={deadlineNoBookId as any}
          onContinue={mockOnContinue}
        />
      );

      expect(useFetchBookById).toHaveBeenCalledWith('');
    });
  });

  describe('Selection Interaction', () => {
    it('should show continue button when yes is selected', async () => {
      render(
        <CompletionFormStep2
          deadline={mockDeadline}
          onContinue={mockOnContinue}
        />
      );

      fireEvent.press(screen.getByTestId('yes-button'));

      await waitFor(() => {
        expect(screen.getByTestId('continue-button')).toBeTruthy();
      });
    });

    it('should show continue button when no is selected', async () => {
      render(
        <CompletionFormStep2
          deadline={mockDeadline}
          onContinue={mockOnContinue}
        />
      );

      fireEvent.press(screen.getByTestId('no-button'));

      await waitFor(() => {
        expect(screen.getByTestId('continue-button')).toBeTruthy();
      });
    });

    it('should show help text when yes is selected', async () => {
      render(
        <CompletionFormStep2
          deadline={mockDeadline}
          onContinue={mockOnContinue}
        />
      );

      fireEvent.press(screen.getByTestId('yes-button'));

      await waitFor(() => {
        expect(
          screen.getByText("We'll help you track your review progress")
        ).toBeTruthy();
      });
    });

    it('should not show help text when no is selected', async () => {
      render(
        <CompletionFormStep2
          deadline={mockDeadline}
          onContinue={mockOnContinue}
        />
      );

      fireEvent.press(screen.getByTestId('no-button'));

      await waitFor(() => {
        expect(screen.getByTestId('continue-button')).toBeTruthy();
      });

      expect(
        screen.queryByText("We'll help you track your review progress")
      ).toBeNull();
    });

    it('should allow toggling from yes to no', async () => {
      render(
        <CompletionFormStep2
          deadline={mockDeadline}
          onContinue={mockOnContinue}
        />
      );

      fireEvent.press(screen.getByTestId('yes-button'));

      await waitFor(() => {
        expect(
          screen.getByText("We'll help you track your review progress")
        ).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId('no-button'));

      await waitFor(() => {
        expect(
          screen.queryByText("We'll help you track your review progress")
        ).toBeNull();
      });
    });

    it('should allow toggling from no to yes', async () => {
      render(
        <CompletionFormStep2
          deadline={mockDeadline}
          onContinue={mockOnContinue}
        />
      );

      fireEvent.press(screen.getByTestId('no-button'));

      await waitFor(() => {
        expect(screen.getByTestId('continue-button')).toBeTruthy();
      });

      expect(
        screen.queryByText("We'll help you track your review progress")
      ).toBeNull();

      fireEvent.press(screen.getByTestId('yes-button'));

      await waitFor(() => {
        expect(
          screen.getByText("We'll help you track your review progress")
        ).toBeTruthy();
      });
    });
  });

  describe('Continue Button Callback', () => {
    it('should call onContinue with true when yes is selected and continue pressed', async () => {
      render(
        <CompletionFormStep2
          deadline={mockDeadline}
          onContinue={mockOnContinue}
        />
      );

      fireEvent.press(screen.getByTestId('yes-button'));

      await waitFor(() => {
        expect(screen.getByTestId('continue-button')).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId('continue-button'));

      expect(mockOnContinue).toHaveBeenCalledWith(true);
      expect(mockOnContinue).toHaveBeenCalledTimes(1);
    });

    it('should call onContinue with false when no is selected and continue pressed', async () => {
      render(
        <CompletionFormStep2
          deadline={mockDeadline}
          onContinue={mockOnContinue}
        />
      );

      fireEvent.press(screen.getByTestId('no-button'));

      await waitFor(() => {
        expect(screen.getByTestId('continue-button')).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId('continue-button'));

      expect(mockOnContinue).toHaveBeenCalledWith(false);
      expect(mockOnContinue).toHaveBeenCalledTimes(1);
    });

    it('should call onContinue with correct value after toggling selection', async () => {
      render(
        <CompletionFormStep2
          deadline={mockDeadline}
          onContinue={mockOnContinue}
        />
      );

      fireEvent.press(screen.getByTestId('yes-button'));

      await waitFor(() => {
        expect(screen.getByTestId('continue-button')).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId('no-button'));

      fireEvent.press(screen.getByTestId('continue-button'));

      expect(mockOnContinue).toHaveBeenCalledWith(false);
    });

    it('should not call onContinue when continue button is not visible', () => {
      render(
        <CompletionFormStep2
          deadline={mockDeadline}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.queryByTestId('continue-button')).toBeNull();
      expect(mockOnContinue).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid clicks on yes button', async () => {
      render(
        <CompletionFormStep2
          deadline={mockDeadline}
          onContinue={mockOnContinue}
        />
      );

      const yesButton = screen.getByTestId('yes-button');
      fireEvent.press(yesButton);
      fireEvent.press(yesButton);
      fireEvent.press(yesButton);

      await waitFor(() => {
        expect(screen.getByTestId('continue-button')).toBeTruthy();
      });

      expect(
        screen.getByText("We'll help you track your review progress")
      ).toBeTruthy();
    });

    it('should handle multiple rapid clicks on no button', async () => {
      render(
        <CompletionFormStep2
          deadline={mockDeadline}
          onContinue={mockOnContinue}
        />
      );

      const noButton = screen.getByTestId('no-button');
      fireEvent.press(noButton);
      fireEvent.press(noButton);
      fireEvent.press(noButton);

      await waitFor(() => {
        expect(screen.getByTestId('continue-button')).toBeTruthy();
      });

      expect(
        screen.queryByText("We'll help you track your review progress")
      ).toBeNull();
    });

    it('should render with minimal deadline data', () => {
      const minimalDeadline = {
        ...mockDeadline,
        book_title: null,
        author: null,
      } as unknown as ReadingDeadlineWithProgress;

      render(
        <CompletionFormStep2
          deadline={minimalDeadline}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByTestId('review-question-container')).toBeTruthy();
      expect(screen.getByText('Need to post reviews?')).toBeTruthy();
    });
  });

  describe('Component Props', () => {
    it('should accept and use deadline prop', () => {
      const customDeadline = {
        ...mockDeadline,
        id: 'custom-id',
        book_id: 'custom-book-id',
      };

      render(
        <CompletionFormStep2
          deadline={customDeadline}
          onContinue={mockOnContinue}
        />
      );

      expect(useFetchBookById).toHaveBeenCalledWith('custom-book-id');
    });

    it('should accept and use onContinue callback prop', async () => {
      const customCallback = jest.fn();

      render(
        <CompletionFormStep2
          deadline={mockDeadline}
          onContinue={customCallback}
        />
      );

      fireEvent.press(screen.getByTestId('yes-button'));

      await waitFor(() => {
        expect(screen.getByTestId('continue-button')).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId('continue-button'));

      expect(customCallback).toHaveBeenCalledWith(true);
      expect(mockOnContinue).not.toHaveBeenCalled();
    });
  });
});
