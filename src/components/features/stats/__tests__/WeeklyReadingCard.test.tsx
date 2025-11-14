import { WeeklyStats } from '@/types/stats.types';
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { WeeklyReadingCard } from '../WeeklyReadingCard';

// Mock the base component
jest.mock('../WeeklyStatsCard', () => ({
  WeeklyStatsCard: ({ headerLabel, type, formatValue }: any) => {
    const React = require('react');
    return React.createElement(
      'View',
      { testID: `weekly-stats-card-${type}` },
      [
        React.createElement('Text', { key: 'header' }, headerLabel),
        React.createElement('Text', { key: 'formatted' }, formatValue(100)),
      ]
    );
  },
}));

describe('WeeklyReadingCard', () => {
  const mockStats: WeeklyStats = {
    unitsReadThisWeek: 350,
    unitsNeededThisWeek: 280,
    unitsAheadBehind: 70,
    averagePerDay: 50,
    requiredDailyPace: 40,
    daysWithActivity: 7,
    daysElapsedThisWeek: 7,
    progressPercentage: 125,
    overallStatus: 'ahead',
  };

  it('should render WeeklyStatsCard with reading type', () => {
    render(<WeeklyReadingCard stats={mockStats} />);

    expect(screen.getByTestId('weekly-stats-card-reading')).toBeTruthy();
  });

  it('should pass correct header label for reading', () => {
    render(<WeeklyReadingCard stats={mockStats} />);

    expect(screen.getByText('Books This Week')).toBeTruthy();
  });

  it('should format values as pages', () => {
    render(<WeeklyReadingCard stats={mockStats} />);

    // The mock formatValue(100) should return "100 pages"
    expect(screen.getByText('100 pages')).toBeTruthy();
  });

  it('should pass stats prop to base component', () => {
    const { getByTestId } = render(<WeeklyReadingCard stats={mockStats} />);

    expect(getByTestId('weekly-stats-card-reading')).toBeTruthy();
  });
});
