import { booksService } from '../books.service';
import { supabase } from '@/lib/supabase';
import { FullBookData } from '@/types/bookSearch';

// Mock the supabase module
jest.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn().mockReturnThis(),
    })),
  },
}));

describe('BooksService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchBooks', () => {
    it('should return empty array for empty query', async () => {
      const result = await booksService.searchBooks('');
      expect(result).toEqual({ bookList: [] });
      expect(supabase.functions.invoke).not.toHaveBeenCalled();
    });

    it('should return empty array for whitespace-only query', async () => {
      const result = await booksService.searchBooks('   ');
      expect(result).toEqual({ bookList: [] });
      expect(supabase.functions.invoke).not.toHaveBeenCalled();
    });

    it('should search books with valid query', async () => {
      const mockResponse = {
        data: { bookList: [{ id: '1', title: 'Test Book' }] },
        error: null,
      };

      (supabase.functions.invoke as jest.Mock).mockResolvedValue(mockResponse);

      const result = await booksService.searchBooks('Harry Potter');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('search-books-v2', {
        body: { query: 'Harry Potter' },
      });
      expect(result).toEqual({ bookList: [{ id: '1', title: 'Test Book' }] });
    });

    it('should throw error when search fails', async () => {
      const mockError = new Error('Search failed');
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(booksService.searchBooks('test')).rejects.toThrow(
        'Search failed'
      );

      expect(supabase.functions.invoke).toHaveBeenCalledWith('search-books-v2', {
        body: { query: 'test' },
      });
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      (supabase.functions.invoke as jest.Mock).mockRejectedValue(networkError);

      await expect(booksService.searchBooks('test')).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('fetchBookData', () => {
    it('should fetch book data with valid API ID', async () => {
      const mockBookData: FullBookData = {
        api_id: 'test-123',
        api_source: 'test',
        title: 'Test Book',
        publication_date: '2024-01-01',
        total_pages: 300,
        description: 'Test description',
        cover_image_url: 'https://example.com/image.jpg',
        format: 'physical',
        metadata: { authors: ['Test Author'] },
        edition: null,
        genres: [],
        has_user_edits: false,
        isbn10: null,
        isbn13: null,
        language: null,
        publisher: null,
        rating: null,
        source: 'test',
        total_duration: null,
      };

      const mockResponse = {
        data: mockBookData,
        error: null,
      };

      (supabase.functions.invoke as jest.Mock).mockResolvedValue(mockResponse);

      const result = await booksService.fetchBookData('test-123');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('book-data', {
        body: { api_id: 'test-123' },
      });
      expect(result).toEqual(mockBookData);
    });

    it('should throw error when fetch fails', async () => {
      const mockError = new Error('Fetch failed');
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(booksService.fetchBookData('invalid-id')).rejects.toThrow(
        'Fetch failed'
      );

      expect(supabase.functions.invoke).toHaveBeenCalledWith('book-data', {
        body: { api_id: 'invalid-id' },
      });
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network timeout');
      (supabase.functions.invoke as jest.Mock).mockRejectedValue(networkError);

      await expect(booksService.fetchBookData('test-123')).rejects.toThrow(
        'Network timeout'
      );
    });
  });

  describe('fetchBookDataByISBN', () => {
    it('should fetch book data with valid ISBN', async () => {
      const mockBookData: FullBookData = {
        api_id: 'google-vol-123',
        api_source: 'google_books',
        google_volume_id: 'google-vol-123',
        title: 'Test Book',
        publication_date: '2024-01-01',
        total_pages: 300,
        description: 'Test description',
        cover_image_url: 'https://example.com/image.jpg',
        format: 'physical',
        metadata: { authors: ['Test Author'] },
        edition: null,
        genres: [],
        has_user_edits: false,
        isbn10: '1234567890',
        isbn13: '9781234567890',
        language: null,
        publisher: null,
        rating: null,
        source: 'google_books',
        total_duration: null,
      };

      const mockResponse = {
        data: mockBookData,
        error: null,
      };

      (supabase.functions.invoke as jest.Mock).mockResolvedValue(mockResponse);

      const result = await booksService.fetchBookDataByISBN('9781234567890');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('book-data', {
        body: { isbn: '9781234567890' },
      });
      expect(result).toEqual(mockBookData);
    });

    it('should throw error when ISBN fetch fails', async () => {
      const mockError = new Error('Book not found with ISBN');
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(
        booksService.fetchBookDataByISBN('invalid-isbn')
      ).rejects.toThrow('Book not found with ISBN');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('book-data', {
        body: { isbn: 'invalid-isbn' },
      });
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network timeout');
      (supabase.functions.invoke as jest.Mock).mockRejectedValue(networkError);

      await expect(
        booksService.fetchBookDataByISBN('9781234567890')
      ).rejects.toThrow('Network timeout');
    });
  });

  describe('fetchBookDataByGoogleVolumeId', () => {
    it('should fetch book data with valid Google Volume ID', async () => {
      const mockBookData: FullBookData = {
        api_id: 'google-vol-456',
        api_source: 'google_books',
        google_volume_id: 'google-vol-456',
        title: 'Another Test Book',
        publication_date: '2024-02-01',
        total_pages: 250,
        description: 'Another test description',
        cover_image_url: 'https://example.com/image2.jpg',
        format: 'eBook',
        metadata: { authors: ['Another Author'] },
        edition: null,
        genres: ['Fiction'],
        has_user_edits: false,
        isbn10: null,
        isbn13: '9789876543210',
        language: 'en',
        publisher: 'Test Publisher',
        rating: 4.5,
        source: 'google_books',
        total_duration: null,
      };

      const mockResponse = {
        data: mockBookData,
        error: null,
      };

      (supabase.functions.invoke as jest.Mock).mockResolvedValue(mockResponse);

      const result =
        await booksService.fetchBookDataByGoogleVolumeId('google-vol-456');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('book-data', {
        body: { google_volume_id: 'google-vol-456' },
      });
      expect(result).toEqual(mockBookData);
    });

    it('should throw error when Google Volume ID fetch fails', async () => {
      const mockError = new Error('Book not found with Google Volume ID');
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(
        booksService.fetchBookDataByGoogleVolumeId('invalid-volume-id')
      ).rejects.toThrow('Book not found with Google Volume ID');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('book-data', {
        body: { google_volume_id: 'invalid-volume-id' },
      });
    });

    it('should handle network errors', async () => {
      const networkError = new Error('API unavailable');
      (supabase.functions.invoke as jest.Mock).mockRejectedValue(networkError);

      await expect(
        booksService.fetchBookDataByGoogleVolumeId('google-vol-456')
      ).rejects.toThrow('API unavailable');
    });
  });

  describe('fetchBookById', () => {
    let mockSelect: jest.Mock;
    let mockEq: jest.Mock;
    let mockSingle: jest.Mock;

    beforeEach(() => {
      mockSingle = jest.fn();
      mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });
    });

    it('should fetch book by ID successfully', async () => {
      const mockBook = {
        id: 'book-123',
        title: 'Test Book',
        authors: ['Test Author'],
      };

      mockSingle.mockResolvedValue({
        data: mockBook,
        error: null,
      });

      const result = await booksService.fetchBookById('book-123');

      expect(supabase.from).toHaveBeenCalledWith('books');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', 'book-123');
      expect(result).toEqual(mockBook);
    });

    it('should throw error when book not found', async () => {
      const mockError = { message: 'Book not found', code: 'PGRST116' };
      mockSingle.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(booksService.fetchBookById('nonexistent')).rejects.toThrow(
        'Failed to fetch book data: Book not found'
      );

      expect(supabase.from).toHaveBeenCalledWith('books');
      expect(mockEq).toHaveBeenCalledWith('id', 'nonexistent');
    });

    it('should throw error for database errors', async () => {
      const mockError = { message: 'Database connection failed' };
      mockSingle.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(booksService.fetchBookById('book-123')).rejects.toThrow(
        'Failed to fetch book data: Database connection failed'
      );
    });
  });

  describe('getBookByApiId', () => {
    let mockSelect: jest.Mock;
    let mockEq: jest.Mock;
    let mockSingle: jest.Mock;

    beforeEach(() => {
      mockSingle = jest.fn();
      mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });
    });

    it('should return book data when found', async () => {
      const mockBook = { id: 'book-123' };
      mockSingle.mockResolvedValue({
        data: mockBook,
        error: null,
      });

      const result = await booksService.getBookByApiId('api-123');

      expect(supabase.from).toHaveBeenCalledWith('books');
      expect(mockSelect).toHaveBeenCalledWith('id');
      expect(mockEq).toHaveBeenCalledWith('api_id', 'api-123');
      expect(result).toEqual(mockBook);
    });

    it('should return null when book not found (PGRST116 error)', async () => {
      const mockError = { code: 'PGRST116', message: 'No rows found' };
      mockSingle.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await booksService.getBookByApiId('nonexistent-api');

      expect(result).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith('books');
    });

    it('should throw error for other database errors', async () => {
      const mockError = { code: 'OTHER_ERROR', message: 'Database error' };
      mockSingle.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(booksService.getBookByApiId('api-123')).rejects.toEqual(
        mockError
      );
    });
  });

  describe('insertBook', () => {
    let mockInsert: jest.Mock;
    let mockSelect: jest.Mock;
    let mockSingle: jest.Mock;

    beforeEach(() => {
      mockSingle = jest.fn();
      mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });
    });

    it('should insert book successfully', async () => {
      const bookId = 'book-123';
      const bookData: FullBookData = {
        api_id: 'api-123',
        api_source: 'test',
        title: 'Test Book',
        publication_date: '2024-01-01',
        total_pages: 300,
        description: 'Test description',
        cover_image_url: 'https://example.com/image.jpg',
        format: 'physical',
        metadata: { authors: ['Test Author'] },
        edition: null,
        genres: [],
        has_user_edits: false,
        isbn10: null,
        isbn13: null,
        language: null,
        publisher: null,
        rating: null,
        source: 'test',
        total_duration: null,
      };

      const expectedInsertData = {
        id: bookId,
        api_id: 'api-123',
        api_source: 'test',
        title: 'Test Book',
        publication_date: '2024-01-01',
        total_pages: 300,
        description: 'Test description',
        cover_image_url: 'https://example.com/image.jpg',
        format: 'physical',
        metadata: { authors: ['Test Author'] },
        edition: null,
        genres: [],
        has_user_edits: false,
        isbn10: null,
        isbn13: null,
        language: null,
        publisher: null,
        rating: null,
        source: 'test',
        total_duration: null,
      };

      const mockInsertedBook = { ...expectedInsertData };

      mockSingle.mockResolvedValue({
        data: mockInsertedBook,
        error: null,
      });

      const result = await booksService.insertBook(bookId, bookData);

      expect(supabase.from).toHaveBeenCalledWith('books');
      expect(mockInsert).toHaveBeenCalledWith(expectedInsertData);
      expect(mockSelect).toHaveBeenCalledWith();
      expect(result).toEqual(mockInsertedBook);
    });

    it('should handle book data without optional fields', async () => {
      const bookId = 'book-456';
      const minimalBookData: FullBookData = {
        api_id: 'api-456',
        api_source: 'test',
        title: 'Minimal Book',
        publication_date: '2024-01-01',
        total_pages: 200,
        description: 'Description',
        cover_image_url: 'https://example.com/image.jpg',
        format: 'eBook',
        metadata: { authors: ['Author'] },
        edition: null,
        genres: [],
        has_user_edits: false,
        isbn10: null,
        isbn13: null,
        language: null,
        publisher: null,
        rating: null,
        source: 'test',
        total_duration: null,
      };

      const expectedInsertData = {
        id: bookId,
        api_id: 'api-456',
        api_source: 'test',
        title: 'Minimal Book',
        publication_date: '2024-01-01',
        total_pages: 200,
        description: 'Description',
        cover_image_url: 'https://example.com/image.jpg',
        format: 'eBook',
        metadata: { authors: ['Author'] },
        edition: null,
        genres: [],
        has_user_edits: false,
        isbn10: null,
        isbn13: null,
        language: null,
        publisher: null,
        rating: null,
        source: 'test',
        total_duration: null,
      };

      mockSingle.mockResolvedValue({
        data: expectedInsertData,
        error: null,
      });

      const result = await booksService.insertBook(bookId, minimalBookData);

      expect(mockInsert).toHaveBeenCalledWith(expectedInsertData);
      expect(result).toEqual(expectedInsertData);
    });

    it('should throw error when insert fails', async () => {
      const bookId = 'book-789';
      const bookData: FullBookData = {
        api_id: 'api-789',
        api_source: 'test',
        title: 'Test Book',
        publication_date: '2024-01-01',
        total_pages: 300,
        description: 'Test description',
        cover_image_url: 'https://example.com/image.jpg',
        format: 'audio',
        metadata: { authors: ['Test Author'] },
        edition: null,
        genres: [],
        has_user_edits: false,
        isbn10: null,
        isbn13: null,
        language: null,
        publisher: null,
        rating: null,
        source: 'test',
        total_duration: null,
      };

      const mockError = new Error('Insert failed');
      mockSingle.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(booksService.insertBook(bookId, bookData)).rejects.toThrow(
        'Insert failed'
      );

      expect(supabase.from).toHaveBeenCalledWith('books');
    });

    it('should handle different format types correctly', async () => {
      const formatTests: ('physical' | 'eBook' | 'audio')[] = [
        'physical',
        'eBook',
        'audio',
      ];

      for (const format of formatTests) {
        const bookData: FullBookData = {
          api_id: `api-${format}`,
          api_source: 'test',
          title: `${format} Book`,
          publication_date: '2024-01-01',
          total_pages: 300,
          description: 'Description',
          cover_image_url: 'https://example.com/image.jpg',
          format,
          metadata: { authors: ['Author'] },
          edition: null,
          genres: [],
          has_user_edits: false,
          isbn10: null,
          isbn13: null,
          language: null,
          publisher: null,
          rating: null,
          source: 'test',
          total_duration: null,
        };

        mockSingle.mockResolvedValue({
          data: { id: `book-${format}`, ...bookData },
          error: null,
        });

        await booksService.insertBook(`book-${format}`, bookData);

        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({ format })
        );
      }
    });
  });
});
