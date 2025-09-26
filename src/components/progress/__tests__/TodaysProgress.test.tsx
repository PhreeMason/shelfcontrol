import React from 'react';
import { render, screen } from '@testing-library/react-native';
import TodaysProgress from '../TodaysProgress';

import {
  getDisplayValue,
  getRemainingText,
  getEncouragementMessage,
  getProgressBackgroundColor,
} from '@/utils/todaysProgressUtils';

// Mock the theme hook
jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: () => ({
    colors: {
      text: '#000000',
      primary: '#007AFF',
      secondary: '#5856D6',
    },
  }),
}));

// Mock ThemedText and ThemedView
jest.mock('@/components/themed', () => ({
  ThemedText: ({ children, style }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(
      Text,
      { testID: 'themed-text', style },
      children
    );
  },
  ThemedView: ({ children, style }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(
      View,
      { testID: 'themed-view', style },
      children
    );
  },
}));

// Mock LinearProgressBar
jest.mock('@/components/shared/LinearProgressBar', () => {
  return function MockLinearProgressBar(props: any) {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, {
      testID: 'linear-progress-bar',
      'data-progress': props.progressPercentage,
      'data-gradient': props.gradientColors?.join(','),
      'data-background': props.backgroundColor,
      'data-shimmer': props.showShimmer,
    });
  };
});

// Mock utility functions
jest.mock('@/utils/todaysProgressUtils', () => ({
  getDisplayValue: jest.fn(),
  getRemainingText: jest.fn(),
  getEncouragementMessage: jest.fn(),
  getProgressBackgroundColor: jest.fn(),
}));

