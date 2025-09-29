import {
  createDateChangeHandler,
  createErrorToast,
  createFormatChangeHandler,
  createFormNavigation,
  createPriorityChangeHandler,
  createSuccessToast,
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
      expect(defaults.source).toBe('');
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
      source: 'Library',
      deadline: new Date('2024-12-01'),
      totalQuantity: 300,
      flexibility: 'flexible',
      status: 'active',
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
      expect(result.source).toBe('Library');
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
  });

  describe('prepareProgressDetailsFromForm', () => {
    const mockFormData: DeadlineFormData = {
      bookTitle: 'Test Book',
      format: 'eBook',
      source: 'Library',
      deadline: new Date(),
      totalQuantity: 300,
      currentProgress: 150,
      flexibility: 'flexible',
      status: 'active',
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
      const deadline: Partial<ReadingDeadlineWithProgress> = {
        book_title: 'Test Book',
        author: 'Test Author',
        format: 'physical',
        source: 'Library',
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
        mockSetCurrentStep
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
        mockSetCurrentStep
      );

      await navigation.nextStep();

      expect(mockTrigger).toHaveBeenCalledWith([
        'bookTitle',
        'format',
        'source',
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
        mockSetCurrentStep
      );

      await navigation.nextStep();

      expect(mockTrigger).toHaveBeenCalledWith([
        'bookTitle',
        'format',
        'source',
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
        mockSetCurrentStep
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
        mockSetCurrentStep
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
        mockSetCurrentStep
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
});
