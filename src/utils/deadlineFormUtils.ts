import { ROUTES } from '@/constants/routes';
import { SelectedBook } from '@/types/bookSearch';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { convertMinutesToHoursAndMinutes } from './audiobookTimeUtils';
import { normalizeServerDate } from './dateNormalization';
import {
  calculateCurrentProgressFromForm,
  calculateTotalQuantityFromForm,
} from './deadlineCalculations';
import { DeadlineFormData } from './deadlineFormSchema';
import { posthog } from '@/lib/posthog';

export type FormMode = 'new' | 'edit';

export interface FormNavigationConfig {
  currentStep: number;
  totalSteps: number;
  canGoBack: boolean;
}

export interface FormNavigationHandlers {
  nextStep: () => Promise<void>;
  goBack: () => void;
}

export interface FormStateConfig {
  selectedFormat: 'physical' | 'eBook' | 'audio';
  selectedStatus: 'pending' | 'active';
  selectedPriority: 'flexible' | 'strict';
  showDatePicker: boolean;
  paceEstimate: string;
  isSubmitting: boolean;
  deadlineFromPublicationDate?: boolean;
  previousPageCount?: number | null;
}

/**
 * Creates navigation handlers for form steps
 */
export const createFormNavigation = (
  config: FormNavigationConfig,
  _triggerValidation: (fields?: (keyof DeadlineFormData)[]) => Promise<boolean>,
  handleSubmit: () => void,
  _selectedFormat: 'physical' | 'eBook' | 'audio',
  setCurrentStep: (step: number) => void,
  _mode: FormMode,
  _getFormErrors: () => Record<string, any>,
  _setFocus: (field: keyof DeadlineFormData) => void
): FormNavigationHandlers => {
  const nextStep = async () => {
    if (config.currentStep < config.totalSteps) {
      // Step 1 -> Step 2: No validation needed (book search step)
      // Just advance to the next step
      setCurrentStep(config.currentStep + 1);
      return;
    } else {
      // Final step - submit form
      // handleSubmit from react-hook-form will:
      // 1. Validate all fields and mark them as touched
      // 2. If valid, call the onSubmit callback
      // 3. If invalid, show errors and call the error callback
      handleSubmit();
    }
  };

  const goBack = () => {
    if (config.currentStep > 1) {
      setCurrentStep(config.currentStep - 1);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(ROUTES.HOME);
      }
    }
  };

  return { nextStep, goBack };
};

/**
 * Gets default form values based on mode
 */
export const getFormDefaultValues = (
  mode: FormMode
): Partial<DeadlineFormData> => {
  const commonDefaults = {
    bookTitle: '',
    bookAuthor: '',
    format: 'eBook' as const,
    type: '' as const,
    acquisition_source: '' as const,
    publishers: undefined as string[] | undefined,
    status: 'active' as const,
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    flexibility: 'flexible' as const,
    ignoreInCalcs: true,
  };

  if (mode === 'new') {
    return commonDefaults;
  }

  // Edit mode defaults
  return {
    ...commonDefaults,
    format: 'physical' as const,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    totalQuantity: 0,
    totalMinutes: 0,
    currentMinutes: 0,
    currentProgress: 0,
  };
};

/**
 * Initializes form state based on mode and optional data
 */
export const initializeFormState = (mode: FormMode): FormStateConfig => {
  const baseState: FormStateConfig = {
    selectedFormat: mode === 'new' ? 'eBook' : 'physical',
    selectedStatus: 'active',
    selectedPriority: 'flexible',
    showDatePicker: false,
    paceEstimate: '',
    isSubmitting: false,
  };

  if (mode === 'new') {
    baseState.deadlineFromPublicationDate = false;
    baseState.previousPageCount = null;
  }

  return baseState;
};

/**
 * Prepares deadline details from form data for submission
 */
