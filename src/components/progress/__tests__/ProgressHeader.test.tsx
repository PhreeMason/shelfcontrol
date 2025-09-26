import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ProgressHeader from '../ProgressHeader';

// Mock the theme hook
jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      text: '#000000',
      primary: '#007AFF',
      secondary: '#5856D6',
    },
    typography: {
      bodyLarge: {
        fontSize: 18,
        lineHeight: 24,
      },
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

describe('ProgressHeader', () => {
  it('should render the header text', () => {
    render(<ProgressHeader />);
    expect(screen.getByText('Reading Progress')).toBeTruthy();
  });

  it('should apply correct styles from theme', () => {
    render(<ProgressHeader />);

    const text = screen.getByTestId('themed-text');
    expect(text.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fontSize: 18,
          lineHeight: 24,
        }),
        expect.objectContaining({
          color: '#000000',
          fontWeight: 'bold',
        }),
      ])
    );
  });

  it('should use ThemedView container', () => {
    render(<ProgressHeader />);

    const container = screen.getByTestId('themed-view');
    expect(container).toBeTruthy();
    expect(container.props.style).toEqual(
      expect.objectContaining({
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
      })
    );
  });

  it('should be a functional component', () => {
    const { toJSON } = render(<ProgressHeader />);

    // Should render without errors
    expect(toJSON()).toBeTruthy();

    // Re-render to ensure no issues with hooks
    const { toJSON: toJSON2 } = render(<ProgressHeader />);
    expect(toJSON2()).toBeTruthy();
  });
});
