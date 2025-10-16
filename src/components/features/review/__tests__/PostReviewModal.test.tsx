import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import PostReviewModal from '../PostReviewModal';

jest.mock('@/components/shared/Checkbox', () => {
  return function MockCheckbox({ checked, onToggle, label }: any) {
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');
    return React.createElement(
      TouchableOpacity,
      {
        testID: `checkbox-${label}`,
        onPress: onToggle,
      },
      React.createElement(Text, null, `${label} ${checked ? '✓' : ''}`)
    );
  };
});

jest.mock('@/components/themed', () => ({
  ThemedButton: ({ title, onPress, testID, disabled }: any) => {
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');
    return React.createElement(
      TouchableOpacity,
      {
        testID,
        onPress,
        disabled,
      },
      React.createElement(Text, null, title)
    );
  },
  ThemedView: ({ children, style }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { style }, children);
  },
  ThemedText: ({ children, style }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { style }, children);
  },
  ThemedScrollView: ({ children, style }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { style }, children);
  },
}));

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textMuted: '#888888',
    },
  }),
}));

const mockPlatforms = [
  {
    id: '1',
    platform_name: 'Goodreads',
    posted: true,
    posted_date: '2025-01-15',
    review_url: 'https://goodreads.com/review/123',
  },
  {
    id: '2',
    platform_name: 'Amazon',
    posted: false,
    posted_date: null,
    review_url: null,
  },
  {
    id: '3',
    platform_name: 'StoryGraph',
    posted: true,
    posted_date: '2025-01-16',
    review_url: null,
  },
];

