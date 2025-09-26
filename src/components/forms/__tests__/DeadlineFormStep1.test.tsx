import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react-native';
import { DeadlineFormStep1 } from '../DeadlineFormStep1';
import { useFetchBookData, useSearchBooksList } from '@/hooks/useBooks';
import { useTheme } from '@/hooks/useThemeColor';

// Mock hooks
jest.mock('@/hooks/useBooks', () => ({
  useSearchBooksList: jest.fn(),
  useFetchBookData: jest.fn(),
}));

jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: jest.fn(),
}));

// Mock child components to isolate testing
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

jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: ({ name, ...props }: any) => {
    const React = require('react');
    return React.createElement(
      'Text',
      { ...props, testID: `icon-${name}` },
      name
    );
  },
}));

describe('DeadlineFormStep1', () => {
  const mockColors = {
    primary: '#007AFF',
    surface: '#FFFFFF',
    border: '#E5E5E7',
    text: '#000000',
    textMuted: '#8E8E93',
    danger: '#FF3B30',
  };

  const mockOnBookSelected = jest.fn();
  const mockOnManualEntry = jest.fn();
  const mockSetValue = jest.fn();

  const defaultProps = {
    onBookSelected: mockOnBookSelected,
    onManualEntry: mockOnManualEntry,
    setValue: mockSetValue,
  };

  const mockSearchResults = {
    bookList: [
      {
        api_id: 'book-1',
        title: "Harry Potter and the Sorcerer's Stone",
        cover_image_url: 'https://example.com/cover1.jpg',
        metadata: {
          authors: ['J.K. Rowling'],
        },
      },
      {
        api_id: 'book-2',
        title: 'The Hobbit',
        cover_image_url: null,
        metadata: {
          authors: ['J.R.R. Tolkien'],
        },
      },
    ],
  };

  const mockFullBookData = {
    id: 'db-book-1',
    title: "Harry Potter and the Sorcerer's Stone",
    metadata: {
      authors: ['J.K. Rowling'],
    },
    cover_image_url: 'https://example.com/cover1.jpg',
    total_pages: 309,
    total_duration: null,
    publication_date: '1997-06-26',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useTheme as jest.Mock).mockReturnValue({ colors: mockColors });

    (useSearchBooksList as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    (useFetchBookData as jest.Mock).mockReturnValue({
      data: null,
    });
  });

  describe('Component Structure', () => {
    it('should render main container and description', () => {
      render(<DeadlineFormStep1 {...defaultProps} />);

      expect(screen.getByText(/Let's add a book to track/)).toBeTruthy();
    });

    it('should render search input with placeholder', () => {
      render(<DeadlineFormStep1 {...defaultProps} />);

      expect(
        screen.getByPlaceholderText('Search by title or author...')
      ).toBeTruthy();
    });

    it('should render search icon', () => {
      render(<DeadlineFormStep1 {...defaultProps} />);

      expect(screen.getAllByTestId('icon-magnifyingglass')).toHaveLength(2);
    });

    it('should render manual entry button', () => {
      render(<DeadlineFormStep1 {...defaultProps} />);

      expect(screen.getByText(/Can't find your book/)).toBeTruthy();
    });

    it('should render OR divider', () => {
      render(<DeadlineFormStep1 {...defaultProps} />);

      expect(screen.getByText('OR')).toBeTruthy();
    });
  });

  describe('Hook Integration', () => {
    it('should call useTheme hook', () => {
      render(<DeadlineFormStep1 {...defaultProps} />);

      expect(useTheme).toHaveBeenCalled();
    });

    it('should call useSearchBooksList with empty query initially', () => {
      render(<DeadlineFormStep1 {...defaultProps} />);

      expect(useSearchBooksList).toHaveBeenCalledWith('');
    });

    it('should call useFetchBookData with empty string initially', () => {
      render(<DeadlineFormStep1 {...defaultProps} />);

      expect(useFetchBookData).toHaveBeenCalledWith('');
    });

    it('should call useSearchBooksList with debounced query after typing', async () => {
      jest.useFakeTimers();

      render(<DeadlineFormStep1 {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(
        'Search by title or author...'
      );
      fireEvent.changeText(searchInput, 'Harry Potter');

      // Wait for debounce
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(useSearchBooksList).toHaveBeenLastCalledWith('Harry Potter');
      });

      jest.useRealTimers();
    });
  });

  describe('Search Input Behavior', () => {
    it('should update input value when typing', () => {
      render(<DeadlineFormStep1 {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(
        'Search by title or author...'
      );
      fireEvent.changeText(searchInput, 'Harry Potter');

      expect(searchInput.props.value).toBe('Harry Potter');
    });

    it('should show clear button when input has text', () => {
      render(<DeadlineFormStep1 {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(
        'Search by title or author...'
      );
      fireEvent.changeText(searchInput, 'Harry');

      expect(screen.getByTestId('icon-xmark.circle.fill')).toBeTruthy();
    });

    it('should clear input when clear button is pressed', () => {
      render(<DeadlineFormStep1 {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(
        'Search by title or author...'
      );
      fireEvent.changeText(searchInput, 'Harry');

      const clearButton = screen.getByTestId('icon-xmark.circle.fill');
      fireEvent.press(clearButton);

      expect(searchInput.props.value).toBe('');
    });

    it('should not show clear button when input is empty', () => {
      render(<DeadlineFormStep1 {...defaultProps} />);

      expect(screen.queryByTestId('icon-xmark.circle.fill')).toBeNull();
    });
  });

  describe('Search States', () => {
    it('should show loading state when searching', () => {
      (useSearchBooksList as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(<DeadlineFormStep1 {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(
        'Search by title or author...'
      );
      fireEvent.changeText(searchInput, 'Harry Potter');

      expect(screen.getByText('Searching books...')).toBeTruthy();
    });

    it('should show error state when search fails', () => {
      (useSearchBooksList as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Search failed'),
      });

      render(<DeadlineFormStep1 {...defaultProps} />);

      expect(
        screen.getByText('Failed to search books. Please try again.')
      ).toBeTruthy();
    });

    it('should show no results message when no books found', () => {
      (useSearchBooksList as jest.Mock).mockReturnValue({
        data: { bookList: [] },
        isLoading: false,
        error: null,
      });

      render(<DeadlineFormStep1 {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(
        'Search by title or author...'
      );
      fireEvent.changeText(searchInput, 'NonexistentBook');

      expect(
        screen.getByText(/No books found for "NonexistentBook"/)
      ).toBeTruthy();
      expect(
        screen.getByText('Try a different search or add manually')
      ).toBeTruthy();
    });

    it('should show search prompt when input is empty', () => {
      render(<DeadlineFormStep1 {...defaultProps} />);

      expect(screen.getByText('Search for a book to get started')).toBeTruthy();
      expect(
        screen.getByText("We'll grab the page count and details for you")
      ).toBeTruthy();
    });

    it('should not show loading for queries 2 characters or less', () => {
      (useSearchBooksList as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(<DeadlineFormStep1 {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(
        'Search by title or author...'
      );
      fireEvent.changeText(searchInput, 'ab');

      expect(screen.queryByText('Searching books...')).toBeNull();
    });
  });

  describe('Search Results Display', () => {
    it('should display search results when available', () => {
      (useSearchBooksList as jest.Mock).mockReturnValue({
        data: mockSearchResults,
        isLoading: false,
        error: null,
      });

      render(<DeadlineFormStep1 {...defaultProps} />);

      expect(
        screen.getByText("Harry Potter and the Sorcerer's Stone")
      ).toBeTruthy();
      expect(screen.getByText('The Hobbit')).toBeTruthy();
      expect(screen.getByText('by J.K. Rowling')).toBeTruthy();
      expect(screen.getByText('by J.R.R. Tolkien')).toBeTruthy();
    });

    it('should handle books without cover images', () => {
      (useSearchBooksList as jest.Mock).mockReturnValue({
        data: mockSearchResults,
        isLoading: false,
        error: null,
      });

      render(<DeadlineFormStep1 {...defaultProps} />);

      expect(screen.getAllByTestId('icon-book')).toHaveLength(1);
    });

    it('should not show authors section when authors array is empty', () => {
      const resultsWithoutAuthors = {
        bookList: [
          {
            api_id: 'book-3',
            title: 'Book Without Author',
            cover_image_url: null,
            metadata: {
              authors: [],
            },
          },
        ],
      };

      (useSearchBooksList as jest.Mock).mockReturnValue({
        data: resultsWithoutAuthors,
        isLoading: false,
        error: null,
      });

      render(<DeadlineFormStep1 {...defaultProps} />);

      expect(screen.getByText('Book Without Author')).toBeTruthy();
      expect(screen.queryByText(/^by /)).toBeNull();
    });

    it('should show chevron icons for all result items', () => {
      (useSearchBooksList as jest.Mock).mockReturnValue({
        data: mockSearchResults,
        isLoading: false,
        error: null,
      });

      render(<DeadlineFormStep1 {...defaultProps} />);

      expect(screen.getAllByTestId('icon-chevron.right')).toHaveLength(2);
    });
  });

  describe('Book Selection', () => {
    it('should handle book selection when book has valid api_id', () => {
      (useSearchBooksList as jest.Mock).mockReturnValue({
        data: mockSearchResults,
        isLoading: false,
        error: null,
      });

      render(<DeadlineFormStep1 {...defaultProps} />);

      const firstBookButton = screen.getByText(
        "Harry Potter and the Sorcerer's Stone"
      );
      fireEvent.press(firstBookButton);

      expect(useFetchBookData).toHaveBeenCalledWith('book-1');
    });

    it('should not handle book selection when book has no api_id', () => {
      const resultsWithoutApiId = {
        bookList: [
          {
            api_id: null,
            title: 'Book Without API ID',
            cover_image_url: null,
            metadata: { authors: ['Test Author'] },
          },
        ],
      };

      (useSearchBooksList as jest.Mock).mockReturnValue({
        data: resultsWithoutApiId,
        isLoading: false,
        error: null,
      });

      render(<DeadlineFormStep1 {...defaultProps} />);

      const bookButton = screen.getByText('Book Without API ID');
      fireEvent.press(bookButton);

      // Should still call useFetchBookData with empty string (initial state)
      expect(useFetchBookData).toHaveBeenCalledWith('');
    });
  });

  describe('Book Details Loading', () => {
    it('should show loading overlay when fetching book details', () => {
      render(<DeadlineFormStep1 {...defaultProps} />);

      (useSearchBooksList as jest.Mock).mockReturnValue({
        data: mockSearchResults,
        isLoading: false,
        error: null,
      });

      const { rerender } = render(<DeadlineFormStep1 {...defaultProps} />);

      const firstBookButton = screen.getByText(
        "Harry Potter and the Sorcerer's Stone"
      );
      fireEvent.press(firstBookButton);

      rerender(<DeadlineFormStep1 {...defaultProps} />);

      expect(screen.getByText('Loading book details...')).toBeTruthy();
    });

    it('should show loading state correctly after book selection', () => {
      (useSearchBooksList as jest.Mock).mockReturnValue({
        data: mockSearchResults,
        isLoading: false,
        error: null,
      });

      const { rerender } = render(<DeadlineFormStep1 {...defaultProps} />);

      const firstBookButton = screen.getByText(
        "Harry Potter and the Sorcerer's Stone"
      );
      fireEvent.press(firstBookButton);

      rerender(<DeadlineFormStep1 {...defaultProps} />);

      // After clicking, should show loading overlay instead of search results
      expect(screen.getByText('Loading book details...')).toBeTruthy();
    });
  });

  describe('Manual Entry', () => {
    it('should call onManualEntry when manual entry button is pressed', () => {
      render(<DeadlineFormStep1 {...defaultProps} />);

      const manualEntryButton = screen.getByText(/Can't find your book/);
      fireEvent.press(manualEntryButton);

      expect(mockOnManualEntry).toHaveBeenCalled();
    });

    it('should show pencil icon on manual entry button', () => {
      render(<DeadlineFormStep1 {...defaultProps} />);

      expect(screen.getByTestId('icon-pencil')).toBeTruthy();
    });
  });

  describe('Props Handling', () => {
    it('should call setValue with correct book data when book is selected', () => {
      (useFetchBookData as jest.Mock).mockReturnValue({
        data: mockFullBookData,
      });

      const { rerender } = render(<DeadlineFormStep1 {...defaultProps} />);

      (useSearchBooksList as jest.Mock).mockReturnValue({
        data: mockSearchResults,
        isLoading: false,
        error: null,
      });

      rerender(<DeadlineFormStep1 {...defaultProps} />);

      const firstBookButton = screen.getByText(
        "Harry Potter and the Sorcerer's Stone"
      );
      fireEvent.press(firstBookButton);

      rerender(<DeadlineFormStep1 {...defaultProps} />);

      expect(mockSetValue).toHaveBeenCalledWith(
        'bookTitle',
        "Harry Potter and the Sorcerer's Stone"
      );
      expect(mockSetValue).toHaveBeenCalledWith('bookAuthor', 'J.K. Rowling');
      expect(mockSetValue).toHaveBeenCalledWith('book_id', 'db-book-1');
      expect(mockSetValue).toHaveBeenCalledWith('api_id', 'book-1');
      expect(mockSetValue).toHaveBeenCalledWith('totalQuantity', 309);
    });

    it('should call onBookSelected with correct book data', () => {
      (useFetchBookData as jest.Mock).mockReturnValue({
        data: mockFullBookData,
      });

      const { rerender } = render(<DeadlineFormStep1 {...defaultProps} />);

      (useSearchBooksList as jest.Mock).mockReturnValue({
        data: mockSearchResults,
        isLoading: false,
        error: null,
      });

      rerender(<DeadlineFormStep1 {...defaultProps} />);

      const firstBookButton = screen.getByText(
        "Harry Potter and the Sorcerer's Stone"
      );
      fireEvent.press(firstBookButton);

      rerender(<DeadlineFormStep1 {...defaultProps} />);

      expect(mockOnBookSelected).toHaveBeenCalledWith({
        id: 'db-book-1',
        api_id: 'book-1',
        title: "Harry Potter and the Sorcerer's Stone",
        author: 'J.K. Rowling',
        cover_image_url: 'https://example.com/cover1.jpg',
        total_pages: 309,
        total_duration: null,
        publication_date: '1997-06-26',
      });
    });

    it('should not set totalQuantity when book has no total_pages', () => {
      const bookWithoutPages = {
        ...mockFullBookData,
        total_pages: null,
      };

      (useFetchBookData as jest.Mock).mockReturnValue({
        data: bookWithoutPages,
      });

      const { rerender } = render(<DeadlineFormStep1 {...defaultProps} />);

      (useSearchBooksList as jest.Mock).mockReturnValue({
        data: mockSearchResults,
        isLoading: false,
        error: null,
      });

      rerender(<DeadlineFormStep1 {...defaultProps} />);

      const firstBookButton = screen.getByText(
        "Harry Potter and the Sorcerer's Stone"
      );
      fireEvent.press(firstBookButton);

      rerender(<DeadlineFormStep1 {...defaultProps} />);

      expect(mockSetValue).not.toHaveBeenCalledWith(
        'totalQuantity',
        expect.anything()
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle missing book data gracefully', () => {
      const minimalBookData = {
        id: null,
        title: null,
        metadata: null,
        cover_image_url: null,
        total_pages: null,
        total_duration: null,
        publication_date: null,
      };

      (useFetchBookData as jest.Mock).mockReturnValue({
        data: minimalBookData,
      });

      const { rerender } = render(<DeadlineFormStep1 {...defaultProps} />);

      (useSearchBooksList as jest.Mock).mockReturnValue({
        data: mockSearchResults,
        isLoading: false,
        error: null,
      });

      rerender(<DeadlineFormStep1 {...defaultProps} />);

      const firstBookButton = screen.getByText(
        "Harry Potter and the Sorcerer's Stone"
      );
      fireEvent.press(firstBookButton);

      rerender(<DeadlineFormStep1 {...defaultProps} />);

      expect(mockSetValue).toHaveBeenCalledWith('bookTitle', '');
      expect(mockSetValue).toHaveBeenCalledWith('bookAuthor', '');
    });

    it('should handle undefined metadata gracefully', () => {
      const bookWithUndefinedMetadata = {
        ...mockFullBookData,
        metadata: undefined,
      };

      (useFetchBookData as jest.Mock).mockReturnValue({
        data: bookWithUndefinedMetadata,
      });

      const { rerender } = render(<DeadlineFormStep1 {...defaultProps} />);

      (useSearchBooksList as jest.Mock).mockReturnValue({
        data: mockSearchResults,
        isLoading: false,
        error: null,
      });

      rerender(<DeadlineFormStep1 {...defaultProps} />);

      const firstBookButton = screen.getByText(
        "Harry Potter and the Sorcerer's Stone"
      );
      fireEvent.press(firstBookButton);

      rerender(<DeadlineFormStep1 {...defaultProps} />);

      expect(mockSetValue).toHaveBeenCalledWith('bookAuthor', '');
    });

    it('should render without errors when all props are provided', () => {
      expect(() => {
        render(<DeadlineFormStep1 {...defaultProps} />);
      }).not.toThrow();
    });

    it('should handle books with empty authors array in search results', () => {
      const resultsWithEmptyAuthors = {
        bookList: [
          {
            api_id: 'book-1',
            title: 'Book Without Authors',
            cover_image_url: null,
            metadata: {
              authors: [],
            },
          },
        ],
      };

      (useSearchBooksList as jest.Mock).mockReturnValue({
        data: resultsWithEmptyAuthors,
        isLoading: false,
        error: null,
      });

      render(<DeadlineFormStep1 {...defaultProps} />);

      expect(screen.getByText('Book Without Authors')).toBeTruthy();
    });

    it('should handle null metadata in search results', () => {
      const resultsWithNullMetadata = {
        bookList: [
          {
            api_id: 'book-1',
            title: 'Book With Null Metadata',
            cover_image_url: null,
            metadata: null,
          },
        ],
      };

      (useSearchBooksList as jest.Mock).mockReturnValue({
        data: resultsWithNullMetadata,
        isLoading: false,
        error: null,
      });

      render(<DeadlineFormStep1 {...defaultProps} />);

      expect(screen.getByText('Book With Null Metadata')).toBeTruthy();
    });
  });

  describe('Complex Integration Scenarios', () => {
    it('should handle complete book selection flow', async () => {
      jest.useFakeTimers();

      const { rerender } = render(<DeadlineFormStep1 {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(
        'Search by title or author...'
      );
      fireEvent.changeText(searchInput, 'Harry Potter');

      jest.advanceTimersByTime(300);

      (useSearchBooksList as jest.Mock).mockReturnValue({
        data: mockSearchResults,
        isLoading: false,
        error: null,
      });

      rerender(<DeadlineFormStep1 {...defaultProps} />);

      const bookButton = screen.getByText(
        "Harry Potter and the Sorcerer's Stone"
      );
      fireEvent.press(bookButton);

      (useFetchBookData as jest.Mock).mockReturnValue({
        data: mockFullBookData,
      });

      rerender(<DeadlineFormStep1 {...defaultProps} />);

      expect(mockOnBookSelected).toHaveBeenCalled();
      expect(mockSetValue).toHaveBeenCalledWith(
        'bookTitle',
        "Harry Potter and the Sorcerer's Stone"
      );

      jest.useRealTimers();
    });

    it('should handle search -> no results -> manual entry flow', () => {
      const { rerender } = render(<DeadlineFormStep1 {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(
        'Search by title or author...'
      );
      fireEvent.changeText(searchInput, 'Nonexistent Book');

      (useSearchBooksList as jest.Mock).mockReturnValue({
        data: { bookList: [] },
        isLoading: false,
        error: null,
      });

      rerender(<DeadlineFormStep1 {...defaultProps} />);

      expect(
        screen.getByText(/No books found for "Nonexistent Book"/)
      ).toBeTruthy();

      const manualEntryButton = screen.getByText(/Can't find your book/);
      fireEvent.press(manualEntryButton);

      expect(mockOnManualEntry).toHaveBeenCalled();
    });

    it('should handle search error -> manual entry fallback', () => {
      (useSearchBooksList as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Network error'),
      });

      render(<DeadlineFormStep1 {...defaultProps} />);

      expect(
        screen.getByText('Failed to search books. Please try again.')
      ).toBeTruthy();

      const manualEntryButton = screen.getByText(/Can't find your book/);
      fireEvent.press(manualEntryButton);

      expect(mockOnManualEntry).toHaveBeenCalled();
    });
  });
});
