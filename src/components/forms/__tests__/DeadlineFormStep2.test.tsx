import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { DeadlineFormStep2 } from '../DeadlineFormStep2';
import { useWatch } from 'react-hook-form';

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useWatch: jest.fn(),
}));

// Mock utilities
jest.mock('@/utils/stringUtils', () => ({
  toTitleCase: jest.fn(text => text),
}));

// Mock child components to isolate testing
jest.mock('@/components/shared/CustomInput', () => {
  const React = require('react');
  return function MockCustomInput(props: any) {
    return React.createElement(
      'View',
      {
        testID: props.testID,
        'data-name': props.name,
        'data-placeholder': props.placeholder,
        'data-keyboard': props.keyboardType,
        'data-input-type': props.inputType,
        'data-transform': props.transformOnBlur ? 'toTitleCase' : undefined,
      },
      null
    );
  };
});

jest.mock('@/components/shared/SourceTypeaheadInput', () => {
  const React = require('react');
  return function MockSourceTypeaheadInput(props: any) {
    return React.createElement(
      'View',
      {
        testID: props.testID,
        'data-name': props.name,
        'data-placeholder': props.placeholder,
      },
      null
    );
  };
});

jest.mock('@/components/forms/FormatSelector', () => ({
  FormatSelector: ({ selectedFormat, onSelectFormat, disabled }: any) => {
    const React = require('react');
    return React.createElement(
      'View',
      {
        testID: 'format-selector',
        'data-selected': selectedFormat,
        'data-disabled': disabled,
        onPress: () => onSelectFormat && onSelectFormat('audio'),
      },
      null
    );
  },
}));

jest.mock('@/components/forms/StatusSelector', () => ({
  StatusSelector: ({ selectedStatus, onSelectStatus }: any) => {
    const React = require('react');
    return React.createElement(
      'View',
      {
        testID: 'status-selector',
        'data-selected': selectedStatus,
        onPress: () => onSelectStatus && onSelectStatus('active'),
      },
      null
    );
  },
}));

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

