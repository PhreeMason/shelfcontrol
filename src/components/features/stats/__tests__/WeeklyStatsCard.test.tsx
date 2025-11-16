import { WeeklyStats } from '@/types/stats.types';
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { WeeklyStatsCard } from '../WeeklyStatsCard';

jest.mock('@/components/themed', () => ({
  ThemedText: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement(
      'Text',
      { ...props, testID: props.testID || 'themed-text' },
      children
    );
  },
}));

jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: ({ name, accessibilityLabel, ...props }: any) => {
    const React = require('react');
    return React.createElement(
      'View',
      { testID: `icon-${name}`, accessibilityLabel, ...props },
      React.createElement('Text', {}, name)
    );
  },
}));

jest.mock('@/hooks/useTheme', () => ({
  useTheme: jest.fn(() => ({
    colors: {
      background: '#ffffff',
      border: '#e5e7eb',
      textMuted: '#9ca3af',
      successGreen: '#86b468',
      warningOrange: '#f97316',
      errorRed: '#dc2626',
    },
  })),
}));

jest.mock('@/components/shared/LinearProgressBar', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ progressPercentage, height, ...props }: any) =>
      React.createElement(
        'View',
        { ...props, testID: 'linear-progress-bar' },
        React.createElement(
          'Text',
          { testID: 'progress-value' },
          `${progressPercentage}% (height: ${height})`
        )
      ),
  };
});

jest.mock('@/constants/statsConstants', () => ({
  STATS_CONSTANTS: {
    PROGRESS_BAR_HEIGHT: 12,
    WEEK_DAYS: 7,
    AHEAD_THRESHOLD: 100,
    ON_TRACK_THRESHOLD: 95,
  },
}));

jest.mock('@/utils/statsUtils', () => ({
  getWeeklyStatusColors: jest.fn((status, colors) => {
    if (status === 'ahead') {
      return {
        background: colors.background,
        border: colors.border,
        text: colors.successGreen,
        progressBar: colors.successGreen,
      };
    } else if (status === 'behind') {
      return {
        background: colors.background,
        border: colors.border,
        text: colors.errorRed,
        progressBar: colors.errorRed,
      };
    } else {
      return {
        background: colors.background,
        border: colors.border,
        text: colors.warningOrange,
        progressBar: colors.warningOrange,
      };
    }
  }),
  formatAheadBehindText: jest.fn((value, formatValue) => {
    if (value > 0) return `+${formatValue(Math.abs(value))}`;
    if (value < 0) return `${formatValue(Math.abs(value))}`;
    return formatValue(0);
  }),
  getAheadBehindLabel: jest.fn(value => {
    if (value > 0) return 'ahead';
    if (value < 0) return 'to go';
    return 'on track';
  }),
}));

