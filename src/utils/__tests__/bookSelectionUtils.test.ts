import {
  transformBookSearchResult,
  shouldTriggerSearch,
  getSearchStatusMessage,
  populateFormFromBook,
  hasValidApiId,
  getBookDisplayInfo,
} from '../bookSelectionUtils';
import { BookSearchResult, FullBookData } from '@/types/bookSearch';

describe('bookSelectionUtils', () => {
  describe('transformBookSearchResult', () => {
    const mockFullBookData: FullBookData = {
      id: 'book-123',
      api_id: 'api-123',
      api_source: 'google-books',
      title: 'Test Book',
      description: null,
      edition: null,
      format: null,
      genres: [],
      has_user_edits: false,
      isbn10: null,
      isbn13: null,
      language: null,
      publisher: null,
      rating: null,
      source: 'google-books',
      metadata: {
        authors: ['John Doe', 'Jane Smith'],
      },
      cover_image_url: 'https://example.com/cover.jpg',
      total_pages: 300,
      total_duration: 600,
      publication_date: '2023-01-01',
    };

    it('should transform full book data to selected book format', () => {
      const result = transformBookSearchResult(mockFullBookData, 'api-123');

      expect(result).toEqual({
        id: 'book-123',
        api_id: 'api-123',
        title: 'Test Book',
        author: 'John Doe',
        cover_image_url: 'https://example.com/cover.jpg',
        total_pages: 300,
        total_duration: 600,
        publication_date: '2023-01-01',
      });
    });

    it('should handle missing book data gracefully', () => {
      const minimalBookData: FullBookData = {
        id: '',
        api_id: '',
        api_source: '',
        title: '',
        description: null,
        edition: null,
        format: null,
        genres: [],
        has_user_edits: false,
        isbn10: null,
        isbn13: null,
        language: null,
        publisher: null,
        rating: null,
        source: '',
        metadata: {},
        cover_image_url: null,
        total_pages: null,
        total_duration: null,
        publication_date: null,
      };

      const result = transformBookSearchResult(minimalBookData, 'api-456');

      expect(result).toEqual({
        id: '',
        api_id: 'api-456',
        title: '',
        author: '',
        cover_image_url: undefined,
        total_pages: undefined,
        total_duration: null,
        publication_date: null,
      });
    });

    it('should handle empty authors array', () => {
      const bookWithNoAuthors: FullBookData = {
        ...mockFullBookData,
        metadata: {
          authors: [],
        },
      };

      const result = transformBookSearchResult(bookWithNoAuthors, 'api-789');

      expect(result.author).toBe('');
    });

    it('should use first author when multiple authors exist', () => {
      const result = transformBookSearchResult(mockFullBookData, 'api-123');

      expect(result.author).toBe('John Doe');
    });

    it('should handle undefined metadata', () => {
      const bookWithNoMetadata: FullBookData = {
        ...mockFullBookData,
        metadata: {},
      };

      const result = transformBookSearchResult(bookWithNoMetadata, 'api-999');

      expect(result.author).toBe('');
    });
  });

  describe('shouldTriggerSearch', () => {
    it('should return true for queries longer than 2 characters', () => {
      expect(shouldTriggerSearch('abc')).toBe(true);
      expect(shouldTriggerSearch('abcd')).toBe(true);
      expect(shouldTriggerSearch('Harry Potter')).toBe(true);
    });

    it('should return false for queries 2 characters or shorter', () => {
      expect(shouldTriggerSearch('')).toBe(false);
      expect(shouldTriggerSearch('a')).toBe(false);
      expect(shouldTriggerSearch('ab')).toBe(false);
    });
  });

  describe('getSearchStatusMessage', () => {
    it('should return loading message for valid query while loading', () => {
      const result = getSearchStatusMessage('Harry Potter', true, false, false);

      expect(result).toEqual({
        type: 'loading',
        message: 'Searching books...',
      });
    });

    it('should not return loading message for short query while loading', () => {
      const result = getSearchStatusMessage('ab', true, false, false);

      expect(result.type).toBe(null);
    });

    it('should return error message when there is an error', () => {
      const result = getSearchStatusMessage('Harry Potter', false, true, false);

      expect(result).toEqual({
        type: 'error',
        message: 'Failed to search books. Please try again.',
      });
    });

    it('should return no results message for valid query with no results', () => {
      const result = getSearchStatusMessage(
        'NonexistentBook',
        false,
        false,
        false
      );

      expect(result).toEqual({
        type: 'no-results',
        message: 'No books found for "NonexistentBook"',
        subMessage: 'Try a different search or add manually',
      });
    });

    it('should return prompt message for empty query', () => {
      const result = getSearchStatusMessage('', false, false, false);

      expect(result).toEqual({
        type: 'prompt',
        message: 'Search for a book to get started',
        subMessage: "We'll grab the page count and details for you",
      });
    });

    it('should return null when query is valid and has results', () => {
      const result = getSearchStatusMessage('Harry Potter', false, false, true);

      expect(result.type).toBe(null);
    });

    it('should prioritize error over other states', () => {
      const result = getSearchStatusMessage('Harry Potter', true, true, true);

      expect(result.type).toBe('error');
    });

    it('should prioritize loading over no-results for valid query', () => {
      const result = getSearchStatusMessage('ValidQuery', true, false, false);

      expect(result.type).toBe('loading');
    });
  });

  describe('populateFormFromBook', () => {
    const mockSetValue = jest.fn();
    const mockSelectedBook = {
      id: 'book-123',
      api_id: 'api-123',
      title: 'Test Book',
      author: 'John Doe',
      cover_image_url: 'https://example.com/cover.jpg',
      total_pages: 300,
      total_duration: null,
      publication_date: '2023-01-01',
    };

    beforeEach(() => {
      mockSetValue.mockClear();
    });

    it('should populate all form fields with book data', () => {
      populateFormFromBook(mockSelectedBook, mockSetValue);

      expect(mockSetValue).toHaveBeenCalledWith('bookTitle', 'Test Book');
      expect(mockSetValue).toHaveBeenCalledWith('bookAuthor', 'John Doe');
      expect(mockSetValue).toHaveBeenCalledWith('book_id', 'book-123');
      expect(mockSetValue).toHaveBeenCalledWith('api_id', 'api-123');
      expect(mockSetValue).toHaveBeenCalledWith('totalQuantity', 300);
    });

    it('should handle empty author gracefully', () => {
      const bookWithoutAuthor = {
        ...mockSelectedBook,
        author: '',
      };

      populateFormFromBook(bookWithoutAuthor, mockSetValue);

      expect(mockSetValue).toHaveBeenCalledWith('bookAuthor', '');
    });

    it('should not set totalQuantity when total_pages is undefined', () => {
      const bookWithoutPages = {
        ...mockSelectedBook,
        total_pages: undefined,
      };

      populateFormFromBook(bookWithoutPages, mockSetValue);

      expect(mockSetValue).not.toHaveBeenCalledWith(
        'totalQuantity',
        expect.anything()
      );
      expect(mockSetValue).toHaveBeenCalledWith('bookTitle', 'Test Book');
      expect(mockSetValue).toHaveBeenCalledWith('bookAuthor', 'John Doe');
      expect(mockSetValue).toHaveBeenCalledWith('book_id', 'book-123');
      expect(mockSetValue).toHaveBeenCalledWith('api_id', 'api-123');
    });

    it('should set totalQuantity to 0 when total_pages is 0', () => {
      const bookWithZeroPages = {
        ...mockSelectedBook,
        total_pages: 0,
      };

      populateFormFromBook(bookWithZeroPages, mockSetValue);

      expect(mockSetValue).not.toHaveBeenCalledWith('totalQuantity', 0);
    });

    it('should handle null author as empty string', () => {
      const bookWithNullAuthor = {
        ...mockSelectedBook,
        author: null as any,
      };

      populateFormFromBook(bookWithNullAuthor, mockSetValue);

      expect(mockSetValue).toHaveBeenCalledWith('bookAuthor', '');
    });
  });

  describe('hasValidApiId', () => {
    it('should return true for book with valid api_id', () => {
      const bookWithApiId: BookSearchResult = {
        title: 'Test Book',
        api_id: 'valid-api-id',
        api_source: 'google-books',
        bookUrl: 'https://example.com/book',
        cover_image_url: null,
        publication_date: null,
        rating: null,
        source: 'google-books',
        epub_url: '',
        metadata: {
          goodreads_id: 'gr-123',
          authors: [],
        },
      };

      expect(hasValidApiId(bookWithApiId)).toBe(true);
    });

    it('should return false for book with null api_id', () => {
      const bookWithoutApiId: BookSearchResult = {
        title: 'Test Book',
        api_id: null as any,
        api_source: 'google-books',
        bookUrl: 'https://example.com/book',
        cover_image_url: null,
        publication_date: null,
        rating: null,
        source: 'google-books',
        epub_url: '',
        metadata: {
          goodreads_id: 'gr-123',
          authors: [],
        },
      };

      expect(hasValidApiId(bookWithoutApiId)).toBe(false);
    });

    it('should return false for book with undefined api_id', () => {
      const bookWithUndefinedApiId: BookSearchResult = {
        title: 'Test Book',
        api_id: undefined as any,
        api_source: 'google-books',
        bookUrl: 'https://example.com/book',
        cover_image_url: null,
        publication_date: null,
        rating: null,
        source: 'google-books',
        epub_url: '',
        metadata: {
          goodreads_id: 'gr-123',
          authors: [],
        },
      };

      expect(hasValidApiId(bookWithUndefinedApiId)).toBe(false);
    });

    it('should return false for book with empty string api_id', () => {
      const bookWithEmptyApiId: BookSearchResult = {
        title: 'Test Book',
        api_id: '',
        api_source: 'google-books',
        bookUrl: 'https://example.com/book',
        cover_image_url: null,
        publication_date: null,
        rating: null,
        source: 'google-books',
        epub_url: '',
        metadata: {
          goodreads_id: 'gr-123',
          authors: [],
        },
      };

      expect(hasValidApiId(bookWithEmptyApiId)).toBe(false);
    });
  });

  describe('getBookDisplayInfo', () => {
    it('should extract display info from book search result', () => {
      const mockItem: BookSearchResult = {
        title: 'Test Book',
        api_id: 'api-123',
        api_source: 'google-books',
        bookUrl: 'https://example.com/book',
        cover_image_url: 'https://example.com/cover.jpg',
        publication_date: null,
        rating: null,
        source: 'google-books',
        epub_url: '',
        metadata: {
          goodreads_id: 'gr-123',
          authors: ['John Doe', 'Jane Smith'],
        },
      };

      const result = getBookDisplayInfo(mockItem);

      expect(result).toEqual({
        title: 'Test Book',
        author: 'John Doe',
        coverImageUrl: 'https://example.com/cover.jpg',
      });
    });

    it('should handle missing author gracefully', () => {
      const mockItem: BookSearchResult = {
        title: 'Test Book',
        api_id: 'api-123',
        api_source: 'google-books',
        bookUrl: 'https://example.com/book',
        cover_image_url: 'https://example.com/cover.jpg',
        publication_date: null,
        rating: null,
        source: 'google-books',
        epub_url: '',
        metadata: {
          goodreads_id: 'gr-123',
          authors: [],
        },
      };

      const result = getBookDisplayInfo(mockItem);

      expect(result.author).toBe(null);
    });

    it('should handle null metadata gracefully', () => {
      const mockItem: BookSearchResult = {
        title: 'Test Book',
        api_id: 'api-123',
        api_source: 'google-books',
        bookUrl: 'https://example.com/book',
        cover_image_url: 'https://example.com/cover.jpg',
        publication_date: null,
        rating: null,
        source: 'google-books',
        epub_url: '',
        metadata: {
          goodreads_id: 'gr-123',
          authors: [],
        },
      };

      const result = getBookDisplayInfo(mockItem);

      expect(result.author).toBe(null);
    });

    it('should handle missing cover image gracefully', () => {
      const mockItem: BookSearchResult = {
        title: 'Test Book',
        api_id: 'api-123',
        api_source: 'google-books',
        bookUrl: 'https://example.com/book',
        cover_image_url: null,
        publication_date: null,
        rating: null,
        source: 'google-books',
        epub_url: '',
        metadata: {
          goodreads_id: 'gr-123',
          authors: ['John Doe'],
        },
      };

      const result = getBookDisplayInfo(mockItem);

      expect(result.coverImageUrl).toBe(null);
    });

    it('should return first author when multiple authors exist', () => {
      const mockItem: BookSearchResult = {
        title: 'Test Book',
        api_id: 'api-123',
        api_source: 'google-books',
        bookUrl: 'https://example.com/book',
        cover_image_url: null,
        publication_date: null,
        rating: null,
        source: 'google-books',
        epub_url: '',
        metadata: {
          goodreads_id: 'gr-123',
          authors: ['First Author', 'Second Author', 'Third Author'],
        },
      };

      const result = getBookDisplayInfo(mockItem);

      expect(result.author).toBe('First Author');
    });
  });
});
