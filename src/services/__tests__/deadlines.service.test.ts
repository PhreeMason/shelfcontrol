import {
  deadlinesService,
  AddDeadlineParams,
  UpdateDeadlineParams,
  UpdateProgressParams,
} from '../deadlines.service';
import { booksService } from '../books.service';
import { supabase, generateId } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  generateId: jest.fn(),
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
    })),
  },
}));

jest.mock('../books.service', () => ({
  booksService: {
    getBookByApiId: jest.fn(),
    fetchBookData: jest.fn(),
    insertBook: jest.fn(),
  },
}));

const mockSupabaseFrom = supabase.from as jest.Mock;
const mockGenerateId = generateId as jest.Mock;
const mockBooksService = booksService as jest.Mocked<typeof booksService>;

describe('DeadlinesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateId.mockImplementation((prefix: string) => `${prefix}-123`);
  });

  describe('addDeadline', () => {
    const userId = 'user-123';
    const mockParams: AddDeadlineParams = {
      deadlineDetails: {
        book_title: 'Test Book',
        author: 'Test Author',
        deadline_date: '2024-12-31',
        total_quantity: 300,
        format: 'physical',
        source: 'personal',
        flexibility: 'flexible',
      },
      progressDetails: {
        current_progress: 0,
        deadline_id: 'rd-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    it('should add deadline with book data successfully', async () => {
      const mockBookData = { id: 'book-123', title: 'Test Book' };
      const mockProgressData = { id: 'rdp-123', current_progress: 0 };
      const mockStatusData = { id: 'status-123', status: 'reading' };

      mockBooksService.getBookByApiId.mockResolvedValue(mockBookData);

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValueOnce({
          data: { id: 'rd-123', ...mockParams.deadlineDetails },
          error: null,
        })
        .mockResolvedValueOnce({ data: mockProgressData, error: null })
        .mockResolvedValueOnce({ data: mockStatusData, error: null });

      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      const paramsWithBookData = {
        ...mockParams,
        bookData: { api_id: 'book-api-123' },
      };

      const result = await deadlinesService.addDeadline(
        userId,
        paramsWithBookData
      );

      expect(mockBooksService.getBookByApiId).toHaveBeenCalledWith(
        'book-api-123'
      );
      expect(mockSupabaseFrom).toHaveBeenCalledWith('deadlines');
      expect(mockSupabaseFrom).toHaveBeenCalledWith('deadline_progress');
      expect(mockSupabaseFrom).toHaveBeenCalledWith('deadline_status');
      expect(result).toEqual({
        id: 'rd-123',
        user_id: userId,
        progress: mockProgressData,
        status: [mockStatusData],
        ...mockParams.deadlineDetails,
      });
    });

    it('should add deadline without book data', async () => {
      const mockProgressData = { id: 'rdp-123', current_progress: 0 };
      const mockStatusData = { id: 'status-123', status: 'reading' };

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValueOnce({
          data: { id: 'rd-123', ...mockParams.deadlineDetails },
          error: null,
        })
        .mockResolvedValueOnce({ data: mockProgressData, error: null })
        .mockResolvedValueOnce({ data: mockStatusData, error: null });

      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      const result = await deadlinesService.addDeadline(userId, mockParams);

      expect(mockBooksService.getBookByApiId).not.toHaveBeenCalled();
      expect(result).toEqual({
        id: 'rd-123',
        user_id: userId,
        progress: mockProgressData,
        status: [mockStatusData],
        ...mockParams.deadlineDetails,
      });
    });

    it('should fetch and insert new book when book does not exist', async () => {
      const mockBookResponse = {
        api_id: 'new-book-api-123',
        title: 'New Book',
        author: 'New Author',
        api_source: 'google',
        cover_image_url: null,
        description: null,
        edition: null,
        published_date: null,
        isbn10: null,
        isbn13: null,
        page_count: null,
        language: null,
        categories: [],
        average_rating: null,
        maturity_rating: null,
        info_link: null,
        preview_link: null,
        first_publish_year: null,
      } as any;

      mockBooksService.getBookByApiId.mockResolvedValue(null);
      mockBooksService.fetchBookData.mockResolvedValue(mockBookResponse);
      mockBooksService.insertBook.mockResolvedValue({} as any);

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValueOnce({ data: { id: 'rd-123' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'rdp-123' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'status-123' }, error: null });

      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      const paramsWithBookData = {
        ...mockParams,
        bookData: { api_id: 'new-book-api-123' },
      };

      await deadlinesService.addDeadline(userId, paramsWithBookData);

      expect(mockBooksService.getBookByApiId).toHaveBeenCalledWith(
        'new-book-api-123'
      );
      expect(mockBooksService.fetchBookData).toHaveBeenCalledWith(
        'new-book-api-123'
      );
      expect(mockBooksService.insertBook).toHaveBeenCalledWith(
        'book-123',
        mockBookResponse
      );
    });

    it('should handle book fetch error gracefully', async () => {
      mockBooksService.getBookByApiId.mockResolvedValue(null);
      mockBooksService.fetchBookData.mockRejectedValue(
        new Error('Fetch failed')
      );

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValueOnce({ data: { id: 'rd-123' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'rdp-123' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'status-123' }, error: null });

      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      const paramsWithBookData = {
        ...mockParams,
        bookData: { api_id: 'failing-book-api' },
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await deadlinesService.addDeadline(userId, paramsWithBookData);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch/insert book data:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it('should throw error when deadline insertion fails', async () => {
      const mockError = new Error('Deadline insertion failed');

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: mockError });

      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      await expect(
        deadlinesService.addDeadline(userId, mockParams)
      ).rejects.toThrow('Deadline insertion failed');
    });

    it('should throw error when progress insertion fails', async () => {
      const mockError = new Error('Progress insertion failed');

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValueOnce({ data: { id: 'rd-123' }, error: null })
        .mockResolvedValueOnce({ data: null, error: mockError });

      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      await expect(
        deadlinesService.addDeadline(userId, mockParams)
      ).rejects.toThrow('Progress insertion failed');
    });

    it('should throw error when status insertion fails', async () => {
      const mockError = new Error('Status insertion failed');

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValueOnce({ data: { id: 'rd-123' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'rdp-123' }, error: null })
        .mockResolvedValueOnce({ data: null, error: mockError });

      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      await expect(
        deadlinesService.addDeadline(userId, mockParams)
      ).rejects.toThrow('Status insertion failed');
    });

    it('should use provided book_id when available', async () => {
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValueOnce({ data: { id: 'rd-123' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'rdp-123' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'status-123' }, error: null });

      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      const paramsWithBookId = {
        ...mockParams,
        bookData: { api_id: 'book-api-123', book_id: 'existing-book-123' },
      };

      await deadlinesService.addDeadline(userId, paramsWithBookId);

      expect(mockBooksService.getBookByApiId).not.toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          book_id: 'existing-book-123',
        })
      );
    });

    it('should set yesterday timestamps when ignore_in_calcs is true', async () => {
      const mockCurrentDate = new Date('2024-01-15T12:00:00.000Z');
      const mockYesterday = new Date('2024-01-14T12:00:00.000Z');

      jest.spyOn(global, 'Date').mockImplementation(((...args: any[]) => {
        if (args.length === 0) {
          return mockCurrentDate;
        }
        return new (Date as any)(...args);
      }) as any);

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValueOnce({ data: { id: 'rd-123' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'rdp-123' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'status-123' }, error: null });

      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      const paramsWithIgnoreFlag = {
        ...mockParams,
        progressDetails: {
          ...mockParams.progressDetails,
          ignore_in_calcs: true,
        },
      };

      await deadlinesService.addDeadline(userId, paramsWithIgnoreFlag);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          created_at: mockYesterday.toISOString(),
          updated_at: mockYesterday.toISOString(),
        })
      );

      jest.restoreAllMocks();
    });

    it('should not modify timestamps when ignore_in_calcs is false', async () => {
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValueOnce({ data: { id: 'rd-123' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'rdp-123' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'status-123' }, error: null });

      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      const currentTimestamp = new Date().toISOString();
      const paramsWithoutIgnoreFlag = {
        ...mockParams,
        progressDetails: {
          ...mockParams.progressDetails,
          ignore_in_calcs: false,
          created_at: currentTimestamp,
          updated_at: currentTimestamp,
        },
      };

      await deadlinesService.addDeadline(userId, paramsWithoutIgnoreFlag);

      const progressInsertCall = mockInsert.mock.calls.find(
        call => call[0].current_progress !== undefined
      );
      expect(progressInsertCall).toBeDefined();
      expect(progressInsertCall[0].created_at).toBe(currentTimestamp);
      expect(progressInsertCall[0].updated_at).toBe(currentTimestamp);
    });
  });

  describe('updateDeadline', () => {
    const userId = 'user-123';
    const mockParams: UpdateDeadlineParams = {
      deadlineDetails: {
        id: 'rd-123',
        book_title: 'Updated Book',
        author: 'Updated Author',
        deadline_date: '2024-12-31',
        total_quantity: 350,
        format: 'eBook',
        source: 'library',
        flexibility: 'strict',
        user_id: userId,
      },
      progressDetails: {
        current_progress: 100,
        deadline_id: 'rd-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    it('should update deadline and create new progress entry', async () => {
      const mockDeadlineData = { id: 'rd-123', ...mockParams.deadlineDetails };
      const mockProgressData = { id: 'rdp-456', current_progress: 100 };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValueOnce({ data: mockDeadlineData, error: null })
        .mockResolvedValueOnce({ data: mockProgressData, error: null });

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
        insert: mockInsert,
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      const result = await deadlinesService.updateDeadline(userId, mockParams);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockParams.deadlineDetails,
          updated_at: expect.any(String),
        })
      );
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'rdp-123',
          deadline_id: 'rd-123',
          current_progress: 100,
        })
      );
      expect(result).toEqual({
        ...mockDeadlineData,
        progress: mockProgressData,
      });
    });

    it('should update deadline and update existing progress entry', async () => {
      const mockDeadlineData = { id: 'rd-123', ...mockParams.deadlineDetails };
      const existingProgressData = {
        id: 'rdp-existing',
        current_progress: 50,
        ignore_in_calcs: false,
      };
      const mockProgressData = { id: 'rdp-existing', current_progress: 100 };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValueOnce({ data: mockDeadlineData, error: null })
        .mockResolvedValueOnce({ data: existingProgressData, error: null })
        .mockResolvedValueOnce({ data: mockProgressData, error: null });

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      const paramsWithExistingProgress = {
        ...mockParams,
        progressDetails: {
          id: 'rdp-existing',
          current_progress: 100,
          deadline_id: 'rd-123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      const result = await deadlinesService.updateDeadline(
        userId,
        paramsWithExistingProgress
      );

      expect(mockUpdate).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        ...mockDeadlineData,
        progress: mockProgressData,
      });
    });

    it('should throw error when deadline update fails', async () => {
      const mockError = new Error('Deadline update failed');

      const mockUpdate = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: mockError });

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      await expect(
        deadlinesService.updateDeadline(userId, mockParams)
      ).rejects.toThrow('Deadline update failed');
    });

    it('should throw error when progress update fails', async () => {
      const mockDeadlineData = { id: 'rd-123' };
      const mockProgressError = new Error('Progress update failed');

      const mockUpdate = jest.fn().mockReturnThis();
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValueOnce({ data: mockDeadlineData, error: null })
        .mockResolvedValueOnce({ data: null, error: mockProgressError });

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
        insert: mockInsert,
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      await expect(
        deadlinesService.updateDeadline(userId, mockParams)
      ).rejects.toThrow('Progress update failed');
    });

    it('should set timestamp to day before deadline creation when creating new progress with ignore_in_calcs true', async () => {
      const deadlineCreatedAt = '2024-01-15T12:00:00.000Z';
      const dayBeforeDeadline = new Date(deadlineCreatedAt);
      dayBeforeDeadline.setDate(dayBeforeDeadline.getDate() - 1);

      const mockDeadlineData = {
        id: 'rd-123',
        ...mockParams.deadlineDetails,
        created_at: deadlineCreatedAt,
      };
      const mockProgressData = { id: 'rdp-456', current_progress: 100 };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValueOnce({ data: mockDeadlineData, error: null })
        .mockResolvedValueOnce({ data: mockProgressData, error: null });

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
        insert: mockInsert,
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      const paramsWithIgnoreFlag = {
        ...mockParams,
        progressDetails: {
          current_progress: 100,
          deadline_id: 'rd-123',
          ignore_in_calcs: true,
        },
      };

      await deadlinesService.updateDeadline(userId, paramsWithIgnoreFlag);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'rdp-123',
          deadline_id: 'rd-123',
          current_progress: 100,
          ignore_in_calcs: true,
          created_at: dayBeforeDeadline.toISOString(),
          updated_at: dayBeforeDeadline.toISOString(),
        })
      );
    });

    it('should set timestamp same as deadline creation when creating new progress with ignore_in_calcs false', async () => {
      const deadlineCreatedAt = '2024-01-15T12:00:00.000Z';

      const mockDeadlineData = {
        id: 'rd-123',
        ...mockParams.deadlineDetails,
        created_at: deadlineCreatedAt,
      };
      const mockProgressData = { id: 'rdp-456', current_progress: 100 };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValueOnce({ data: mockDeadlineData, error: null })
        .mockResolvedValueOnce({ data: mockProgressData, error: null });

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
        insert: mockInsert,
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      const paramsWithoutIgnoreFlag = {
        ...mockParams,
        progressDetails: {
          current_progress: 100,
          deadline_id: 'rd-123',
          ignore_in_calcs: false,
        },
      };

      await deadlinesService.updateDeadline(userId, paramsWithoutIgnoreFlag);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'rdp-123',
          deadline_id: 'rd-123',
          current_progress: 100,
          ignore_in_calcs: false,
          created_at: deadlineCreatedAt,
          updated_at: deadlineCreatedAt,
        })
      );
    });

    it('should update created_at when changing ignore_in_calcs from true to false', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockDeadlineData = {
        id: 'rd-123',
        ...mockParams.deadlineDetails,
      };

      const existingProgressData = {
        id: 'rdp-existing',
        deadline_id: 'rd-123',
        current_progress: 50,
        ignore_in_calcs: true,
        created_at: yesterday.toISOString(),
        updated_at: yesterday.toISOString(),
      };

      const updatedProgressData = {
        ...existingProgressData,
        ignore_in_calcs: false,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValueOnce({ data: mockDeadlineData, error: null })
        .mockResolvedValueOnce({ data: existingProgressData, error: null })
        .mockResolvedValueOnce({ data: updatedProgressData, error: null });

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      const paramsWithToggle = {
        ...mockParams,
        progressDetails: {
          id: 'rdp-existing',
          current_progress: 50,
          deadline_id: 'rd-123',
          ignore_in_calcs: false,
        },
      };

      await deadlinesService.updateDeadline(userId, paramsWithToggle);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          current_progress: 50,
          ignore_in_calcs: false,
          updated_at: expect.any(String),
          created_at: expect.any(String),
        })
      );
    });

    it('should not update created_at when ignore_in_calcs remains false', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockDeadlineData = {
        id: 'rd-123',
        ...mockParams.deadlineDetails,
      };

      const existingProgressData = {
        id: 'rdp-existing',
        deadline_id: 'rd-123',
        current_progress: 50,
        ignore_in_calcs: false,
        created_at: yesterday.toISOString(),
        updated_at: yesterday.toISOString(),
      };

      const updatedProgressData = {
        ...existingProgressData,
        current_progress: 75,
        updated_at: new Date().toISOString(),
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValueOnce({ data: mockDeadlineData, error: null })
        .mockResolvedValueOnce({ data: existingProgressData, error: null })
        .mockResolvedValueOnce({ data: updatedProgressData, error: null });

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      const paramsNoToggle = {
        ...mockParams,
        progressDetails: {
          id: 'rdp-existing',
          current_progress: 75,
          deadline_id: 'rd-123',
          ignore_in_calcs: false,
        },
      };

      await deadlinesService.updateDeadline(userId, paramsNoToggle);

      const updateCall = mockUpdate.mock.calls.find((call: any) =>
        call[0].hasOwnProperty('current_progress')
      );

      expect(updateCall[0]).not.toHaveProperty('created_at');
    });
  });

  describe('updateDeadlineProgress', () => {
    const mockParams: UpdateProgressParams = {
      deadlineId: 'rd-123',
      currentProgress: 150,
      timeSpentReading: 30,
    };

    it('should create new progress entry', async () => {
      const mockProgressData = {
        id: 'rdp-123',
        deadline_id: 'rd-123',
        current_progress: 150,
        time_spent_reading: 30,
      };

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: mockProgressData, error: null });

      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      const result = await deadlinesService.updateDeadlineProgress(mockParams);

      expect(mockInsert).toHaveBeenCalledWith({
        id: 'rdp-123',
        deadline_id: 'rd-123',
        current_progress: 150,
        time_spent_reading: 30,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
      expect(result).toEqual(mockProgressData);
    });

    it('should handle progress entry without time spent reading', async () => {
      const paramsWithoutTime = {
        deadlineId: 'rd-123',
        currentProgress: 150,
      };

      const mockProgressData = {
        id: 'rdp-123',
        deadline_id: 'rd-123',
        current_progress: 150,
        time_spent_reading: null,
      };

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: mockProgressData, error: null });

      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      const result =
        await deadlinesService.updateDeadlineProgress(paramsWithoutTime);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          time_spent_reading: null,
        })
      );
      expect(result).toEqual(mockProgressData);
    });

    it('should throw error when progress insertion fails', async () => {
      const mockError = new Error('Progress insertion failed');

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: mockError });

      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      await expect(
        deadlinesService.updateDeadlineProgress(mockParams)
      ).rejects.toThrow('Progress insertion failed');
    });
  });

  describe('getDeadlines', () => {
    const userId = 'user-123';

    it('should return all deadlines for user', async () => {
      const mockDeadlines = [
        {
          id: 'rd-1',
          book_title: 'Book 1',
          progress: [{ current_progress: 50 }],
          status: [{ status: 'reading' }],
        },
        {
          id: 'rd-2',
          book_title: 'Book 2',
          progress: [{ current_progress: 100 }],
          status: [{ status: 'complete' }],
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest
        .fn()
        .mockResolvedValue({ data: mockDeadlines, error: null });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      });

      const result = await deadlinesService.getDeadlines(userId);

      expect(mockSelect).toHaveBeenCalledWith(`
        *,
        progress:deadline_progress(*),
        status:deadline_status(*)
      `);
      expect(mockEq).toHaveBeenCalledWith('user_id', userId);
      expect(mockOrder).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
      expect(result).toEqual(mockDeadlines);
    });

    it('should throw error when query fails', async () => {
      const mockError = new Error('Query failed');

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest
        .fn()
        .mockResolvedValue({ data: null, error: mockError });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      });

      await expect(deadlinesService.getDeadlines(userId)).rejects.toThrow(
        'Query failed'
      );
    });
  });

  describe('getDeadlineById', () => {
    const userId = 'user-123';
    const deadlineId = 'rd-123';

    it('should return deadline when found', async () => {
      const mockDeadline = {
        id: 'rd-123',
        book_title: 'Test Book',
        progress: [{ current_progress: 150 }],
        status: [{ status: 'reading' }],
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: mockDeadline, error: null });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      const result = await deadlinesService.getDeadlineById(userId, deadlineId);

      expect(mockEq).toHaveBeenCalledWith('user_id', userId);
      expect(mockEq).toHaveBeenCalledWith('id', deadlineId);
      expect(result).toEqual(mockDeadline);
    });

    it('should return null when deadline not found (PGRST116 error)', async () => {
      const mockError = { code: 'PGRST116', message: 'Not found' };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: mockError });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      const result = await deadlinesService.getDeadlineById(userId, deadlineId);

      expect(result).toBeNull();
    });

    it('should throw error for other database errors', async () => {
      const mockError = new Error('Database error');

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: mockError });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      await expect(
        deadlinesService.getDeadlineById(userId, deadlineId)
      ).rejects.toThrow('Database error');
    });
  });

  describe('updateDeadlineStatus', () => {
    const deadlineId = 'rd-123';

    it('should update deadline status to complete', async () => {
      const mockStatusData = {
        deadline_id: 'rd-123',
        status: 'complete',
        created_at: expect.any(String),
        updated_at: expect.any(String),
      };

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: mockStatusData, error: null });

      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      const result = await deadlinesService.updateDeadlineStatus(
        deadlineId,
        'complete'
      );

      expect(mockInsert).toHaveBeenCalledWith({
        deadline_id: 'rd-123',
        status: 'complete',
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
      expect(result).toEqual(
        expect.objectContaining({
          deadline_id: 'rd-123',
          status: 'complete',
        })
      );
    });

    it('should update deadline status to set_aside', async () => {
      const mockStatusData = {
        deadline_id: 'rd-123',
        status: 'paused',
      };

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: mockStatusData, error: null });

      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      const result = await deadlinesService.updateDeadlineStatus(
        deadlineId,
        'paused'
      );

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'paused',
        })
      );
      expect(result).toEqual(mockStatusData);
    });

    it('should throw error when status update fails', async () => {
      const mockError = new Error('Status update failed');

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: mockError });

      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      await expect(
        deadlinesService.updateDeadlineStatus(deadlineId, 'complete')
      ).rejects.toThrow('Status update failed');
    });
  });

  describe('completeDeadline', () => {
    const userId = 'user-123';
    const deadlineId = 'rd-123';

    it('should complete deadline and update progress to max when needed', async () => {
      const mockDeadline = {
        id: 'rd-123',
        total_quantity: 300,
        progress: [{ current_progress: 150 }, { current_progress: 200 }],
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValueOnce({ data: mockDeadline, error: null });

      const mockInsert = jest.fn().mockReturnThis();

      mockSupabaseFrom
        .mockReturnValueOnce({
          select: mockSelect,
          eq: mockEq,
          single: mockSingle,
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      // Mock the updateDeadlineStatus method
      jest.spyOn(deadlinesService, 'updateDeadlineStatus').mockResolvedValue({
        id: 'status-123',
        deadline_id: 'rd-123',
        status: 'complete',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any);

      const result = await deadlinesService.completeDeadline(
        userId,
        deadlineId
      );

      expect(mockSelect).toHaveBeenCalledWith(`
        *,
        progress:deadline_progress(*)
      `);
      expect(mockInsert).toHaveBeenCalledWith({
        id: 'rdp-123',
        deadline_id: 'rd-123',
        current_progress: 300,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
      expect(result).toEqual(
        expect.objectContaining({
          deadline_id: 'rd-123',
          status: 'complete',
        })
      );
    });

    it('should complete deadline without updating progress when already at max', async () => {
      const mockDeadline = {
        id: 'rd-123',
        total_quantity: 300,
        progress: [{ current_progress: 300 }],
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: mockDeadline, error: null });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      jest.spyOn(deadlinesService, 'updateDeadlineStatus').mockResolvedValue({
        id: 'status-123',
        deadline_id: 'rd-123',
        status: 'complete',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any);

      const result = await deadlinesService.completeDeadline(
        userId,
        deadlineId
      );

      expect(mockSupabaseFrom).toHaveBeenCalledTimes(1); // Only for fetching deadline
      expect(result).toEqual(
        expect.objectContaining({
          deadline_id: 'rd-123',
          status: 'complete',
        })
      );
    });

    it('should handle deadline with no progress entries', async () => {
      const mockDeadline = {
        id: 'rd-123',
        total_quantity: 300,
        progress: [],
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: mockDeadline, error: null });

      const mockInsert = jest.fn().mockReturnThis();

      mockSupabaseFrom
        .mockReturnValueOnce({
          select: mockSelect,
          eq: mockEq,
          single: mockSingle,
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      jest.spyOn(deadlinesService, 'updateDeadlineStatus').mockResolvedValue({
        id: 'status-123',
        deadline_id: 'rd-123',
        status: 'complete',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any);

      const result = await deadlinesService.completeDeadline(
        userId,
        deadlineId
      );

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          current_progress: 300,
        })
      );
      expect(result).toEqual(
        expect.objectContaining({
          deadline_id: 'rd-123',
          status: 'complete',
        })
      );
    });

    it('should throw error when deadline fetch fails', async () => {
      const mockError = new Error('Deadline fetch failed');

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: mockError });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      await expect(
        deadlinesService.completeDeadline(userId, deadlineId)
      ).rejects.toThrow('Deadline fetch failed');
    });

    it('should throw error when progress update fails', async () => {
      const mockDeadline = {
        id: 'rd-123',
        total_quantity: 300,
        progress: [{ current_progress: 200 }],
      };

      const mockProgressError = new Error('Progress update failed');

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: mockDeadline, error: null });

      const mockInsert = jest
        .fn()
        .mockResolvedValue({ error: mockProgressError });

      mockSupabaseFrom
        .mockReturnValueOnce({
          select: mockSelect,
          eq: mockEq,
          single: mockSingle,
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      await expect(
        deadlinesService.completeDeadline(userId, deadlineId)
      ).rejects.toThrow('Progress update failed');
    });
  });

  describe('deleteFutureProgress', () => {
    const deadlineId = 'rd-123';
    const newProgress = 100;

    it('should delete future progress entries', async () => {
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockGt = jest.fn().mockResolvedValue({ error: null });

      mockSupabaseFrom.mockReturnValue({
        delete: mockDelete,
        eq: mockEq,
        gt: mockGt,
      });

      const result = await deadlinesService.deleteFutureProgress(
        deadlineId,
        newProgress
      );

      expect(mockSupabaseFrom).toHaveBeenCalledWith('deadline_progress');
      expect(mockEq).toHaveBeenCalledWith('deadline_id', deadlineId);
      expect(mockGt).toHaveBeenCalledWith('current_progress', newProgress);
      expect(result).toEqual({ deadlineId, newProgress });
    });

    it('should throw error when deletion fails', async () => {
      const mockError = new Error('Deletion failed');

      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockGt = jest.fn().mockResolvedValue({ error: mockError });

      mockSupabaseFrom.mockReturnValue({
        delete: mockDelete,
        eq: mockEq,
        gt: mockGt,
      });

      await expect(
        deadlinesService.deleteFutureProgress(deadlineId, newProgress)
      ).rejects.toThrow('Deletion failed');
    });
  });

  describe('getDeadlineHistory', () => {
    const userId = 'user-123';

    it('should return deadline history without format filter', async () => {
      const mockHistory = [
        {
          id: 'rd-1',
          book_title: 'Book 1',
          format: 'physical',
          deadline_progress: [{ current_progress: 100 }],
          deadline_status: [{ status: 'complete' }],
        },
        {
          id: 'rd-2',
          book_title: 'Book 2',
          format: 'eBook',
          deadline_progress: [{ current_progress: 200 }],
          deadline_status: [{ status: 'reading' }],
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest
        .fn()
        .mockResolvedValue({ data: mockHistory, error: null });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      });

      const params = { userId };
      const result = await deadlinesService.getDeadlineHistory(params);

      expect(mockSelect).toHaveBeenCalledWith(
        expect.stringContaining('deadline_progress')
      );
      expect(mockEq).toHaveBeenCalledWith('user_id', userId);
      expect(result).toEqual(mockHistory);
    });

    it('should return deadline history with format filter', async () => {
      const mockHistory = [
        {
          id: 'rd-1',
          book_title: 'Book 1',
          format: 'physical',
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockIn = jest
        .fn()
        .mockResolvedValue({ data: mockHistory, error: null });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
        in: mockIn,
      });

      const params = {
        userId,
        formats: ['physical', 'eBook'] as ('physical' | 'eBook' | 'audio')[],
      };

      const result = await deadlinesService.getDeadlineHistory(params);

      expect(mockIn).toHaveBeenCalledWith('format', ['physical', 'eBook']);
      expect(result).toEqual(mockHistory);
    });

    it('should throw error when history query fails', async () => {
      const mockError = new Error('History query failed');

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest
        .fn()
        .mockResolvedValue({ data: null, error: mockError });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      });

      const params = { userId };

      await expect(deadlinesService.getDeadlineHistory(params)).rejects.toThrow(
        'History query failed'
      );
    });
  });
});