describe('DeadlineFormStep2', () => {
  const mockControl = {} as any;
  const mockSetValue = jest.fn();
  const mockOnFormatChange = jest.fn();
  const mockOnStatusChange = jest.fn();

  const defaultProps = {
    control: mockControl,
    selectedFormat: 'physical' as const,
    onFormatChange: mockOnFormatChange,
    selectedStatus: 'pending' as const,
    onStatusChange: mockOnStatusChange,
    isEditMode: false,
    setValue: mockSetValue,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useWatch as jest.Mock).mockReturnValue(null);
  });

  describe('Component Structure', () => {
    it('should render description text', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      expect(
        screen.getByText('Enter the book details and format information.')
      ).toBeTruthy();
    });

    it('should render Book Title label and input', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      expect(screen.getByText('Book Title *')).toBeTruthy();
      expect(screen.getByTestId('input-bookTitle')).toBeTruthy();
    });

    it('should render Author label and input', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      expect(screen.getByText('Author')).toBeTruthy();
      expect(screen.getByTestId('input-bookAuthor')).toBeTruthy();
    });

    it('should render Status label and selector', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      expect(screen.getByText('Status')).toBeTruthy();
      expect(screen.getByTestId('status-selector')).toBeTruthy();
    });

    it('should render Format label and selector', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      expect(screen.getByText('Format')).toBeTruthy();
      expect(screen.getByTestId('format-selector')).toBeTruthy();
    });

    it('should render Book type label and typeahead input', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      expect(screen.getByText('Book type')).toBeTruthy();
      expect(screen.getByTestId('input-source')).toBeTruthy();
    });

    it('should render Total Pages label for physical/eBook formats', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      expect(screen.getByText('Total Pages *')).toBeTruthy();
    });

    it('should render Total Time label for audio format', () => {
      render(
        <DeadlineFormStep2 {...{ ...defaultProps, selectedFormat: 'audio' }} />
      );

      expect(screen.getByText('Total Time *')).toBeTruthy();
    });

    it('should show helper text under Status selector', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      expect(
        screen.getByText('Is this book actively being read or pending?')
      ).toBeTruthy();
    });

    it('should show helper text under Total Quantity input', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      expect(
        screen.getByText("We'll use this to calculate your daily reading pace")
      ).toBeTruthy();
    });

    it('should render all required components without errors', () => {
      expect(() => {
        render(<DeadlineFormStep2 {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe('Hook Integration', () => {
    it('should call useWatch with correct parameters', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      expect(useWatch).toHaveBeenCalledWith({
        control: mockControl,
        name: 'book_id',
      });
    });

    it('should watch book_id field from control', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      const calls = (useWatch as jest.Mock).mock.calls;
      const bookIdWatch = calls.find(call => call[0].name === 'book_id');
      expect(bookIdWatch).toBeDefined();
    });

    it('should re-render when watched value changes', () => {
      const { rerender } = render(<DeadlineFormStep2 {...defaultProps} />);

      (useWatch as jest.Mock).mockReturnValue('book-123');

      rerender(<DeadlineFormStep2 {...defaultProps} />);

      expect(screen.getAllByText('✓ Linked from library')).toHaveLength(2);
    });
  });

  describe('Format-Based Conditional Rendering', () => {
    it('should show "Total Pages *" label for physical format', () => {
      render(
        <DeadlineFormStep2
          {...{ ...defaultProps, selectedFormat: 'physical' }}
        />
      );

      expect(screen.getByText('Total Pages *')).toBeTruthy();
      expect(screen.queryByText('Total Time *')).toBeNull();
    });

    it('should show "Total Pages *" label for eBook format', () => {
      render(
        <DeadlineFormStep2 {...{ ...defaultProps, selectedFormat: 'eBook' }} />
      );

      expect(screen.getByText('Total Pages *')).toBeTruthy();
      expect(screen.queryByText('Total Time *')).toBeNull();
    });

    it('should show "Total Time *" label for audio format', () => {
      render(
        <DeadlineFormStep2 {...{ ...defaultProps, selectedFormat: 'audio' }} />
      );

      expect(screen.getByText('Total Time *')).toBeTruthy();
      expect(screen.queryByText('Total Pages *')).toBeNull();
    });

    it('should show "How many pages total?" placeholder for non-audio formats', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      const totalQuantityInput = screen.getByTestId('input-totalQuantity');
      expect(totalQuantityInput.props['data-placeholder']).toBe(
        'How many pages total?'
      );
    });

    it('should show "Hours" placeholder for audio format', () => {
      render(
        <DeadlineFormStep2 {...{ ...defaultProps, selectedFormat: 'audio' }} />
      );

      const totalQuantityInput = screen.getByTestId('input-totalQuantity');
      expect(totalQuantityInput.props['data-placeholder']).toBe('Hours');
    });

    it('should show Minutes input field only for audio format', () => {
      const { rerender } = render(<DeadlineFormStep2 {...defaultProps} />);

      expect(screen.queryByTestId('input-totalMinutes')).toBeNull();

      rerender(
        <DeadlineFormStep2 {...{ ...defaultProps, selectedFormat: 'audio' }} />
      );

      expect(screen.getByTestId('input-totalMinutes')).toBeTruthy();
    });
  });

  describe('Book Linking Indicators', () => {
    it('should show "✓ Linked from library" under book title when book_id present', () => {
      (useWatch as jest.Mock).mockReturnValue('book-123');

      render(<DeadlineFormStep2 {...defaultProps} />);

      const linkedIndicators = screen.getAllByText('✓ Linked from library');
      expect(linkedIndicators.length).toBeGreaterThanOrEqual(1);
    });

    it('should show "✓ Linked from library" under author when book_id present', () => {
      (useWatch as jest.Mock).mockReturnValue('book-123');

      render(<DeadlineFormStep2 {...defaultProps} />);

      const linkedIndicators = screen.getAllByText('✓ Linked from library');
      expect(linkedIndicators).toHaveLength(2);
    });

    it('should hide indicators when book_id is null', () => {
      (useWatch as jest.Mock).mockReturnValue(null);

      render(<DeadlineFormStep2 {...defaultProps} />);

      expect(screen.queryByText('✓ Linked from library')).toBeNull();
    });

    it('should update indicators when book_id changes', () => {
      const { rerender } = render(<DeadlineFormStep2 {...defaultProps} />);

      expect(screen.queryByText('✓ Linked from library')).toBeNull();

      (useWatch as jest.Mock).mockReturnValue('book-456');
      rerender(<DeadlineFormStep2 {...defaultProps} />);

      expect(screen.getAllByText('✓ Linked from library')).toHaveLength(2);
    });
  });

  describe('Edit Mode Behavior', () => {
    it('should disable FormatSelector in edit mode', () => {
      render(<DeadlineFormStep2 {...{ ...defaultProps, isEditMode: true }} />);

      const formatSelector = screen.getByTestId('format-selector');
      expect(formatSelector.props['data-disabled']).toBe(true);
    });

    it('should show "Format cannot be changed after creation" text in edit mode', () => {
      render(<DeadlineFormStep2 {...{ ...defaultProps, isEditMode: true }} />);

      expect(
        screen.getByText('Format cannot be changed after creation')
      ).toBeTruthy();
    });

    it('should enable FormatSelector when not in edit mode', () => {
      render(<DeadlineFormStep2 {...{ ...defaultProps, isEditMode: false }} />);

      const formatSelector = screen.getByTestId('format-selector');
      expect(formatSelector.props['data-disabled']).toBe(false);
    });
  });

  describe('Props Handling', () => {
    it('should pass control prop to all CustomInput components', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      const inputs = [
        'input-bookTitle',
        'input-bookAuthor',
        'input-totalQuantity',
      ];
      inputs.forEach(testId => {
        expect(screen.getByTestId(testId)).toBeTruthy();
      });
    });

    it('should pass control prop to SourceTypeaheadInput', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      expect(screen.getByTestId('input-source')).toBeTruthy();
    });

    it('should call onFormatChange when format is selected', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      const formatSelector = screen.getByTestId('format-selector');
      fireEvent.press(formatSelector);

      expect(mockOnFormatChange).toHaveBeenCalledWith('audio');
    });

    it('should call onStatusChange when status is selected', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      const statusSelector = screen.getByTestId('status-selector');
      fireEvent.press(statusSelector);

      expect(mockOnStatusChange).toHaveBeenCalledWith('active');
    });

    it('should pass selectedFormat to FormatSelector', () => {
      render(
        <DeadlineFormStep2 {...{ ...defaultProps, selectedFormat: 'eBook' }} />
      );

      const formatSelector = screen.getByTestId('format-selector');
      expect(formatSelector.props['data-selected']).toBe('eBook');
    });

    it('should pass selectedStatus to StatusSelector', () => {
      render(
        <DeadlineFormStep2 {...{ ...defaultProps, selectedStatus: 'active' }} />
      );

      const statusSelector = screen.getByTestId('status-selector');
      expect(statusSelector.props['data-selected']).toBe('active');
    });

    it('should pass correct testIDs to all inputs', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      expect(screen.getByTestId('input-bookTitle')).toBeTruthy();
      expect(screen.getByTestId('input-bookAuthor')).toBeTruthy();
      expect(screen.getByTestId('input-source')).toBeTruthy();
      expect(screen.getByTestId('input-totalQuantity')).toBeTruthy();
    });

    it('should apply toTitleCase transform to bookTitle', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      const bookTitleInput = screen.getByTestId('input-bookTitle');
      expect(bookTitleInput.props['data-transform']).toBe('toTitleCase');
    });
  });

  describe('Input Field Configuration', () => {
    it('should configure bookTitle input with correct name and testID', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      const input = screen.getByTestId('input-bookTitle');
      expect(input.props['data-name']).toBe('bookTitle');
      expect(input.props['data-placeholder']).toBe('Enter the book title');
    });

    it('should configure bookAuthor input with correct name and testID', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      const input = screen.getByTestId('input-bookAuthor');
      expect(input.props['data-name']).toBe('bookAuthor');
      expect(input.props['data-placeholder']).toBe('Author name (optional)');
    });

    it('should configure source typeahead with correct name and testID', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      const input = screen.getByTestId('input-source');
      expect(input.props['data-name']).toBe('source');
      expect(input.props['data-placeholder']).toBe('Enter book type');
    });

    it('should configure totalQuantity input with numeric keyboard and integer type', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      const input = screen.getByTestId('input-totalQuantity');
      expect(input.props['data-keyboard']).toBe('numeric');
      expect(input.props['data-input-type']).toBe('integer');
    });

    it('should configure totalMinutes input with numeric keyboard and integer type for audio', () => {
      render(
        <DeadlineFormStep2 {...{ ...defaultProps, selectedFormat: 'audio' }} />
      );

      const input = screen.getByTestId('input-totalMinutes');
      expect(input.props['data-keyboard']).toBe('numeric');
      expect(input.props['data-input-type']).toBe('integer');
      expect(input.props['data-placeholder']).toBe('Minutes (optional)');
    });

    it('should mark required fields with asterisk', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      expect(screen.getByText('Book Title *')).toBeTruthy();
      expect(screen.getByText('Total Pages *')).toBeTruthy();
    });

    it('should mark optional fields appropriately', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      const authorLabel = screen.getByText('Author');
      const statusLabel = screen.getByText('Status');
      const formatLabel = screen.getByText('Format');
      const bookTypeLabel = screen.getByText('Book type');

      // These should not contain asterisks
      expect(authorLabel.props.children).toBe('Author');
      expect(statusLabel.props.children).toBe('Status');
      expect(formatLabel.props.children).toBe('Format');
      expect(bookTypeLabel.props.children).toBe('Book type');
    });
  });

  describe('Dynamic Label/Placeholder Tests', () => {
    it('should return correct label for physical format', () => {
      render(
        <DeadlineFormStep2
          {...{ ...defaultProps, selectedFormat: 'physical' }}
        />
      );

      expect(screen.getByText('Total Pages *')).toBeTruthy();
    });

    it('should return correct label for audio format', () => {
      render(
        <DeadlineFormStep2 {...{ ...defaultProps, selectedFormat: 'audio' }} />
      );

      expect(screen.getByText('Total Time *')).toBeTruthy();
    });

    it('should update labels when format changes', () => {
      const { rerender } = render(<DeadlineFormStep2 {...defaultProps} />);

      expect(screen.getByText('Total Pages *')).toBeTruthy();

      rerender(
        <DeadlineFormStep2 {...{ ...defaultProps, selectedFormat: 'audio' }} />
      );

      expect(screen.queryByText('Total Pages *')).toBeNull();
      expect(screen.getByText('Total Time *')).toBeTruthy();
    });

    it('should update placeholders when format changes', () => {
      const { rerender } = render(<DeadlineFormStep2 {...defaultProps} />);

      let input = screen.getByTestId('input-totalQuantity');
      expect(input.props['data-placeholder']).toBe('How many pages total?');

      rerender(
        <DeadlineFormStep2 {...{ ...defaultProps, selectedFormat: 'audio' }} />
      );

      input = screen.getByTestId('input-totalQuantity');
      expect(input.props['data-placeholder']).toBe('Hours');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete flow for non-linked book with all manual inputs', () => {
      render(<DeadlineFormStep2 {...defaultProps} />);

      // Verify all inputs are present and no linked indicators
      expect(screen.getByTestId('input-bookTitle')).toBeTruthy();
      expect(screen.getByTestId('input-bookAuthor')).toBeTruthy();
      expect(screen.getByTestId('input-source')).toBeTruthy();
      expect(screen.getByTestId('input-totalQuantity')).toBeTruthy();
      expect(screen.queryByText('✓ Linked from library')).toBeNull();

      // Verify selectors are enabled
      const formatSelector = screen.getByTestId('format-selector');
      expect(formatSelector.props['data-disabled']).toBe(false);
    });

    it('should handle complete flow for linked book showing indicators', () => {
      (useWatch as jest.Mock).mockReturnValue('book-123');

      const { rerender } = render(<DeadlineFormStep2 {...defaultProps} />);

      // Initially no indicators
      rerender(<DeadlineFormStep2 {...defaultProps} />);

      // Now should show indicators
      expect(screen.getAllByText('✓ Linked from library')).toHaveLength(2);

      // All inputs should still be present for manual editing
      expect(screen.getByTestId('input-bookTitle')).toBeTruthy();
      expect(screen.getByTestId('input-bookAuthor')).toBeTruthy();
    });

    it('should handle format change updating labels and showing/hiding minutes input', () => {
      const { rerender } = render(<DeadlineFormStep2 {...defaultProps} />);

      // Physical format: no minutes input
      expect(screen.getByText('Total Pages *')).toBeTruthy();
      expect(screen.queryByTestId('input-totalMinutes')).toBeNull();

      // Change to audio format
      rerender(
        <DeadlineFormStep2 {...{ ...defaultProps, selectedFormat: 'audio' }} />
      );

      // Audio format: shows minutes input
      expect(screen.getByText('Total Time *')).toBeTruthy();
      expect(screen.getByTestId('input-totalMinutes')).toBeTruthy();

      // Change to eBook format
      rerender(
        <DeadlineFormStep2 {...{ ...defaultProps, selectedFormat: 'eBook' }} />
      );

      // eBook format: no minutes input
      expect(screen.getByText('Total Pages *')).toBeTruthy();
      expect(screen.queryByTestId('input-totalMinutes')).toBeNull();
    });

    it('should handle edit mode with linked book showing correct state', () => {
      (useWatch as jest.Mock).mockReturnValue('book-456');

      render(<DeadlineFormStep2 {...{ ...defaultProps, isEditMode: true }} />);

      // Format selector should be disabled
      const formatSelector = screen.getByTestId('format-selector');
      expect(formatSelector.props['data-disabled']).toBe(true);

      // Should show disabled message
      expect(
        screen.getByText('Format cannot be changed after creation')
      ).toBeTruthy();

      // Should show linked indicators
      expect(screen.getAllByText('✓ Linked from library')).toHaveLength(2);

      // All inputs should still be editable
      expect(screen.getByTestId('input-bookTitle')).toBeTruthy();
      expect(screen.getByTestId('input-bookAuthor')).toBeTruthy();
      expect(screen.getByTestId('input-totalQuantity')).toBeTruthy();
    });
  });
});
