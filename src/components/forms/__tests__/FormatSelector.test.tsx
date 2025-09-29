import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { FormatSelector } from '../FormatSelector';

// Mock dependencies following minimal mocking strategy from TESTING.md
jest.mock('@/components/themed', () => ({
  ThemedText: ({ children, ...props }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, props, children);
  },
}));

jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: () => ({
    colors: {
      primary: '#007AFF',
      border: '#E0E0E0',
      inputBlurBackground: '#F5F5F5',
    },
  }),
}));

describe('FormatSelector', () => {
  const defaultProps = {
    selectedFormat: 'physical',
    onSelectFormat: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render the format selector container', () => {
      render(<FormatSelector {...defaultProps} />);

      expect(screen.getByTestId('format-selector')).toBeTruthy();
    });

    it('should render all three format options', () => {
      render(<FormatSelector {...defaultProps} />);

      expect(screen.getByTestId('format-chip-physical')).toBeTruthy();
      expect(screen.getByTestId('format-chip-eBook')).toBeTruthy();
      expect(screen.getByTestId('format-chip-audio')).toBeTruthy();
    });

    it('should display correct labels for each format', () => {
      render(<FormatSelector {...defaultProps} />);

      expect(screen.getByText('Physical')).toBeTruthy();
      expect(screen.getByText('eBook')).toBeTruthy();
      expect(screen.getByText('Audio')).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('should call onSelectFormat when physical format is pressed', () => {
      const mockOnSelectFormat = jest.fn();
      render(
        <FormatSelector
          selectedFormat="eBook"
          onSelectFormat={mockOnSelectFormat}
        />
      );

      fireEvent.press(screen.getByTestId('format-chip-physical'));

      expect(mockOnSelectFormat).toHaveBeenCalledTimes(1);
      expect(mockOnSelectFormat).toHaveBeenCalledWith('physical');
    });

    it('should call onSelectFormat when eBook format is pressed', () => {
      const mockOnSelectFormat = jest.fn();
      render(
        <FormatSelector
          selectedFormat="physical"
          onSelectFormat={mockOnSelectFormat}
        />
      );

      fireEvent.press(screen.getByTestId('format-chip-eBook'));

      expect(mockOnSelectFormat).toHaveBeenCalledTimes(1);
      expect(mockOnSelectFormat).toHaveBeenCalledWith('eBook');
    });

    it('should call onSelectFormat when audio format is pressed', () => {
      const mockOnSelectFormat = jest.fn();
      render(
        <FormatSelector
          selectedFormat="physical"
          onSelectFormat={mockOnSelectFormat}
        />
      );

      fireEvent.press(screen.getByTestId('format-chip-audio'));

      expect(mockOnSelectFormat).toHaveBeenCalledTimes(1);
      expect(mockOnSelectFormat).toHaveBeenCalledWith('audio');
    });

    it('should allow selecting the already selected format', () => {
      const mockOnSelectFormat = jest.fn();
      render(
        <FormatSelector
          selectedFormat="physical"
          onSelectFormat={mockOnSelectFormat}
        />
      );

      fireEvent.press(screen.getByTestId('format-chip-physical'));

      expect(mockOnSelectFormat).toHaveBeenCalledTimes(1);
      expect(mockOnSelectFormat).toHaveBeenCalledWith('physical');
    });
  });

  describe('Props Handling', () => {
    describe('disabled prop', () => {
      it('should not call onSelectFormat when disabled', () => {
        const mockOnSelectFormat = jest.fn();
        render(
          <FormatSelector
            selectedFormat="physical"
            onSelectFormat={mockOnSelectFormat}
            disabled={true}
          />
        );

        fireEvent.press(screen.getByTestId('format-chip-eBook'));

        expect(mockOnSelectFormat).not.toHaveBeenCalled();
      });

      it('should apply opacity styling when disabled', () => {
        render(
          <FormatSelector
            selectedFormat="physical"
            onSelectFormat={jest.fn()}
            disabled={true}
          />
        );

        const physicalChip = screen.getByTestId('format-chip-physical');
        expect(physicalChip.props.style).toEqual(
          expect.objectContaining({ opacity: 0.5 })
        );
      });

      it('should work normally when disabled is false', () => {
        const mockOnSelectFormat = jest.fn();
        render(
          <FormatSelector
            selectedFormat="physical"
            onSelectFormat={mockOnSelectFormat}
            disabled={false}
          />
        );

        fireEvent.press(screen.getByTestId('format-chip-eBook'));

        expect(mockOnSelectFormat).toHaveBeenCalledTimes(1);
        expect(mockOnSelectFormat).toHaveBeenCalledWith('eBook');
      });

      it('should work normally when disabled prop is not provided', () => {
        const mockOnSelectFormat = jest.fn();
        render(
          <FormatSelector
            selectedFormat="physical"
            onSelectFormat={mockOnSelectFormat}
          />
        );

        fireEvent.press(screen.getByTestId('format-chip-audio'));

        expect(mockOnSelectFormat).toHaveBeenCalledTimes(1);
        expect(mockOnSelectFormat).toHaveBeenCalledWith('audio');
      });
    });

    describe('selectedFormat prop', () => {
      it('should highlight physical format when selected', () => {
        render(
          <FormatSelector
            selectedFormat="physical"
            onSelectFormat={jest.fn()}
          />
        );

        const physicalChip = screen.getByTestId('format-chip-physical');
        expect(physicalChip.props.style).toEqual(
          expect.objectContaining({
            backgroundColor: '#007AFF20',
            borderColor: '#007AFF',
          })
        );
      });

      it('should highlight eBook format when selected', () => {
        render(
          <FormatSelector selectedFormat="eBook" onSelectFormat={jest.fn()} />
        );

        const eBookChip = screen.getByTestId('format-chip-eBook');
        expect(eBookChip.props.style).toEqual(
          expect.objectContaining({
            backgroundColor: '#007AFF20',
            borderColor: '#007AFF',
          })
        );
      });

      it('should highlight audio format when selected', () => {
        render(
          <FormatSelector selectedFormat="audio" onSelectFormat={jest.fn()} />
        );

        const audioChip = screen.getByTestId('format-chip-audio');
        expect(audioChip.props.style).toEqual(
          expect.objectContaining({
            backgroundColor: '#007AFF20',
            borderColor: '#007AFF',
          })
        );
      });
    });
  });

  describe('Visual States', () => {
    it('should apply unselected styling to non-selected formats', () => {
      render(
        <FormatSelector selectedFormat="physical" onSelectFormat={jest.fn()} />
      );

      const eBookChip = screen.getByTestId('format-chip-eBook');
      const audioChip = screen.getByTestId('format-chip-audio');

      expect(eBookChip.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: '#F5F5F5',
          borderColor: '#E0E0E0',
        })
      );

      expect(audioChip.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: '#F5F5F5',
          borderColor: '#E0E0E0',
        })
      );
    });

    it('should apply border width to all format chips', () => {
      render(
        <FormatSelector selectedFormat="physical" onSelectFormat={jest.fn()} />
      );

      const physicalChip = screen.getByTestId('format-chip-physical');
      const eBookChip = screen.getByTestId('format-chip-eBook');
      const audioChip = screen.getByTestId('format-chip-audio');

      [physicalChip, eBookChip, audioChip].forEach(chip => {
        expect(chip.props.style).toEqual(
          expect.objectContaining({ borderWidth: 2 })
        );
      });
    });

    it('should update visual state when selectedFormat changes', () => {
      const { rerender } = render(
        <FormatSelector selectedFormat="physical" onSelectFormat={jest.fn()} />
      );

      let physicalChip = screen.getByTestId('format-chip-physical');
      expect(physicalChip.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: '#007AFF20',
          borderColor: '#007AFF',
        })
      );

      rerender(
        <FormatSelector selectedFormat="eBook" onSelectFormat={jest.fn()} />
      );

      physicalChip = screen.getByTestId('format-chip-physical');
      const eBookChip = screen.getByTestId('format-chip-eBook');

      expect(physicalChip.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: '#F5F5F5',
          borderColor: '#E0E0E0',
        })
      );

      expect(eBookChip.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: '#007AFF20',
          borderColor: '#007AFF',
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid successive clicks', () => {
      const mockOnSelectFormat = jest.fn();
      render(
        <FormatSelector
          selectedFormat="physical"
          onSelectFormat={mockOnSelectFormat}
        />
      );

      const eBookChip = screen.getByTestId('format-chip-eBook');

      fireEvent.press(eBookChip);
      fireEvent.press(eBookChip);
      fireEvent.press(eBookChip);

      expect(mockOnSelectFormat).toHaveBeenCalledTimes(3);
      expect(mockOnSelectFormat).toHaveBeenCalledWith('eBook');
    });

    it('should handle clicking different formats in sequence', () => {
      const mockOnSelectFormat = jest.fn();
      render(
        <FormatSelector
          selectedFormat="physical"
          onSelectFormat={mockOnSelectFormat}
        />
      );

      fireEvent.press(screen.getByTestId('format-chip-eBook'));
      fireEvent.press(screen.getByTestId('format-chip-audio'));
      fireEvent.press(screen.getByTestId('format-chip-physical'));

      expect(mockOnSelectFormat).toHaveBeenCalledTimes(3);
      expect(mockOnSelectFormat).toHaveBeenNthCalledWith(1, 'eBook');
      expect(mockOnSelectFormat).toHaveBeenNthCalledWith(2, 'audio');
      expect(mockOnSelectFormat).toHaveBeenNthCalledWith(3, 'physical');
    });
  });
});