describe('WeeklyStatsCard', () => {
  const defaultFormatValue = (value: number) => `${value} units`;

  describe('when ahead', () => {
    const aheadStats: WeeklyStats = {
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

    it('should render header label', () => {
      render(
        <WeeklyStatsCard
          stats={aheadStats}
          type="reading"
          headerLabel="Test Header"
          unitsReadLabel="read"
          unitsNeededLabel="needed"
          averageActivityLabel="Reading"
          daysActivityLabel="Read"
          formatValue={defaultFormatValue}
        />
      );

      expect(screen.getByText('Test Header')).toBeTruthy();
    });

    it('should display units read with label', () => {
      render(
        <WeeklyStatsCard
          stats={aheadStats}
          type="reading"
          headerLabel="Test"
          unitsReadLabel="read"
          unitsNeededLabel="needed"
          averageActivityLabel="Reading"
          daysActivityLabel="Read"
          formatValue={defaultFormatValue}
        />
      );

      expect(screen.getByText('350 units')).toBeTruthy();
      expect(screen.getByText('read')).toBeTruthy();
    });

    it('should display units needed with label', () => {
      render(
        <WeeklyStatsCard
          stats={aheadStats}
          type="reading"
          headerLabel="Test"
          unitsReadLabel="read"
          unitsNeededLabel="needed"
          averageActivityLabel="Reading"
          daysActivityLabel="Read"
          formatValue={defaultFormatValue}
        />
      );

      expect(screen.getByText('280 units')).toBeTruthy();
      expect(screen.getByText('needed')).toBeTruthy();
    });

    it('should display ahead/behind status', () => {
      render(
        <WeeklyStatsCard
          stats={aheadStats}
          type="reading"
          headerLabel="Test"
          unitsReadLabel="read"
          unitsNeededLabel="needed"
          averageActivityLabel="Reading"
          daysActivityLabel="Read"
          formatValue={defaultFormatValue}
        />
      );

      expect(screen.getByText('+70 units')).toBeTruthy();
      expect(screen.getByText('ahead')).toBeTruthy();
    });

    it('should display checkmark icon for ahead status', () => {
      render(
        <WeeklyStatsCard
          stats={aheadStats}
          type="reading"
          headerLabel="Test"
          unitsReadLabel="read"
          unitsNeededLabel="needed"
          averageActivityLabel="Reading"
          daysActivityLabel="Read"
          formatValue={defaultFormatValue}
        />
      );

      const icon = screen.getByTestId('icon-checkmark');
      expect(icon).toBeTruthy();
      expect(icon.props.accessibilityLabel).toBe('Ahead of pace');
    });

    it('should display progress percentage', () => {
      render(
        <WeeklyStatsCard
          stats={aheadStats}
          type="reading"
          headerLabel="Test"
          unitsReadLabel="read"
          unitsNeededLabel="needed"
          averageActivityLabel="Reading"
          daysActivityLabel="Read"
          formatValue={defaultFormatValue}
        />
      );

      expect(screen.getByText('125%')).toBeTruthy();
    });

    it('should display average per day', () => {
      render(
        <WeeklyStatsCard
          stats={aheadStats}
          type="reading"
          headerLabel="Test"
          unitsReadLabel="read"
          unitsNeededLabel="needed"
          averageActivityLabel="Reading"
          daysActivityLabel="Read"
          formatValue={defaultFormatValue}
        />
      );

      expect(screen.getByText(/On pace for/)).toBeTruthy();
      expect(screen.getByText(/50 units\/day/)).toBeTruthy();
    });

    it('should display days with activity', () => {
      render(
        <WeeklyStatsCard
          stats={aheadStats}
          type="reading"
          headerLabel="Test"
          unitsReadLabel="read"
          unitsNeededLabel="needed"
          averageActivityLabel="Reading"
          daysActivityLabel="Read"
          formatValue={defaultFormatValue}
        />
      );

      expect(screen.getByText(/Read/)).toBeTruthy();
      expect(screen.getByText(/7 out of 7 days/)).toBeTruthy();
    });

    it('should use progress bar height from constants', () => {
      render(
        <WeeklyStatsCard
          stats={aheadStats}
          type="reading"
          headerLabel="Test"
          unitsReadLabel="read"
          unitsNeededLabel="needed"
          averageActivityLabel="Reading"
          daysActivityLabel="Read"
          formatValue={defaultFormatValue}
        />
      );

      expect(screen.getByText(/height: 12/)).toBeTruthy();
    });

    it('should have accessibility attributes', () => {
      const { getByLabelText } = render(
        <WeeklyStatsCard
          stats={aheadStats}
          type="reading"
          headerLabel="Test Header"
          unitsReadLabel="read"
          unitsNeededLabel="needed"
          averageActivityLabel="Reading"
          daysActivityLabel="Read"
          formatValue={defaultFormatValue}
        />
      );

      // Accessibility label uses raw numbers, not formatted/abbreviated
      expect(
        getByLabelText(/Test Header.*350 read.*280 needed.*70 ahead.*Averaging 50 per day/)
      ).toBeTruthy();
    });
  });

  describe('when behind', () => {
    const behindStats: WeeklyStats = {
      unitsReadThisWeek: 150,
      unitsNeededThisWeek: 280,
      unitsAheadBehind: -130,
      averagePerDay: 25,
      requiredDailyPace: 40,
      daysWithActivity: 6,
      daysElapsedThisWeek: 7,
      progressPercentage: 54,
      overallStatus: 'behind',
    };

    it('should display negative ahead/behind value', () => {
      render(
        <WeeklyStatsCard
          stats={behindStats}
          type="reading"
          headerLabel="Test"
          unitsReadLabel="read"
          unitsNeededLabel="needed"
          averageActivityLabel="Reading"
          daysActivityLabel="Read"
          formatValue={defaultFormatValue}
        />
      );

      expect(screen.getByText('130 units')).toBeTruthy();
      expect(screen.getByText('to go')).toBeTruthy();
    });
  });

  describe('when on track', () => {
    const onTrackStats: WeeklyStats = {
      unitsReadThisWeek: 280,
      unitsNeededThisWeek: 280,
      unitsAheadBehind: 0,
      averagePerDay: 40,
      requiredDailyPace: 40,
      daysWithActivity: 7,
      daysElapsedThisWeek: 7,
      progressPercentage: 100,
      overallStatus: 'onTrack',
    };

    it('should display on track status', () => {
      render(
        <WeeklyStatsCard
          stats={onTrackStats}
          type="reading"
          headerLabel="Test"
          unitsReadLabel="read"
          unitsNeededLabel="needed"
          averageActivityLabel="Reading"
          daysActivityLabel="Read"
          formatValue={defaultFormatValue}
        />
      );

      expect(screen.getByText('0 units')).toBeTruthy();
      expect(screen.getByText('on track')).toBeTruthy();
    });

    it('should display arrow icon for on track status', () => {
      render(
        <WeeklyStatsCard
          stats={onTrackStats}
          type="reading"
          headerLabel="Test"
          unitsReadLabel="read"
          unitsNeededLabel="needed"
          averageActivityLabel="Reading"
          daysActivityLabel="Read"
          formatValue={defaultFormatValue}
        />
      );

      const icon = screen.getByTestId('icon-arrow.up.right');
      expect(icon).toBeTruthy();
      expect(icon.props.accessibilityLabel).toBe('On track');
    });
  });

  describe('when no activity', () => {
    const noActivityStats: WeeklyStats = {
      unitsReadThisWeek: 0,
      unitsNeededThisWeek: 0,
      unitsAheadBehind: 0,
      averagePerDay: 0,
      requiredDailyPace: 0,
      daysWithActivity: 0,
      daysElapsedThisWeek: 7,
      progressPercentage: 0,
      overallStatus: 'onTrack',
    };

    it('should not render when there is no activity', () => {
      const { toJSON } = render(
        <WeeklyStatsCard
          stats={noActivityStats}
          type="reading"
          headerLabel="Test"
          unitsReadLabel="read"
          unitsNeededLabel="needed"
          averageActivityLabel="Reading"
          daysActivityLabel="Read"
          formatValue={defaultFormatValue}
        />
      );

      expect(toJSON()).toBeNull();
    });
  });

  describe('with custom formatValue', () => {
    const customStats: WeeklyStats = {
      unitsReadThisWeek: 75,
      unitsNeededThisWeek: 60,
      unitsAheadBehind: 15,
      averagePerDay: 10,
      requiredDailyPace: 8,
      daysWithActivity: 7,
      daysElapsedThisWeek: 7,
      progressPercentage: 125,
      overallStatus: 'ahead',
    };

    const formatTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
    };

    it('should use custom formatValue function for all values', () => {
      render(
        <WeeklyStatsCard
          stats={customStats}
          type="listening"
          headerLabel="Listening"
          unitsReadLabel="listened"
          unitsNeededLabel="needed"
          averageActivityLabel="Listening"
          daysActivityLabel="Listened"
          formatValue={formatTime}
        />
      );

      expect(screen.getByText('1h 15m')).toBeTruthy(); // unitsReadThisWeek (75)
      expect(screen.getByText('1h')).toBeTruthy(); // unitsNeededThisWeek (60)
    });
  });

  describe('with partial week data', () => {
    const partialWeekStats: WeeklyStats = {
      unitsReadThisWeek: 100,
      unitsNeededThisWeek: 120,
      unitsAheadBehind: -20,
      averagePerDay: 25,
      requiredDailyPace: 30,
      daysWithActivity: 4,
      daysElapsedThisWeek: 4,
      progressPercentage: 83,
      overallStatus: 'behind',
    };

    it('should display correct days with activity out of days elapsed', () => {
      render(
        <WeeklyStatsCard
          stats={partialWeekStats}
          type="reading"
          headerLabel="Test"
          unitsReadLabel="read"
          unitsNeededLabel="needed"
          averageActivityLabel="Reading"
          daysActivityLabel="Read"
          formatValue={defaultFormatValue}
        />
      );

      expect(screen.getByText(/4 out of 4 days/)).toBeTruthy();
    });
  });
});
