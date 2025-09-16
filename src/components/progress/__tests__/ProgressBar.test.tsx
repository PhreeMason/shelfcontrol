import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ProgressBar from '../ProgressBar';

// Mock the dependencies
jest.mock('@/components/shared/LinearProgressBar', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockLinearProgressBar(_props: any) {
    return React.createElement(View, { testID: 'linear-progress-bar' });
  };
});

jest.mock('@/components/themed/ThemedText', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    ThemedText: function MockThemedText({ children, variant }: any) {
      return React.createElement(
        Text,
        { testID: `themed-text-${variant || 'default'}` },
        children
      );
    },
  };
});

jest.mock('@/utils/dateUtils', () => ({
  formatDeadlineDate: jest.fn((date: string) => `FormattedDate-${date}`),
}));

describe('ProgressBar', () => {
  const defaultProps = {
    progressPercentage: 75,
    deadlineDate: '2024-01-20',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with correct progress percentage', () => {
    const { getByText } = render(<ProgressBar {...defaultProps} />);

    // Check if the progress percentage is displayed
    expect(getByText('75%')).toBeTruthy();
  });

  it('should render LinearProgressBar with correct props', () => {
    render(<ProgressBar {...defaultProps} />);

    // Check if LinearProgressBar is rendered
    expect(screen.getByTestId('linear-progress-bar')).toBeTruthy();
  });

  it('should format and display deadline date', () => {
    const { formatDeadlineDate } = require('@/utils/dateUtils');
    render(<ProgressBar {...defaultProps} />);

    // Check if formatDeadlineDate was called with correct date
    expect(formatDeadlineDate).toHaveBeenCalledWith('2024-01-20');

    // Check if deadline text is displayed
    expect(screen.getByText('Deadline: FormattedDate-2024-01-20')).toBeTruthy();
  });

  it('should handle different progress percentages', () => {
    render(<ProgressBar {...defaultProps} progressPercentage={100} />);

    expect(screen.getByText('100%')).toBeTruthy();
    expect(screen.getByTestId('linear-progress-bar')).toBeTruthy();
  });

  it('should handle zero progress', () => {
    render(<ProgressBar {...defaultProps} progressPercentage={0} />);

    expect(screen.getByText('0%')).toBeTruthy();
    expect(screen.getByTestId('linear-progress-bar')).toBeTruthy();
  });

  it('should handle different deadline dates', () => {
    const { formatDeadlineDate } = require('@/utils/dateUtils');
    const customDate = '2024-12-25';

    render(<ProgressBar {...defaultProps} deadlineDate={customDate} />);

    expect(formatDeadlineDate).toHaveBeenCalledWith(customDate);
    expect(screen.getByText('Deadline: FormattedDate-2024-12-25')).toBeTruthy();
  });

  it('should apply correct styling structure', () => {
    render(<ProgressBar {...defaultProps} />);

    // Verify that both progress percentage and deadline are rendered
    expect(screen.getByText('75%')).toBeTruthy();
    expect(screen.getByText('Deadline: FormattedDate-2024-01-20')).toBeTruthy();
  });
});
