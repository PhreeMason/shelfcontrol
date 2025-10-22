import {
  createDateChangeHandler,
  createErrorToast,
  createFormatChangeHandler,
  createFormNavigation,
  createPriorityChangeHandler,
  createSuccessToast,
  findEarliestErrorStep,
  getFieldStep,
  getFormDefaultValues,
  handleBookSelection,
  initializeFormState,
  populateFormFromDeadline,
  populateFormFromParams,
  prepareDeadlineDetailsFromForm,
  prepareProgressDetailsFromForm,
} from '../deadlineFormUtils';
import { DeadlineFormData } from '../deadlineFormSchema';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { SelectedBook } from '@/types/bookSearch';

// Mock Toast
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

// Mock router
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(),
  },
}));

describe('deadlineFormUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFormDefaultValues', () => {
    it('should return correct defaults for new mode', () => {
      const defaults = getFormDefaultValues('new');

      expect(defaults.bookTitle).toBe('');
      expect(defaults.bookAuthor).toBe('');
      expect(defaults.format).toBe('eBook');
      expect(defaults.deadline_type).toBe('');
      expect(defaults.status).toBe('active');
      expect(defaults.flexibility).toBe('flexible');
      expect(defaults.deadline).toBeInstanceOf(Date);
    });

    it('should return correct defaults for edit mode', () => {
      const defaults = getFormDefaultValues('edit');

      expect(defaults.bookTitle).toBe('');
      expect(defaults.format).toBe('physical');
      expect(defaults.totalQuantity).toBe(0);
      expect(defaults.totalMinutes).toBe(0);
      expect(defaults.currentMinutes).toBe(0);
      expect(defaults.currentProgress).toBe(0);
    });

    it('should set deadline 2 weeks from now for new mode', () => {
      const now = new Date();
      const twoWeeksFromNow = new Date(
        now.getTime() + 14 * 24 * 60 * 60 * 1000
      );
      const defaults = getFormDefaultValues('new');

      const timeDiff = Math.abs(
        defaults.deadline!.getTime() - twoWeeksFromNow.getTime()
      );
      expect(timeDiff).toBeLessThan(1000); // Within 1 second
    });

    it('should set deadline 1 week from now for edit mode', () => {
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const defaults = getFormDefaultValues('edit');

      const timeDiff = Math.abs(
        defaults.deadline!.getTime() - oneWeekFromNow.getTime()
      );
      expect(timeDiff).toBeLessThan(1000); // Within 1 second
    });
  });

  describe('initializeFormState', () => {
    it('should initialize state for new mode', () => {
      const state = initializeFormState('new');

      expect(state.selectedFormat).toBe('eBook');
      expect(state.selectedStatus).toBe('active');
      expect(state.selectedPriority).toBe('flexible');
      expect(state.showDatePicker).toBe(false);
      expect(state.paceEstimate).toBe('');
      expect(state.isSubmitting).toBe(false);
      expect(state.deadlineFromPublicationDate).toBe(false);
      expect(state.previousPageCount).toBeNull();
    });

    it('should initialize state for edit mode', () => {
      const state = initializeFormState('edit');

      expect(state.selectedFormat).toBe('physical');
      expect(state.selectedStatus).toBe('active');
      expect(state.deadlineFromPublicationDate).toBeUndefined();
      expect(state.previousPageCount).toBeUndefined();
    });
  });

  describe('prepareDeadlineDetailsFromForm', () => {
    const mockFormData: DeadlineFormData = {
      bookTitle: 'Test Book',
      bookAuthor: 'Test Author',
      format: 'eBook',
      deadline_type: 'Library',
      deadline: new Date('2024-12-01'),
      totalQuantity: 300,
      flexibility: 'flexible',
      status: 'active',
      ignoreInCalcs: false,
    };

    it('should prepare details for new deadline', () => {
      const result = prepareDeadlineDetailsFromForm(
        mockFormData,
        'eBook',
        'flexible'
      );

      expect(result.book_title).toBe('Test Book');
      expect(result.author).toBe('Test Author');
      expect(result.format).toBe('eBook');
      expect(result.deadline_type).toBe('Library');
      expect(result.total_quantity).toBe(300);
      expect(result.flexibility).toBe('flexible');
      expect(result.deadline_date).toBe('2024-12-01T00:00:00.000Z');
      expect(result.id).toBe('');
    });

    it('should prepare details for existing deadline', () => {
      const existingDeadline: Partial<ReadingDeadlineWithProgress> = {
        id: 'existing-id',
        user_id: 'user-123',
        book_id: 'book-456',
        created_at: '2024-01-01T00:00:00.000Z',
      };

      const result = prepareDeadlineDetailsFromForm(
        mockFormData,
        'eBook',
        'flexible',
        existingDeadline as ReadingDeadlineWithProgress
      );

      expect(result.id).toBe('existing-id');
      expect(result.user_id).toBe('user-123');
      expect(result.book_id).toBe('book-456');
      expect(result.created_at).toBe('2024-01-01T00:00:00.000Z');
      expect(result.updated_at).toBeDefined();
    });

    it('should handle audio format with total minutes', () => {
      const audioFormData = {
        ...mockFormData,
        totalQuantity: 10,
        totalMinutes: 30,
      };

      const result = prepareDeadlineDetailsFromForm(
        audioFormData,
        'audio',
        'strict'
      );

      expect(result.total_quantity).toBe(630); // 10 hours * 60 + 30 minutes
    });

    it('should handle null author', () => {
      const formDataWithoutAuthor = {
        ...mockFormData,
        bookAuthor: undefined,
      };

      const result = prepareDeadlineDetailsFromForm(
        formDataWithoutAuthor,
        'eBook',
        'flexible'
      );

      expect(result.author).toBeNull();
    });

    it('should include acquisition_source when provided', () => {
      const formDataWithSource = {
        ...mockFormData,
        acquisition_source: 'NetGalley',
      };

      const result = prepareDeadlineDetailsFromForm(
        formDataWithSource,
        'eBook',
        'flexible'
      );

      expect(result.acquisition_source).toBe('NetGalley');
    });

    it('should set acquisition_source to null when not provided', () => {
      const result = prepareDeadlineDetailsFromForm(
        mockFormData,
        'eBook',
        'flexible'
      );

      expect(result.acquisition_source).toBeNull();
    });

    it('should include publishers when provided', () => {
      const formDataWithPublishers = {
        ...mockFormData,
        publishers: ['Penguin', 'HarperCollins'],
      };

      const result = prepareDeadlineDetailsFromForm(
        formDataWithPublishers,
        'eBook',
        'flexible'
      );

      expect(result.publishers).toEqual(['Penguin', 'HarperCollins']);
    });

    it('should set publishers to null when not provided', () => {
      const result = prepareDeadlineDetailsFromForm(
        mockFormData,
        'eBook',
        'flexible'
      );

      expect(result.publishers).toBeNull();
    });

    it('should filter empty strings from publishers array', () => {
      const formDataWithEmptyPublishers = {
        ...mockFormData,
        publishers: ['Penguin', '', 'HarperCollins', '  ', 'Macmillan'],
      };

      const result = prepareDeadlineDetailsFromForm(
        formDataWithEmptyPublishers,
        'eBook',
        'flexible'
      );

      expect(result.publishers).toEqual(['Penguin', 'HarperCollins', 'Macmillan']);
    });

    it('should set publishers to null when all strings are empty', () => {
      const formDataWithAllEmptyPublishers = {
        ...mockFormData,
        publishers: ['', '  ', '   '],
      };

      const result = prepareDeadlineDetailsFromForm(
        formDataWithAllEmptyPublishers,
        'eBook',
        'flexible'
      );

      expect(result.publishers).toBeNull();
    });
  });

  describe('prepareProgressDetailsFromForm', () => {
    const mockFormData: DeadlineFormData = {
      bookTitle: 'Test Book',
      format: 'eBook',
      deadline_type: 'Library',
      deadline: new Date(),
      totalQuantity: 300,
      currentProgress: 150,
      flexibility: 'flexible',
      status: 'active',
      ignoreInCalcs: false,
    };

    it('should prepare progress details for new deadline', () => {
      const result = prepareProgressDetailsFromForm(mockFormData, 'eBook');

      expect(result.current_progress).toBe(150);
      expect(result.deadline_id).toBe('');
      expect(result.id).toBe('');
    });

    it('should prepare progress details for existing deadline', () => {
      const existingDeadline: Partial<ReadingDeadlineWithProgress> = {
        id: 'deadline-123',
        progress: [
          {
            id: 'progress-456',
            current_progress: 100,
            deadline_id: 'deadline-123',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
            time_spent_reading: null,
            ignore_in_calcs: false,
          },
        ],
      };

      const result = prepareProgressDetailsFromForm(
        mockFormData,
        'eBook',
        existingDeadline as ReadingDeadlineWithProgress
      );

      expect(result.current_progress).toBe(150);
      expect(result.deadline_id).toBe('deadline-123');
      expect(result.id).toBe('progress-456');
    });

    it('should handle audio format with current minutes', () => {
      const audioFormData = {
        ...mockFormData,
        currentProgress: 5,
        currentMinutes: 45,
      };

      const result = prepareProgressDetailsFromForm(audioFormData, 'audio');

      expect(result.current_progress).toBe(345); // 5 hours * 60 + 45 minutes
    });

    it('should handle missing progress in existing deadline', () => {
      const existingDeadline: Partial<ReadingDeadlineWithProgress> = {
        id: 'deadline-123',
        progress: [],
      };

      const result = prepareProgressDetailsFromForm(
        mockFormData,
        'eBook',
        existingDeadline as ReadingDeadlineWithProgress
      );

      expect(result.id).toBe('');
      expect(result.deadline_id).toBe('deadline-123');
    });

    it('should include ignore_in_calcs as true when ignoreInCalcs is true', () => {
      const formDataWithIgnore = {
        ...mockFormData,
        ignoreInCalcs: true,
      };

      const result = prepareProgressDetailsFromForm(
        formDataWithIgnore,
        'eBook'
      );

      expect(result.ignore_in_calcs).toBe(true);
    });

    it('should include ignore_in_calcs as false when ignoreInCalcs is false', () => {
      const formDataWithIgnore = {
        ...mockFormData,
        ignoreInCalcs: false,
      };

      const result = prepareProgressDetailsFromForm(
        formDataWithIgnore,
        'eBook'
      );

      expect(result.ignore_in_calcs).toBe(false);
    });

    it('should include ignore_in_calcs as false when ignoreInCalcs is undefined', () => {
      const result = prepareProgressDetailsFromForm(mockFormData, 'eBook');

      expect(result.ignore_in_calcs).toBe(false);
    });

    it('should include ignore_in_calcs in existing deadline update', () => {
      const formDataWithIgnore = {
        ...mockFormData,
        ignoreInCalcs: true,
      };

      const existingDeadline: Partial<ReadingDeadlineWithProgress> = {
        id: 'deadline-123',
        progress: [
          {
            id: 'progress-456',
            current_progress: 100,
            deadline_id: 'deadline-123',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
            time_spent_reading: null,
            ignore_in_calcs: false,
          },
        ],
      };

      const result = prepareProgressDetailsFromForm(
        formDataWithIgnore,
        'eBook',
        existingDeadline as ReadingDeadlineWithProgress
      );

      expect(result.ignore_in_calcs).toBe(true);
    });

    it('should use FIRST progress record when multiple exist', () => {
      const existingDeadline: Partial<ReadingDeadlineWithProgress> = {
        id: 'deadline-123',
        progress: [
          {
            id: 'progress-first',
            current_progress: 50,
            deadline_id: 'deadline-123',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
            time_spent_reading: null,
            ignore_in_calcs: true,
          },
          {
            id: 'progress-second',
            current_progress: 100,
            deadline_id: 'deadline-123',
            created_at: '2024-01-05T00:00:00.000Z',
            updated_at: '2024-01-05T00:00:00.000Z',
            time_spent_reading: null,
            ignore_in_calcs: false,
          },
          {
            id: 'progress-latest',
            current_progress: 150,
            deadline_id: 'deadline-123',
            created_at: '2024-01-10T00:00:00.000Z',
            updated_at: '2024-01-10T00:00:00.000Z',
            time_spent_reading: null,
            ignore_in_calcs: false,
          },
        ],
      };

      const result = prepareProgressDetailsFromForm(
        mockFormData,
        'eBook',
        existingDeadline as ReadingDeadlineWithProgress
      );

      expect(result.id).toBe('progress-first');
      expect(result.ignore_in_calcs).toBe(false);
    });

    it('should update first progress record ignore_in_calcs when editing', () => {
      const formDataWithIgnore = {
        ...mockFormData,
        ignoreInCalcs: true,
      };

      const existingDeadline: Partial<ReadingDeadlineWithProgress> = {
        id: 'deadline-123',
        progress: [
          {
            id: 'progress-first',
            current_progress: 50,
            deadline_id: 'deadline-123',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
            time_spent_reading: null,
            ignore_in_calcs: false,
          },
          {
            id: 'progress-latest',
            current_progress: 150,
            deadline_id: 'deadline-123',
            created_at: '2024-01-10T00:00:00.000Z',
            updated_at: '2024-01-10T00:00:00.000Z',
            time_spent_reading: null,
            ignore_in_calcs: false,
          },
        ],
      };

      const result = prepareProgressDetailsFromForm(
        formDataWithIgnore,
        'eBook',
        existingDeadline as ReadingDeadlineWithProgress
      );

      expect(result.id).toBe('progress-first');
      expect(result.ignore_in_calcs).toBe(true);
    });
  });

  describe('populateFormFromParams', () => {
    const mockSetValue = jest.fn();

    beforeEach(() => {
      mockSetValue.mockClear();
    });

    it('should return defaults when no params provided', () => {
      const result = populateFormFromParams({}, mockSetValue);

      expect(result.selectedFormat).toBe('eBook');
      expect(result.selectedPriority).toBe('flexible');
    });

    it('should populate format from params', () => {
      const params = { format: 'audio' };
      const result = populateFormFromParams(params, mockSetValue);

      expect(result.selectedFormat).toBe('audio');
      expect(mockSetValue).toHaveBeenCalledWith('format', 'audio');
    });

    it('should populate flexibility from params', () => {
      const params = { flexibility: 'strict' };
      const result = populateFormFromParams(params, mockSetValue);

      expect(result.selectedPriority).toBe('strict');
      expect(mockSetValue).toHaveBeenCalledWith('flexibility', 'strict');
    });

    it('should populate book details from params', () => {
      const params = {
        bookTitle: 'Test Book',
        bookAuthor: 'Test Author',
        totalQuantity: '300',
        totalMinutes: '1200',
        book_id: 'book-123',
        api_id: 'api-456',
      };

      populateFormFromParams(params, mockSetValue);

      expect(mockSetValue).toHaveBeenCalledWith('bookTitle', 'Test Book');
      expect(mockSetValue).toHaveBeenCalledWith('bookAuthor', 'Test Author');
      expect(mockSetValue).toHaveBeenCalledWith('totalQuantity', 300);
      expect(mockSetValue).toHaveBeenCalledWith('totalMinutes', 1200);
      expect(mockSetValue).toHaveBeenCalledWith('book_id', 'book-123');
      expect(mockSetValue).toHaveBeenCalledWith('api_id', 'api-456');
    });

    it('should handle array values by taking first element', () => {
      const params = {
        format: ['physical', 'eBook'],
        bookTitle: ['Title 1', 'Title 2'],
      };

      const result = populateFormFromParams(params, mockSetValue);

      expect(result.selectedFormat).toBe('physical');
      expect(mockSetValue).toHaveBeenCalledWith('bookTitle', 'Title 1');
    });

    it('should ignore invalid format values', () => {
      const params = { format: 'invalid' };
      const result = populateFormFromParams(params, mockSetValue);

      expect(result.selectedFormat).toBe('eBook');
      expect(mockSetValue).not.toHaveBeenCalledWith('format', 'invalid');
    });

    it('should ignore invalid numeric values', () => {
      const params = { totalQuantity: 'not-a-number' };
      populateFormFromParams(params, mockSetValue);

      expect(mockSetValue).not.toHaveBeenCalledWith(
        'totalQuantity',
        expect.anything()
      );
    });
  });

  describe('populateFormFromDeadline', () => {
    const mockSetValue = jest.fn();

    beforeEach(() => {
      mockSetValue.mockClear();
    });

    it('should populate form from deadline data', () => {
      const deadline: any = {
        book_title: 'Test Book',
        author: 'Test Author',
        format: 'physical',
        deadline_type: 'Library',
        deadline_date: '2024-12-01T00:00:00.000Z',
        flexibility: 'strict',
        book_id: 'book-123',
        total_quantity: 300,
        status: [
          {
            status: 'reading',
            id: 'status-1',
            deadline_id: 'deadline-1',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
          },
        ],
        progress: [
          {
            current_progress: 150,
            id: 'progress-1',
            deadline_id: 'deadline-1',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
            time_spent_reading: null,
            ignore_in_calcs: false,
          },
        ],
      };

      const result = populateFormFromDeadline(
        deadline as ReadingDeadlineWithProgress,
        mockSetValue
      );

      expect(result.selectedFormat).toBe('physical');
      expect(result.selectedPriority).toBe('strict');
      expect(result.selectedStatus).toBe('active');
      expect(mockSetValue).toHaveBeenCalledWith('bookTitle', 'Test Book');
      expect(mockSetValue).toHaveBeenCalledWith('bookAuthor', 'Test Author');
      expect(mockSetValue).toHaveBeenCalledWith('totalQuantity', 300);
      expect(mockSetValue).toHaveBeenCalledWith('currentProgress', 150);
    });

    it('should handle audio format with time conversion', () => {
      const deadline: Partial<ReadingDeadlineWithProgress> = {
        book_title: 'Audio Book',
        format: 'audio',
        total_quantity: 630, // 10 hours 30 minutes
        progress: [
          {
            current_progress: 345, // 5 hours 45 minutes
            id: 'progress-2',
            deadline_id: 'deadline-2',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
            time_spent_reading: null,
            ignore_in_calcs: false,
          },
        ],
      };

      const result = populateFormFromDeadline(
        deadline as ReadingDeadlineWithProgress,
        mockSetValue
      );

      expect(result.selectedFormat).toBe('audio');
      expect(mockSetValue).toHaveBeenCalledWith('totalQuantity', 10);
      expect(mockSetValue).toHaveBeenCalledWith('totalMinutes', 30);
      expect(mockSetValue).toHaveBeenCalledWith('currentProgress', 5);
      expect(mockSetValue).toHaveBeenCalledWith('currentMinutes', 45);
    });

    it('should handle pending status', () => {
      const deadline: Partial<ReadingDeadlineWithProgress> = {
        book_title: 'Test Book',
        status: [
          {
            status: 'pending',
            id: 'status-3',
            deadline_id: 'deadline-3',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
          },
        ],
      };

      const result = populateFormFromDeadline(
        deadline as ReadingDeadlineWithProgress,
        mockSetValue
      );

      expect(result.selectedStatus).toBe('pending');
      expect(mockSetValue).toHaveBeenCalledWith('status', 'pending');
    });

    it('should handle missing data gracefully', () => {
      const deadline = {
        book_title: null,
        author: null,
        format: null,
      } as unknown as ReadingDeadlineWithProgress;

      populateFormFromDeadline(deadline, mockSetValue);

      expect(mockSetValue).toHaveBeenCalledWith('bookTitle', '');
      expect(mockSetValue).toHaveBeenCalledWith('bookAuthor', '');
      expect(mockSetValue).toHaveBeenCalledWith('format', 'physical');
    });

    it('should return safe defaults on error', () => {
      const deadline = null as any;

      const result = populateFormFromDeadline(deadline, mockSetValue);

      expect(result.selectedFormat).toBe('physical');
      expect(result.selectedPriority).toBe('flexible');
      expect(result.selectedStatus).toBe('active');
    });
  });

  describe('createFormatChangeHandler', () => {
    const mockSetValue = jest.fn();
    const mockSetSelectedFormat = jest.fn();
    const mockSetPreviousPageCount = jest.fn();
    const mockWatchedValues = { totalQuantity: 250 };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should store page count when switching to audio', () => {
      const handler = createFormatChangeHandler(
        'physical',
        mockWatchedValues,
        null,
        mockSetValue,
        mockSetSelectedFormat,
        mockSetPreviousPageCount
      );

      handler('audio');

      expect(mockSetPreviousPageCount).toHaveBeenCalledWith(250);
      expect(mockSetValue).toHaveBeenCalledWith('totalQuantity', '');
      expect(mockSetValue).toHaveBeenCalledWith('totalMinutes', undefined);
      expect(mockSetSelectedFormat).toHaveBeenCalledWith('audio');
      expect(mockSetValue).toHaveBeenCalledWith('format', 'audio');
    });

    it('should restore page count when switching from audio', () => {
      const handler = createFormatChangeHandler(
        'audio',
        mockWatchedValues,
        200,
        mockSetValue,
        mockSetSelectedFormat,
        mockSetPreviousPageCount
      );

      handler('physical');

      expect(mockSetValue).toHaveBeenCalledWith('totalQuantity', 200);
      expect(mockSetValue).toHaveBeenCalledWith('totalMinutes', undefined);
      expect(mockSetSelectedFormat).toHaveBeenCalledWith('physical');
      expect(mockSetValue).toHaveBeenCalledWith('format', 'physical');
    });

    it('should not store zero page count', () => {
      const watchedValuesWithZero = { totalQuantity: 0 };
      const handler = createFormatChangeHandler(
        'physical',
        watchedValuesWithZero,
        null,
        mockSetValue,
        mockSetSelectedFormat,
        mockSetPreviousPageCount
      );

      handler('audio');

      expect(mockSetPreviousPageCount).not.toHaveBeenCalled();
    });

    it('should handle switching between non-audio formats', () => {
      const handler = createFormatChangeHandler(
        'physical',
        mockWatchedValues,
        null,
        mockSetValue,
        mockSetSelectedFormat,
        mockSetPreviousPageCount
      );

      handler('eBook');

      expect(mockSetSelectedFormat).toHaveBeenCalledWith('eBook');
      expect(mockSetValue).toHaveBeenCalledWith('format', 'eBook');
      expect(mockSetPreviousPageCount).not.toHaveBeenCalled();
      expect(mockSetValue).not.toHaveBeenCalledWith(
        'totalQuantity',
        expect.anything()
      );
    });
  });

  describe('createPriorityChangeHandler', () => {
    const mockSetValue = jest.fn();
    const mockSetSelectedPriority = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle priority change', () => {
      const handler = createPriorityChangeHandler(
        mockSetValue,
        mockSetSelectedPriority
      );

      handler('strict');

      expect(mockSetSelectedPriority).toHaveBeenCalledWith('strict');
      expect(mockSetValue).toHaveBeenCalledWith('flexibility', 'strict');
    });
  });

  describe('createDateChangeHandler', () => {
    const mockSetValue = jest.fn();
    const mockSetShowDatePicker = jest.fn();
    const mockSetDeadlineFromPublicationDate = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle date change', () => {
      const handler = createDateChangeHandler(
        mockSetValue,
        mockSetShowDatePicker,
        mockSetDeadlineFromPublicationDate
      );

      const selectedDate = new Date('2024-12-01');
      handler(null, selectedDate);

      expect(mockSetShowDatePicker).toHaveBeenCalledWith(false);
      expect(mockSetValue).toHaveBeenCalledWith('deadline', selectedDate);
      expect(mockSetDeadlineFromPublicationDate).toHaveBeenCalledWith(false);
    });

    it('should handle no date selected', () => {
      const handler = createDateChangeHandler(
        mockSetValue,
        mockSetShowDatePicker
      );

      handler(null, undefined);

      expect(mockSetShowDatePicker).toHaveBeenCalledWith(false);
      expect(mockSetValue).not.toHaveBeenCalled();
    });

    it('should work without setDeadlineFromPublicationDate', () => {
      const handler = createDateChangeHandler(
        mockSetValue,
        mockSetShowDatePicker
      );

      const selectedDate = new Date('2024-12-01');
      handler(null, selectedDate);

      expect(mockSetValue).toHaveBeenCalledWith('deadline', selectedDate);
    });
  });

  describe('createFormNavigation', () => {
    const mockTrigger = jest.fn();
    const mockHandleSubmit = jest.fn();
    const mockSetCurrentStep = jest.fn();

    const baseConfig = {
      currentStep: 1,
      totalSteps: 3,
      canGoBack: true,
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockTrigger.mockResolvedValue(true);
    });

    it('should navigate to next step without validation for step 1', async () => {
      const navigation = createFormNavigation(
        baseConfig,
        mockTrigger,
        mockHandleSubmit,
        'eBook',
        mockSetCurrentStep,
        'new',
        () => ({})
      );

      await navigation.nextStep();

      expect(mockSetCurrentStep).toHaveBeenCalledWith(2);
      expect(mockTrigger).not.toHaveBeenCalled();
    });

    it('should validate before moving from step 2 to step 3', async () => {
      const config = { ...baseConfig, currentStep: 2 };
      const navigation = createFormNavigation(
        config,
        mockTrigger,
        mockHandleSubmit,
        'eBook',
        mockSetCurrentStep,
        'new',
        () => ({})
      );

      await navigation.nextStep();

      expect(mockTrigger).toHaveBeenCalledWith([
        'bookTitle',
        'format',
        'totalQuantity',
      ]);
      expect(mockSetCurrentStep).toHaveBeenCalledWith(3);
    });

    it('should include totalMinutes validation for audio format', async () => {
      const config = { ...baseConfig, currentStep: 2 };
      const navigation = createFormNavigation(
        config,
        mockTrigger,
        mockHandleSubmit,
        'audio',
        mockSetCurrentStep,
        'new',
        () => ({})
      );

      await navigation.nextStep();

      expect(mockTrigger).toHaveBeenCalledWith([
        'bookTitle',
        'format',
        'totalQuantity',
        'totalMinutes',
      ]);
    });

    it('should not navigate if validation fails', async () => {
      mockTrigger.mockResolvedValue(false);
      const config = { ...baseConfig, currentStep: 2 };
      const navigation = createFormNavigation(
        config,
        mockTrigger,
        mockHandleSubmit,
        'eBook',
        mockSetCurrentStep,
        'new',
        () => ({})
      );

      await navigation.nextStep();

      expect(mockSetCurrentStep).not.toHaveBeenCalled();
    });

    it('should submit form on final step', async () => {
      const config = { ...baseConfig, currentStep: 3 };
      const navigation = createFormNavigation(
        config,
        mockTrigger,
        mockHandleSubmit,
        'eBook',
        mockSetCurrentStep,
        'new',
        () => ({})
      );

      await navigation.nextStep();

      expect(mockHandleSubmit).toHaveBeenCalled();
      expect(mockSetCurrentStep).not.toHaveBeenCalled();
    });

    it('should go back to previous step', () => {
      const config = { ...baseConfig, currentStep: 2 };
      const navigation = createFormNavigation(
        config,
        mockTrigger,
        mockHandleSubmit,
        'eBook',
        mockSetCurrentStep,
        'new',
        () => ({})
      );

      navigation.goBack();

      expect(mockSetCurrentStep).toHaveBeenCalledWith(1);
    });
  });

  describe('handleBookSelection', () => {
    const mockSetValue = jest.fn();
    const mockSetCurrentStep = jest.fn();
    const mockSetDeadlineFromPublicationDate = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should set publication date as deadline if in future', () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const book: SelectedBook = {
        id: 'book-1',
        api_id: 'api-1',
        title: 'Future Book',
        publication_date: futureDate.toISOString(),
      };

      handleBookSelection(
        book,
        mockSetValue,
        mockSetCurrentStep,
        mockSetDeadlineFromPublicationDate
      );

      expect(mockSetValue).toHaveBeenCalledWith('deadline', futureDate);
      expect(mockSetDeadlineFromPublicationDate).toHaveBeenCalledWith(true);
      expect(mockSetCurrentStep).toHaveBeenCalledWith(2);
    });

    it('should normalize and set publication date with non-standard timezone format', () => {
      const book: SelectedBook = {
        id: 'book-1',
        api_id: 'api-1',
        title: 'Future Book',
        publication_date: '2025-10-28 07:00:00+00',
      };

      handleBookSelection(
        book,
        mockSetValue,
        mockSetCurrentStep,
        mockSetDeadlineFromPublicationDate
      );

      const expectedDate = new Date('2025-10-28 07:00:00+00:00');
      expect(mockSetValue).toHaveBeenCalledWith('deadline', expectedDate);
      expect(mockSetDeadlineFromPublicationDate).toHaveBeenCalledWith(true);
      expect(mockSetCurrentStep).toHaveBeenCalledWith(2);
    });

    it('should handle publication date with standard timezone format', () => {
      const book: SelectedBook = {
        id: 'book-1',
        api_id: 'api-1',
        title: 'Future Book',
        publication_date: '2025-10-28T07:00:00+00:00',
      };

      handleBookSelection(
        book,
        mockSetValue,
        mockSetCurrentStep,
        mockSetDeadlineFromPublicationDate
      );

      const expectedDate = new Date('2025-10-28T07:00:00+00:00');
      expect(mockSetValue).toHaveBeenCalledWith('deadline', expectedDate);
      expect(mockSetDeadlineFromPublicationDate).toHaveBeenCalledWith(true);
      expect(mockSetCurrentStep).toHaveBeenCalledWith(2);
    });

    it('should not set publication date if in past', () => {
      const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const book: SelectedBook = {
        id: 'book-1',
        api_id: 'api-2',
        title: 'Past Book',
        publication_date: pastDate.toISOString(),
      };

      handleBookSelection(
        book,
        mockSetValue,
        mockSetCurrentStep,
        mockSetDeadlineFromPublicationDate
      );

      expect(mockSetValue).not.toHaveBeenCalledWith(
        'deadline',
        expect.anything()
      );
      expect(mockSetDeadlineFromPublicationDate).toHaveBeenCalledWith(false);
      expect(mockSetCurrentStep).toHaveBeenCalledWith(2);
    });

    it('should handle book without publication date', () => {
      const book: SelectedBook = {
        id: 'book-1',
        api_id: 'api-3',
        title: 'Book Without Date',
      };

      handleBookSelection(
        book,
        mockSetValue,
        mockSetCurrentStep,
        mockSetDeadlineFromPublicationDate
      );

      expect(mockSetDeadlineFromPublicationDate).toHaveBeenCalledWith(false);
      expect(mockSetCurrentStep).toHaveBeenCalledWith(2);
    });

    it('should handle invalid publication date gracefully', () => {
      const book: SelectedBook = {
        id: 'book-1',
        api_id: 'api-4',
        title: 'Book With Invalid Date',
        publication_date: 'invalid-date',
      };

      handleBookSelection(
        book,
        mockSetValue,
        mockSetCurrentStep,
        mockSetDeadlineFromPublicationDate
      );

      expect(mockSetValue).not.toHaveBeenCalledWith(
        'deadline',
        expect.anything()
      );
      expect(mockSetDeadlineFromPublicationDate).toHaveBeenCalledWith(false);
      expect(mockSetCurrentStep).toHaveBeenCalledWith(2);
    });

    it('should handle null book', () => {
      handleBookSelection(
        null,
        mockSetValue,
        mockSetCurrentStep,
        mockSetDeadlineFromPublicationDate
      );

      expect(mockSetValue).not.toHaveBeenCalledWith(
        'deadline',
        expect.anything()
      );
      expect(mockSetDeadlineFromPublicationDate).toHaveBeenCalledWith(false);
      expect(mockSetCurrentStep).toHaveBeenCalledWith(2);
    });

    it('should set publishers array when book has publisher', () => {
      const book: SelectedBook = {
        id: 'book-1',
        api_id: 'api-1',
        title: 'Test Book',
        publisher: 'Penguin Random House',
      };

      handleBookSelection(
        book,
        mockSetValue,
        mockSetCurrentStep,
        mockSetDeadlineFromPublicationDate
      );

      expect(mockSetValue).toHaveBeenCalledWith('publishers', [
        'Penguin Random House',
      ]);
      expect(mockSetCurrentStep).toHaveBeenCalledWith(2);
    });

    it('should not set publishers when book has no publisher', () => {
      const book: SelectedBook = {
        id: 'book-1',
        api_id: 'api-1',
        title: 'Test Book',
      };

      handleBookSelection(
        book,
        mockSetValue,
        mockSetCurrentStep,
        mockSetDeadlineFromPublicationDate
      );

      expect(mockSetValue).not.toHaveBeenCalledWith(
        'publishers',
        expect.anything()
      );
    });

    it('should not set publishers when publisher is null', () => {
      const book: SelectedBook = {
        id: 'book-1',
        api_id: 'api-1',
        title: 'Test Book',
        publisher: null,
      };

      handleBookSelection(
        book,
        mockSetValue,
        mockSetCurrentStep,
        mockSetDeadlineFromPublicationDate
      );

      expect(mockSetValue).not.toHaveBeenCalledWith(
        'publishers',
        expect.anything()
      );
    });

    it('should handle both publication date and publisher together', () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const book: SelectedBook = {
        id: 'book-1',
        api_id: 'api-1',
        title: 'Future Book',
        publication_date: futureDate.toISOString(),
        publisher: 'HarperCollins',
      };

      handleBookSelection(
        book,
        mockSetValue,
        mockSetCurrentStep,
        mockSetDeadlineFromPublicationDate
      );

      expect(mockSetValue).toHaveBeenCalledWith('deadline', futureDate);
      expect(mockSetValue).toHaveBeenCalledWith('publishers', [
        'HarperCollins',
      ]);
      expect(mockSetDeadlineFromPublicationDate).toHaveBeenCalledWith(true);
      expect(mockSetCurrentStep).toHaveBeenCalledWith(2);
    });

    it('should set publisher even when publication date is in the past', () => {
      const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const book: SelectedBook = {
        id: 'book-1',
        api_id: 'api-1',
        title: 'Past Book',
        publication_date: pastDate.toISOString(),
        publisher: 'Simon & Schuster',
      };

      handleBookSelection(
        book,
        mockSetValue,
        mockSetCurrentStep,
        mockSetDeadlineFromPublicationDate
      );

      expect(mockSetValue).not.toHaveBeenCalledWith(
        'deadline',
        expect.anything()
      );
      expect(mockSetValue).toHaveBeenCalledWith('publishers', [
        'Simon & Schuster',
      ]);
      expect(mockSetDeadlineFromPublicationDate).toHaveBeenCalledWith(false);
      expect(mockSetCurrentStep).toHaveBeenCalledWith(2);
    });
  });

  describe('createSuccessToast', () => {
    const Toast = require('react-native-toast-message');
    const { router } = require('expo-router');

    it('should create success toast for new mode', () => {
      const toastFn = createSuccessToast('new');
      toastFn();

      expect(Toast.show).toHaveBeenCalledWith({
        swipeable: true,
        type: 'success',
        text1: 'Deadline added successfully!',
        autoHide: true,
        visibilityTime: 1500,
        position: 'top',
      });
    });

    it('should create success toast for edit mode', () => {
      const toastFn = createSuccessToast('edit');
      toastFn();

      expect(Toast.show).toHaveBeenCalledWith({
        swipeable: true,
        type: 'success',
        text1: 'Deadline updated successfully!',
        autoHide: true,
        visibilityTime: 1500,
        position: 'top',
      });
    });

    it('should navigate correctly for new mode', () => {
      const toastFn = createSuccessToast('new');
      toastFn();

      expect(router.replace).toHaveBeenCalledWith('/');
    });

    it('should navigate correctly for edit mode when can go back', () => {
      const { router } = require('expo-router');
      router.canGoBack.mockReturnValue(true);

      const toastFn = createSuccessToast('edit');
      toastFn();

      expect(router.back).toHaveBeenCalled();
    });

    it('should navigate to home for edit mode when cannot go back', () => {
      const { router } = require('expo-router');
      router.canGoBack.mockReturnValue(false);

      const toastFn = createSuccessToast('edit');
      toastFn();

      expect(router.replace).toHaveBeenCalledWith('/');
    });
  });

  describe('createErrorToast', () => {
    const Toast = require('react-native-toast-message');

    it('should create error toast for new mode', () => {
      const errorFn = createErrorToast('new');
      const error = new Error('Test error');
      errorFn(error);

      expect(Toast.show).toHaveBeenCalledWith({
        swipeable: true,
        type: 'error',
        text1: 'Failed to add deadline',
        text2: 'Test error',
        autoHide: true,
        visibilityTime: 1500,
        position: 'top',
      });
    });

    it('should create error toast for edit mode', () => {
      const errorFn = createErrorToast('edit');
      const error = new Error('Update failed');
      errorFn(error);

      expect(Toast.show).toHaveBeenCalledWith({
        swipeable: true,
        type: 'error',
        text1: 'Failed to update deadline',
        text2: 'Update failed',
        autoHide: true,
        visibilityTime: 1500,
        position: 'top',
      });
    });

    it('should handle error without message', () => {
      const errorFn = createErrorToast('new');
      const error = new Error();
      errorFn(error);

      expect(Toast.show).toHaveBeenCalledWith({
        swipeable: true,
        type: 'error',
        text1: 'Failed to add deadline',
        text2: 'Please try again',
        autoHide: true,
        visibilityTime: 1500,
        position: 'top',
      });
    });
  });

  describe('getFieldStep', () => {
    describe('new mode', () => {
      it('should return step 1 for api_id', () => {
        expect(getFieldStep('api_id', 'new')).toBe(1);
      });

      it('should return step 1 for book_id', () => {
        expect(getFieldStep('book_id', 'new')).toBe(1);
      });

      it('should return step 2 for bookTitle', () => {
        expect(getFieldStep('bookTitle', 'new')).toBe(2);
      });

      it('should return step 2 for bookAuthor', () => {
        expect(getFieldStep('bookAuthor', 'new')).toBe(2);
      });

      it('should return step 2 for format', () => {
        expect(getFieldStep('format', 'new')).toBe(2);
      });

      it('should return step 3 for deadline_type', () => {
        expect(getFieldStep('deadline_type', 'new')).toBe(3);
      });

      it('should return step 3 for acquisition_source', () => {
        expect(getFieldStep('acquisition_source', 'new')).toBe(3);
      });

      it('should return step 3 for publishers', () => {
        expect(getFieldStep('publishers', 'new')).toBe(3);
      });

      it('should return step 2 for totalQuantity', () => {
        expect(getFieldStep('totalQuantity', 'new')).toBe(2);
      });

      it('should return step 2 for totalMinutes', () => {
        expect(getFieldStep('totalMinutes', 'new')).toBe(2);
      });

      it('should return step 2 for status', () => {
        expect(getFieldStep('status', 'new')).toBe(2);
      });

      it('should return step 4 for deadline', () => {
        expect(getFieldStep('deadline', 'new')).toBe(4);
      });

      it('should return step 4 for flexibility', () => {
        expect(getFieldStep('flexibility', 'new')).toBe(4);
      });

      it('should return step 4 for currentProgress', () => {
        expect(getFieldStep('currentProgress', 'new')).toBe(4);
      });

      it('should return step 4 for currentMinutes', () => {
        expect(getFieldStep('currentMinutes', 'new')).toBe(4);
      });
    });

    describe('edit mode', () => {
      it('should return step 1 for bookTitle', () => {
        expect(getFieldStep('bookTitle', 'edit')).toBe(1);
      });

      it('should return step 1 for format', () => {
        expect(getFieldStep('format', 'edit')).toBe(1);
      });

      it('should return step 2 for deadline_type', () => {
        expect(getFieldStep('deadline_type', 'edit')).toBe(2);
      });

      it('should return step 2 for acquisition_source', () => {
        expect(getFieldStep('acquisition_source', 'edit')).toBe(2);
      });

      it('should return step 2 for publishers', () => {
        expect(getFieldStep('publishers', 'edit')).toBe(2);
      });

      it('should return step 1 for totalQuantity', () => {
        expect(getFieldStep('totalQuantity', 'edit')).toBe(1);
      });

      it('should return step 3 for deadline', () => {
        expect(getFieldStep('deadline', 'edit')).toBe(3);
      });

      it('should return step 3 for flexibility', () => {
        expect(getFieldStep('flexibility', 'edit')).toBe(3);
      });

      it('should return step 3 for api_id', () => {
        expect(getFieldStep('api_id', 'edit')).toBe(3);
      });

      it('should return step 3 for book_id', () => {
        expect(getFieldStep('book_id', 'edit')).toBe(3);
      });
    });
  });

  describe('findEarliestErrorStep', () => {
    it('should return null for empty errors object', () => {
      expect(findEarliestErrorStep({}, 'new')).toBeNull();
    });

    it('should return null for undefined errors', () => {
      expect(findEarliestErrorStep(undefined as any, 'new')).toBeNull();
    });

    it('should find step 3 for deadline_type error in new mode', () => {
      const errors = { deadline_type: { message: 'Required' } };
      expect(findEarliestErrorStep(errors, 'new')).toBe(3);
    });

    it('should find step 4 for deadline error in new mode', () => {
      const errors = { deadline: { message: 'Required' } };
      expect(findEarliestErrorStep(errors, 'new')).toBe(4);
    });

    it('should find earliest step with multiple errors in new mode', () => {
      const errors = {
        deadline_type: { message: 'Required' },
        deadline: { message: 'Required' },
        flexibility: { message: 'Required' },
      };
      expect(findEarliestErrorStep(errors, 'new')).toBe(3);
    });

    it('should find step 2 for deadline_type error in edit mode', () => {
      const errors = { deadline_type: { message: 'Required' } };
      expect(findEarliestErrorStep(errors, 'edit')).toBe(2);
    });

    it('should find step 3 for deadline error in edit mode', () => {
      const errors = { deadline: { message: 'Required' } };
      expect(findEarliestErrorStep(errors, 'edit')).toBe(3);
    });

    it('should find earliest step with multiple errors in edit mode', () => {
      const errors = {
        bookTitle: { message: 'Required' },
        deadline: { message: 'Required' },
      };
      expect(findEarliestErrorStep(errors, 'edit')).toBe(1);
    });

    it('should handle multiple errors on same step', () => {
      const errors = {
        bookTitle: { message: 'Required' },
        deadline_type: { message: 'Required' },
        totalQuantity: { message: 'Required' },
      };
      expect(findEarliestErrorStep(errors, 'new')).toBe(2);
    });
  });

  describe('createFormNavigation - error navigation', () => {
    const mockTrigger = jest.fn();
    const mockHandleSubmit = jest.fn();
    const mockSetCurrentStep = jest.fn();
    const mockGetFormErrors = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
      mockTrigger.mockResolvedValue(true);
      mockGetFormErrors.mockReturnValue({});
    });

    it('should navigate to step 3 when on step 4 with step 3 errors in new mode', async () => {
      const config = { currentStep: 4, totalSteps: 4, canGoBack: true };
      mockTrigger.mockResolvedValue(false);
      mockGetFormErrors.mockReturnValue({
        deadline_type: { message: 'Required' },
      });

      const navigation = createFormNavigation(
        config,
        mockTrigger,
        mockHandleSubmit,
        'eBook',
        mockSetCurrentStep,
        'new',
        mockGetFormErrors
      );

      await navigation.nextStep();

      expect(mockTrigger).toHaveBeenCalledWith();
      expect(mockSetCurrentStep).toHaveBeenCalledWith(3);
      expect(mockHandleSubmit).not.toHaveBeenCalled();
    });

    it('should stay on current step if already on earliest error step', async () => {
      const config = { currentStep: 3, totalSteps: 4, canGoBack: true };
      mockTrigger.mockResolvedValue(false);
      mockGetFormErrors.mockReturnValue({
        deadline_type: { message: 'Required' },
      });

      const navigation = createFormNavigation(
        config,
        mockTrigger,
        mockHandleSubmit,
        'eBook',
        mockSetCurrentStep,
        'new',
        mockGetFormErrors
      );

      await navigation.nextStep();

      expect(mockSetCurrentStep).not.toHaveBeenCalled();
      expect(mockHandleSubmit).not.toHaveBeenCalled();
    });

    it('should submit when validation passes on final step', async () => {
      const config = { currentStep: 4, totalSteps: 4, canGoBack: true };
      mockTrigger.mockResolvedValue(true);

      const navigation = createFormNavigation(
        config,
        mockTrigger,
        mockHandleSubmit,
        'eBook',
        mockSetCurrentStep,
        'new',
        mockGetFormErrors
      );

      await navigation.nextStep();

      expect(mockTrigger).toHaveBeenCalledWith();
      expect(mockHandleSubmit).toHaveBeenCalled();
      expect(mockSetCurrentStep).not.toHaveBeenCalled();
    });

    it('should navigate to step 2 when on step 3 with step 2 errors in edit mode', async () => {
      const config = { currentStep: 3, totalSteps: 3, canGoBack: true };
      mockTrigger.mockResolvedValue(false);
      mockGetFormErrors.mockReturnValue({
        deadline_type: { message: 'Required' },
      });

      const navigation = createFormNavigation(
        config,
        mockTrigger,
        mockHandleSubmit,
        'eBook',
        mockSetCurrentStep,
        'edit',
        mockGetFormErrors
      );

      await navigation.nextStep();

      expect(mockTrigger).toHaveBeenCalledWith();
      expect(mockSetCurrentStep).toHaveBeenCalledWith(2);
      expect(mockHandleSubmit).not.toHaveBeenCalled();
    });

    it('should handle multiple errors and navigate to earliest', async () => {
      const config = { currentStep: 4, totalSteps: 4, canGoBack: true };
      mockTrigger.mockResolvedValue(false);
      mockGetFormErrors.mockReturnValue({
        deadline_type: { message: 'Required' },
        deadline: { message: 'Required' },
        flexibility: { message: 'Required' },
      });

      const navigation = createFormNavigation(
        config,
        mockTrigger,
        mockHandleSubmit,
        'eBook',
        mockSetCurrentStep,
        'new',
        mockGetFormErrors
      );

      await navigation.nextStep();

      expect(mockSetCurrentStep).toHaveBeenCalledWith(3);
    });
  });
});