export const prepareDeadlineDetailsFromForm = (
  data: DeadlineFormData,
  selectedFormat: 'physical' | 'eBook' | 'audio',
  selectedPriority: 'flexible' | 'strict',
  existingDeadline?: ReadingDeadlineWithProgress
): any => {
  const finalTotalQuantity = calculateTotalQuantityFromForm(
    selectedFormat,
    data.totalQuantity,
    data.totalMinutes
  );

  const filteredPublishers = data.publishers?.filter(p => p.trim().length > 0);

  const baseDetails = {
    author: data.bookAuthor || null,
    book_title: data.bookTitle,
    deadline_date: data.deadline.toISOString(),
    total_quantity: finalTotalQuantity,
    format: selectedFormat,
    deadline_type: data.type,
    acquisition_source: data.acquisition_source || null,
    publishers: filteredPublishers?.length ? filteredPublishers : null,
    flexibility: selectedPriority,
    book_id: data.book_id || null,
    // Initialize cover_image_url - will be overwritten by upload/URL logic in form container
    cover_image_url: null,
  };

  if (existingDeadline) {
    return {
      id: existingDeadline.id,
      ...baseDetails,
      book_id: data.book_id || existingDeadline.book_id || null,
      // Preserve existing cover_image_url unless explicitly changed
      cover_image_url: existingDeadline.cover_image_url,
      user_id: existingDeadline.user_id,
      created_at: existingDeadline.created_at,
      updated_at: new Date().toISOString(),
    };
  }

  return {
    id: '',
    ...baseDetails,
  };
};

/**
 * Prepares progress details from form data for submission
 */
export const prepareProgressDetailsFromForm = (
  data: DeadlineFormData,
  selectedFormat: 'physical' | 'eBook' | 'audio',
  existingDeadline?: ReadingDeadlineWithProgress
): any => {
  const finalCurrentProgress = calculateCurrentProgressFromForm(
    selectedFormat,
    data.currentProgress || 0,
    data.currentMinutes
  );

  if (existingDeadline) {
    const firstProgress =
      existingDeadline.progress && existingDeadline.progress.length > 0
        ? existingDeadline.progress
            .slice()
            .sort(
              (a, b) =>
                normalizeServerDate(a.created_at).valueOf() -
                normalizeServerDate(b.created_at).valueOf()
            )[0]
        : null;

    return {
      id: firstProgress?.id || '',
      current_progress: finalCurrentProgress,
      deadline_id: existingDeadline.id,
      ignore_in_calcs: data.ignoreInCalcs ?? true,
    };
  }

  return {
    id: '',
    current_progress: finalCurrentProgress,
    deadline_id: '',
    ignore_in_calcs: data.ignoreInCalcs ?? true,
  };
};

/**
 * Populates form from URL parameters
 */
export const populateFormFromParams = (
  params: Record<string, any>,
  setValue: (field: keyof DeadlineFormData, value: any) => void
): {
  selectedFormat: 'physical' | 'eBook' | 'audio';
  selectedPriority: 'flexible' | 'strict';
} => {
  if (!params) {
    return { selectedFormat: 'eBook', selectedPriority: 'flexible' };
  }

  const str = (v: any) => (Array.isArray(v) ? v[0] : v);

  let selectedFormat: 'physical' | 'eBook' | 'audio' = 'eBook';
  const format = str(params.format);
  if (format && ['physical', 'eBook', 'audio'].includes(format)) {
    selectedFormat = format as any;
    setValue('format', format as any);
  }

  let selectedPriority: 'flexible' | 'strict' = 'flexible';
  const flexibility = str(params.flexibility);
  if (flexibility && ['flexible', 'strict'].includes(flexibility)) {
    selectedPriority = flexibility as any;
    setValue('flexibility', flexibility as any);
  }

  const bookTitle = str(params.bookTitle);
  if (bookTitle) setValue('bookTitle', bookTitle);

  const bookAuthor = str(params.bookAuthor);
  if (bookAuthor) setValue('bookAuthor', bookAuthor);

  const type = str(params.type);
  if (type) setValue('type', type);

  const acquisition_source = str(params.acquisition_source);
  if (acquisition_source) setValue('acquisition_source', acquisition_source);

  const totalQuantity = str(params.totalQuantity);
  if (totalQuantity && !isNaN(Number(totalQuantity))) {
    setValue('totalQuantity', Number(totalQuantity));
  }

  const totalMinutes = str(params.totalMinutes);
  if (totalMinutes && !isNaN(Number(totalMinutes))) {
    setValue('totalMinutes', Number(totalMinutes));
  }

  const book_id = str((params as any).book_id);
  if (book_id) setValue('book_id', book_id);

  const api_id = str((params as any).api_id);
  if (api_id) setValue('api_id', api_id);

  return { selectedFormat, selectedPriority };
};

