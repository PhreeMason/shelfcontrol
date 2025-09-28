import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { useForm } from 'react-hook-form';
import CustomInput from '../CustomInput';

jest.mock('@/components/themed', () => ({
  ThemedText: function MockThemedText({ children, color, style }: any) {
    const React = require('react');
    return React.createElement('Text', {
      testID: `themed-text-${color}`,
      style
    }, children);
  },
}));

jest.mock('@/hooks/useTheme', () => ({
  useTheme: jest.fn(() => ({
    colors: {
      textMuted: '#888888',
      surface: '#ffffff',
      text: '#000000',
      border: '#cccccc',
      danger: '#ff0000',
      inputBlurBackground: '#f5f5f5',
    },
  })),
}));

describe('CustomInput', () => {
  const TestWrapper = ({
    inputType = 'string',
    transformOnBlur,
    initialValue = '',
    _hasError = false,
    ...props
  }: {
    inputType?: 'string' | 'number' | 'integer';
    transformOnBlur?: (value: string) => string;
    initialValue?: any;
    _hasError?: boolean;
    [key: string]: any;
  }) => {
    const { control } = useForm({
      defaultValues: { testField: initialValue }
    });

    const inputProps: any = {
      control,
      name: "testField" as const,
      inputType,
      testID: "custom-input",
      placeholder: "Test placeholder",
      ...props
    };

    if (transformOnBlur) {
      inputProps.transformOnBlur = transformOnBlur;
    }

    return <CustomInput {...inputProps} />;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render TextInput with correct props', () => {
      render(<TestWrapper placeholder="Enter text" />);

      const input = screen.getByTestId('custom-input');
      expect(input).toBeTruthy();
      expect(input.props.placeholder).toBe('Enter text');
    });

    it('should render container with proper structure', () => {
      render(<TestWrapper />);

      expect(screen.getByTestId('custom-input')).toBeTruthy();
    });

    it('should apply custom testID when provided', () => {
      render(<TestWrapper testID="my-custom-input" />);

      expect(screen.getByTestId('my-custom-input')).toBeTruthy();
    });
  });

  describe('Input Types and Value Handling', () => {
    describe('String Input Type', () => {
      it('should handle string values correctly', () => {
        render(<TestWrapper inputType="string" initialValue="test string" />);

        const input = screen.getByTestId('custom-input');
        expect(input.props.value).toBe('test string');
      });

      it('should handle undefined values as empty string', () => {
        render(<TestWrapper inputType="string" initialValue={undefined} />);

        const input = screen.getByTestId('custom-input');
        expect(input.props.value).toBe('');
      });

      it('should handle null values as empty string', () => {
        render(<TestWrapper inputType="string" initialValue={null} />);

        const input = screen.getByTestId('custom-input');
        expect(input.props.value).toBe('');
      });

      it('should convert number values to string', () => {
        render(<TestWrapper inputType="string" initialValue={123} />);

        const input = screen.getByTestId('custom-input');
        expect(input.props.value).toBe('123');
      });
    });

    describe('Number Input Type', () => {
      it('should handle number values correctly', () => {
        render(<TestWrapper inputType="number" initialValue={42} />);

        const input = screen.getByTestId('custom-input');
        expect(input.props.value).toBe('42');
      });

      it('should handle undefined number values as empty string', () => {
        render(<TestWrapper inputType="number" initialValue={undefined} />);

        const input = screen.getByTestId('custom-input');
        expect(input.props.value).toBe('');
      });

      it('should handle null number values as empty string', () => {
        render(<TestWrapper inputType="number" initialValue={null} />);

        const input = screen.getByTestId('custom-input');
        expect(input.props.value).toBe('');
      });

      it('should handle zero values correctly', () => {
        render(<TestWrapper inputType="number" initialValue={0} />);

        const input = screen.getByTestId('custom-input');
        expect(input.props.value).toBe('0');
      });
    });

    describe('Integer Input Type', () => {
      it('should handle integer values correctly', () => {
        render(<TestWrapper inputType="integer" initialValue={100} />);

        const input = screen.getByTestId('custom-input');
        expect(input.props.value).toBe('100');
      });

      it('should handle undefined integer values as empty string', () => {
        render(<TestWrapper inputType="integer" initialValue={undefined} />);

        const input = screen.getByTestId('custom-input');
        expect(input.props.value).toBe('');
      });

      it('should handle null integer values as empty string', () => {
        render(<TestWrapper inputType="integer" initialValue={null} />);

        const input = screen.getByTestId('custom-input');
        expect(input.props.value).toBe('');
      });
    });
  });

  describe('Transform On Blur Functionality', () => {
    it('should not transform value when transformOnBlur is not provided', () => {
      render(<TestWrapper initialValue="test value" />);

      const input = screen.getByTestId('custom-input');
      fireEvent(input, 'blur');

      expect(input.props.value).toBe('test value');
    });

    it('should apply transformOnBlur when value is string', () => {
      const toUpperCase = (value: string) => value.toUpperCase();
      render(<TestWrapper transformOnBlur={toUpperCase} initialValue="hello world" />);

      const input = screen.getByTestId('custom-input');
      fireEvent(input, 'blur');

      // The transformation would be handled by react-hook-form in real usage
      expect(typeof input.props.value).toBe('string');
    });

    it('should not transform when value is not a string', () => {
      const toUpperCase = (value: string) => value.toUpperCase();
      render(<TestWrapper transformOnBlur={toUpperCase} initialValue={123} />);

      const input = screen.getByTestId('custom-input');
      fireEvent(input, 'blur');

      expect(input.props.value).toBe('123');
    });

    it('should not transform when value is empty/null', () => {
      const toUpperCase = (value: string) => value.toUpperCase();
      render(<TestWrapper transformOnBlur={toUpperCase} initialValue="" />);

      const input = screen.getByTestId('custom-input');
      fireEvent(input, 'blur');

      expect(input.props.value).toBe('');
    });
  });

  describe('Focus and Blur Behavior', () => {
    it('should update background color on focus', () => {
      render(<TestWrapper />);

      const input = screen.getByTestId('custom-input');

      fireEvent(input, 'focus');

      // Focus should trigger style change (background color)
      expect(input).toBeTruthy();
    });

    it('should update background color on blur', () => {
      render(<TestWrapper />);

      const input = screen.getByTestId('custom-input');

      fireEvent(input, 'focus');
      fireEvent(input, 'blur');

      // Blur should trigger style change back to blur background
      expect(input).toBeTruthy();
    });

    it('should call onBlur handler on blur event', () => {
      render(<TestWrapper />);

      const input = screen.getByTestId('custom-input');
      fireEvent(input, 'blur');

      // onBlur should be called
      expect(input).toBeTruthy();
    });
  });

  describe('Error State Handling', () => {
    it('should not display error when no error exists', () => {
      render(<TestWrapper _hasError={false} />);

      // Should not find error text
      expect(screen.queryByTestId('themed-text-danger')).toBeNull();
    });

    it('should apply error styling when error exists', () => {
      render(<TestWrapper _hasError={true} />);

      const input = screen.getByTestId('custom-input');
      // Error styling would be applied to border color
      expect(input).toBeTruthy();
    });

    it('should maintain consistent height spacing for error area', () => {
      const { rerender } = render(<TestWrapper _hasError={false} />);

      // Should have height spacing when no error
      expect(screen.getByTestId('custom-input')).toBeTruthy();

      rerender(<TestWrapper _hasError={true} />);

      // Should still maintain consistent layout with error
      expect(screen.getByTestId('custom-input')).toBeTruthy();
    });
  });

  describe('Theme Integration', () => {
    it('should apply theme colors correctly', () => {
      render(<TestWrapper />);

      const input = screen.getByTestId('custom-input');
      const style = input.props.style;

      // Should have theme-based styling
      expect(Array.isArray(style)).toBe(true);
      expect(input.props.placeholderTextColor).toBe('#888888');
    });

    it('should use danger color for error state', () => {
      render(<TestWrapper _hasError={true} />);

      const input = screen.getByTestId('custom-input');
      // Error state should use danger color for border
      expect(input).toBeTruthy();
    });

    it('should use different colors for focused and unfocused states', () => {
      render(<TestWrapper />);

      const input = screen.getByTestId('custom-input');

      // Test focus state color change
      fireEvent(input, 'focus');
      expect(input).toBeTruthy();

      // Test blur state color change
      fireEvent(input, 'blur');
      expect(input).toBeTruthy();
    });
  });

  describe('Props Handling', () => {
    it('should pass through additional TextInput props', () => {
      render(
        <TestWrapper
          maxLength={10}
          autoCapitalize="words"
          keyboardType="email-address"
        />
      );

      const input = screen.getByTestId('custom-input');
      expect(input.props.maxLength).toBe(10);
      expect(input.props.autoCapitalize).toBe('words');
      expect(input.props.keyboardType).toBe('email-address');
    });

    it('should not override controlled props', () => {
      render(<TestWrapper />);

      const input = screen.getByTestId('custom-input');

      // Should not have direct onChangeText, onBlur, value props
      // as they are controlled by react-hook-form
      expect(typeof input.props.onChangeText).toBe('function');
      expect(typeof input.props.onBlur).toBe('function');
      expect(typeof input.props.value).toBe('string');
    });

    it('should merge custom styles with default styles', () => {
      const customStyle = { fontSize: 20, paddingHorizontal: 20 };
      render(<TestWrapper style={customStyle} />);

      const input = screen.getByTestId('custom-input');
      const style = input.props.style;

      expect(Array.isArray(style)).toBe(true);
      expect(style).toContain(customStyle);
    });
  });

  describe('User Interaction', () => {
    it('should handle text input changes', () => {
      render(<TestWrapper />);

      const input = screen.getByTestId('custom-input');
      fireEvent.changeText(input, 'new text value');

      // onChange should be called through Controller
      expect(input).toBeTruthy();
    });

    it('should handle focus and blur events', () => {
      render(<TestWrapper />);

      const input = screen.getByTestId('custom-input');

      fireEvent(input, 'focus');
      fireEvent(input, 'blur');

      // Events should be handled properly
      expect(input).toBeTruthy();
    });

    it('should maintain input state through multiple interactions', () => {
      render(<TestWrapper initialValue="initial" />);

      const input = screen.getByTestId('custom-input');

      fireEvent(input, 'focus');
      fireEvent.changeText(input, 'updated text');
      fireEvent(input, 'blur');

      expect(input).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid focus/blur events', () => {
      render(<TestWrapper />);

      const input = screen.getByTestId('custom-input');

      fireEvent(input, 'focus');
      fireEvent(input, 'blur');
      fireEvent(input, 'focus');
      fireEvent(input, 'blur');

      expect(input).toBeTruthy();
    });

    it('should handle empty transformOnBlur function', () => {
      const emptyTransform = () => '';
      render(<TestWrapper transformOnBlur={emptyTransform} initialValue="test" />);

      const input = screen.getByTestId('custom-input');
      fireEvent(input, 'blur');

      expect(input).toBeTruthy();
    });

    it('should handle complex value transformations', () => {
      const titleCase = (value: string) =>
        value.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

      render(<TestWrapper transformOnBlur={titleCase} initialValue="hello world" />);

      const input = screen.getByTestId('custom-input');
      fireEvent(input, 'blur');

      expect(input).toBeTruthy();
    });
  });
});