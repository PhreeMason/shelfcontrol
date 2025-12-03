import React from 'react';
import { render, screen } from '@testing-library/react-native';
import TodaysGoals from '../TodaysGoals';

// Mock the dependencies
jest.mock('@/components/progress/TodaysProgress', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return function MockTodaysProgress({ type, total, current }: any) {
    return React.createElement(
      View,
      { testID: `todays-progress-${type}` },
      React.createElement(Text, {}, `${type}: ${current}/${total}`)
    );
  };
});

jest.mock('@/components/themed', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    ThemedView: function MockThemedView({ children, style }: any) {
      return React.createElement(View, { style }, children);
    },
    ThemedText: function MockThemedText({ children, variant, style }: any) {
      return React.createElement(
        Text,
        { testID: `themed-text-${variant || 'default'}`, style },
        children
      );
    },
  };
});

jest.mock('@/hooks/useTodaysDeadlines', () => ({
  useTodaysDeadlines: jest.fn(),
}));

jest.mock('@/providers/DeadlineProvider', () => ({
  useDeadlines: jest.fn(),
}));

const defaultMockUseTodaysDeadlines = {
  audioDeadlines: [],
  readingDeadlines: [],
  allAudioDeadlines: [],
  allReadingDeadlines: [],
  overdueReadingDeadlines: [],
  overdueAudioDeadlines: [],
};

const defaultMockUseDeadlines = {
  calculateProgressForToday: jest.fn(),
  userPaceData: { averagePace: 0 },
  userListeningPaceData: { averagePace: 0 },
};

jest.mock('@/utils/deadlineAggregationUtils', () => ({
  calculateTodaysAudioTotals: jest.fn(),
  calculateTodaysReadingTotals: jest.fn(),
  calculateOverdueCatchUpTotals: jest.fn(),
}));

