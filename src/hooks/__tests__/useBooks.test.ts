import { booksService } from '@/services';
import { useQuery } from '@tanstack/react-query';
import {
  SearchBooksResponse,
  FullBookData,
  BookSearchResult,
} from '@/types/bookSearch';
import { Database } from '@/types/database.types';
import {
  searchBookList,
  fetchBookData,
  fetchBookById,
  useSearchBooksList,
  useFetchBookData,
  useFetchBookById,
} from '../useBooks';

type BookRecord = Database['public']['Tables']['books']['Row'];

jest.mock('@/services', () => ({
  booksService: {
    searchBooks: jest.fn(),
    fetchBookData: jest.fn(),
    fetchBookById: jest.fn(),
  },
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

const mockUseQuery = useQuery as jest.Mock;
const mockBooksService = booksService as jest.Mocked<typeof booksService>;

describe('useBooks hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      refetch: jest.fn(),
    });
  });

  describe('Service wrapper functions', () => {
    describe('searchBookList', () => {
      it('should call booksService.searchBooks with correct query', async () => {
        const mockSearchResult: BookSearchResult = {
          api_id: 'api-123',
          api_source: 'goodreads',
          bookUrl: 'http://example.com/book',
          cover_image_url: 'http://example.com/cover.jpg',
          title: 'Test Book',
          publication_date: '2024-01-01',
          rating: 4.5,
          source: 'goodreads',
          epub_url: 'http://example.com/epub',
          metadata: {
            goodreads_id: 'gr123',
            authors: ['Test Author'],
          },
        };
        const mockResponse: SearchBooksResponse = {
          bookList: [mockSearchResult],
        };
        mockBooksService.searchBooks.mockResolvedValue(mockResponse);

        const result = await searchBookList('Harry Potter');

        expect(mockBooksService.searchBooks).toHaveBeenCalledWith(
          'Harry Potter'
        );
        expect(result).toEqual(mockResponse);
      });

      it('should handle empty query string', async () => {
        const mockResponse: SearchBooksResponse = { bookList: [] };
        mockBooksService.searchBooks.mockResolvedValue(mockResponse);

        const result = await searchBookList('');

        expect(mockBooksService.searchBooks).toHaveBeenCalledWith('');
        expect(result).toEqual(mockResponse);
      });

      it('should propagate service errors', async () => {
        const mockError = new Error('Search failed');
        mockBooksService.searchBooks.mockRejectedValue(mockError);

        await expect(searchBookList('test')).rejects.toThrow('Search failed');
        expect(mockBooksService.searchBooks).toHaveBeenCalledWith('test');
      });
    });

    describe('fetchBookData', () => {
      it('should call booksService.fetchBookData with correct api_id', async () => {
        const mockBookData: FullBookData = {
          api_id: 'api-123',
          api_source: 'goodreads',
          cover_image_url: 'http://example.com/cover.jpg',
          description: 'Test description',
          edition: 'First Edition',
          format: 'paperback',
          genres: ['Fiction'],
          has_user_edits: false,
          isbn10: '1234567890',
          isbn13: '1234567890123',
          language: 'en',
          metadata: { authors: ['Test Author'] },
          publication_date: '2024-01-01',
          publisher: 'Test Publisher',
          rating: 4.5,
          source: 'goodreads',
          title: 'Test Book',
          total_duration: null,
          total_pages: 300,
        };
        mockBooksService.fetchBookData.mockResolvedValue(mockBookData);

        const result = await fetchBookData('api-123');

        expect(mockBooksService.fetchBookData).toHaveBeenCalledWith('api-123');
        expect(result).toEqual(mockBookData);
      });

      it('should propagate service errors', async () => {
        const mockError = new Error('Fetch failed');
        mockBooksService.fetchBookData.mockRejectedValue(mockError);

        await expect(fetchBookData('api-123')).rejects.toThrow('Fetch failed');
        expect(mockBooksService.fetchBookData).toHaveBeenCalledWith('api-123');
      });
    });

    describe('fetchBookById', () => {
      it('should call booksService.fetchBookById with correct book_id', async () => {
        const mockBookData: BookRecord = {
          api_id: 'api-123',
          api_source: 'goodreads',
          cover_image_url: 'http://example.com/cover.jpg',
          created_at: '2024-01-01T00:00:00Z',
          date_added: '2024-01-01',
          description: 'Test description',
          edition: { name: 'First Edition' },
          format: 'physical',
          genres: ['Fiction'],
          id: 'book-123',
          isbn10: '1234567890',
          isbn13: '1234567890123',
          language: 'en',
          metadata: { authors: ['Test Author'] },
          publication_date: '2024-01-01',
          publisher: 'Test Publisher',
          rating: 4.5,
          title: 'Test Book',
          total_duration: null,
          total_pages: 300,
          updated_at: '2024-01-01T00:00:00Z',
        };
        mockBooksService.fetchBookById.mockResolvedValue(mockBookData);

        const result = await fetchBookById('book-123');

        expect(mockBooksService.fetchBookById).toHaveBeenCalledWith('book-123');
        expect(result).toEqual(mockBookData);
      });

      it('should propagate service errors', async () => {
        const mockError = new Error('Database fetch failed');
        mockBooksService.fetchBookById.mockRejectedValue(mockError);

        await expect(fetchBookById('book-123')).rejects.toThrow(
          'Database fetch failed'
        );
        expect(mockBooksService.fetchBookById).toHaveBeenCalledWith('book-123');
      });
    });
  });

  describe('useSearchBooksList', () => {
    it('should configure query with correct parameters for valid query', () => {
      useSearchBooksList('Harry Potter');

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['books', 'search', 'Harry Potter'],
        queryFn: expect.any(Function),
        staleTime: 1000 * 60 * 5,
        enabled: true,
      });
    });

    it('should call searchBookList in queryFn', async () => {
      const mockResponse: SearchBooksResponse = { bookList: [] };
      mockBooksService.searchBooks.mockResolvedValue(mockResponse);

      useSearchBooksList('test query');

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const result = await queryConfig.queryFn();

      expect(result).toEqual(mockResponse);
    });

    it('should be disabled for empty query', () => {
      useSearchBooksList('');

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.enabled).toBe(false);
    });

    it('should be disabled for query with 2 or fewer characters', () => {
      useSearchBooksList('ab');

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.enabled).toBe(false);
    });

    it('should be enabled for query with more than 2 characters', () => {
      useSearchBooksList('abc');

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.enabled).toBe(true);
    });

    it('should use correct stale time of 5 minutes', () => {
      useSearchBooksList('test');

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.staleTime).toBe(1000 * 60 * 5);
    });
  });

  describe('useFetchBookData', () => {
    it('should configure query with correct parameters', () => {
      useFetchBookData('api-123');

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['book', 'api-123'],
        queryFn: expect.any(Function),
        staleTime: 1000 * 60 * 30,
      });
    });

    it('should call fetchBookData in queryFn', async () => {
      const mockBookData: FullBookData = {
        api_id: 'api-123',
        api_source: 'goodreads',
        cover_image_url: 'http://example.com/cover.jpg',
        description: 'Test description',
        edition: 'First Edition',
        format: 'paperback',
        genres: ['Fiction'],
        has_user_edits: false,
        isbn10: '1234567890',
        isbn13: '1234567890123',
        language: 'en',
        metadata: { authors: ['Test Author'] },
        publication_date: '2024-01-01',
        publisher: 'Test Publisher',
        rating: 4.5,
        source: 'goodreads',
        title: 'Test Book',
        total_duration: null,
        total_pages: 300,
      };
      mockBooksService.fetchBookData.mockResolvedValue(mockBookData);

      useFetchBookData('api-123');

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const result = await queryConfig.queryFn();

      expect(result).toEqual(mockBookData);
    });

    it('should use correct stale time of 30 minutes', () => {
      useFetchBookData('api-123');

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.staleTime).toBe(1000 * 60 * 30);
    });

    it('should handle different api_id values', () => {
      useFetchBookData('different-api-id');

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.queryKey).toEqual(['book', 'different-api-id']);
    });
  });

  describe('useFetchBookById', () => {
    it('should configure query with correct parameters for valid book_id', () => {
      useFetchBookById('book-123');

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['book', 'id', 'book-123'],
        queryFn: expect.any(Function),
        staleTime: 1000 * 60 * 30,
        enabled: true,
      });
    });

    it('should call fetchBookById in queryFn', async () => {
      const mockBookData: BookRecord = {
        api_id: 'api-123',
        api_source: 'goodreads',
        cover_image_url: 'http://example.com/cover.jpg',
        created_at: '2024-01-01T00:00:00Z',
        date_added: '2024-01-01',
        description: 'Test description',
        edition: { name: 'First Edition' },
        format: 'physical',
        genres: ['Fiction'],
        id: 'book-123',
        isbn10: '1234567890',
        isbn13: '1234567890123',
        language: 'en',
        metadata: { authors: ['Test Author'] },
        publication_date: '2024-01-01',
        publisher: 'Test Publisher',
        rating: 4.5,
        title: 'Test Book',
        total_duration: null,
        total_pages: 300,
        updated_at: '2024-01-01T00:00:00Z',
      };
      mockBooksService.fetchBookById.mockResolvedValue(mockBookData);

      useFetchBookById('book-123');

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const result = await queryConfig.queryFn();

      expect(result).toEqual(mockBookData);
    });

    it('should be disabled when book_id is null', () => {
      useFetchBookById(null);

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.enabled).toBe(false);
    });

    it('should be disabled when book_id is empty string', () => {
      useFetchBookById('');

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.enabled).toBe(false);
    });

    it('should be disabled when book_id is undefined', () => {
      useFetchBookById(null);

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.enabled).toBe(false);
    });

    it('should use correct stale time of 30 minutes', () => {
      useFetchBookById('book-123');

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.staleTime).toBe(1000 * 60 * 30);
    });

    it('should handle null book_id in queryKey', () => {
      useFetchBookById(null);

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.queryKey).toEqual(['book', 'id', null]);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle special characters in search query', () => {
      const specialQuery = "Harry Potter & the Philosopher's Stone!";
      useSearchBooksList(specialQuery);

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.queryKey).toEqual(['books', 'search', specialQuery]);
      expect(queryConfig.enabled).toBe(true);
    });

    it('should handle whitespace-only queries', () => {
      useSearchBooksList('   ');

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.enabled).toBe(true); // 3 characters, even if whitespace
    });

    it('should handle very long queries', () => {
      const longQuery = 'a'.repeat(1000);
      useSearchBooksList(longQuery);

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.queryKey).toEqual(['books', 'search', longQuery]);
      expect(queryConfig.enabled).toBe(true);
    });

    it('should handle special characters in api_id', () => {
      const specialApiId = 'api-123_test.book@example';
      useFetchBookData(specialApiId);

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.queryKey).toEqual(['book', specialApiId]);
    });

    it('should handle special characters in book_id', () => {
      const specialBookId = 'book-123_test.id@database';
      useFetchBookById(specialBookId);

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.queryKey).toEqual(['book', 'id', specialBookId]);
      expect(queryConfig.enabled).toBe(true);
    });
  });
});
