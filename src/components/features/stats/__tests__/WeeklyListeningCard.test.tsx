import { WeeklyStats } from '@/types/stats.types';
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { WeeklyListeningCard } from '../WeeklyListeningCard';

// Mock formatAudioTime
jest.mock('@/utils/statsUtils', () => ({
  formatAudioTime: jest.fn((minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
    }
    return `${Math.round(minutes)}m`;
  }),
}));

// Mock the base component
jest.mock('../WeeklyStatsCard', () => ({
  WeeklyStatsCard: ({ headerLabel, formatValue }: any) => {
    const React = require('react');
    return React.createElement(
      'View',
      { testID: 'weekly-stats-card' },
      [
        React.createElement('Text', { key: 'header' }, headerLabel),
        React.createElement('Text', { key: 'formatted' }, formatValue(75)),
      ]
    );
  },
}));

describe('WeeklyListeningCard', () => {
  const mockStats: WeeklyStats = {
    unitsReadThisWeek: 300,
    unitsNeededThisWeek: 240,
    unitsAheadBehind: 60,
    averagePerDay: 43,
    requiredDailyPace: 34,
    daysWithActivity: 7,
    daysElapsedThisWeek: 7,
    progressPercentage: 125,
    overallStatus: 'ahead',
  };

  it('should render WeeklyStatsCard with listening header', () => {
    render(<WeeklyListeningCard stats={mockStats} />);

    expect(screen.getByTestId('weekly-stats-card')).toBeTruthy();
    expect(screen.getByText('Audiobooks This Week')).toBeTruthy();
  });

  it('should pass correct header label for listening', () => {
    render(<WeeklyListeningCard stats={mockStats} />);

    expect(screen.getByText('Audiobooks This Week')).toBeTruthy();
  });

  it('should format values using formatAudioTime', () => {
    render(<WeeklyListeningCard stats={mockStats} />);

    // The mock formatValue(75) should return "1h 15m"
    expect(screen.getByText('1h 15m')).toBeTruthy();
  });

  it('should pass stats prop to base component', () => {
    const { getByTestId } = render(<WeeklyListeningCard stats={mockStats} />);

    expect(getByTestId('weekly-stats-card')).toBeTruthy();
  });
});
