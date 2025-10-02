import { SelectedBook } from '@/types/bookSearch';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { convertMinutesToHoursAndMinutes } from './audiobookTimeUtils';
import {
  calculateCurrentProgressFromForm,
  calculateTotalQuantityFromForm,
} from './deadlineCalculations';
import { DeadlineFormData } from './deadlineFormSchema';
import { ROUTES } from '@/constants/routes';

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
  triggerValidation: (fields?: (keyof DeadlineFormData)[]) => Promise<boolean>,
  handleSubmit: () => void,
  selectedFormat: 'physical' | 'eBook' | 'audio',
  setCurrentStep: (step: number) => void,
  mode: FormMode,
  getFormErrors: () => Record<string, any>
): FormNavigationHandlers => {
  const nextStep = async () => {
    if (config.currentStep < config.totalSteps) {
      // Step 1 -> Step 2: No validation needed for new form
      if (config.currentStep === 1) {
        setCurrentStep(2);
        return;
      }

      // Step 2 -> Step 3: Validate book details
      if (config.currentStep === 2) {
        const fieldsToValidate: (keyof DeadlineFormData)[] = [
          'bookTitle',
          'format',
          'source',
          'totalQuantity',
        ];

        if (selectedFormat === 'audio') {
          fieldsToValidate.push('totalMinutes');
        }

        const result = await triggerValidation(fieldsToValidate);

        if (result) {
          setCurrentStep(config.currentStep + 1);
        }
      }
    } else {
      const isValid = await triggerValidation();

      if (!isValid) {
        const errors = getFormErrors();
        const earliestErrorStep = findEarliestErrorStep(errors, mode);

        if (earliestErrorStep !== null && earliestErrorStep !== config.currentStep) {
          setCurrentStep(earliestErrorStep);
        }
        return;
      }

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
    source: '' as const,
    status: 'active' as const,
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
    flexibility: 'flexible' as const,
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

  const baseDetails = {
    author: data.bookAuthor || null,
    book_title: data.bookTitle,
    deadline_date: data.deadline.toISOString(),
    total_quantity: finalTotalQuantity,
    format: selectedFormat,
    source: data.source,
    flexibility: selectedPriority,
    book_id: data.book_id || null,
  };

  if (existingDeadline) {
    return {
      id: existingDeadline.id,
      ...baseDetails,
      book_id: data.book_id || existingDeadline.book_id || null,
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
    const latestProgress =
      existingDeadline.progress && existingDeadline.progress.length > 0
        ? existingDeadline.progress[existingDeadline.progress.length - 1]
        : null;

    return {
      id: latestProgress?.id || '',
      current_progress: finalCurrentProgress,
      deadline_id: existingDeadline.id,
    };
  }

  return {
    id: '',
    current_progress: finalCurrentProgress,
    deadline_id: '',
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

  const source = str(params.source);
  if (source) setValue('source', source);

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
    setValue('source', deadline.source || '');
    setValue(
      'deadline',
      deadline.deadline_date ? new Date(deadline.deadline_date) : new Date()
    );
    setValue('flexibility', deadline.flexibility || 'flexible');
    setValue('book_id', deadline.book_id || undefined);

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

    const latestProgress =
      deadline.progress && deadline.progress.length > 0
        ? deadline.progress[deadline.progress.length - 1]
        : null;

    if (deadline.format === 'audio') {
      // Convert total minutes to hours and minutes for form display
      const { hours, minutes } = convertMinutesToHoursAndMinutes(
        deadline.total_quantity || 0
      );
      setValue('totalQuantity', hours);
      setValue('totalMinutes', minutes);

      // Convert current progress minutes to hours and minutes for form display
      const currentProgressMinutes = latestProgress?.current_progress || 0;
      const { hours: currentHours, minutes: currentMins } =
        convertMinutesToHoursAndMinutes(currentProgressMinutes);
      setValue('currentProgress', currentHours);
      setValue('currentMinutes', currentMins);
    } else {
      setValue('totalQuantity', deadline.total_quantity || 0);
      setValue('currentProgress', latestProgress?.current_progress || 0);
    }

    return { selectedFormat, selectedPriority, selectedStatus };
  } catch (error) {
    console.error('Error populating form from deadline:', error);
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
        'source',
        'totalQuantity',
      ];

      if (selectedFormat === 'audio') {
        fieldsToValidate.push('totalMinutes');
      }

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
    const publicationDate = new Date(book.publication_date);
    const now = new Date();

    // Check if publication date is in the future
    if (publicationDate > now) {
      setValue('deadline', publicationDate);
      setDeadlineFromPublicationDate(true);
    } else {
      setDeadlineFromPublicationDate(false);
    }
  } else {
    setDeadlineFromPublicationDate(false);
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
    if (mode === 'new') {
      router.replace(ROUTES.HOME);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(ROUTES.HOME);
      }
    }
    Toast.show({
      swipeable: true,
      type: 'success',
      text1: message,
      autoHide: true,
      visibilityTime: 1500,
      position: 'top',
    });
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
    switch (field) {
      case 'api_id':
      case 'book_id':
        return 1;
      case 'bookTitle':
      case 'bookAuthor':
      case 'format':
      case 'source':
      case 'totalQuantity':
      case 'totalMinutes':
      case 'status':
        return 2;
      case 'deadline':
      case 'flexibility':
      case 'currentProgress':
      case 'currentMinutes':
        return 3;
      default:
        return 1;
    }
  } else {
    switch (field) {
      case 'bookTitle':
      case 'bookAuthor':
      case 'format':
      case 'source':
      case 'totalQuantity':
      case 'totalMinutes':
      case 'status':
        return 1;
      case 'deadline':
      case 'flexibility':
      case 'currentProgress':
      case 'currentMinutes':
      case 'api_id':
      case 'book_id':
        return 2;
      default:
        return 1;
    }
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
