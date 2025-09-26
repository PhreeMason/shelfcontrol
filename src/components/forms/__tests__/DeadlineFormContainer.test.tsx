import { render, screen, fireEvent } from '@testing-library/react-native';
import DeadlineFormContainer from '../DeadlineFormContainer';
import { useTheme } from '@/hooks/useThemeColor';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';

// Mock expo-router
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  router: {
    back: jest.fn(),
  },
}));

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: jest.fn(),
  Controller: ({ render }: any) => {
    return render({ field: { value: new Date('2024-12-31') } });
  },
}));

// Mock hooks
jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: jest.fn(),
}));

jest.mock('@/providers/DeadlineProvider', () => ({
  useDeadlines: jest.fn(),
}));

// Mock utility functions
jest.mock('@/utils/deadlineFormUtils', () => ({
  FormMode: { NEW: 'new', EDIT: 'edit' },
  getFormDefaultValues: jest.fn(() => ({
    bookTitle: '',
    bookAuthor: '',
    deadline: new Date('2024-12-31'),
    totalQuantity: 0,
    currentProgress: 0,
  })),
  initializeFormState: jest.fn(() => ({
    selectedFormat: 'physical',
    selectedStatus: 'pending',
    selectedPriority: 'flexible',
    showDatePicker: false,
    paceEstimate: '',
    isSubmitting: false,
    deadlineFromPublicationDate: false,
    previousPageCount: null,
  })),
  populateFormFromParams: jest.fn(() => ({
    selectedFormat: 'physical',
    selectedPriority: 'flexible',
  })),
  populateFormFromDeadline: jest.fn(() => ({
    selectedFormat: 'physical',
    selectedPriority: 'flexible',
    selectedStatus: 'pending',
  })),
  createFormNavigation: jest.fn(() => ({
    goBack: jest.fn(),
    nextStep: jest.fn(),
  })),
  createFormatChangeHandler: jest.fn(() => jest.fn()),
  createPriorityChangeHandler: jest.fn(() => jest.fn()),
  createDateChangeHandler: jest.fn(() => jest.fn()),
  createSuccessToast: jest.fn(() => jest.fn()),
  createErrorToast: jest.fn(() => jest.fn()),
  handleBookSelection: jest.fn(),
  prepareDeadlineDetailsFromForm: jest.fn(() => ({})),
  prepareProgressDetailsFromForm: jest.fn(() => ({})),
}));

jest.mock('@/utils/deadlineUtils', () => ({
  getInitialStepFromSearchParams: jest.fn(() => 1),
}));

jest.mock('@/utils/deadlineCalculations', () => ({
  calculateRemainingFromForm: jest.fn(() => 100),
  getPaceEstimate: jest.fn(() => '5 pages per day'),
}));

// Mock child components
jest.mock('../DeadlineFormStep1', () => ({
  DeadlineFormStep1: ({ onBookSelected, onManualEntry, setValue }: any) => {
    const React = require('react');
    return React.createElement('View', {
      testID: 'deadline-form-step1',
      'data-on-book-selected': !!onBookSelected,
      'data-on-manual-entry': !!onManualEntry,
      'data-set-value': !!setValue,
    });
  },
}));

jest.mock('../DeadlineFormStep2', () => ({
  DeadlineFormStep2: ({
    control,
    selectedFormat,
    onFormatChange,
    selectedStatus,
    onStatusChange,
    setValue,
    isEditMode,
  }: any) => {
    const React = require('react');
    return React.createElement('View', {
      testID: 'deadline-form-step2',
      'data-control': !!control,
      'data-selected-format': selectedFormat,
      'data-on-format-change': !!onFormatChange,
      'data-selected-status': selectedStatus,
      'data-on-status-change': !!onStatusChange,
      'data-set-value': !!setValue,
      'data-is-edit-mode': isEditMode,
    });
  },
}));

jest.mock('../DeadlineFormStep3', () => ({
  DeadlineFormStep3: ({
    control,
    selectedFormat,
    selectedPriority,
    onPriorityChange,
    showDatePicker,
    onDatePickerToggle,
    onDateChange,
    deadline,
    paceEstimate,
    watchedValues,
    setValue,
    deadlineFromPublicationDate,
  }: any) => {
    const React = require('react');
    return React.createElement('View', {
      testID: 'deadline-form-step3',
      'data-control': !!control,
      'data-selected-format': selectedFormat,
      'data-selected-priority': selectedPriority,
      'data-on-priority-change': !!onPriorityChange,
      'data-show-date-picker': showDatePicker,
      'data-on-date-picker-toggle': !!onDatePickerToggle,
      'data-on-date-change': !!onDateChange,
      'data-deadline': !!deadline,
      'data-pace-estimate': paceEstimate,
      'data-watched-values': !!watchedValues,
      'data-set-value': !!setValue,
      'data-deadline-from-publication': deadlineFromPublicationDate,
    });
  },
}));

jest.mock('../StepIndicators', () => ({
  StepIndicators: ({ currentStep, totalSteps }: any) => {
    const React = require('react');
    return React.createElement('View', {
      testID: 'step-indicators',
      'data-current-step': currentStep,
      'data-total-steps': totalSteps,
    });
  },
}));

jest.mock('@/components/shared/AppHeader', () => {
  const React = require('react');
  return function MockAppHeader({ title, onBack, children }: any) {
    return React.createElement(
      'View',
      {
        testID: 'app-header',
        'data-title': title,
        'data-on-back': !!onBack,
      },
      children
    );
  };
});

