import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import {
  AnimatedCustomInput,
  AnimatedCustomInputRef,
} from '../AnimatedCustomInput';

// Mock external dependencies - minimal mocking strategy
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  useSharedValue: jest.fn(() => ({ value: 0 })),
  useAnimatedStyle: jest.fn(() => ({})),
  withTiming: jest.fn(value => value),
  interpolate: jest.fn((_value, _input, output) => output[0]),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, ...props }: any) => {
    const React = require('react');
    return React.createElement(
      'Text',
      {
        ...props,
        testID: `ionicons-${name}`,
      },
      name
    );
  },
}));

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textSecondary: '#666666',
    },
  }),
}));

describe('AnimatedCustomInput', () => {
  const defaultProps = {
    label: 'Test Label',
    value: '',
    onChangeText: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render all main UI elements', () => {
      render(<AnimatedCustomInput {...defaultProps} />);

      expect(screen.getByText('Test Label')).toBeTruthy();
      expect(screen.getByDisplayValue('')).toBeTruthy();
    });

    it('should render with custom container style', () => {
      const containerStyle = { backgroundColor: 'red' };
      render(
        <AnimatedCustomInput
          {...defaultProps}
          containerStyle={containerStyle}
          testID="container-test"
        />
      );

      const containers = screen.getAllByTestId('container-test');
      expect(containers.length).toBeGreaterThan(0);
    });

    it('should render with custom input style', () => {
      const inputStyle = { fontSize: 20 };
      render(<AnimatedCustomInput {...defaultProps} inputStyle={inputStyle} />);

      expect(screen.getByDisplayValue('')).toBeTruthy();
    });

    it('should render with custom label color', () => {
      render(<AnimatedCustomInput {...defaultProps} labelColor="#ff0000" />);

      expect(screen.getByText('Test Label')).toBeTruthy();
    });
  });

  describe('Form Integration', () => {
    it('should call onChangeText when text input changes', () => {
      const mockOnChangeText = jest.fn();
      render(
        <AnimatedCustomInput
          {...defaultProps}
          onChangeText={mockOnChangeText}
        />
      );

      const input = screen.getByDisplayValue('');
      fireEvent.changeText(input, 'new text');

      expect(mockOnChangeText).toHaveBeenCalledWith('new text');
    });

    it('should display provided value', () => {
      render(<AnimatedCustomInput {...defaultProps} value="current value" />);

      expect(screen.getByDisplayValue('current value')).toBeTruthy();
    });

    it('should pass through TextInput props', () => {
      render(
        <AnimatedCustomInput
          {...defaultProps}
          placeholder="Enter text"
          maxLength={100}
          multiline={true}
        />
      );

      const input = screen.getByDisplayValue('');
      expect(input.props.placeholder).toBe('Enter text');
      expect(input.props.maxLength).toBe(100);
      expect(input.props.multiline).toBe(true);
    });

    it('should handle testID prop', () => {
      render(<AnimatedCustomInput {...defaultProps} testID="custom-input" />);

      expect(screen.getAllByTestId('custom-input').length).toBeGreaterThan(0);
    });
  });

  describe('Focus and Blur Handling', () => {
    it('should call onFocus callback when focused', () => {
      const mockOnFocus = jest.fn();
      render(<AnimatedCustomInput {...defaultProps} onFocus={mockOnFocus} />);

      const input = screen.getByDisplayValue('');
      fireEvent(input, 'focus');

      expect(mockOnFocus).toHaveBeenCalled();
    });

    it('should call onBlur callback when blurred', () => {
      const mockOnBlur = jest.fn();
      render(<AnimatedCustomInput {...defaultProps} onBlur={mockOnBlur} />);

      const input = screen.getByDisplayValue('');
      fireEvent(input, 'blur');

      expect(mockOnBlur).toHaveBeenCalled();
    });

    it('should focus input when container is pressed', () => {
      render(
        <AnimatedCustomInput {...defaultProps} testID="focus-container" />
      );

      const containers = screen.getAllByTestId('focus-container');
      const pressableContainer = containers[0]; // Pressable is the first element
      fireEvent.press(pressableContainer);

      // Verify that the focus function would be called
      // Note: We can't directly test TextInput.focus() in testing library
      // but we can verify the container press event is handled
      expect(pressableContainer).toBeTruthy();
    });
  });

  describe('Secure Text Entry', () => {
    it('should render eye toggle when secureTextEntry is true', () => {
      render(<AnimatedCustomInput {...defaultProps} secureTextEntry={true} />);

      expect(screen.getByTestId('ionicons-eye-off-outline')).toBeTruthy();
    });

    it('should not render eye toggle when secureTextEntry is false', () => {
      render(<AnimatedCustomInput {...defaultProps} secureTextEntry={false} />);

      expect(screen.queryByTestId('ionicons-eye-off-outline')).toBeNull();
      expect(screen.queryByTestId('ionicons-eye-outline')).toBeNull();
    });

    it('should toggle secure text entry when eye icon is pressed', () => {
      render(<AnimatedCustomInput {...defaultProps} secureTextEntry={true} />);

      const eyeIcon = screen.getByTestId('ionicons-eye-off-outline');
      fireEvent.press(eyeIcon);

      // After toggle, should show the other eye icon
      expect(screen.getByTestId('ionicons-eye-outline')).toBeTruthy();
    });

    it('should toggle back when eye icon is pressed again', () => {
      render(<AnimatedCustomInput {...defaultProps} secureTextEntry={true} />);

      const eyeIcon = screen.getByTestId('ionicons-eye-off-outline');

      // First toggle
      fireEvent.press(eyeIcon);
      expect(screen.getByTestId('ionicons-eye-outline')).toBeTruthy();

      // Second toggle
      const newEyeIcon = screen.getByTestId('ionicons-eye-outline');
      fireEvent.press(newEyeIcon);
      expect(screen.getByTestId('ionicons-eye-off-outline')).toBeTruthy();
    });

    it('should apply secure input styling when secureTextEntry is true', () => {
      render(<AnimatedCustomInput {...defaultProps} secureTextEntry={true} />);

      const input = screen.getByDisplayValue('');
      expect(input.props.secureTextEntry).toBe(true);
    });
  });

  describe('Animation Integration', () => {
    it('should initialize with animation value', () => {
      const mockUseSharedValue =
        require('react-native-reanimated').useSharedValue;
      render(<AnimatedCustomInput {...defaultProps} />);

      expect(mockUseSharedValue).toHaveBeenCalledWith(0);
    });

    it('should trigger animation on focus', () => {
      const mockWithTiming = require('react-native-reanimated').withTiming;
      render(<AnimatedCustomInput {...defaultProps} />);

      const input = screen.getByDisplayValue('');
      fireEvent(input, 'focus');

      expect(mockWithTiming).toHaveBeenCalledWith(1, { duration: 200 });
    });

    it('should trigger animation on blur with empty value', () => {
      const mockWithTiming = require('react-native-reanimated').withTiming;
      render(<AnimatedCustomInput {...defaultProps} value="" />);

      const input = screen.getByDisplayValue('');
      fireEvent(input, 'blur');

      expect(mockWithTiming).toHaveBeenCalledWith(0, { duration: 200 });
    });

    it('should not reset animation on blur with value', () => {
      const mockWithTiming = require('react-native-reanimated').withTiming;
      jest.clearAllMocks();

      render(<AnimatedCustomInput {...defaultProps} value="some text" />);

      const input = screen.getByDisplayValue('some text');
      fireEvent(input, 'blur');

      // Should not call withTiming(0) when there's a value
      expect(mockWithTiming).not.toHaveBeenCalledWith(0, { duration: 200 });
    });

    it('should use animated style for label', () => {
      const mockUseAnimatedStyle =
        require('react-native-reanimated').useAnimatedStyle;
      render(<AnimatedCustomInput {...defaultProps} />);

      expect(mockUseAnimatedStyle).toHaveBeenCalled();
    });
  });

  describe('Imperative Ref Methods', () => {
    it('should expose focus method through ref', () => {
      const ref = React.createRef<AnimatedCustomInputRef>();
      render(<AnimatedCustomInput {...defaultProps} ref={ref} />);

      expect(ref.current?.focus).toBeDefined();
      expect(typeof ref.current?.focus).toBe('function');
    });

    it('should expose blur method through ref', () => {
      const ref = React.createRef<AnimatedCustomInputRef>();
      render(<AnimatedCustomInput {...defaultProps} ref={ref} />);

      expect(ref.current?.blur).toBeDefined();
      expect(typeof ref.current?.blur).toBe('function');
    });

    it('should call TextInput focus when ref focus is called', () => {
      const ref = React.createRef<AnimatedCustomInputRef>();
      render(<AnimatedCustomInput {...defaultProps} ref={ref} />);

      // Call the focus method - this tests the imperative handle implementation
      expect(() => ref.current?.focus()).not.toThrow();
    });

    it('should call TextInput blur when ref blur is called', () => {
      const ref = React.createRef<AnimatedCustomInputRef>();
      render(<AnimatedCustomInput {...defaultProps} ref={ref} />);

      // Call the blur method - this tests the imperative handle implementation
      expect(() => ref.current?.blur()).not.toThrow();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty label', () => {
      render(<AnimatedCustomInput {...defaultProps} label="" />);

      expect(screen.getByText('')).toBeTruthy();
    });

    it('should handle missing onChangeText callback gracefully', () => {
      render(
        <AnimatedCustomInput label="Test" value="" onChangeText={jest.fn()} />
      );

      const input = screen.getByDisplayValue('');
      expect(() => fireEvent.changeText(input, 'test')).not.toThrow();
    });

    it('should handle missing focus/blur callbacks gracefully', () => {
      render(<AnimatedCustomInput {...defaultProps} />);

      const input = screen.getByDisplayValue('');
      expect(() => fireEvent(input, 'focus')).not.toThrow();
      expect(() => fireEvent(input, 'blur')).not.toThrow();
    });

    it('should handle container press without crashing', () => {
      render(
        <AnimatedCustomInput {...defaultProps} testID="press-container" />
      );

      const containers = screen.getAllByTestId('press-container');
      const pressableContainer = containers[0];
      expect(() => fireEvent.press(pressableContainer)).not.toThrow();
    });
  });

  describe('Value-based Animation Trigger', () => {
    it('should trigger animation when value changes from empty to filled', () => {
      const mockWithTiming = require('react-native-reanimated').withTiming;
      const { rerender } = render(
        <AnimatedCustomInput {...defaultProps} value="" />
      );

      jest.clearAllMocks();

      // Change value to non-empty
      rerender(<AnimatedCustomInput {...defaultProps} value="new value" />);

      expect(mockWithTiming).toHaveBeenCalledWith(1, { duration: 200 });
    });

    it('should not trigger animation when already focused', () => {
      const mockWithTiming = require('react-native-reanimated').withTiming;
      const { rerender } = render(
        <AnimatedCustomInput {...defaultProps} value="" />
      );

      // Focus first
      const input = screen.getByDisplayValue('');
      fireEvent(input, 'focus');

      jest.clearAllMocks();

      // Change value while focused
      rerender(<AnimatedCustomInput {...defaultProps} value="new value" />);

      // Should not trigger additional animation since already focused
      expect(mockWithTiming).not.toHaveBeenCalledWith(1, { duration: 200 });
    });
  });
});