describe('PostReviewModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Opening Behavior', () => {
    it('should initialize state from platforms prop when visible', () => {
      render(
        <PostReviewModal
          visible={true}
          platforms={mockPlatforms}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Goodreads ✓')).toBeTruthy();
      expect(screen.getByText(/Amazon(?!\s✓)/)).toBeTruthy();
      expect(screen.getByText('StoryGraph ✓')).toBeTruthy();
    });

    it('should show existing review URLs when modal opens', () => {
      render(
        <PostReviewModal
          visible={true}
          platforms={mockPlatforms}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const urlInput = screen.getByDisplayValue('https://goodreads.com/review/123');
      expect(urlInput).toBeTruthy();
    });

    it('should enable link submission checkbox when platforms have URLs', () => {
      render(
        <PostReviewModal
          visible={true}
          platforms={mockPlatforms}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('I need to submit review links ✓')).toBeTruthy();
    });

    it('should not initialize state when modal is not visible', () => {
      render(
        <PostReviewModal
          visible={false}
          platforms={mockPlatforms}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByText('Goodreads ✓')).toBeNull();
    });

    it('should handle empty platforms array', () => {
      render(
        <PostReviewModal
          visible={true}
          platforms={[]}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Post Review')).toBeTruthy();
    });
  });

  describe('Save Functionality', () => {
    it('should call onSave with correct updates when saving', () => {
      render(
        <PostReviewModal
          visible={true}
          platforms={mockPlatforms}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByTestId('save-button');
      fireEvent.press(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            posted: true,
            review_url: 'https://goodreads.com/review/123',
          }),
          expect.objectContaining({
            id: '3',
            posted: true,
          }),
        ])
      );
    });

    it('should call onClose after successful save', () => {
      render(
        <PostReviewModal
          visible={true}
          platforms={mockPlatforms}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByTestId('save-button');
      fireEvent.press(saveButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should disable save button when no platforms selected', () => {
      const platformsAllUnposted = [
        {
          id: '1',
          platform_name: 'Goodreads',
          posted: false,
          posted_date: null,
          review_url: null,
        },
      ];

      render(
        <PostReviewModal
          visible={true}
          platforms={platformsAllUnposted}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByTestId('save-button');
      fireEvent.press(saveButton);

      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Cancel/Close Behavior', () => {
    it('should call onClose when cancel button pressed', () => {
      render(
        <PostReviewModal
          visible={true}
          platforms={mockPlatforms}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const cancelButton = screen.getByTestId('cancel-button');
      fireEvent.press(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not call onSave when cancel button pressed', () => {
      render(
        <PostReviewModal
          visible={true}
          platforms={mockPlatforms}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const cancelButton = screen.getByTestId('cancel-button');
      fireEvent.press(cancelButton);

      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    it('should toggle platform selection', () => {
      render(
        <PostReviewModal
          visible={true}
          platforms={mockPlatforms}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const amazonCheckbox = screen.getByTestId('checkbox-Amazon');
      fireEvent.press(amazonCheckbox);

      expect(screen.getByText('Amazon ✓')).toBeTruthy();

      const saveButton = screen.getByTestId('save-button');
      fireEvent.press(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: '2', posted: true }),
        ])
      );
    });

    it('should handle adding review URL', () => {
      render(
        <PostReviewModal
          visible={true}
          platforms={mockPlatforms}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const storyGraphInput = screen.getByDisplayValue('');
      fireEvent.changeText(storyGraphInput, 'https://storygraph.com/review/789');

      const saveButton = screen.getByTestId('save-button');
      fireEvent.press(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: '3',
            posted: true,
            review_url: 'https://storygraph.com/review/789',
          }),
        ])
      );
    });

    it('should toggle link submission checkbox', () => {
      const platformsWithoutUrls = [
        {
          id: '1',
          platform_name: 'Goodreads',
          posted: true,
          posted_date: '2025-01-15',
          review_url: null,
        },
      ];

      render(
        <PostReviewModal
          visible={true}
          platforms={platformsWithoutUrls}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const linkCheckbox = screen.getByTestId('checkbox-I need to submit review links');
      fireEvent.press(linkCheckbox);

      expect(screen.getByText('I need to submit review links ✓')).toBeTruthy();
    });

    it('should persist state when reopening modal with same data', () => {
      const { rerender } = render(
        <PostReviewModal
          visible={true}
          platforms={mockPlatforms}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Goodreads ✓')).toBeTruthy();

      rerender(
        <PostReviewModal
          visible={false}
          platforms={mockPlatforms}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      rerender(
        <PostReviewModal
          visible={true}
          platforms={mockPlatforms}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Goodreads ✓')).toBeTruthy();
      expect(screen.getByDisplayValue('https://goodreads.com/review/123')).toBeTruthy();
    });

    it('should remove platform URL when deselecting platform', () => {
      render(
        <PostReviewModal
          visible={true}
          platforms={mockPlatforms}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const goodreadsCheckbox = screen.getByTestId('checkbox-Goodreads');
      fireEvent.press(goodreadsCheckbox);

      expect(screen.getByText(/Goodreads(?!\s✓)/)).toBeTruthy();

      const saveButton = screen.getByTestId('save-button');
      fireEvent.press(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.not.arrayContaining([
          expect.objectContaining({ id: '1' }),
        ])
      );
    });

    it('should save without URLs when link submission disabled', () => {
      render(
        <PostReviewModal
          visible={true}
          platforms={mockPlatforms}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const linkCheckbox = screen.getByTestId('checkbox-I need to submit review links');
      fireEvent.press(linkCheckbox);

      const saveButton = screen.getByTestId('save-button');
      fireEvent.press(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            posted: true,
          }),
          expect.not.objectContaining({
            review_url: expect.anything(),
          }),
        ])
      );
    });
  });

  describe('Platform List Rendering', () => {
    it('should render all platforms in the list', () => {
      render(
        <PostReviewModal
          visible={true}
          platforms={mockPlatforms}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const goodreads = screen.getAllByText(/Goodreads/);
      const amazon = screen.getAllByText(/Amazon/);
      const storyGraph = screen.getAllByText(/StoryGraph/);

      expect(goodreads.length).toBeGreaterThan(0);
      expect(amazon.length).toBeGreaterThan(0);
      expect(storyGraph.length).toBeGreaterThan(0);
    });

    it('should show "(Posted)" indicator for already posted platforms', () => {
      render(
        <PostReviewModal
          visible={true}
          platforms={mockPlatforms}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const postedIndicators = screen.getAllByText('(Posted)');
      expect(postedIndicators).toHaveLength(2);
    });

    it('should not show "(Posted)" for unposted platforms', () => {
      const platformsAllUnposted = [
        {
          id: '1',
          platform_name: 'Goodreads',
          posted: false,
          posted_date: null,
          review_url: null,
        },
      ];

      render(
        <PostReviewModal
          visible={true}
          platforms={platformsAllUnposted}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByText('(Posted)')).toBeNull();
    });
  });
});