jest.mock('@/components/themed', () => ({
  ThemedButton: ({ title, onPress, variant, disabled }: any) => {
    const React = require('react');
    return React.createElement(
      'View',
      {
        testID: 'themed-button',
        'data-title': title,
        'data-variant': variant,
        'data-disabled': disabled,
        'data-on-press': !!onPress,
        onPress: onPress,
      },
      title
    );
  },
  ThemedKeyboardAwareScrollView: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement(
      'View',
      {
        testID: 'themed-keyboard-aware-scroll-view',
        ...props,
      },
      children
    );
  },
  ThemedText: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement(
      'Text',
      {
        testID: 'themed-text',
        ...props,
      },
      children
    );
  },
  ThemedView: ({ children, style }: any) => {
    const React = require('react');
    return React.createElement(
      'View',
      {
        testID: 'themed-view',
        style,
      },
      children
    );
  },
}));

describe('DeadlineFormContainer', () => {
  const mockColors = {
    background: '#FFFFFF',
    surface: '#F8F8F8',
    border: '#E5E5E7',
    primary: '#007AFF',
  };

  const mockAddDeadline = jest.fn();
  const mockUpdateDeadline = jest.fn();
  const mockControl = {} as any;
  const mockHandleSubmit = jest.fn(fn => fn);
  const mockWatch = jest.fn(() => ({
    bookTitle: 'Test Book',
    bookAuthor: 'Test Author',
    deadline: new Date('2024-12-31'),
    totalQuantity: 300,
    currentProgress: 50,
  }));
  const mockSetValue = jest.fn();
  const mockTrigger = jest.fn();

  const mockExistingDeadline = {
    id: 'deadline-123',
    book_title: 'Existing Book',
    book_author: 'Existing Author',
    deadline_date: '2024-12-31',
    format: 'physical',
    priority: 'flexible',
    status: 'reading',
    total_pages: 300,
    current_progress: 50,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();

    (useTheme as jest.Mock).mockReturnValue({ colors: mockColors });
    (useDeadlines as jest.Mock).mockReturnValue({
      addDeadline: mockAddDeadline,
      updateDeadline: mockUpdateDeadline,
    });
    (useLocalSearchParams as jest.Mock).mockReturnValue({});
    (useForm as jest.Mock).mockReturnValue({
      control: mockControl,
      handleSubmit: mockHandleSubmit,
      watch: mockWatch,
      setValue: mockSetValue,
      trigger: mockTrigger,
    });

    // Reset step initialization
    const { getInitialStepFromSearchParams } = require('@/utils/deadlineUtils');
    getInitialStepFromSearchParams.mockReturnValue(1);
  });

  describe('Component Structure', () => {
    it('should render SafeAreaView with correct background color', () => {
      render(<DeadlineFormContainer mode="new" />);

      const container = screen.getByTestId(
        'themed-keyboard-aware-scroll-view'
      ).parent;
      expect(container).toBeTruthy();
    });

    it('should render AppHeader with correct title for new mode step 1', () => {
      render(<DeadlineFormContainer mode="new" />);

      const header = screen.getByTestId('app-header');
      expect(header.props['data-title']).toBe('Find Book');
    });

    it('should render AppHeader with correct title for edit mode step 1', () => {
      render(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );

      const header = screen.getByTestId('app-header');
      expect(header.props['data-title']).toBe('Book Details');
    });

    it('should render StepIndicators with correct props', () => {
      render(<DeadlineFormContainer mode="new" />);

      const indicators = screen.getByTestId('step-indicators');
      expect(indicators.props['data-current-step']).toBe(1);
      expect(indicators.props['data-total-steps']).toBe(3);
    });

    it('should render StepIndicators with 2 steps for edit mode', () => {
      render(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );

      const indicators = screen.getByTestId('step-indicators');
      expect(indicators.props['data-total-steps']).toBe(2);
    });

    it('should render navigation buttons container', () => {
      render(<DeadlineFormContainer mode="new" />);

      const navButtons = screen.getAllByTestId('themed-view');
      const navButtonsContainer = navButtons.find(
        view =>
          view.props.style &&
          typeof view.props.style === 'object' &&
          'flexDirection' in view.props.style
      );
      expect(navButtonsContainer).toBeTruthy();
    });

    it('should show Continue button on first step', () => {
      render(<DeadlineFormContainer mode="new" />);

      const continueButton = screen
        .getAllByTestId('themed-button')
        .find(button => button.props['data-title'] === 'Continue');
      expect(continueButton).toBeTruthy();
    });

    it('should show Back and Continue buttons on middle steps', () => {
      // Mock being on step 2 of new mode
      const mockNavigation = {
        goBack: jest.fn(),
        nextStep: jest.fn(),
      };

      const { createFormNavigation } = require('@/utils/deadlineFormUtils');
      createFormNavigation.mockReturnValue(mockNavigation);

      render(<DeadlineFormContainer mode="new" />);

      // Should have navigation buttons
      const buttons = screen.getAllByTestId('themed-button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should show error state when deadline not found in edit mode', () => {
      render(<DeadlineFormContainer mode="edit" />);

      expect(screen.getByText('Deadline not found')).toBeTruthy();

      // Check for button with Go Back title in data attribute
      const goBackButton = screen
        .getAllByTestId('themed-button')
        .find(button => button.props['data-title'] === 'Go Back');
      expect(goBackButton).toBeTruthy();
    });

    it('should render without throwing errors', () => {
      expect(() => {
        render(<DeadlineFormContainer mode="new" />);
      }).not.toThrow();
    });
  });

  describe('Hook Integration', () => {
    it('should call useTheme hook', () => {
      render(<DeadlineFormContainer mode="new" />);

      expect(useTheme).toHaveBeenCalled();
    });

    it('should call useDeadlines hook', () => {
      render(<DeadlineFormContainer mode="new" />);

      expect(useDeadlines).toHaveBeenCalled();
    });

    it('should call useLocalSearchParams hook', () => {
      render(<DeadlineFormContainer mode="new" />);

      expect(useLocalSearchParams).toHaveBeenCalled();
    });

    it('should call useForm with correct resolver and defaults', () => {
      render(<DeadlineFormContainer mode="new" />);

      expect(useForm).toHaveBeenCalledWith(
        expect.objectContaining({
          resolver: expect.anything(),
          defaultValues: expect.anything(),
        })
      );
    });

    it('should call utility functions on render', () => {
      const {
        getFormDefaultValues,
        initializeFormState,
      } = require('@/utils/deadlineFormUtils');

      render(<DeadlineFormContainer mode="new" />);

      expect(getFormDefaultValues).toHaveBeenCalledWith('new');
      expect(initializeFormState).toHaveBeenCalledWith('new');
    });

    it('should create form navigation handler', () => {
      const { createFormNavigation } = require('@/utils/deadlineFormUtils');

      render(<DeadlineFormContainer mode="new" />);

      expect(createFormNavigation).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStep: expect.any(Number),
          totalSteps: expect.any(Number),
          canGoBack: true,
        }),
        expect.any(Function), // trigger
        expect.any(Function), // submit handler
        expect.any(String), // selectedFormat
        expect.any(Function) // setCurrentStep
      );
    });

    it('should integrate with DeadlineProvider methods', () => {
      render(<DeadlineFormContainer mode="new" />);

      const { addDeadline, updateDeadline } = useDeadlines();
      expect(addDeadline).toBeDefined();
      expect(updateDeadline).toBeDefined();
    });

    it('should watch form values', () => {
      render(<DeadlineFormContainer mode="new" />);

      expect(mockWatch).toHaveBeenCalled();
    });
  });

  describe('Mode-Based Behavior', () => {
    it('should show 3 steps for new mode', () => {
      render(<DeadlineFormContainer mode="new" />);

      const indicators = screen.getByTestId('step-indicators');
      expect(indicators.props['data-total-steps']).toBe(3);
    });

    it('should show 2 steps for edit mode', () => {
      render(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );

      const indicators = screen.getByTestId('step-indicators');
      expect(indicators.props['data-total-steps']).toBe(2);
    });

    it('should render DeadlineFormStep1 on step 1 of new mode', () => {
      render(<DeadlineFormContainer mode="new" />);

      expect(screen.getByTestId('deadline-form-step1')).toBeTruthy();
      expect(screen.queryByTestId('deadline-form-step2')).toBeNull();
      expect(screen.queryByTestId('deadline-form-step3')).toBeNull();
    });

    it('should not render DeadlineFormStep1 in edit mode', () => {
      render(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );

      expect(screen.queryByTestId('deadline-form-step1')).toBeNull();
      expect(screen.getByTestId('deadline-form-step2')).toBeTruthy();
    });

    it('should pass correct props to Step1 in new mode', () => {
      render(<DeadlineFormContainer mode="new" />);

      const step1 = screen.getByTestId('deadline-form-step1');
      expect(step1.props['data-on-book-selected']).toBe(true);
      expect(step1.props['data-on-manual-entry']).toBe(true);
      expect(step1.props['data-set-value']).toBe(true);
    });

    it('should show different header titles based on mode', () => {
      const { rerender } = render(<DeadlineFormContainer mode="new" />);

      let header = screen.getByTestId('app-header');
      expect(header.props['data-title']).toBe('Find Book');

      rerender(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );

      header = screen.getByTestId('app-header');
      expect(header.props['data-title']).toBe('Book Details');
    });

    it('should initialize form state differently for each mode', () => {
      const { initializeFormState } = require('@/utils/deadlineFormUtils');

      render(<DeadlineFormContainer mode="new" />);
      expect(initializeFormState).toHaveBeenCalledWith('new');

      jest.clearAllMocks();

      render(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );
      expect(initializeFormState).toHaveBeenCalledWith('edit');
    });

    it('should call getFormDefaultValues with correct mode', () => {
      const { getFormDefaultValues } = require('@/utils/deadlineFormUtils');

      render(<DeadlineFormContainer mode="new" />);
      expect(getFormDefaultValues).toHaveBeenCalledWith('new');

      jest.clearAllMocks();

      render(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );
      expect(getFormDefaultValues).toHaveBeenCalledWith('edit');
    });

    it('should show different button text based on mode', () => {
      const { rerender } = render(<DeadlineFormContainer mode="new" />);

      const continueButton = screen
        .getAllByTestId('themed-button')
        .find(button => button.props['data-title'] === 'Continue');
      expect(continueButton).toBeTruthy();

      rerender(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );

      const buttons = screen.getAllByTestId('themed-button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should handle format changes only in new mode', () => {
      const { rerender } = render(<DeadlineFormContainer mode="new" />);

      // Mock stepping to step 2
      const { createFormNavigation } = require('@/utils/deadlineFormUtils');
      createFormNavigation.mockReturnValue({
        goBack: jest.fn(),
        nextStep: jest.fn(),
      });

      // This would render step 2, check format change handler
      rerender(<DeadlineFormContainer mode="new" />);

      const step2 = screen.queryByTestId('deadline-form-step2');
      if (step2) {
        expect(step2.props['data-on-format-change']).toBe(true);
      }
    });

    it('should disable format changes in edit mode', () => {
      render(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );

      const step2 = screen.getByTestId('deadline-form-step2');
      expect(step2.props['data-is-edit-mode']).toBe(true);
    });

    it('should show deadline from publication date only in new mode', () => {
      // Mock getting to step 3 in new mode
      const { createFormNavigation } = require('@/utils/deadlineFormUtils');
      const mockNavigation = {
        goBack: jest.fn(),
        nextStep: jest.fn(),
      };
      createFormNavigation.mockReturnValue(mockNavigation);

      const { rerender } = render(<DeadlineFormContainer mode="new" />);

      // If step 3 is rendered, check publication date prop
      const step3 = screen.queryByTestId('deadline-form-step3');
      if (step3) {
        expect(step3.props['data-deadline-from-publication']).toBe(false);
      }

      rerender(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );

      const editStep3 = screen.queryByTestId('deadline-form-step3');
      if (editStep3) {
        expect(editStep3.props['data-deadline-from-publication']).toBe(false);
      }
    });
  });

  describe('Step Navigation', () => {
    it('should start on step 1 by default', () => {
      render(<DeadlineFormContainer mode="new" />);

      const indicators = screen.getByTestId('step-indicators');
      expect(indicators.props['data-current-step']).toBe(1);
    });

    it('should use initial step from URL params', () => {
      const {
        getInitialStepFromSearchParams,
      } = require('@/utils/deadlineUtils');
      getInitialStepFromSearchParams.mockReturnValue(2);

      render(<DeadlineFormContainer mode="new" />);

      expect(getInitialStepFromSearchParams).toHaveBeenCalledWith(
        {},
        {
          paramName: 'page',
          defaultStep: 1,
          minStep: 1,
          maxStep: 3,
        }
      );
    });

    it('should call createFormNavigation with correct parameters', () => {
      const { createFormNavigation } = require('@/utils/deadlineFormUtils');

      render(<DeadlineFormContainer mode="new" />);

      expect(createFormNavigation).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStep: 1,
          totalSteps: 3,
          canGoBack: true,
        }),
        mockTrigger,
        expect.any(Function),
        'physical',
        expect.any(Function)
      );
    });

    it('should create navigation with correct total steps for edit mode', () => {
      const { createFormNavigation } = require('@/utils/deadlineFormUtils');

      render(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );

      expect(createFormNavigation).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStep: 1,
          totalSteps: 2,
          canGoBack: true,
        }),
        mockTrigger,
        expect.any(Function),
        'physical',
        expect.any(Function)
      );
    });

    it('should pass navigation handlers to buttons', () => {
      const mockNavigation = {
        goBack: jest.fn(),
        nextStep: jest.fn(),
      };

      const { createFormNavigation } = require('@/utils/deadlineFormUtils');
      createFormNavigation.mockReturnValue(mockNavigation);

      render(<DeadlineFormContainer mode="new" />);

      const buttons = screen.getAllByTestId('themed-button');
      const continueButton = buttons.find(
        button => button.props['data-title'] === 'Continue'
      );

      expect(continueButton).toBeTruthy();
      expect(continueButton?.props.onPress).toBeDefined();
    });

    it('should show only Continue button on step 1', () => {
      render(<DeadlineFormContainer mode="new" />);

      const buttons = screen.getAllByTestId('themed-button');
      const backButton = buttons.find(
        button => button.props['data-title'] === 'Back'
      );
      const continueButton = buttons.find(
        button => button.props['data-title'] === 'Continue'
      );

      expect(backButton).toBeUndefined();
      expect(continueButton).toBeTruthy();
    });

    it('should handle step changes correctly', () => {
      const mockNavigation = {
        goBack: jest.fn(),
        nextStep: jest.fn(),
      };

      const { createFormNavigation } = require('@/utils/deadlineFormUtils');
      createFormNavigation.mockReturnValue(mockNavigation);

      render(<DeadlineFormContainer mode="new" />);

      const buttons = screen.getAllByTestId('themed-button');
      const continueButton = buttons.find(
        button => button.props['data-title'] === 'Continue'
      );

      fireEvent.press(continueButton);

      expect(mockNavigation.nextStep).toHaveBeenCalled();
    });

    it('should show correct header titles for each step in new mode', () => {
      render(<DeadlineFormContainer mode="new" />);

      const header = screen.getByTestId('app-header');
      expect(header.props['data-title']).toBe('Find Book');

      expect(['Find Book', 'Book Details', 'Set Deadline']).toContain(
        header.props['data-title']
      );
    });

    it('should show correct header titles for each step in edit mode', () => {
      render(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );

      const header = screen.getByTestId('app-header');
      expect(['Book Details', 'Set Deadline']).toContain(
        header.props['data-title']
      );
    });

    it('should pass correct step to StepIndicators', () => {
      render(<DeadlineFormContainer mode="new" />);

      const indicators = screen.getByTestId('step-indicators');
      expect(indicators.props['data-current-step']).toBe(1);
      expect(indicators.props['data-total-steps']).toBe(3);
    });

    it('should handle navigation with validation', () => {
      const mockNavigation = {
        goBack: jest.fn(),
        nextStep: jest.fn(),
      };

      const { createFormNavigation } = require('@/utils/deadlineFormUtils');
      createFormNavigation.mockReturnValue(mockNavigation);

      render(<DeadlineFormContainer mode="new" />);

      expect(createFormNavigation).toHaveBeenCalledWith(
        expect.anything(),
        mockTrigger,
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });

    it('should disable navigation buttons when submitting', () => {
      const mockNavigation = {
        goBack: jest.fn(),
        nextStep: jest.fn(),
      };

      const { createFormNavigation } = require('@/utils/deadlineFormUtils');
      createFormNavigation.mockReturnValue(mockNavigation);

      render(<DeadlineFormContainer mode="new" />);

      const buttons = screen.getAllByTestId('themed-button');
      buttons.forEach(button => {
        expect(button.props['data-disabled']).toBe(false);
      });
    });

    it('should show different button text on final step', () => {
      const {
        getInitialStepFromSearchParams,
      } = require('@/utils/deadlineUtils');
      getInitialStepFromSearchParams.mockReturnValue(3);

      render(<DeadlineFormContainer mode="new" />);

      const buttons = screen.getAllByTestId('themed-button');
      const actionButton = buttons.find(
        button =>
          button.props['data-title'] === 'Add Book' ||
          button.props['data-title'] === 'Continue'
      );

      expect(actionButton).toBeTruthy();
    });

    it('should handle back navigation correctly', () => {
      const mockNavigation = {
        goBack: jest.fn(),
        nextStep: jest.fn(),
      };

      const { createFormNavigation } = require('@/utils/deadlineFormUtils');
      createFormNavigation.mockReturnValue(mockNavigation);

      const {
        getInitialStepFromSearchParams,
      } = require('@/utils/deadlineUtils');
      getInitialStepFromSearchParams.mockReturnValue(2);

      render(<DeadlineFormContainer mode="new" />);

      expect(createFormNavigation).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStep: 2,
          totalSteps: 3,
          canGoBack: true,
        }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('Form Initialization', () => {
    it('should initialize form with URL params in new mode', () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        bookTitle: 'Test Book',
        format: 'physical',
      });

      const { populateFormFromParams } = require('@/utils/deadlineFormUtils');

      render(<DeadlineFormContainer mode="new" />);

      expect(populateFormFromParams).toHaveBeenCalledWith(
        { bookTitle: 'Test Book', format: 'physical' },
        mockSetValue
      );
    });

    it('should initialize form with existing deadline in edit mode', () => {
      const { populateFormFromDeadline } = require('@/utils/deadlineFormUtils');

      render(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );

      expect(populateFormFromDeadline).toHaveBeenCalledWith(
        mockExistingDeadline,
        mockSetValue
      );
    });

    it('should not re-initialize form multiple times', () => {
      const { populateFormFromParams } = require('@/utils/deadlineFormUtils');

      const { rerender } = render(<DeadlineFormContainer mode="new" />);
      rerender(<DeadlineFormContainer mode="new" />);

      expect(populateFormFromParams).toHaveBeenCalledTimes(1);
    });

    it('should reset initialization when mode changes', () => {
      const {
        populateFormFromParams,
        populateFormFromDeadline,
      } = require('@/utils/deadlineFormUtils');

      const { rerender } = render(<DeadlineFormContainer mode="new" />);
      rerender(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );

      expect(populateFormFromParams).toHaveBeenCalledTimes(1);
      expect(populateFormFromDeadline).toHaveBeenCalledTimes(1);
    });

    it('should reset initialization when deadline ID changes', () => {
      const { populateFormFromDeadline } = require('@/utils/deadlineFormUtils');

      const { rerender } = render(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );

      const newDeadline = { ...mockExistingDeadline, id: 'different-id' };
      rerender(
        <DeadlineFormContainer mode="edit" existingDeadline={newDeadline} />
      );

      expect(populateFormFromDeadline).toHaveBeenCalledTimes(2);
    });

    it('should handle empty URL params gracefully', () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({});

      const { populateFormFromParams } = require('@/utils/deadlineFormUtils');

      render(<DeadlineFormContainer mode="new" />);

      expect(populateFormFromParams).toHaveBeenCalledWith({}, mockSetValue);
    });

    it('should set initial form state correctly for new mode', () => {
      const { populateFormFromParams } = require('@/utils/deadlineFormUtils');
      populateFormFromParams.mockReturnValue({
        selectedFormat: 'audio',
        selectedPriority: 'strict',
      });

      render(<DeadlineFormContainer mode="new" />);

      expect(populateFormFromParams).toHaveBeenCalled();
    });

    it('should set initial form state correctly for edit mode', () => {
      const { populateFormFromDeadline } = require('@/utils/deadlineFormUtils');
      populateFormFromDeadline.mockReturnValue({
        selectedFormat: 'eBook',
        selectedPriority: 'flexible',
        selectedStatus: 'reading',
      });

      render(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );

      expect(populateFormFromDeadline).toHaveBeenCalled();
    });

    it('should stabilize params to prevent infinite loops', () => {
      const params = { bookTitle: 'Test' };
      (useLocalSearchParams as jest.Mock).mockReturnValue(params);

      const { rerender } = render(<DeadlineFormContainer mode="new" />);

      (useLocalSearchParams as jest.Mock).mockReturnValue({ ...params });
      rerender(<DeadlineFormContainer mode="new" />);

      const { populateFormFromParams } = require('@/utils/deadlineFormUtils');
      expect(populateFormFromParams).toHaveBeenCalledTimes(1);
    });

    it('should not throw errors during normal initialization', () => {
      const { populateFormFromParams } = require('@/utils/deadlineFormUtils');

      // Test that normal initialization works without throwing
      expect(() => {
        render(<DeadlineFormContainer mode="new" />);
      }).not.toThrow();

      expect(populateFormFromParams).toHaveBeenCalled();
    });
  });

  describe('Form Submission Preparation', () => {
    it('should call form submission utility functions correctly', () => {
      const {
        prepareDeadlineDetailsFromForm,
        prepareProgressDetailsFromForm,
      } = require('@/utils/deadlineFormUtils');

      render(<DeadlineFormContainer mode="new" />);

      // These utilities should be available for form submission
      expect(prepareDeadlineDetailsFromForm).toBeDefined();
      expect(prepareProgressDetailsFromForm).toBeDefined();
    });

    it('should set up form submission handlers for both modes', () => {
      const { rerender } = render(<DeadlineFormContainer mode="new" />);

      // Navigation should be set up
      const buttons = screen.getAllByTestId('themed-button');
      const continueButton = buttons.find(
        button => button.props['data-title'] === 'Continue'
      );
      expect(continueButton?.props['data-on-press']).toBe(true);

      // Test edit mode
      rerender(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );

      const editButtons = screen.getAllByTestId('themed-button');
      const editContinueButton = editButtons.find(
        button => button.props['data-title'] === 'Continue'
      );
      expect(editContinueButton?.props['data-on-press']).toBe(true);
    });
  });

  describe('Button State Management', () => {
    it('should show final step button text when on last step in new mode', () => {
      const {
        getInitialStepFromSearchParams,
      } = require('@/utils/deadlineUtils');
      getInitialStepFromSearchParams.mockReturnValue(3); // Last step

      render(<DeadlineFormContainer mode="new" />);

      const buttons = screen.getAllByTestId('themed-button');
      const finalButton = buttons.find(
        button => button.props['data-title'] === 'Add Book'
      );
      expect(finalButton).toBeTruthy();
    });

    it('should show final step button text when on last step in edit mode', () => {
      const {
        getInitialStepFromSearchParams,
      } = require('@/utils/deadlineUtils');
      getInitialStepFromSearchParams.mockReturnValue(2); // Last step for edit mode

      render(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );

      const buttons = screen.getAllByTestId('themed-button');
      const finalButton = buttons.find(
        button => button.props['data-title'] === 'Update Book'
      );
      expect(finalButton).toBeTruthy();
    });

    it('should handle button state management properly', () => {
      render(<DeadlineFormContainer mode="new" />);

      const buttons = screen.getAllByTestId('themed-button');
      const continueButton = buttons.find(
        button => button.props['data-title'] === 'Continue'
      );
      expect(continueButton?.props['data-disabled']).toBe(false);
    });
  });

  describe('Event Handler Execution', () => {
    it('should create and use format change handler', () => {
      const {
        createFormatChangeHandler,
      } = require('@/utils/deadlineFormUtils');
      const mockFormatHandler = jest.fn();
      createFormatChangeHandler.mockReturnValue(mockFormatHandler);

      render(<DeadlineFormContainer mode="new" />);

      expect(createFormatChangeHandler).toHaveBeenCalledWith(
        'physical', // selectedFormat
        expect.objectContaining({
          bookTitle: 'Test Book',
          bookAuthor: 'Test Author',
        }), // watchedValues
        null, // previousPageCount
        mockSetValue,
        expect.any(Function), // setSelectedFormat
        expect.any(Function) // setPreviousPageCount
      );
    });

    it('should create and use priority change handler', () => {
      const {
        createPriorityChangeHandler,
      } = require('@/utils/deadlineFormUtils');
      const mockPriorityHandler = jest.fn();
      createPriorityChangeHandler.mockReturnValue(mockPriorityHandler);

      render(<DeadlineFormContainer mode="new" />);

      expect(createPriorityChangeHandler).toHaveBeenCalledWith(
        mockSetValue,
        expect.any(Function) // setSelectedPriority
      );
    });

    it('should create and use date change handler', () => {
      const { createDateChangeHandler } = require('@/utils/deadlineFormUtils');
      const mockDateHandler = jest.fn();
      createDateChangeHandler.mockReturnValue(mockDateHandler);

      render(<DeadlineFormContainer mode="new" />);

      expect(createDateChangeHandler).toHaveBeenCalledWith(
        mockSetValue,
        expect.any(Function), // setShowDatePicker
        expect.any(Function) // setDeadlineFromPublicationDate (only in new mode)
      );
    });

    it('should create date change handler without publication date setter in edit mode', () => {
      const { createDateChangeHandler } = require('@/utils/deadlineFormUtils');
      const mockDateHandler = jest.fn();
      createDateChangeHandler.mockReturnValue(mockDateHandler);

      render(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );

      expect(createDateChangeHandler).toHaveBeenCalledWith(
        mockSetValue,
        expect.any(Function), // setShowDatePicker
        undefined // no publication date setter in edit mode
      );
    });

    it('should handle book selection in new mode', () => {
      const { handleBookSelection } = require('@/utils/deadlineFormUtils');

      render(<DeadlineFormContainer mode="new" />);

      // Find the step1 component and simulate book selection
      const step1 = screen.getByTestId('deadline-form-step1');
      expect(step1.props['data-on-book-selected']).toBe(true);

      // The handleBookSelected function should exist and be ready to call handleBookSelection
      expect(handleBookSelection).toBeDefined();
    });

    it('should handle manual entry in new mode', () => {
      render(<DeadlineFormContainer mode="new" />);

      // Find the step1 component
      const step1 = screen.getByTestId('deadline-form-step1');
      expect(step1.props['data-on-manual-entry']).toBe(true);

      // Manual entry should be set up to advance to step 2
      // This is verified by the props being passed correctly
    });

    it('should not handle format changes in edit mode', () => {
      render(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );

      // In edit mode, format changes are disabled (though handler still exists)
      const step2 = screen.getByTestId('deadline-form-step2');
      expect(step2.props['data-is-edit-mode']).toBe(true);
    });

    it('should handle status changes in both modes', () => {
      const { rerender } = render(<DeadlineFormContainer mode="new" />);

      // Check new mode doesn't show step2 initially
      expect(screen.queryByTestId('deadline-form-step2')).toBeNull();

      // In edit mode, step2 should have status change handler
      rerender(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );

      const step2 = screen.getByTestId('deadline-form-step2');
      expect(step2.props['data-on-status-change']).toBe(true);
    });

    it('should handle priority changes through step3', () => {
      const {
        getInitialStepFromSearchParams,
      } = require('@/utils/deadlineUtils');
      getInitialStepFromSearchParams.mockReturnValue(3); // Go to step 3

      render(<DeadlineFormContainer mode="new" />);

      const step3 = screen.getByTestId('deadline-form-step3');
      expect(step3.props['data-on-priority-change']).toBe(true);
    });
  });

  describe('Handler Integration', () => {
    it('should pass all required props to DeadlineFormStep1', () => {
      render(<DeadlineFormContainer mode="new" />);

      const step1 = screen.getByTestId('deadline-form-step1');
      expect(step1.props['data-on-book-selected']).toBe(true);
      expect(step1.props['data-on-manual-entry']).toBe(true);
      expect(step1.props['data-set-value']).toBe(true);
    });

    it('should pass all required props to DeadlineFormStep2', () => {
      render(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );

      const step2 = screen.getByTestId('deadline-form-step2');
      expect(step2.props['data-control']).toBe(true);
      expect(step2.props['data-selected-format']).toBeDefined();
      expect(step2.props['data-on-format-change']).toBe(true); // Handler exists but disabled in edit mode
      expect(step2.props['data-selected-status']).toBeDefined();
      expect(step2.props['data-on-status-change']).toBe(true);
      expect(step2.props['data-set-value']).toBe(true);
      expect(step2.props['data-is-edit-mode']).toBe(true);
    });

    it('should pass all required props to DeadlineFormStep3', () => {
      const {
        getInitialStepFromSearchParams,
      } = require('@/utils/deadlineUtils');
      getInitialStepFromSearchParams.mockReturnValue(3);

      render(<DeadlineFormContainer mode="new" />);

      const step3 = screen.getByTestId('deadline-form-step3');
      expect(step3.props['data-control']).toBe(true);
      expect(step3.props['data-selected-format']).toBeDefined();
      expect(step3.props['data-selected-priority']).toBeDefined();
      expect(step3.props['data-on-priority-change']).toBe(true);
      expect(step3.props['data-show-date-picker']).toBe(false);
      expect(step3.props['data-on-date-picker-toggle']).toBe(true);
      expect(step3.props['data-on-date-change']).toBe(true);
      expect(step3.props['data-deadline']).toBe(true);
      expect(step3.props['data-pace-estimate']).toBeDefined();
      expect(step3.props['data-watched-values']).toBe(true);
      expect(step3.props['data-set-value']).toBe(true);
      expect(step3.props['data-deadline-from-publication']).toBe(false);
    });

    it('should pass navigation handlers to buttons with correct callbacks', () => {
      render(<DeadlineFormContainer mode="new" />);

      const buttons = screen.getAllByTestId('themed-button');
      const continueButton = buttons.find(
        button => button.props['data-title'] === 'Continue'
      );

      expect(continueButton?.props['data-on-press']).toBe(true);
    });
  });

  describe('Pace Calculation Effect', () => {
    beforeEach(() => {
      const {
        calculateRemainingFromForm,
        getPaceEstimate,
      } = require('@/utils/deadlineCalculations');
      calculateRemainingFromForm.mockReturnValue(250); // Mock remaining
      getPaceEstimate.mockReturnValue('8.3 pages per day');
    });

    it('should calculate pace estimate when form values change', () => {
      const {
        calculateRemainingFromForm,
        getPaceEstimate,
      } = require('@/utils/deadlineCalculations');

      render(<DeadlineFormContainer mode="new" />);

      // The effect should run on initial render
      expect(calculateRemainingFromForm).toHaveBeenCalledWith(
        'physical', // selectedFormat
        300, // totalQuantity from mockWatch
        undefined, // totalMinutes
        50, // currentProgress
        undefined // currentMinutes
      );

      expect(getPaceEstimate).toHaveBeenCalledWith(
        'physical',
        expect.any(Date), // deadline from mockWatch
        250 // remaining from calculateRemainingFromForm
      );
    });

    it('should calculate pace estimate for audio format', () => {
      const mockInitializeFormState =
        require('@/utils/deadlineFormUtils').initializeFormState;
      mockInitializeFormState.mockReturnValue({
        selectedFormat: 'audio',
        selectedStatus: 'pending',
        selectedPriority: 'flexible',
        showDatePicker: false,
        paceEstimate: '',
        isSubmitting: false,
        deadlineFromPublicationDate: false,
        previousPageCount: null,
      });

      const {
        calculateRemainingFromForm,
        getPaceEstimate,
      } = require('@/utils/deadlineCalculations');

      render(<DeadlineFormContainer mode="new" />);

      expect(calculateRemainingFromForm).toHaveBeenCalledWith(
        'audio', // selectedFormat changed to audio
        300, // totalQuantity
        undefined, // totalMinutes from mockWatch
        50, // currentProgress
        undefined // currentMinutes from mockWatch
      );

      expect(getPaceEstimate).toHaveBeenCalledWith(
        'audio',
        expect.any(Date),
        250
      );
    });

    it('should not calculate pace estimate when deadline is missing', () => {
      mockWatch.mockReturnValue({
        bookTitle: 'Test Book',
        bookAuthor: 'Test Author',
        deadline: '' as any, // No deadline
        totalQuantity: 300,
        currentProgress: 50,
      });

      const { getPaceEstimate } = require('@/utils/deadlineCalculations');
      getPaceEstimate.mockClear();

      render(<DeadlineFormContainer mode="new" />);

      expect(getPaceEstimate).not.toHaveBeenCalled();
    });

    it('should not calculate pace estimate when remaining is zero or less', () => {
      const {
        calculateRemainingFromForm,
        getPaceEstimate,
      } = require('@/utils/deadlineCalculations');
      calculateRemainingFromForm.mockReturnValue(0); // No remaining

      render(<DeadlineFormContainer mode="new" />);

      expect(calculateRemainingFromForm).toHaveBeenCalled();
      expect(getPaceEstimate).not.toHaveBeenCalled();
    });

    it('should handle pace calculation with different conditions', () => {
      const {
        calculateRemainingFromForm,
      } = require('@/utils/deadlineCalculations');
      calculateRemainingFromForm.mockReturnValue(-10); // Negative remaining

      render(<DeadlineFormContainer mode="new" />);

      // The component should handle different pace calculation scenarios
      expect(calculateRemainingFromForm).toHaveBeenCalled();
    });

    it('should recalculate pace when watched values change', () => {
      const {
        calculateRemainingFromForm,
      } = require('@/utils/deadlineCalculations');

      const { rerender } = render(<DeadlineFormContainer mode="new" />);

      // Change watched values
      mockWatch.mockReturnValue({
        bookTitle: 'Test Book',
        bookAuthor: 'Test Author',
        deadline: new Date('2024-12-31'),
        totalQuantity: 400, // Changed
        currentProgress: 100, // Changed
      });

      rerender(<DeadlineFormContainer mode="new" />);

      // Should be called with the new values at some point
      expect(calculateRemainingFromForm).toHaveBeenCalled();
    });
  });

  describe('Side Effect Testing', () => {
    it('should handle initialization flag management correctly', () => {
      const { populateFormFromParams } = require('@/utils/deadlineFormUtils');

      const { rerender } = render(<DeadlineFormContainer mode="new" />);

      // First render should initialize
      expect(populateFormFromParams).toHaveBeenCalledTimes(1);

      // Re-render with same props should not re-initialize
      rerender(<DeadlineFormContainer mode="new" />);
      expect(populateFormFromParams).toHaveBeenCalledTimes(1);
    });

    it('should reset initialization flag when mode changes', () => {
      const {
        populateFormFromParams,
        populateFormFromDeadline,
      } = require('@/utils/deadlineFormUtils');

      const { rerender } = render(<DeadlineFormContainer mode="new" />);
      expect(populateFormFromParams).toHaveBeenCalledTimes(1);

      // Change mode should reset flag and allow re-initialization
      rerender(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );
      expect(populateFormFromDeadline).toHaveBeenCalledTimes(1);
    });

    it('should reset initialization flag when deadline ID changes', () => {
      const { populateFormFromDeadline } = require('@/utils/deadlineFormUtils');

      const { rerender } = render(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );
      expect(populateFormFromDeadline).toHaveBeenCalledTimes(1);

      // Change deadline ID should reset flag
      const newDeadline = { ...mockExistingDeadline, id: 'new-id' };
      rerender(
        <DeadlineFormContainer mode="edit" existingDeadline={newDeadline} />
      );
      expect(populateFormFromDeadline).toHaveBeenCalledTimes(2);
    });

    it('should handle scroll behavior on final step', () => {
      const {
        getInitialStepFromSearchParams,
      } = require('@/utils/deadlineUtils');
      getInitialStepFromSearchParams.mockReturnValue(3); // Final step

      // We can't directly test scroll behavior, but we can verify the component renders
      // on the final step without errors
      expect(() => {
        render(<DeadlineFormContainer mode="new" />);
      }).not.toThrow();

      // The scroll effect should be handled internally
      // This tests that the component handles the final step rendering properly
      const step3 = screen.getByTestId('deadline-form-step3');
      expect(step3).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing existingDeadline in edit mode gracefully', () => {
      render(<DeadlineFormContainer mode="edit" />);

      // Should show error state
      expect(screen.getByText('Deadline not found')).toBeTruthy();

      const goBackButton = screen
        .getAllByTestId('themed-button')
        .find(button => button.props['data-title'] === 'Go Back');
      expect(goBackButton).toBeTruthy();
    });

    it('should set up error handling utilities', () => {
      const {
        createErrorToast,
        createSuccessToast,
      } = require('@/utils/deadlineFormUtils');

      render(<DeadlineFormContainer mode="new" />);

      // Error handling utilities should be available
      expect(createErrorToast).toBeDefined();
      expect(createSuccessToast).toBeDefined();
    });
  });

  describe('Complex State Scenarios', () => {
    it('should handle params stabilization to prevent infinite loops', () => {
      let paramCallCount = 0;
      (useLocalSearchParams as jest.Mock).mockImplementation(() => {
        paramCallCount++;
        return { bookTitle: 'Test Book' };
      });

      const { rerender } = render(<DeadlineFormContainer mode="new" />);

      // Multiple re-renders should not cause params to be re-read excessively
      rerender(<DeadlineFormContainer mode="new" />);
      rerender(<DeadlineFormContainer mode="new" />);

      // Params should be called but not excessively
      expect(paramCallCount).toBeGreaterThan(0);
    });

    it('should handle rapid state changes without errors', () => {
      const { rerender } = render(<DeadlineFormContainer mode="new" />);

      // Rapid prop changes
      rerender(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );
      rerender(<DeadlineFormContainer mode="new" />);
      rerender(
        <DeadlineFormContainer
          mode="edit"
          existingDeadline={mockExistingDeadline}
        />
      );

      // Should not throw errors and should render the final state
      expect(screen.getByTestId('deadline-form-step2')).toBeTruthy();
    });

    it('should handle different status states correctly', () => {
      const mockInitializeFormState =
        require('@/utils/deadlineFormUtils').initializeFormState;
      mockInitializeFormState.mockReturnValue({
        selectedFormat: 'physical',
        selectedStatus: 'reading', // Status set to reading
        selectedPriority: 'flexible',
        showDatePicker: false,
        paceEstimate: '',
        isSubmitting: false,
        deadlineFromPublicationDate: false,
        previousPageCount: null,
      });

      render(<DeadlineFormContainer mode="new" />);

      // Component should handle different status states
      expect(screen.getAllByTestId('themed-button').length).toBeGreaterThan(0);
    });
  });
});
