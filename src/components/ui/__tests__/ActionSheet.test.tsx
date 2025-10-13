import { useTheme } from '@/hooks/useThemeColor';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { ActionSheet, ActionSheetOption } from '../ActionSheet';

jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: jest.fn(),
}));

jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: ({ name, ...props }: any) => {
    const React = require('react');
    return React.createElement(
      'Text',
      { ...props, testID: 'icon-symbol' },
      name
    );
  },
}));

jest.mock('@/components/themed/ThemedText', () => ({
  ThemedText: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement(
      'Text',
      { ...props, testID: 'themed-text' },
      children
    );
  },
}));

jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    __esModule: true,
    default: {
      View,
    },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn(value => value),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })),
}));

describe('ActionSheet', () => {
  const mockTheme = {
    colors: {
      surface: '#FFFFFF',
      border: '#E0E0E0',
      primary: '#007AFF',
      error: '#FF3B30',
    },
  };

  const mockOptions: ActionSheetOption[] = [
    { label: 'Option 1', onPress: jest.fn() },
    { label: 'Option 2', onPress: jest.fn() },
    { label: 'Option 3', onPress: jest.fn(), selected: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue(mockTheme);
  });

  describe('Component Structure', () => {
    it('should render modal when visible', () => {
      render(
        <ActionSheet visible={true} onClose={jest.fn()} options={mockOptions} />
      );

      expect(screen.getByText('Option 1')).toBeTruthy();
      expect(screen.getByText('Option 2')).toBeTruthy();
      expect(screen.getByText('Option 3')).toBeTruthy();
    });

    it('should render title when provided', () => {
      render(
        <ActionSheet
          visible={true}
          onClose={jest.fn()}
          options={mockOptions}
          title="Select Option"
        />
      );

      expect(screen.getByText('Select Option')).toBeTruthy();
    });

    it('should not render title when not provided', () => {
      render(
        <ActionSheet visible={true} onClose={jest.fn()} options={mockOptions} />
      );

      expect(screen.queryByText('Select Option')).toBeNull();
    });

    it('should render cancel button', () => {
      render(
        <ActionSheet visible={true} onClose={jest.fn()} options={mockOptions} />
      );

      expect(screen.getByText('Cancel')).toBeTruthy();
    });

    it('should render all options', () => {
      render(
        <ActionSheet visible={true} onClose={jest.fn()} options={mockOptions} />
      );

      mockOptions.forEach(option => {
        expect(screen.getByText(option.label)).toBeTruthy();
      });
    });
  });

  describe('Option Selection', () => {
    it('should call option onPress when option is pressed', () => {
      const onPress = jest.fn();
      const options: ActionSheetOption[] = [{ label: 'Test Option', onPress }];

      render(
        <ActionSheet visible={true} onClose={jest.fn()} options={options} />
      );

      fireEvent.press(screen.getByText('Test Option'));

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should call onClose after option is pressed', () => {
      const onClose = jest.fn();
      const options: ActionSheetOption[] = [
        { label: 'Test Option', onPress: jest.fn() },
      ];

      render(
        <ActionSheet visible={true} onClose={onClose} options={options} />
      );

      fireEvent.press(screen.getByText('Test Option'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call both option onPress and onClose in correct order', () => {
      const callOrder: string[] = [];
      const onPress = jest.fn(() => callOrder.push('onPress'));
      const onClose = jest.fn(() => callOrder.push('onClose'));
      const options: ActionSheetOption[] = [{ label: 'Test Option', onPress }];

      render(
        <ActionSheet visible={true} onClose={onClose} options={options} />
      );

      fireEvent.press(screen.getByText('Test Option'));

      expect(callOrder).toEqual(['onPress', 'onClose']);
    });
  });

  describe('Selected State', () => {
    it('should show checkmark for selected option', () => {
      const options: ActionSheetOption[] = [
        { label: 'Selected Option', onPress: jest.fn(), selected: true },
      ];

      render(
        <ActionSheet visible={true} onClose={jest.fn()} options={options} />
      );

      expect(screen.getByText('checkmark')).toBeTruthy();
    });

    it('should not show checkmark for non-selected options', () => {
      const options: ActionSheetOption[] = [
        { label: 'Not Selected', onPress: jest.fn(), selected: false },
      ];

      render(
        <ActionSheet visible={true} onClose={jest.fn()} options={options} />
      );

      expect(screen.queryByText('checkmark')).toBeNull();
    });

    it('should handle multiple selected states', () => {
      const options: ActionSheetOption[] = [
        { label: 'Option 1', onPress: jest.fn(), selected: true },
        { label: 'Option 2', onPress: jest.fn(), selected: false },
        { label: 'Option 3', onPress: jest.fn(), selected: true },
      ];

      render(
        <ActionSheet visible={true} onClose={jest.fn()} options={options} />
      );

      const checkmarks = screen.getAllByText('checkmark');
      expect(checkmarks).toHaveLength(2);
    });
  });

  describe('Destructive Variant', () => {
    it('should render destructive variant option', () => {
      const options: ActionSheetOption[] = [
        { label: 'Delete', onPress: jest.fn(), variant: 'destructive' },
      ];

      render(
        <ActionSheet visible={true} onClose={jest.fn()} options={options} />
      );

      expect(screen.getByText('Delete')).toBeTruthy();
    });

    it('should render default variant option', () => {
      const options: ActionSheetOption[] = [
        { label: 'Edit', onPress: jest.fn(), variant: 'default' },
      ];

      render(
        <ActionSheet visible={true} onClose={jest.fn()} options={options} />
      );

      expect(screen.getByText('Edit')).toBeTruthy();
    });
  });

  describe('Cancel Button', () => {
    it('should call onClose when cancel is pressed', () => {
      const onClose = jest.fn();

      render(
        <ActionSheet visible={true} onClose={onClose} options={mockOptions} />
      );

      fireEvent.press(screen.getByText('Cancel'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call option onPress when cancel is pressed', () => {
      const onPress = jest.fn();
      const options: ActionSheetOption[] = [{ label: 'Test Option', onPress }];

      render(
        <ActionSheet visible={true} onClose={jest.fn()} options={options} />
      );

      fireEvent.press(screen.getByText('Cancel'));

      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('Backdrop', () => {
    it('should call onClose when backdrop is pressed', () => {
      const onClose = jest.fn();

      render(
        <ActionSheet visible={true} onClose={onClose} options={mockOptions} />
      );

      const backdrop = screen.getByLabelText('Close action sheet');
      fireEvent.press(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Icon Support', () => {
    it('should render icon when provided', () => {
      const options: ActionSheetOption[] = [
        {
          label: 'Delete',
          onPress: jest.fn(),
          icon: 'trash.fill',
          iconColor: '#FF0000',
        },
      ];

      render(
        <ActionSheet visible={true} onClose={jest.fn()} options={options} />
      );

      expect(screen.getByText('trash.fill')).toBeTruthy();
    });

    it('should not render icon when not provided', () => {
      const options: ActionSheetOption[] = [
        { label: 'No Icon', onPress: jest.fn() },
      ];

      render(
        <ActionSheet visible={true} onClose={jest.fn()} options={options} />
      );

      expect(screen.queryByText('trash.fill')).toBeNull();
    });

    it('should render multiple options with and without icons', () => {
      const options: ActionSheetOption[] = [
        { label: 'No Icon', onPress: jest.fn() },
        {
          label: 'With Icon',
          onPress: jest.fn(),
          icon: 'calendar.badge.clock',
        },
      ];

      render(
        <ActionSheet visible={true} onClose={jest.fn()} options={options} />
      );

      expect(screen.getByText('No Icon')).toBeTruthy();
      expect(screen.getByText('With Icon')).toBeTruthy();
      expect(screen.getByText('calendar.badge.clock')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty options array', () => {
      render(<ActionSheet visible={true} onClose={jest.fn()} options={[]} />);

      expect(screen.getByText('Cancel')).toBeTruthy();
    });

    it('should handle single option', () => {
      const options: ActionSheetOption[] = [
        { label: 'Only Option', onPress: jest.fn() },
      ];

      render(
        <ActionSheet visible={true} onClose={jest.fn()} options={options} />
      );

      expect(screen.getByText('Only Option')).toBeTruthy();
    });

    it('should handle long option labels', () => {
      const options: ActionSheetOption[] = [
        {
          label: 'This is a very long option label that might wrap',
          onPress: jest.fn(),
        },
      ];

      render(
        <ActionSheet visible={true} onClose={jest.fn()} options={options} />
      );

      expect(
        screen.getByText('This is a very long option label that might wrap')
      ).toBeTruthy();
    });
  });

  describe('Visibility', () => {
    it('should render when visible is true', () => {
      render(
        <ActionSheet visible={true} onClose={jest.fn()} options={mockOptions} />
      );

      expect(screen.getByText('Cancel')).toBeTruthy();
    });

    it('should handle visibility changes', () => {
      const { rerender } = render(
        <ActionSheet
          visible={false}
          onClose={jest.fn()}
          options={mockOptions}
        />
      );

      rerender(
        <ActionSheet visible={true} onClose={jest.fn()} options={mockOptions} />
      );

      expect(screen.getByText('Cancel')).toBeTruthy();
    });
  });

  describe('Chevron Feature', () => {
    it('should render chevron icon when showChevron is true', () => {
      const options: ActionSheetOption[] = [
        { label: 'Test', onPress: jest.fn(), showChevron: true },
      ];

      render(
        <ActionSheet visible={true} onClose={jest.fn()} options={options} />
      );

      expect(screen.getByText('chevron.right')).toBeTruthy();
    });

    it('should not render chevron when showChevron is false', () => {
      const options: ActionSheetOption[] = [
        { label: 'Test', onPress: jest.fn(), showChevron: false },
      ];

      render(
        <ActionSheet visible={true} onClose={jest.fn()} options={options} />
      );

      expect(screen.queryByText('chevron.right')).toBeNull();
    });

    it('should not render chevron when showChevron is undefined', () => {
      const options: ActionSheetOption[] = [
        { label: 'Test', onPress: jest.fn() },
      ];

      render(
        <ActionSheet visible={true} onClose={jest.fn()} options={options} />
      );

      expect(screen.queryByText('chevron.right')).toBeNull();
    });

    it('should render multiple options with mixed chevron states', () => {
      const options: ActionSheetOption[] = [
        { label: 'With Chevron', onPress: jest.fn(), showChevron: true },
        { label: 'Without Chevron', onPress: jest.fn(), showChevron: false },
        { label: 'Default', onPress: jest.fn() },
      ];

      render(
        <ActionSheet visible={true} onClose={jest.fn()} options={options} />
      );

      const chevrons = screen.queryAllByText('chevron.right');
      expect(chevrons).toHaveLength(1);
    });

    it('should render chevron alongside icon when both are provided', () => {
      const options: ActionSheetOption[] = [
        {
          label: 'Test',
          onPress: jest.fn(),
          icon: 'calendar.badge.clock',
          showChevron: true,
        },
      ];

      render(
        <ActionSheet visible={true} onClose={jest.fn()} options={options} />
      );

      expect(screen.getByText('calendar.badge.clock')).toBeTruthy();
      expect(screen.getByText('chevron.right')).toBeTruthy();
    });
  });
});
