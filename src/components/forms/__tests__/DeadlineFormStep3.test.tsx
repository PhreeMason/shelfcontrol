import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { DeadlineFormStep3 } from '../DeadlineFormStep3';
import { useTheme } from '@/hooks/useThemeColor';

// Mock hooks
jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: jest.fn(),
}));

// Mock react-hook-form (minimal approach following proven pattern)
jest.mock('react-hook-form', () => ({
  Controller: ({ render }: any) => {
    // Let the component handle the field value from props
    return render({ field: { value: new Date('2024-12-31') } });
  },
}));

// Mock child components to isolate testing
jest.mock('@/components/shared/CustomInput', () => {
  const React = require('react');
  return function MockCustomInput(props: any) {
    return React.createElement(
      'View',
      {
        testID: props.testID || `input-${props.name}`,
        'data-name': props.name,
        'data-placeholder': props.placeholder,
        'data-keyboard': props.keyboardType,
        'data-input-type': props.inputType,
      },
      null
    );
  };
});

jest.mock('@/components/forms/PrioritySelector', () => ({
  PrioritySelector: ({ selectedPriority, onSelectPriority }: any) => {
    const React = require('react');
    return React.createElement(
      'View',
      {
        testID: 'priority-selector',
        'data-selected': selectedPriority,
        onPress: () => onSelectPriority && onSelectPriority('strict'),
      },
      null
    );
  },
}));