/**
 * Populates form from existing deadline data
 */
export const populateFormFromDeadline = (
  deadline: ReadingDeadlineWithProgress,
  setValue: (field: keyof DeadlineFormData, value: any) => void
): {
  selectedFormat: 'physical' | 'eBook' | 'audio';
  selectedPriority: 'flexible' | 'strict';
  selectedStatus: 'pending' | 'active';
} => {
  try {
    // Safely set form values with fallbacks
    setValue('bookTitle', deadline.book_title || '');
    setValue('bookAuthor', deadline.author || '');
    setValue('format', deadline.format || 'physical');
    setValue('type', (deadline as any).type || '');
    setValue('acquisition_source', (deadline as any).acquisition_source || '');
    setValue('publishers', (deadline as any).publishers || undefined);
    setValue(
      'deadline',
      deadline.deadline_date ? new Date(deadline.deadline_date) : new Date()
    );
    setValue('flexibility', deadline.flexibility || 'flexible');
    setValue('book_id', deadline.book_id || undefined);

    // Set cover image fields
    setValue('cover_image_url', deadline.cover_image_url || undefined);
    // Determine the mode based on the URL
    if (deadline.cover_image_url) {
      if (deadline.cover_image_url.startsWith('http')) {
        setValue('cover_image_source', 'url');
      } else {
        setValue('cover_image_source', 'upload');
      }
    } else {
      setValue('cover_image_source', 'none');
    }

    const selectedFormat = deadline.format || 'physical';
    const selectedPriority = (deadline.flexibility || 'flexible') as
      | 'flexible'
      | 'strict';

    const latestStatus =
      deadline.status && deadline.status.length > 0
        ? deadline.status[deadline.status.length - 1]
        : null;

    let selectedStatus: 'pending' | 'active' = 'active';
    if (latestStatus) {
      selectedStatus = latestStatus.status === 'pending' ? 'pending' : 'active';
      setValue('status', selectedStatus);
    }

    const firstProgress =
      deadline.progress && deadline.progress.length > 0
        ? deadline.progress
            .slice()
            .sort(
              (a, b) =>
                normalizeServerDate(a.created_at).valueOf() -
                normalizeServerDate(b.created_at).valueOf()
            )[0]
        : null;

    if (deadline.format === 'audio') {
      // Convert total minutes to hours and minutes for form display
      const { hours, minutes } = convertMinutesToHoursAndMinutes(
        deadline.total_quantity || 0
      );
      setValue('totalQuantity', hours);
      setValue('totalMinutes', minutes);

      // Convert current progress minutes to hours and minutes for form display
      const currentProgressMinutes = firstProgress?.current_progress || 0;
      const { hours: currentHours, minutes: currentMins } =
        convertMinutesToHoursAndMinutes(currentProgressMinutes);
      setValue('currentProgress', currentHours);
      setValue('currentMinutes', currentMins);
    } else {
      setValue('totalQuantity', deadline.total_quantity || 0);
      setValue('currentProgress', firstProgress?.current_progress || 0);
    }

    setValue('ignoreInCalcs', firstProgress?.ignore_in_calcs ?? false);

    return { selectedFormat, selectedPriority, selectedStatus };
  } catch (error) {
    console.error('Error populating form from deadline:', error);
    posthog.captureException(error instanceof Error ? error : new Error(String(error)));
    return {
      selectedFormat: 'physical' as const,
      selectedPriority: 'flexible' as const,
      selectedStatus: 'active' as const,
    };
  }
};

