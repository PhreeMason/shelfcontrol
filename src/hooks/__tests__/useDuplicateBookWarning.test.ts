import { showDuplicateBookWarning } from '../useDuplicateBookWarning';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { SelectedBook } from '@/types/bookSearch';
import Toast from 'react-native-toast-message';

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
  },
}));

describe('showDuplicateBookWarning', () => {
  const mockSelectedBook: SelectedBook = {
    id: 'book-1',
    api_id: 'api-book-1',
    title: "Harry Potter and the Sorcerer's Stone",
    author: 'J.K. Rowling',
    cover_image_url: 'https://example.com/cover.jpg',
    total_pages: 309,
    total_duration: null,
    publication_date: '1997-06-26',
    publisher: 'Scholastic',
  };

  const mockDeadline: ReadingDeadlineWithProgress = {
    id: 'deadline-1',
    user_id: 'user-1',
    book_id: 'book-1',
    book_title: "Harry Potter and the Sorcerer's Stone",
    author: 'J.K. Rowling',
    deadline_date: '2024-12-31',
    total_quantity: 309,
    type: 'pages',
    format: 'physical',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    acquisition_source: null,
    flexibility: 'flexible',
    publishers: null,
    progress: [
      {
        id: 'progress-1',
        deadline_id: 'deadline-1',
        current_progress: 150,
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
        time_spent_reading: null,
        ignore_in_calcs: false,
      },
    ],
    status: [
      {
        id: 'status-1',
        deadline_id: 'deadline-1',
        status: 'reading',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not show warning when no duplicates exist', () => {
    showDuplicateBookWarning({
      selectedBook: mockSelectedBook,
      allDeadlines: [],
    });

    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('should show warning when book_id matches', () => {
    showDuplicateBookWarning({
      selectedBook: mockSelectedBook,
      allDeadlines: [mockDeadline],
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'warning',
        text1: 'This book already has a deadline',
        text2: expect.stringContaining('Status: reading'),
      })
    );
  });

  it('should show warning for case-insensitive title/author match', () => {
    const differentBookId: ReadingDeadlineWithProgress = {
      ...mockDeadline,
      book_id: 'different-id',
      book_title: "HARRY POTTER AND THE SORCERER'S STONE",
      author: 'j.k. rowling',
    };

    showDuplicateBookWarning({
      selectedBook: mockSelectedBook,
      allDeadlines: [differentBookId],
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'warning',
        text1: 'This book already has a deadline',
      })
    );
  });

  it('should include formatted due date in message', () => {
    showDuplicateBookWarning({
      selectedBook: mockSelectedBook,
      allDeadlines: [mockDeadline],
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        text2: expect.stringContaining('Due: Dec 31, 2024'),
      })
    );
  });

  it('should include progress percentage in message', () => {
    showDuplicateBookWarning({
      selectedBook: mockSelectedBook,
      allDeadlines: [mockDeadline],
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        text2: expect.stringContaining('49% complete'),
      })
    );
  });

  it('should handle deadline without progress', () => {
    const deadlineWithoutProgress: ReadingDeadlineWithProgress = {
      ...mockDeadline,
      progress: [],
    };

    showDuplicateBookWarning({
      selectedBook: mockSelectedBook,
      allDeadlines: [deadlineWithoutProgress],
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'warning',
        text2: expect.not.stringContaining('complete'),
      })
    );
  });

  it('should handle deadline without status', () => {
    const { status: _status, ...deadlineWithoutStatus } = mockDeadline;

    showDuplicateBookWarning({
      selectedBook: mockSelectedBook,
      allDeadlines: [deadlineWithoutStatus as ReadingDeadlineWithProgress],
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'warning',
        text2: expect.stringContaining('Status: unknown'),
      })
    );
  });

  it('should format status with spaces', () => {
    const pausedDeadline: ReadingDeadlineWithProgress = {
      ...mockDeadline,
      status: [
        {
          id: 'status-1',
          deadline_id: 'deadline-1',
          status: 'did_not_finish',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ],
    };

    showDuplicateBookWarning({
      selectedBook: mockSelectedBook,
      allDeadlines: [pausedDeadline],
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        text2: expect.stringContaining('Status: did not finish'),
      })
    );
  });

  it('should handle deadline with empty deadline_date', () => {
    const deadlineWithoutDate: ReadingDeadlineWithProgress = {
      ...mockDeadline,
      deadline_date: '',
    };

    showDuplicateBookWarning({
      selectedBook: mockSelectedBook,
      allDeadlines: [deadlineWithoutDate],
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        text2: expect.stringContaining('No deadline'),
      })
    );
  });

  it('should only check first duplicate when multiple exist', () => {
    const secondDeadline: ReadingDeadlineWithProgress = {
      ...mockDeadline,
      id: 'deadline-2',
      deadline_date: '2025-01-15',
    };

    showDuplicateBookWarning({
      selectedBook: mockSelectedBook,
      allDeadlines: [mockDeadline, secondDeadline],
    });

    expect(Toast.show).toHaveBeenCalledTimes(1);
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        text2: expect.stringContaining('Due: Dec 31, 2024'),
      })
    );
  });

  it('should use latest status when multiple status records exist', () => {
    const multipleStatuses: ReadingDeadlineWithProgress = {
      ...mockDeadline,
      status: [
        {
          id: 'status-1',
          deadline_id: 'deadline-1',
          status: 'pending',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'status-2',
          deadline_id: 'deadline-1',
          status: 'paused',
          created_at: '2024-01-05',
          updated_at: '2024-01-05',
        },
      ],
    };

    showDuplicateBookWarning({
      selectedBook: mockSelectedBook,
      allDeadlines: [multipleStatuses],
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        text2: expect.stringContaining('Status: paused'),
      })
    );
  });

  it('should use latest progress when multiple progress records exist', () => {
    const multipleProgress: ReadingDeadlineWithProgress = {
      ...mockDeadline,
      progress: [
        {
          id: 'progress-1',
          deadline_id: 'deadline-1',
          current_progress: 50,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          time_spent_reading: null,
          ignore_in_calcs: false,
        },
        {
          id: 'progress-2',
          deadline_id: 'deadline-1',
          current_progress: 200,
          created_at: '2024-01-05',
          updated_at: '2024-01-05',
          time_spent_reading: null,
          ignore_in_calcs: false,
        },
      ],
    };

    showDuplicateBookWarning({
      selectedBook: mockSelectedBook,
      allDeadlines: [multipleProgress],
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        text2: expect.stringContaining('65% complete'),
      })
    );
  });

  it('should configure toast with correct options', () => {
    showDuplicateBookWarning({
      selectedBook: mockSelectedBook,
      allDeadlines: [mockDeadline],
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        swipeable: true,
        type: 'warning',
        visibilityTime: 5000,
        position: 'top',
      })
    );
  });
});