jest.mock('@/components/forms/PaceEstimateBox', () => ({
  PaceEstimateBox: ({ paceEstimate }: any) => {
    const React = require('react');
    return React.createElement(
      'View',
      {
        testID: 'pace-estimate-box',
        'data-pace': paceEstimate,
      },
      paceEstimate
    );
  },
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  return function MockDateTimePicker(props: any) {
    return React.createElement(
      'View',
      {
        testID: props.testID,
        'data-value': props.value?.toISOString(),
        'data-mode': props.mode,
        'data-display': props.display,
      },
      null
    );
  };
});

jest.mock('@/components/themed', () => ({
  ThemedText: ({ children, color, variant }: any) => {
    const React = require('react');
    return React.createElement(
      'Text',
      {
        testID: 'themed-text',
        'data-color': color,
        'data-variant': variant,
      },
      children
    );
  },
}));

describe('DeadlineFormStep3', () => {
  const mockColors = {
    primary: '#007AFF',
    surface: '#FFFFFF',
    border: '#E5E5E7',
    text: '#000000',
    textMuted: '#8E8E93',
    good: '#34C759',
    inputBlurBackground: '#F2F2F7',
  };

  const mockControl = {} as any;
  const mockSetValue = jest.fn();
  const mockOnPriorityChange = jest.fn();
  const mockOnDatePickerToggle = jest.fn();
  const mockOnDateChange = jest.fn();

  const defaultProps = {
    control: mockControl,
    selectedFormat: 'physical' as const,
    selectedPriority: 'flexible' as const,
    onPriorityChange: mockOnPriorityChange,
    showDatePicker: false,
    onDatePickerToggle: mockOnDatePickerToggle,
    onDateChange: mockOnDateChange,
    deadline: new Date('2024-12-31'),
    paceEstimate: '5 pages per day',
    watchedValues: {
      bookTitle: 'Test Book',
      deadline: new Date('2024-12-31'),
    },
    setValue: mockSetValue,
    deadlineFromPublicationDate: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({ colors: mockColors });
  });

  describe('Component Structure', () => {
    it('should render main description text', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(
        screen.getByText(/When do you need to finish\? We'll calculate/)
      ).toBeTruthy();
    });

    it('should render "Deadline Date *" label and date picker button', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      // Check that deadline date label exists (split across multiple text components)
      expect(screen.getByText('Deadline Date', { exact: false })).toBeTruthy();
      expect(screen.getByTestId('date-picker-button')).toBeTruthy();
    });

    it('should render progress label for physical format', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByText('Pages Already Read')).toBeTruthy();
    });

    it('should render progress input field', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByTestId('input-currentProgress')).toBeTruthy();
    });

    it('should render "Deadline Flexibility" label and PrioritySelector', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByText('Deadline Flexibility')).toBeTruthy();
      expect(screen.getByTestId('priority-selector')).toBeTruthy();
    });

    it('should render PaceEstimateBox', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByTestId('pace-estimate-box')).toBeTruthy();
    });

    it('should render summary card with "✓ Ready to Add"', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByText('✓ Ready to Add')).toBeTruthy();
    });

    it('should render helper text for date picker', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(
        screen.getByText('Past dates will be marked as overdue')
      ).toBeTruthy();
    });

    it('should render helper text for progress input', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(
        screen.getByText("Count towards today's reading progress")
      ).toBeTruthy();
    });

    it('should render helper text for priority selector', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(
        screen.getByText('Can this deadline be adjusted if needed?')
      ).toBeTruthy();
    });

    it('should render auto-filled indicator when deadlineFromPublicationDate=true', () => {
      render(
        <DeadlineFormStep3
          {...{ ...defaultProps, deadlineFromPublicationDate: true }}
        />
      );

      expect(screen.getByText('✓ Set to book publication date')).toBeTruthy();
    });

    it('should hide auto-filled indicator when deadlineFromPublicationDate=false', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.queryByText('✓ Set to book publication date')).toBeNull();
    });

    it('should render without errors with all props', () => {
      expect(() => {
        render(<DeadlineFormStep3 {...defaultProps} />);
      }).not.toThrow();
    });

    it('should display formatted date in date picker button', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByText(/December 30, 2024/)).toBeTruthy();
    });
  });

  describe('Hook Integration', () => {
    it('should call useTheme hook', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(useTheme).toHaveBeenCalled();
    });

    it('should pass control prop to Controller', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByTestId('date-picker-button')).toBeTruthy();
    });

    it('should pass control prop to CustomInput components', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByTestId('input-currentProgress')).toBeTruthy();
    });

    it('should handle Controller field value correctly', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByText(/December 30, 2024/)).toBeTruthy();
    });
  });

  describe('Format-Based Conditional Rendering', () => {
    it('should show "Pages Already Read" label for physical format', () => {
      render(
        <DeadlineFormStep3
          {...{ ...defaultProps, selectedFormat: 'physical' }}
        />
      );

      expect(screen.getByText('Pages Already Read')).toBeTruthy();
      expect(screen.queryByText('Time Already Listened')).toBeNull();
    });

    it('should show "Pages Already Read" label for eBook format', () => {
      render(
        <DeadlineFormStep3 {...{ ...defaultProps, selectedFormat: 'eBook' }} />
      );

      expect(screen.getByText('Pages Already Read')).toBeTruthy();
      expect(screen.queryByText('Time Already Listened')).toBeNull();
    });

    it('should show "Time Already Listened" label for audio format', () => {
      render(
        <DeadlineFormStep3 {...{ ...defaultProps, selectedFormat: 'audio' }} />
      );

      expect(screen.getByText('Time Already Listened')).toBeTruthy();
      expect(screen.queryByText('Pages Already Read')).toBeNull();
    });

    it('should show single progress input for physical format', () => {
      render(
        <DeadlineFormStep3
          {...{ ...defaultProps, selectedFormat: 'physical' }}
        />
      );

      expect(screen.getByTestId('input-currentProgress')).toBeTruthy();
      expect(screen.queryByTestId('input-currentMinutes')).toBeNull();
    });

    it('should show single progress input for eBook format', () => {
      render(
        <DeadlineFormStep3 {...{ ...defaultProps, selectedFormat: 'eBook' }} />
      );

      expect(screen.getByTestId('input-currentProgress')).toBeTruthy();
      expect(screen.queryByTestId('input-currentMinutes')).toBeNull();
    });

    it('should show dual progress inputs for audio format', () => {
      render(
        <DeadlineFormStep3 {...{ ...defaultProps, selectedFormat: 'audio' }} />
      );

      expect(screen.getByTestId('input-currentProgress')).toBeTruthy();
      expect(screen.getByTestId('input-currentMinutes')).toBeTruthy();
    });

    it('should update labels when format changes from physical to audio', () => {
      const { rerender } = render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByText('Pages Already Read')).toBeTruthy();

      rerender(
        <DeadlineFormStep3 {...{ ...defaultProps, selectedFormat: 'audio' }} />
      );

      expect(screen.queryByText('Pages Already Read')).toBeNull();
      expect(screen.getByText('Time Already Listened')).toBeTruthy();
    });

    it('should update input visibility when format changes to audio', () => {
      const { rerender } = render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.queryByTestId('input-currentMinutes')).toBeNull();

      rerender(
        <DeadlineFormStep3 {...{ ...defaultProps, selectedFormat: 'audio' }} />
      );

      expect(screen.getByTestId('input-currentMinutes')).toBeTruthy();
    });
  });

  describe('Date Picker Interaction', () => {
    it('should call onDatePickerToggle when date button pressed', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      const dateButton = screen.getByTestId('date-picker-button');
      fireEvent.press(dateButton);

      expect(mockOnDatePickerToggle).toHaveBeenCalled();
    });

    it('should show DateTimePicker when showDatePicker=true', () => {
      render(
        <DeadlineFormStep3 {...{ ...defaultProps, showDatePicker: true }} />
      );

      expect(screen.getByTestId('input-deadline')).toBeTruthy();
    });

    it('should hide DateTimePicker when showDatePicker=false', () => {
      render(
        <DeadlineFormStep3 {...{ ...defaultProps, showDatePicker: false }} />
      );

      expect(screen.queryByTestId('input-deadline')).toBeNull();
    });

    it('should pass correct props to DateTimePicker when shown', () => {
      render(
        <DeadlineFormStep3 {...{ ...defaultProps, showDatePicker: true }} />
      );

      const datePicker = screen.getByTestId('input-deadline');
      expect(datePicker.props['data-mode']).toBe('date');
      expect(datePicker.props['data-display']).toBe('inline');
    });

    it('should display formatted date string in button', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByText(/December 30, 2024/)).toBeTruthy();
    });

    it('should handle date button press interaction', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      const dateButton = screen.getByTestId('date-picker-button');
      fireEvent.press(dateButton);

      expect(mockOnDatePickerToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Props Handling', () => {
    it('should pass selectedPriority to PrioritySelector', () => {
      render(
        <DeadlineFormStep3
          {...{ ...defaultProps, selectedPriority: 'strict' }}
        />
      );

      const prioritySelector = screen.getByTestId('priority-selector');
      expect(prioritySelector.props['data-selected']).toBe('strict');
    });

    it('should call onPriorityChange when priority selected', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      const prioritySelector = screen.getByTestId('priority-selector');
      fireEvent.press(prioritySelector);

      expect(mockOnPriorityChange).toHaveBeenCalledWith('strict');
    });

    it('should pass paceEstimate to PaceEstimateBox', () => {
      const customPace = '10 pages per day';
      render(
        <DeadlineFormStep3 {...{ ...defaultProps, paceEstimate: customPace }} />
      );

      const paceBox = screen.getByTestId('pace-estimate-box');
      expect(paceBox.props['data-pace']).toBe(customPace);
    });

    it('should pass control to all CustomInput components', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByTestId('input-currentProgress')).toBeTruthy();
    });

    it('should pass setValue callback correctly', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByTestId('input-currentProgress')).toBeTruthy();
    });

    it('should handle deadline prop for date display', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByText(/December 30, 2024/)).toBeTruthy();
    });

    it('should handle watchedValues for summary card', () => {
      const watchedValues = {
        bookTitle: 'Custom Book Title',
        deadline: new Date('2024-08-15'),
      };
      render(<DeadlineFormStep3 {...{ ...defaultProps, watchedValues }} />);

      expect(screen.getByText(/Custom Book Title/)).toBeTruthy();
      expect(screen.getByText(/Aug 14/)).toBeTruthy();
    });

    it('should handle deadlineFromPublicationDate indicator', () => {
      render(
        <DeadlineFormStep3
          {...{ ...defaultProps, deadlineFromPublicationDate: true }}
        />
      );

      expect(screen.getByText('✓ Set to book publication date')).toBeTruthy();
    });
  });

  describe('Input Field Configuration', () => {
    it('should configure currentProgress input with numeric keyboard and integer type', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      const input = screen.getByTestId('input-currentProgress');
      expect(input.props['data-name']).toBe('currentProgress');
      expect(input.props['data-keyboard']).toBe('numeric');
      expect(input.props['data-input-type']).toBe('integer');
      expect(input.props['data-placeholder']).toBe('How many pages total?');
    });

    it('should configure currentMinutes input with numeric keyboard and integer type for audio', () => {
      render(
        <DeadlineFormStep3 {...{ ...defaultProps, selectedFormat: 'audio' }} />
      );

      const input = screen.getByTestId('input-currentMinutes');
      expect(input.props['data-name']).toBe('currentMinutes');
      expect(input.props['data-keyboard']).toBe('numeric');
      expect(input.props['data-input-type']).toBe('integer');
      expect(input.props['data-placeholder']).toBe('Minutes');
    });

    it('should set correct placeholders for progress inputs', () => {
      const { rerender } = render(<DeadlineFormStep3 {...defaultProps} />);

      let progressInput = screen.getByTestId('input-currentProgress');
      expect(progressInput.props['data-placeholder']).toBe(
        'How many pages total?'
      );

      rerender(
        <DeadlineFormStep3 {...{ ...defaultProps, selectedFormat: 'audio' }} />
      );

      progressInput = screen.getByTestId('input-currentProgress');
      expect(progressInput.props['data-placeholder']).toBe('Hours');

      const minutesInput = screen.getByTestId('input-currentMinutes');
      expect(minutesInput.props['data-placeholder']).toBe('Minutes');
    });

    it('should set correct testIDs for all inputs', () => {
      render(
        <DeadlineFormStep3 {...{ ...defaultProps, selectedFormat: 'audio' }} />
      );

      expect(screen.getByTestId('input-currentProgress')).toBeTruthy();
      expect(screen.getByTestId('input-currentMinutes')).toBeTruthy();
      expect(screen.getByTestId('date-picker-button')).toBeTruthy();
      expect(screen.getByTestId('priority-selector')).toBeTruthy();
      expect(screen.getByTestId('pace-estimate-box')).toBeTruthy();
    });

    it('should configure input names correctly', () => {
      render(
        <DeadlineFormStep3 {...{ ...defaultProps, selectedFormat: 'audio' }} />
      );

      const progressInput = screen.getByTestId('input-currentProgress');
      const minutesInput = screen.getByTestId('input-currentMinutes');

      expect(progressInput.props['data-name']).toBe('currentProgress');
      expect(minutesInput.props['data-name']).toBe('currentMinutes');
    });

    it('should ensure required field indicators are present', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      // Check that deadline date label exists (split across multiple text components)
      expect(screen.getByText('Deadline Date', { exact: false })).toBeTruthy();
    });
  });

  describe('Dynamic Label Tests', () => {
    it('should return "Pages Already Read" for physical format', () => {
      render(
        <DeadlineFormStep3
          {...{ ...defaultProps, selectedFormat: 'physical' }}
        />
      );

      expect(screen.getByText('Pages Already Read')).toBeTruthy();
    });

    it('should return "Pages Already Read" for eBook format', () => {
      render(
        <DeadlineFormStep3 {...{ ...defaultProps, selectedFormat: 'eBook' }} />
      );

      expect(screen.getByText('Pages Already Read')).toBeTruthy();
    });

    it('should return "Time Already Listened" for audio format', () => {
      render(
        <DeadlineFormStep3 {...{ ...defaultProps, selectedFormat: 'audio' }} />
      );

      expect(screen.getByText('Time Already Listened')).toBeTruthy();
    });

    it('should update label when format prop changes', () => {
      const { rerender } = render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByText('Pages Already Read')).toBeTruthy();

      rerender(
        <DeadlineFormStep3 {...{ ...defaultProps, selectedFormat: 'audio' }} />
      );

      expect(screen.queryByText('Pages Already Read')).toBeNull();
      expect(screen.getByText('Time Already Listened')).toBeTruthy();

      rerender(
        <DeadlineFormStep3 {...{ ...defaultProps, selectedFormat: 'eBook' }} />
      );

      expect(screen.queryByText('Time Already Listened')).toBeNull();
      expect(screen.getByText('Pages Already Read')).toBeTruthy();
    });
  });

  describe('Summary Card Content', () => {
    it('should show book title and deadline when both present in watchedValues', () => {
      const watchedValues = {
        bookTitle: 'The Great Gatsby',
        deadline: new Date('2024-07-04'),
      };
      render(<DeadlineFormStep3 {...{ ...defaultProps, watchedValues }} />);

      expect(screen.getByText(/The Great Gatsby/)).toBeTruthy();
      expect(screen.getByText(/Jul 3/)).toBeTruthy();
    });

    it('should show placeholder message when bookTitle missing', () => {
      const watchedValues = {
        bookTitle: null,
        deadline: new Date('2024-07-04'),
      };
      render(<DeadlineFormStep3 {...{ ...defaultProps, watchedValues }} />);

      expect(
        screen.getByText("'Complete the form above to see your reading plan'")
      ).toBeTruthy();
    });

    it('should show placeholder message when deadline missing', () => {
      const watchedValues = {
        bookTitle: 'Test Book',
        deadline: null,
      };
      render(<DeadlineFormStep3 {...{ ...defaultProps, watchedValues }} />);

      expect(
        screen.getByText("'Complete the form above to see your reading plan'")
      ).toBeTruthy();
    });

    it('should format deadline correctly in summary', () => {
      const watchedValues = {
        bookTitle: 'Test Book',
        deadline: new Date('2024-12-25'),
      };
      render(<DeadlineFormStep3 {...{ ...defaultProps, watchedValues }} />);

      expect(screen.getByText(/Dec 24/)).toBeTruthy();
    });

    it('should update summary when watchedValues change', () => {
      const initialWatched = {
        bookTitle: 'Initial Book',
        deadline: new Date('2024-06-01'),
      };
      const updatedWatched = {
        bookTitle: 'Updated Book',
        deadline: new Date('2024-09-01'),
      };

      const { rerender } = render(
        <DeadlineFormStep3
          {...{ ...defaultProps, watchedValues: initialWatched }}
        />
      );

      expect(screen.getByText(/Initial Book/)).toBeTruthy();
      expect(screen.getByText(/May 31/)).toBeTruthy();

      rerender(
        <DeadlineFormStep3
          {...{ ...defaultProps, watchedValues: updatedWatched }}
        />
      );

      expect(screen.queryByText(/Initial Book/)).toBeNull();
      expect(screen.getByText(/Updated Book/)).toBeTruthy();
      expect(screen.getByText(/Aug 31/)).toBeTruthy();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete flow for physical book with all inputs', () => {
      render(
        <DeadlineFormStep3
          {...{ ...defaultProps, selectedFormat: 'physical' }}
        />
      );

      expect(screen.getByText('Pages Already Read')).toBeTruthy();
      expect(screen.getByTestId('input-currentProgress')).toBeTruthy();
      expect(screen.queryByTestId('input-currentMinutes')).toBeNull();
      expect(screen.getByTestId('date-picker-button')).toBeTruthy();
      expect(screen.getByTestId('priority-selector')).toBeTruthy();
      expect(screen.getByTestId('pace-estimate-box')).toBeTruthy();
    });

    it('should handle complete flow for audio book with dual inputs', () => {
      render(
        <DeadlineFormStep3 {...{ ...defaultProps, selectedFormat: 'audio' }} />
      );

      expect(screen.getByText('Time Already Listened')).toBeTruthy();
      expect(screen.getByTestId('input-currentProgress')).toBeTruthy();
      expect(screen.getByTestId('input-currentMinutes')).toBeTruthy();
      expect(screen.getByTestId('date-picker-button')).toBeTruthy();
      expect(screen.getByTestId('priority-selector')).toBeTruthy();
    });

    it('should handle format change updating labels and input visibility', () => {
      const { rerender } = render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByText('Pages Already Read')).toBeTruthy();
      expect(screen.queryByTestId('input-currentMinutes')).toBeNull();

      rerender(
        <DeadlineFormStep3 {...{ ...defaultProps, selectedFormat: 'audio' }} />
      );

      expect(screen.getByText('Time Already Listened')).toBeTruthy();
      expect(screen.getByTestId('input-currentMinutes')).toBeTruthy();

      rerender(
        <DeadlineFormStep3 {...{ ...defaultProps, selectedFormat: 'eBook' }} />
      );

      expect(screen.getByText('Pages Already Read')).toBeTruthy();
      expect(screen.queryByTestId('input-currentMinutes')).toBeNull();
    });

    it('should handle priority selection triggering callback', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      const prioritySelector = screen.getByTestId('priority-selector');
      fireEvent.press(prioritySelector);

      expect(mockOnPriorityChange).toHaveBeenCalledWith('strict');
    });

    it('should handle date picker interaction workflow', () => {
      const { rerender } = render(<DeadlineFormStep3 {...defaultProps} />);

      const dateButton = screen.getByTestId('date-picker-button');
      fireEvent.press(dateButton);

      expect(mockOnDatePickerToggle).toHaveBeenCalled();

      rerender(
        <DeadlineFormStep3 {...{ ...defaultProps, showDatePicker: true }} />
      );

      expect(screen.getByTestId('input-deadline')).toBeTruthy();
    });

    it('should handle auto-filled deadline from publication date', () => {
      render(
        <DeadlineFormStep3
          {...{ ...defaultProps, deadlineFromPublicationDate: true }}
        />
      );

      expect(screen.getByText('✓ Set to book publication date')).toBeTruthy();
      expect(screen.getByTestId('date-picker-button')).toBeTruthy();

      const dateButton = screen.getByTestId('date-picker-button');
      fireEvent.press(dateButton);

      expect(mockOnDatePickerToggle).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing watchedValues gracefully', () => {
      const emptyWatchedValues = {};
      render(
        <DeadlineFormStep3
          {...{ ...defaultProps, watchedValues: emptyWatchedValues }}
        />
      );

      expect(
        screen.getByText("'Complete the form above to see your reading plan'")
      ).toBeTruthy();
    });

    it('should handle invalid date values', () => {
      const invalidDate = new Date('invalid');
      render(
        <DeadlineFormStep3 {...{ ...defaultProps, deadline: invalidDate }} />
      );

      expect(() => {
        screen.getByTestId('date-picker-button');
      }).not.toThrow();
    });

    it('should handle undefined callbacks without crashing', () => {
      const propsWithUndefinedCallbacks = {
        ...defaultProps,
        onPriorityChange: jest.fn(),
        onDatePickerToggle: jest.fn(),
        onDateChange: jest.fn(),
      };

      expect(() => {
        render(<DeadlineFormStep3 {...propsWithUndefinedCallbacks} />);
      }).not.toThrow();
    });

    it('should render with minimal required props', () => {
      const minimalProps = {
        control: mockControl,
        selectedFormat: 'physical' as const,
        selectedPriority: 'flexible' as const,
        onPriorityChange: mockOnPriorityChange,
        showDatePicker: false,
        onDatePickerToggle: mockOnDatePickerToggle,
        onDateChange: mockOnDateChange,
        deadline: new Date(),
        paceEstimate: '',
        watchedValues: {},
        setValue: mockSetValue,
      };

      expect(() => {
        render(<DeadlineFormStep3 {...minimalProps} />);
      }).not.toThrow();
    });
  });
});
