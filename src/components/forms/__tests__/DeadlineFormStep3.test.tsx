import { useTheme } from '@/hooks/useThemeColor';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { DeadlineFormStep3 } from '../DeadlineFormStep3';

jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: jest.fn(),
}));

jest.mock('react-hook-form', () => ({
  useWatch: ({ name }: any) => {
    if (name === 'book_id') return undefined;
    if (name === 'publishers') return [];
    return undefined;
  },
}));

jest.mock('@/components/shared/CustomInput', () => {
  const React = require('react');
  return function MockCustomInput(props: any) {
    return React.createElement(
      'View',
      {
        testID: props.testID || `input-${props.name}`,
        'data-name': props.name,
        'data-placeholder': props.placeholder,
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
        testID: props.testID || `input-${props.name}`,
        'data-name': props.name,
        'data-placeholder': props.placeholder,
      },
      null
    );
  };
});

jest.mock('@/components/themed', () => ({
  ThemedText: ({ children }: any) => {
    const React = require('react');
    return React.createElement('Text', null, children);
  },
}));

jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: ({ name }: any) => {
    const React = require('react');
    return React.createElement('View', { testID: `icon-${name}` }, null);
  },
}));

describe('DeadlineFormStep3', () => {
  const mockColors = {
    primary: '#007AFF',
    surface: '#FFFFFF',
    border: '#E5E5E7',
    textMuted: '#8E8E93',
    danger: '#FF3B30',
  };

  const mockControl = {} as any;
  const mockSetValue = jest.fn();

  const defaultProps = {
    control: mockControl,
    setValue: mockSetValue,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({ colors: mockColors });
  });

  describe('Component Structure', () => {
    it('should render description text', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(
        screen.getByText(/Add additional details about the book source/i)
      ).toBeTruthy();
    });

    it('should render Book Type field with required indicator', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByText('Book Type', { exact: false })).toBeTruthy();
      expect(screen.getByText('*')).toBeTruthy();
      expect(screen.getByTestId('input-deadline-type')).toBeTruthy();
    });

    it('should render Source field without required indicator', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByText('Source')).toBeTruthy();
      expect(screen.getByTestId('input-acquisition-source')).toBeTruthy();
    });

    it('should render Publishers section', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByText('Publishers')).toBeTruthy();
    });

    it('should render Source field placeholder text', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      const input = screen.getByTestId('input-acquisition-source');
      expect(input.props['data-placeholder']).toBe(
        '(e.g., NetGalley, Edelweiss, Direct, etc.)'
      );
    });

    it('should render helper text for Publishers field', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(
        screen.getByText(/Add up to 5 publishers for this book/i)
      ).toBeTruthy();
    });
  });

  describe('Hook Integration', () => {
    it('should call useTheme hook', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(useTheme).toHaveBeenCalled();
    });

    it('should pass control prop to SourceTypeaheadInput', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByTestId('input-deadline-type')).toBeTruthy();
    });

    it('should pass control prop to CustomInput for acquisition_source', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByTestId('input-acquisition-source')).toBeTruthy();
    });
  });

  describe('Publishers Array - Empty State', () => {
    it('should show "Add Publisher" button when no publishers', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByTestId('add-publisher-button')).toBeTruthy();
      expect(screen.getByText('Add Publisher')).toBeTruthy();
    });

    it('should show plus icon in add button', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByTestId('icon-plus')).toBeTruthy();
    });

    it('should call setValue when add button pressed', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      const addButton = screen.getByTestId('add-publisher-button');
      fireEvent.press(addButton);

      expect(mockSetValue).toHaveBeenCalledWith('publishers', ['']);
    });
  });

  describe('Publishers Array - With Publishers', () => {
    beforeEach(() => {
      (require('react-hook-form').useWatch as jest.Mock) = jest.fn(
        ({ name }: any) => {
          if (name === 'book_id') return undefined;
          if (name === 'publishers') return ['Publisher 1'];
          return undefined;
        }
      );
    });

    it('should render publisher input when publishers exist', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByTestId('input-publisher-0')).toBeTruthy();
    });

    it('should render remove button for each publisher', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByTestId('remove-publisher-0')).toBeTruthy();
    });

    it('should show trash icon in remove button', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByTestId('icon-trash')).toBeTruthy();
    });

    it('should show "Add Another Publisher" button when publishers exist', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByText('Add Another Publisher')).toBeTruthy();
    });

    it('should call setValue when removing publisher', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      const removeButton = screen.getByTestId('remove-publisher-0');
      fireEvent.press(removeButton);

      expect(mockSetValue).toHaveBeenCalledWith('publishers', undefined);
    });

    it('should call setValue with remaining publishers when removing from multiple', () => {
      (require('react-hook-form').useWatch as jest.Mock) = jest.fn(
        ({ name }: any) => {
          if (name === 'book_id') return undefined;
          if (name === 'publishers') return ['Publisher 1', 'Publisher 2'];
          return undefined;
        }
      );

      render(<DeadlineFormStep3 {...defaultProps} />);

      const removeButton = screen.getByTestId('remove-publisher-0');
      fireEvent.press(removeButton);

      expect(mockSetValue).toHaveBeenCalledWith('publishers', ['Publisher 2']);
    });

    it('should call setValue when adding another publisher', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      const addButton = screen.getByTestId('add-publisher-button');
      fireEvent.press(addButton);

      expect(mockSetValue).toHaveBeenCalledWith('publishers', [
        'Publisher 1',
        '',
      ]);
    });
  });

  describe('Multiple Publishers', () => {
    beforeEach(() => {
      (require('react-hook-form').useWatch as jest.Mock) = jest.fn(
        ({ name }: any) => {
          if (name === 'book_id') return undefined;
          if (name === 'publishers')
            return ['Publisher 1', 'Publisher 2', 'Publisher 3'];
          return undefined;
        }
      );
    });

    it('should render multiple publisher inputs', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByTestId('input-publisher-0')).toBeTruthy();
      expect(screen.getByTestId('input-publisher-1')).toBeTruthy();
      expect(screen.getByTestId('input-publisher-2')).toBeTruthy();
    });

    it('should render multiple remove buttons', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByTestId('remove-publisher-0')).toBeTruthy();
      expect(screen.getByTestId('remove-publisher-1')).toBeTruthy();
      expect(screen.getByTestId('remove-publisher-2')).toBeTruthy();
    });

    it('should remove correct publisher by index', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      const removeButton = screen.getByTestId('remove-publisher-1');
      fireEvent.press(removeButton);

      expect(mockSetValue).toHaveBeenCalledWith('publishers', [
        'Publisher 1',
        'Publisher 3',
      ]);
    });
  });

  describe('Autofilled Indicator', () => {
    it('should show autofilled indicator for first publisher when isPublisherAutofilled is true', () => {
      (require('react-hook-form').useWatch as jest.Mock) = jest.fn(
        ({ name }: any) => {
          if (name === 'isPublisherAutofilled') return true;
          if (name === 'publishers') return ['Penguin Random House'];
          return undefined;
        }
      );

      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByText('✓ Linked from library')).toBeTruthy();
    });

    it('should not show autofilled indicator when isPublisherAutofilled is false', () => {
      (require('react-hook-form').useWatch as jest.Mock) = jest.fn(
        ({ name }: any) => {
          if (name === 'isPublisherAutofilled') return false;
          if (name === 'publishers') return ['Penguin Random House'];
          return undefined;
        }
      );

      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.queryByText('✓ Linked from library')).toBeNull();
    });

    it('should not show autofilled indicator when isPublisherAutofilled is undefined', () => {
      (require('react-hook-form').useWatch as jest.Mock) = jest.fn(
        ({ name }: any) => {
          if (name === 'isPublisherAutofilled') return undefined;
          if (name === 'publishers') return ['Penguin Random House'];
          return undefined;
        }
      );

      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.queryByText('✓ Linked from library')).toBeNull();
    });

    it('should only show autofilled indicator on first publisher', () => {
      (require('react-hook-form').useWatch as jest.Mock) = jest.fn(
        ({ name }: any) => {
          if (name === 'isPublisherAutofilled') return true;
          if (name === 'publishers') return ['Publisher 1', 'Publisher 2'];
          return undefined;
        }
      );

      render(<DeadlineFormStep3 {...defaultProps} />);

      const indicators = screen.queryAllByText('✓ Linked from library');
      expect(indicators).toHaveLength(1);
    });

    it('should not show autofilled indicator when no publishers', () => {
      (require('react-hook-form').useWatch as jest.Mock) = jest.fn(
        ({ name }: any) => {
          if (name === 'isPublisherAutofilled') return true;
          if (name === 'publishers') return [];
          return undefined;
        }
      );

      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.queryByText('✓ Linked from library')).toBeNull();
    });

    it('should clear autofilled flag when removing first publisher', () => {
      (require('react-hook-form').useWatch as jest.Mock) = jest.fn(
        ({ name }: any) => {
          if (name === 'isPublisherAutofilled') return true;
          if (name === 'publishers') return ['Penguin Random House'];
          return undefined;
        }
      );

      const mockSetValue = jest.fn();
      render(<DeadlineFormStep3 {...defaultProps} setValue={mockSetValue} />);

      const removeButton = screen.getByTestId('remove-publisher-0');
      fireEvent.press(removeButton);

      expect(mockSetValue).toHaveBeenCalledWith('isPublisherAutofilled', false);
    });

    it('should not clear autofilled flag when removing non-first publisher', () => {
      (require('react-hook-form').useWatch as jest.Mock) = jest.fn(
        ({ name }: any) => {
          if (name === 'isPublisherAutofilled') return true;
          if (name === 'publishers')
            return ['Publisher 1', 'Publisher 2', 'Publisher 3'];
          return undefined;
        }
      );

      const mockSetValue = jest.fn();
      render(<DeadlineFormStep3 {...defaultProps} setValue={mockSetValue} />);

      const removeButton = screen.getByTestId('remove-publisher-1');
      fireEvent.press(removeButton);

      expect(mockSetValue).toHaveBeenCalledWith('publishers', [
        'Publisher 1',
        'Publisher 3',
      ]);
      expect(mockSetValue).not.toHaveBeenCalledWith(
        'isPublisherAutofilled',
        false
      );
    });
  });

  describe('Input Field Configuration', () => {
    it('should configure deadline_type input with correct props', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      const input = screen.getByTestId('input-deadline-type');
      expect(input.props['data-name']).toBe('deadline_type');
      expect(input.props['data-placeholder']).toBe('Enter book type');
    });

    it('should configure acquisition_source input with correct props', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      const input = screen.getByTestId('input-acquisition-source');
      expect(input.props['data-name']).toBe('acquisition_source');
      expect(input.props['data-placeholder']).toBe(
        '(e.g., NetGalley, Edelweiss, Direct, etc.)'
      );
    });

    it('should configure publisher inputs with correct props', () => {
      (require('react-hook-form').useWatch as jest.Mock) = jest.fn(
        ({ name }: any) => {
          if (name === 'book_id') return undefined;
          if (name === 'publishers') return [''];
          return undefined;
        }
      );

      render(<DeadlineFormStep3 {...defaultProps} />);

      const input = screen.getByTestId('input-publisher-0');
      expect(input.props['data-name']).toBe('publishers.0');
      expect(input.props['data-placeholder']).toBe('Publisher name');
    });
  });

  describe('Props Handling', () => {
    it('should pass control to all inputs', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByTestId('input-deadline-type')).toBeTruthy();
      expect(screen.getByTestId('input-acquisition-source')).toBeTruthy();
    });

    it('should pass setValue callback correctly', () => {
      render(<DeadlineFormStep3 {...defaultProps} />);

      const addButton = screen.getByTestId('add-publisher-button');
      fireEvent.press(addButton);

      expect(mockSetValue).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should render without errors with minimal props', () => {
      expect(() => {
        render(<DeadlineFormStep3 {...defaultProps} />);
      }).not.toThrow();
    });

    it('should handle undefined publishers gracefully', () => {
      (require('react-hook-form').useWatch as jest.Mock) = jest.fn(
        ({ name }: any) => {
          if (name === 'book_id') return undefined;
          if (name === 'publishers') return undefined;
          return undefined;
        }
      );

      expect(() => {
        render(<DeadlineFormStep3 {...defaultProps} />);
      }).not.toThrow();
    });

    it('should handle null publishers gracefully', () => {
      (require('react-hook-form').useWatch as jest.Mock) = jest.fn(
        ({ name }: any) => {
          if (name === 'book_id') return undefined;
          if (name === 'publishers') return null;
          return undefined;
        }
      );

      expect(() => {
        render(<DeadlineFormStep3 {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete flow: add, edit, remove publishers', () => {
      const { rerender } = render(<DeadlineFormStep3 {...defaultProps} />);

      const addButton = screen.getByTestId('add-publisher-button');
      fireEvent.press(addButton);

      expect(mockSetValue).toHaveBeenCalledWith('publishers', ['']);

      (require('react-hook-form').useWatch as jest.Mock) = jest.fn(
        ({ name }: any) => {
          if (name === 'book_id') return undefined;
          if (name === 'publishers') return ['Publisher 1'];
          return undefined;
        }
      );

      rerender(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByTestId('input-publisher-0')).toBeTruthy();

      const removeButton = screen.getByTestId('remove-publisher-0');
      fireEvent.press(removeButton);

      expect(mockSetValue).toHaveBeenCalledWith('publishers', undefined);
    });

    it('should handle autofilled publisher from book selection', () => {
      (require('react-hook-form').useWatch as jest.Mock) = jest.fn(
        ({ name }: any) => {
          if (name === 'isPublisherAutofilled') return true;
          if (name === 'publishers') return ['HarperCollins'];
          return undefined;
        }
      );

      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByTestId('input-publisher-0')).toBeTruthy();
      expect(screen.getByText('✓ Linked from library')).toBeTruthy();

      const addButton = screen.getByTestId('add-publisher-button');
      fireEvent.press(addButton);

      expect(mockSetValue).toHaveBeenCalledWith('publishers', [
        'HarperCollins',
        '',
      ]);
    });
  });

  describe('Publisher Limit (Max 5)', () => {
    it('should allow adding publisher when less than 5', () => {
      (require('react-hook-form').useWatch as jest.Mock) = jest.fn(
        ({ name }: any) => {
          if (name === 'isPublisherAutofilled') return false;
          if (name === 'publishers')
            return ['Publisher 1', 'Publisher 2', 'Publisher 3'];
          return undefined;
        }
      );

      const mockSetValue = jest.fn();
      render(<DeadlineFormStep3 {...defaultProps} setValue={mockSetValue} />);

      const addButton = screen.getByTestId('add-publisher-button');
      fireEvent.press(addButton);

      expect(mockSetValue).toHaveBeenCalledWith('publishers', [
        'Publisher 1',
        'Publisher 2',
        'Publisher 3',
        '',
      ]);
    });

    it('should disable add button when 5 publishers exist', () => {
      (require('react-hook-form').useWatch as jest.Mock) = jest.fn(
        ({ name }: any) => {
          if (name === 'isPublisherAutofilled') return false;
          if (name === 'publishers')
            return [
              'Publisher 1',
              'Publisher 2',
              'Publisher 3',
              'Publisher 4',
              'Publisher 5',
            ];
          return undefined;
        }
      );

      render(<DeadlineFormStep3 {...defaultProps} />);

      const addButton = screen.getByTestId('add-publisher-button');
      expect(addButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('should not add publisher when clicking disabled button at limit', () => {
      (require('react-hook-form').useWatch as jest.Mock) = jest.fn(
        ({ name }: any) => {
          if (name === 'isPublisherAutofilled') return false;
          if (name === 'publishers')
            return [
              'Publisher 1',
              'Publisher 2',
              'Publisher 3',
              'Publisher 4',
              'Publisher 5',
            ];
          return undefined;
        }
      );

      const mockSetValue = jest.fn();
      render(<DeadlineFormStep3 {...defaultProps} setValue={mockSetValue} />);

      const addButton = screen.getByTestId('add-publisher-button');
      fireEvent.press(addButton);

      expect(mockSetValue).not.toHaveBeenCalled();
    });

    it('should show reduced opacity on add button when at limit', () => {
      (require('react-hook-form').useWatch as jest.Mock) = jest.fn(
        ({ name }: any) => {
          if (name === 'isPublisherAutofilled') return false;
          if (name === 'publishers')
            return [
              'Publisher 1',
              'Publisher 2',
              'Publisher 3',
              'Publisher 4',
              'Publisher 5',
            ];
          return undefined;
        }
      );

      render(<DeadlineFormStep3 {...defaultProps} />);

      const addButton = screen.getByTestId('add-publisher-button');
      expect(addButton.props.style).toEqual(
        expect.objectContaining({ opacity: 0.5 })
      );
    });

    it('should show "Maximum of 5 publishers reached" text when at limit', () => {
      (require('react-hook-form').useWatch as jest.Mock) = jest.fn(
        ({ name }: any) => {
          if (name === 'isPublisherAutofilled') return false;
          if (name === 'publishers')
            return [
              'Publisher 1',
              'Publisher 2',
              'Publisher 3',
              'Publisher 4',
              'Publisher 5',
            ];
          return undefined;
        }
      );

      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(screen.getByText('Maximum of 5 publishers reached')).toBeTruthy();
    });

    it('should show "Add up to 5 publishers" text when below limit', () => {
      (require('react-hook-form').useWatch as jest.Mock) = jest.fn(
        ({ name }: any) => {
          if (name === 'isPublisherAutofilled') return false;
          if (name === 'publishers') return ['Publisher 1', 'Publisher 2'];
          return undefined;
        }
      );

      render(<DeadlineFormStep3 {...defaultProps} />);

      expect(
        screen.getByText('Add up to 5 publishers for this book')
      ).toBeTruthy();
    });

    it('should allow adding publisher again after removing from limit', () => {
      (require('react-hook-form').useWatch as jest.Mock) = jest.fn(
        ({ name }: any) => {
          if (name === 'isPublisherAutofilled') return false;
          if (name === 'publishers')
            return ['Publisher 1', 'Publisher 2', 'Publisher 3', 'Publisher 4'];
          return undefined;
        }
      );

      const mockSetValue = jest.fn();
      render(<DeadlineFormStep3 {...defaultProps} setValue={mockSetValue} />);

      const addButton = screen.getByTestId('add-publisher-button');
      expect(addButton.props.accessibilityState?.disabled).toBe(false);

      fireEvent.press(addButton);

      expect(mockSetValue).toHaveBeenCalledWith('publishers', [
        'Publisher 1',
        'Publisher 2',
        'Publisher 3',
        'Publisher 4',
        '',
      ]);
    });
  });
});