describe('TodaysProgress', () => {
  const mockGetDisplayValue = getDisplayValue as jest.Mock;
  const mockGetRemainingText = getRemainingText as jest.Mock;
  const mockGetEncouragementMessage = getEncouragementMessage as jest.Mock;
  const mockGetProgressBackgroundColor =
    getProgressBackgroundColor as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockGetDisplayValue.mockReturnValue('150/300');
    mockGetRemainingText.mockReturnValue('150 pages left');
    mockGetEncouragementMessage.mockReturnValue('Great pace!');
    mockGetProgressBackgroundColor.mockReturnValue('#E8C2B999');
  });

  describe('Reading Type Display', () => {
    const defaultProps = {
      total: 300,
      current: 150,
      type: 'reading' as const,
    };

    it('should render reading icon and label', () => {
      render(<TodaysProgress {...defaultProps} />);

      const texts = screen.getAllByTestId('themed-text');
      const iconText = texts.find(text => text.children.includes('📖'));
      const labelText = texts.find(text => text.children.includes('Reading'));

      expect(iconText).toBeTruthy();
      expect(labelText).toBeTruthy();
    });

    it('should call utility functions with correct reading parameters', () => {
      render(<TodaysProgress {...defaultProps} />);

      expect(mockGetDisplayValue).toHaveBeenCalledWith(150, 300, false);
      expect(mockGetRemainingText).toHaveBeenCalledWith(150, 300, false);
      expect(mockGetEncouragementMessage).toHaveBeenCalledWith(50); // (150/300) * 100
      expect(mockGetProgressBackgroundColor).toHaveBeenCalledWith(50);
    });

    it('should display the formatted values from utilities', () => {
      mockGetDisplayValue.mockReturnValue('150/300 pages');
      mockGetRemainingText.mockReturnValue('150 pages remaining');
      mockGetEncouragementMessage.mockReturnValue('Keep going!');

      render(<TodaysProgress {...defaultProps} />);

      expect(screen.getByText('150/300 pages')).toBeTruthy();
      expect(screen.getByText('150 pages remaining')).toBeTruthy();
      expect(screen.getByText('Keep going!')).toBeTruthy();
    });

    it('should handle zero progress', () => {
      const props = { ...defaultProps, current: 0 };
      render(<TodaysProgress {...props} />);

      expect(mockGetDisplayValue).toHaveBeenCalledWith(0, 300, false);
      expect(mockGetRemainingText).toHaveBeenCalledWith(0, 300, false);
      expect(mockGetEncouragementMessage).toHaveBeenCalledWith(0);
      expect(mockGetProgressBackgroundColor).toHaveBeenCalledWith(0);
    });

    it('should handle complete progress', () => {
      const props = { ...defaultProps, current: 300 };
      render(<TodaysProgress {...props} />);

      expect(mockGetDisplayValue).toHaveBeenCalledWith(300, 300, false);
      expect(mockGetRemainingText).toHaveBeenCalledWith(300, 300, false);
      expect(mockGetEncouragementMessage).toHaveBeenCalledWith(100);
      expect(mockGetProgressBackgroundColor).toHaveBeenCalledWith(100);
    });

    it('should handle over-complete progress', () => {
      const props = { ...defaultProps, current: 450 };
      render(<TodaysProgress {...props} />);

      expect(mockGetDisplayValue).toHaveBeenCalledWith(450, 300, false);
      expect(mockGetRemainingText).toHaveBeenCalledWith(450, 300, false);
      expect(mockGetEncouragementMessage).toHaveBeenCalledWith(150);
      expect(mockGetProgressBackgroundColor).toHaveBeenCalledWith(150);
    });
  });

  describe('Listening Type Display', () => {
    const listeningProps = {
      total: 180,
      current: 90,
      type: 'listening' as const,
    };

    it('should render listening icon and label', () => {
      render(<TodaysProgress {...listeningProps} />);

      const texts = screen.getAllByTestId('themed-text');
      const iconText = texts.find(text => text.children.includes('🎧'));
      const labelText = texts.find(text => text.children.includes('Listening'));

      expect(iconText).toBeTruthy();
      expect(labelText).toBeTruthy();
    });

    it('should call utility functions with correct listening parameters', () => {
      render(<TodaysProgress {...listeningProps} />);

      expect(mockGetDisplayValue).toHaveBeenCalledWith(90, 180, true);
      expect(mockGetRemainingText).toHaveBeenCalledWith(90, 180, true);
      expect(mockGetEncouragementMessage).toHaveBeenCalledWith(50); // (90/180) * 100
      expect(mockGetProgressBackgroundColor).toHaveBeenCalledWith(50);
    });

    it('should display formatted time values from utilities', () => {
      mockGetDisplayValue.mockReturnValue('1h 30m/3h 0m');
      mockGetRemainingText.mockReturnValue('1h 30m left');
      mockGetEncouragementMessage.mockReturnValue('Great pace!');

      render(<TodaysProgress {...listeningProps} />);

      expect(screen.getByText('1h 30m/3h 0m')).toBeTruthy();
      expect(screen.getByText('1h 30m left')).toBeTruthy();
      expect(screen.getByText('Great pace!')).toBeTruthy();
    });
  });

  describe('Default Type Behavior', () => {
    it('should default to reading type when not specified', () => {
      const props = { total: 200, current: 100 };
      render(<TodaysProgress {...props} />);

      const texts = screen.getAllByTestId('themed-text');
      const iconText = texts.find(text => text.children.includes('📖'));
      const labelText = texts.find(text => text.children.includes('Reading'));

      expect(iconText).toBeTruthy();
      expect(labelText).toBeTruthy();
      expect(mockGetDisplayValue).toHaveBeenCalledWith(100, 200, false);
    });
  });

  describe('Progress Bar Integration', () => {
    const progressProps = {
      total: 400,
      current: 200,
      type: 'reading' as const,
    };

    it('should render LinearProgressBar component', () => {
      render(<TodaysProgress {...progressProps} />);

      const progressBar = screen.getByTestId('linear-progress-bar');
      expect(progressBar).toBeTruthy();
    });

    it('should pass correct progress percentage to progress bar', () => {
      render(<TodaysProgress {...progressProps} />);

      const progressBar = screen.getByTestId('linear-progress-bar');
      expect(progressBar.props['data-progress']).toBe(50); // (200/400) * 100
    });

    it('should cap progress percentage at 100 for progress bar', () => {
      const props = { ...progressProps, current: 600 }; // 150%
      render(<TodaysProgress {...props} />);

      const progressBar = screen.getByTestId('linear-progress-bar');
      expect(progressBar.props['data-progress']).toBe(100); // Capped at 100
    });

    it('should use completion colors when at 100%', () => {
      const props = { ...progressProps, current: 400 }; // 100%
      render(<TodaysProgress {...props} />);

      const progressBar = screen.getByTestId('linear-progress-bar');
      expect(progressBar.props['data-gradient']).toBe('#815ac0,#4b2e83');
    });

    it('should use theme colors when under 100%', () => {
      render(<TodaysProgress {...progressProps} />); // 50%

      const progressBar = screen.getByTestId('linear-progress-bar');
      expect(progressBar.props['data-gradient']).toBe('#E8C2B9,#007AFF');
    });

    it('should pass background color from utility function', () => {
      mockGetProgressBackgroundColor.mockReturnValue('#testBG99');

      render(<TodaysProgress {...progressProps} />);

      const progressBar = screen.getByTestId('linear-progress-bar');
      expect(progressBar.props['data-background']).toBe('#testBG99');
    });

    it('should enable shimmer effect', () => {
      render(<TodaysProgress {...progressProps} />);

      const progressBar = screen.getByTestId('linear-progress-bar');
      expect(progressBar.props['data-shimmer']).toBe(true);
    });
  });

  describe('Theme Integration', () => {
    it('should call useTheme hook', () => {
      const props = { total: 100, current: 50 };
      render(<TodaysProgress {...props} />);

      // Theme hook should be called (verified by no errors)
      expect(screen.getByTestId('themed-view')).toBeTruthy();
    });

    it('should use themed components', () => {
      const props = { total: 100, current: 50 };
      render(<TodaysProgress {...props} />);

      expect(screen.getByTestId('themed-view')).toBeTruthy();
      expect(screen.getAllByTestId('themed-text').length).toBeGreaterThan(0);
    });
  });

  describe('Component Structure', () => {
    const structureProps = { total: 250, current: 125 };

    it('should render main container', () => {
      render(<TodaysProgress {...structureProps} />);

      const container = screen.getByTestId('themed-view');
      expect(container).toBeTruthy();
    });

    it('should render all text elements', () => {
      mockGetDisplayValue.mockReturnValue('Test Display');
      mockGetRemainingText.mockReturnValue('Test Remaining');
      mockGetEncouragementMessage.mockReturnValue('Test Encouragement');

      render(<TodaysProgress {...structureProps} />);

      // Should have icon, label, display value, encouragement, and remaining text
      const texts = screen.getAllByTestId('themed-text');
      expect(texts.length).toBe(5);

      expect(screen.getByText('Test Display')).toBeTruthy();
      expect(screen.getByText('Test Remaining')).toBeTruthy();
      expect(screen.getByText('Test Encouragement')).toBeTruthy();
    });

    it('should render progress bar', () => {
      render(<TodaysProgress {...structureProps} />);

      const progressBar = screen.getByTestId('linear-progress-bar');
      expect(progressBar).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero total', () => {
      const props = { total: 0, current: 0 };

      // This would cause division by zero, but should not crash
      expect(() => render(<TodaysProgress {...props} />)).not.toThrow();
    });

    it('should handle very large numbers', () => {
      const props = { total: 999999, current: 500000 };

      render(<TodaysProgress {...props} />);

      expect(mockGetDisplayValue).toHaveBeenCalledWith(500000, 999999, false);
      expect(mockGetProgressBackgroundColor).toHaveBeenCalledWith(50); // Rounded
    });

    it('should handle decimal progress calculations', () => {
      const props = { total: 3, current: 1 };

      render(<TodaysProgress {...props} />);

      expect(mockGetEncouragementMessage).toHaveBeenCalledWith(33); // Rounded
    });

    it('should handle negative current values', () => {
      const props = { total: 100, current: -10 };

      expect(() => render(<TodaysProgress {...props} />)).not.toThrow();
      expect(mockGetDisplayValue).toHaveBeenCalledWith(-10, 100, false);
    });

    it('should handle negative total values', () => {
      const props = { total: -100, current: 50 };

      expect(() => render(<TodaysProgress {...props} />)).not.toThrow();
      expect(mockGetDisplayValue).toHaveBeenCalledWith(50, -100, false);
    });
  });
});