/**
 * Creates format change handler with previous page count memory
 */
export const createFormatChangeHandler = (
  currentFormat: 'physical' | 'eBook' | 'audio',
  watchedValues: any,
  previousPageCount: number | null,
  setValue: (field: keyof DeadlineFormData, value: any) => void,
  setSelectedFormat: (format: 'physical' | 'eBook' | 'audio') => void,
  setPreviousPageCount: (count: number | null) => void
) => {
  return (format: 'physical' | 'eBook' | 'audio') => {
    const currentTotalQuantity = watchedValues.totalQuantity;

    // Store previous page count when switching away from physical/eBook to audio
    if (
      (currentFormat === 'physical' || currentFormat === 'eBook') &&
      format === 'audio'
    ) {
      if (currentTotalQuantity && currentTotalQuantity > 0) {
        setPreviousPageCount(currentTotalQuantity);
      }
      // Reset values for audio format
      setValue('totalQuantity', '');
      setValue('totalMinutes', undefined);
    }

    // Restore previous page count when switching back to physical/eBook from audio
    if (
      currentFormat === 'audio' &&
      (format === 'physical' || format === 'eBook')
    ) {
      if (previousPageCount && previousPageCount > 0) {
        setValue('totalQuantity', previousPageCount);
      }
      // Clear audio-specific fields
      setValue('totalMinutes', undefined);
    }

    setSelectedFormat(format);
    setValue('format', format);
  };
};

/**
 * Creates priority change handler
 */
export const createPriorityChangeHandler = (
  setValue: (field: keyof DeadlineFormData, value: any) => void,
  setSelectedPriority: (priority: 'flexible' | 'strict') => void
) => {
  return (priority: 'flexible' | 'strict') => {
    setSelectedPriority(priority);
    setValue('flexibility', priority);
  };
};

/**
 * Creates date change handler
 */
export const createDateChangeHandler = (
  setValue: (field: keyof DeadlineFormData, value: any) => void,
  setShowDatePicker: (show: boolean) => void,
  setDeadlineFromPublicationDate?: (value: boolean) => void
) => {
  return (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setValue('deadline', selectedDate);
      if (setDeadlineFromPublicationDate) {
        setDeadlineFromPublicationDate(false);
      }
    }
  };
};

/**
 * Creates validation handler for form steps
 */
export const createValidationHandler = (
  selectedFormat: 'physical' | 'eBook' | 'audio',
  trigger: (fields: (keyof DeadlineFormData)[]) => Promise<boolean>
) => {
  return async (currentStep: number): Promise<boolean> => {
    if (currentStep === 2) {
      const fieldsToValidate: (keyof DeadlineFormData)[] = [
        'bookTitle',
        'format',
        'totalQuantity',
      ];

      if (selectedFormat === 'audio') {
        fieldsToValidate.push('totalMinutes');
      }

      return await trigger(fieldsToValidate);
    }

    if (currentStep === 3) {
      const fieldsToValidate: (keyof DeadlineFormData)[] = ['type'];
      return await trigger(fieldsToValidate);
    }

    return true;
  };
};

/**
 * Handles book selection for new deadline form
 */
export const handleBookSelection = (
  book: SelectedBook | null,
  setValue: (field: keyof DeadlineFormData, value: any) => void,
  setCurrentStep: (step: number) => void,
  setDeadlineFromPublicationDate: (value: boolean) => void
) => {
  if (book?.publication_date) {
    let dateString = book.publication_date;

    if (dateString.match(/\+\d{2}$/)) {
      dateString = dateString.replace(/\+(\d{2})$/, '+$1:00');
    }

    const publicationDate = new Date(dateString);
    const now = new Date();

    if (!isNaN(publicationDate.getTime()) && publicationDate > now) {
      setValue('deadline', publicationDate);
      setDeadlineFromPublicationDate(true);
    } else {
      setDeadlineFromPublicationDate(false);
    }
  } else {
    setDeadlineFromPublicationDate(false);
  }

  if (book?.publisher) {
    setValue('publishers', [book.publisher]);
    setValue('isPublisherAutofilled', true);
  }

  // Store book's cover for preview
  if (book?.cover_image_url) {
    setValue('book_cover_image_url', book.cover_image_url);
  }

  setCurrentStep(2);
};