describe('TodaysGoals', () => {
  const mockCalculateProgressForToday = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    const { useDeadlines } = require('@/providers/DeadlineProvider');
    const { useTodaysDeadlines } = require('@/hooks/useTodaysDeadlines');
    const {
      calculateTodaysAudioTotals,
      calculateTodaysReadingTotals,
      calculateOverdueCatchUpTotals,
    } = require('@/utils/deadlineAggregationUtils');

    useDeadlines.mockReturnValue({
      ...defaultMockUseDeadlines,
      calculateProgressForToday: mockCalculateProgressForToday,
    });

    useTodaysDeadlines.mockReturnValue(defaultMockUseTodaysDeadlines);

    // Default mock return values for aggregation utilities
    calculateTodaysAudioTotals.mockReturnValue({ total: 0, current: 0 });
    calculateTodaysReadingTotals.mockReturnValue({ total: 0, current: 0 });
    calculateOverdueCatchUpTotals.mockReturnValue({ total: 0, current: 0, hasCapacity: false });
  });

  describe('Empty State', () => {
    it('should display empty state when no deadlines exist', () => {
      // Uses default mocks set in beforeEach (all empty arrays)
      render(<TodaysGoals />);

      expect(screen.getByText('No reading goals set for today')).toBeTruthy();
      expect(
        screen.getByText(
          'Add a book with a due date to start tracking your progress'
        )
      ).toBeTruthy();
    });

    it('should not display empty state when reading deadlines exist', () => {
      const { useTodaysDeadlines } = require('@/hooks/useTodaysDeadlines');
      useTodaysDeadlines.mockReturnValue({
        ...defaultMockUseTodaysDeadlines,
        readingDeadlines: [{ id: '1', title: 'Test Book' }],
        allReadingDeadlines: [{ id: '1', title: 'Test Book' }],
      });

      const { calculateTodaysReadingTotals } = require('@/utils/deadlineAggregationUtils');
      calculateTodaysReadingTotals.mockReturnValue({ total: 100, current: 50 });

      render(<TodaysGoals />);

      expect(screen.queryByText('No reading goals set for today')).toBeNull();
      expect(screen.getByTestId('todays-progress-reading')).toBeTruthy();
    });

    it('should not display empty state when audio deadlines exist', () => {
      const { useTodaysDeadlines } = require('@/hooks/useTodaysDeadlines');
      useTodaysDeadlines.mockReturnValue({
        ...defaultMockUseTodaysDeadlines,
        audioDeadlines: [{ id: '1', title: 'Test Audiobook' }],
        allAudioDeadlines: [{ id: '1', title: 'Test Audiobook' }],
      });

      const { calculateTodaysAudioTotals } = require('@/utils/deadlineAggregationUtils');
      calculateTodaysAudioTotals.mockReturnValue({ total: 120, current: 60 });

      render(<TodaysGoals />);

      expect(screen.queryByText('No reading goals set for today')).toBeNull();
      expect(screen.getByTestId('todays-progress-listening')).toBeTruthy();
    });
  });

  describe('Progress Display', () => {
    it('should display both reading and audio progress when both exist', () => {
      const { useTodaysDeadlines } = require('@/hooks/useTodaysDeadlines');
      useTodaysDeadlines.mockReturnValue({
        ...defaultMockUseTodaysDeadlines,
        audioDeadlines: [{ id: '1', title: 'Test Audiobook' }],
        readingDeadlines: [{ id: '2', title: 'Test Book' }],
        allAudioDeadlines: [{ id: '1', title: 'Test Audiobook' }],
        allReadingDeadlines: [{ id: '2', title: 'Test Book' }],
      });

      const {
        calculateTodaysAudioTotals,
        calculateTodaysReadingTotals,
      } = require('@/utils/deadlineAggregationUtils');
      calculateTodaysAudioTotals.mockReturnValue({ total: 120, current: 60 });
      calculateTodaysReadingTotals.mockReturnValue({ total: 100, current: 50 });

      render(<TodaysGoals />);

      expect(screen.getByTestId('todays-progress-reading')).toBeTruthy();
      expect(screen.getByTestId('todays-progress-listening')).toBeTruthy();
      expect(screen.queryByText('No reading goals set for today')).toBeNull();
    });

    it('should display only reading progress when only reading deadlines exist', () => {
      const { useTodaysDeadlines } = require('@/hooks/useTodaysDeadlines');
      useTodaysDeadlines.mockReturnValue({
        ...defaultMockUseTodaysDeadlines,
        readingDeadlines: [{ id: '1', title: 'Test Book' }],
        allReadingDeadlines: [{ id: '1', title: 'Test Book' }],
      });

      const { calculateTodaysReadingTotals } = require('@/utils/deadlineAggregationUtils');
      calculateTodaysReadingTotals.mockReturnValue({ total: 100, current: 75 });

      render(<TodaysGoals />);

      expect(screen.getByTestId('todays-progress-reading')).toBeTruthy();
      expect(screen.queryByTestId('todays-progress-listening')).toBeNull();
    });

    it('should display only audio progress when only audio deadlines exist', () => {
      const { useTodaysDeadlines } = require('@/hooks/useTodaysDeadlines');
      useTodaysDeadlines.mockReturnValue({
        ...defaultMockUseTodaysDeadlines,
        audioDeadlines: [{ id: '1', title: 'Test Audiobook' }],
        allAudioDeadlines: [{ id: '1', title: 'Test Audiobook' }],
      });

      const { calculateTodaysAudioTotals } = require('@/utils/deadlineAggregationUtils');
      calculateTodaysAudioTotals.mockReturnValue({ total: 180, current: 90 });

      render(<TodaysGoals />);

      expect(screen.queryByTestId('todays-progress-reading')).toBeNull();
      expect(screen.getByTestId('todays-progress-listening')).toBeTruthy();
    });
  });

  describe('Component Structure', () => {
    it('should always display the title', () => {
      // Uses default mocks set in beforeEach (all empty arrays)
      render(<TodaysGoals />);

      expect(screen.getByText("TODAY'S READING GOALS")).toBeTruthy();
    });

    it('should pass correct props to TodaysProgress for reading', () => {
      const { useTodaysDeadlines } = require('@/hooks/useTodaysDeadlines');
      useTodaysDeadlines.mockReturnValue({
        ...defaultMockUseTodaysDeadlines,
        readingDeadlines: [{ id: '1', title: 'Test Book' }],
        allReadingDeadlines: [{ id: '1', title: 'Test Book' }],
      });

      const { calculateTodaysReadingTotals } = require('@/utils/deadlineAggregationUtils');
      calculateTodaysReadingTotals.mockReturnValue({
        total: 200,
        current: 150,
      });

      render(<TodaysGoals />);

      const progressElement = screen.getByTestId('todays-progress-reading');
      expect(progressElement).toBeTruthy();
      expect(screen.getByText('reading: 150/200')).toBeTruthy();
    });

    it('should pass correct props to TodaysProgress for audio', () => {
      const { useTodaysDeadlines } = require('@/hooks/useTodaysDeadlines');
      useTodaysDeadlines.mockReturnValue({
        ...defaultMockUseTodaysDeadlines,
        audioDeadlines: [{ id: '1', title: 'Test Audiobook' }],
        allAudioDeadlines: [{ id: '1', title: 'Test Audiobook' }],
      });

      const { calculateTodaysAudioTotals } = require('@/utils/deadlineAggregationUtils');
      calculateTodaysAudioTotals.mockReturnValue({ total: 300, current: 100 });

      render(<TodaysGoals />);

      const progressElement = screen.getByTestId('todays-progress-listening');
      expect(progressElement).toBeTruthy();
      expect(screen.getByText('listening: 100/300')).toBeTruthy();
    });
  });

  describe('Calculation Functions', () => {
    it('should call calculation functions with correct parameters', () => {
      const { useTodaysDeadlines } = require('@/hooks/useTodaysDeadlines');
      const mockReadingDeadlines = [{ id: '1', title: 'Book 1' }];
      const mockAudioDeadlines = [{ id: '2', title: 'Audio 1' }];
      const mockAllReadingDeadlines = [{ id: '1', title: 'Book 1' }];
      const mockAllAudioDeadlines = [{ id: '2', title: 'Audio 1' }];

      useTodaysDeadlines.mockReturnValue({
        ...defaultMockUseTodaysDeadlines,
        audioDeadlines: mockAudioDeadlines,
        readingDeadlines: mockReadingDeadlines,
        allAudioDeadlines: mockAllAudioDeadlines,
        allReadingDeadlines: mockAllReadingDeadlines,
      });

      const {
        calculateTodaysAudioTotals,
        calculateTodaysReadingTotals,
      } = require('@/utils/deadlineAggregationUtils');
      calculateTodaysAudioTotals.mockReturnValue({ total: 60, current: 30 });
      calculateTodaysReadingTotals.mockReturnValue({ total: 50, current: 25 });

      render(<TodaysGoals />);

      expect(calculateTodaysAudioTotals).toHaveBeenCalledWith(
        mockAudioDeadlines,
        mockAllAudioDeadlines,
        mockCalculateProgressForToday
      );
      expect(calculateTodaysReadingTotals).toHaveBeenCalledWith(
        mockReadingDeadlines,
        mockAllReadingDeadlines,
        mockCalculateProgressForToday
      );
    });
  });
});
