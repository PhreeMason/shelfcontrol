import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import PostReviewModal from '../PostReviewModal';

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: View,
    },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(callback => {
      return callback();
    }),
    withSpring: jest.fn(value => value),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

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

jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: () => ({
    colors: {
      surface: '#FFFFFF',
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
    review_url: null,
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

      expect(screen.getByText('Mark as Posted')).toBeTruthy();
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
    });

    it('should remove platform when deselecting', () => {
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
        expect.not.arrayContaining([expect.objectContaining({ id: '1' })])
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
  });
});