/**
 * Creates success toast notification
 */
export const createSuccessToast = (mode: FormMode) => {
  const message =
    mode === 'new'
      ? 'Deadline added successfully!'
      : 'Deadline updated successfully!';

  return () => {
    // Show toast first
    Toast.show({
      swipeable: true,
      type: 'success',
      text1: message,
      autoHide: true,
      visibilityTime: 2000,
      position: 'top',
    });

    // Navigate immediately after
    if (mode === 'new') {
      router.replace(ROUTES.HOME);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(ROUTES.HOME);
      }
    }
  };
};

/**
 * Creates error toast notification
 */
export const createErrorToast = (mode: FormMode) => {
  const title =
    mode === 'new' ? 'Failed to add deadline' : 'Failed to update deadline';

  return (error: Error) => {
    Toast.show({
      swipeable: true,
      type: 'error',
      text1: title,
      text2: error.message || 'Please try again',
      autoHide: true,
      visibilityTime: 1500,
      position: 'top',
    });
  };
};

/**
 * Maps form fields to their corresponding step number based on form mode
 */
export const getFieldStep = (
  field: keyof DeadlineFormData,
  mode: FormMode
): number => {
  if (mode === 'new') {
    // New mode: 2 steps total
    // Step 1: Book search (api_id, book_id)
    // Step 2: All form fields (book details, additional info, schedule)
    switch (field) {
      case 'api_id':
      case 'book_id':
        return 1;
      // All other fields are on Step 2 (combined form)
      case 'bookTitle':
      case 'bookAuthor':
      case 'format':
      case 'totalQuantity':
      case 'totalMinutes':
      case 'status':
      case 'type':
      case 'acquisition_source':
      case 'publishers':
      case 'deadline':
      case 'flexibility':
      case 'currentProgress':
      case 'currentMinutes':
        return 2;
      default:
        return 2;
    }
  } else {
    // Edit mode: 1 step total (all fields on single page)
    // All fields belong to step 1
    return 1;
  }
};

/**
 * Finds the earliest step number that contains validation errors
 */
export const findEarliestErrorStep = (
  errors: Record<string, any>,
  mode: FormMode
): number | null => {
  if (!errors || Object.keys(errors).length === 0) {
    return null;
  }

  let earliestStep: number | null = null;

  for (const field of Object.keys(errors)) {
    const step = getFieldStep(field as keyof DeadlineFormData, mode);
    if (earliestStep === null || step < earliestStep) {
      earliestStep = step;
    }
  }

  return earliestStep;
};

/**
 * Gets the first error field in display order
 */
export const getFirstErrorField = (
  errors: Record<string, any>,
  mode: FormMode
): keyof DeadlineFormData | null => {
  if (!errors || Object.keys(errors).length === 0) {
    return null;
  }

  // Field order matches the form display order
  const fieldOrder: (keyof DeadlineFormData)[] =
    mode === 'new'
      ? [
          'bookTitle',
          'bookAuthor',
          'format',
          'type',
          'acquisition_source',
          'publishers',
          'totalQuantity',
          'totalMinutes',
          'currentProgress',
          'currentMinutes',
          'deadline',
          'flexibility',
          'status',
        ]
      : [
          'bookTitle',
          'bookAuthor',
          'format',
          'type',
          'acquisition_source',
          'publishers',
          'totalQuantity',
          'totalMinutes',
          'currentProgress',
          'currentMinutes',
          'deadline',
          'flexibility',
          'status',
        ];

  for (const field of fieldOrder) {
    if (errors[field]) {
      return field;
    }
  }

  // If no field matches the order, return the first error key
  return Object.keys(errors)[0] as keyof DeadlineFormData;
};
