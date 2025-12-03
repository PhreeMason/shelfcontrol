import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { CalendarFilterSheet } from '../CalendarFilterSheet';

// Mock dependencies
jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: () => ({
    colors: {
      surface: '#ffffff',
      primary: '#0000ff',
      outline: '#cccccc',
      darkPink: '#ff0000',
      border: '#eeeeee',
      successGreen: '#10B981',
      good: '#7a5a8c',
      approaching: '#d4a46a',
      urgent: '#c8696e',
    },
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 20 }),
}));

describe('CalendarFilterSheet', () => {
  const mockOnClose = jest.fn();
  const mockOnExcludedActivitiesChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when visible', () => {
    render(
      <CalendarFilterSheet
        visible={true}
        onClose={mockOnClose}
        excludedActivities={[]}
        onExcludedActivitiesChange={mockOnExcludedActivitiesChange}
      />
    );

    expect(screen.getByText('Filter Activities')).toBeTruthy();
    // Due date filters
    expect(screen.getByText('Due Dates')).toBeTruthy();
    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.getByText('On Track')).toBeTruthy();
    expect(screen.getByText('Tight')).toBeTruthy();
    expect(screen.getByText('Needs Replanning')).toBeTruthy();
    // Activity event filters
    expect(screen.getByText('Activity Events')).toBeTruthy();
    expect(screen.getByText('New Books Added')).toBeTruthy();
  });

  it('toggles due date filters correctly', () => {
    render(
      <CalendarFilterSheet
        visible={true}
        onClose={mockOnClose}
        excludedActivities={[]}
        onExcludedActivitiesChange={mockOnExcludedActivitiesChange}
      />
    );

    fireEvent.press(screen.getByText('On Track'));
    expect(mockOnExcludedActivitiesChange).toHaveBeenCalledWith([
      'deadline_due_good',
    ]);
  });

  it('removes activity from excluded list when toggled again', () => {
    render(
      <CalendarFilterSheet
        visible={true}
        onClose={mockOnClose}
        excludedActivities={['deadline_due_urgent']}
        onExcludedActivitiesChange={mockOnExcludedActivitiesChange}
      />
    );

    fireEvent.press(screen.getByText('Needs Replanning'));
    expect(mockOnExcludedActivitiesChange).toHaveBeenCalledWith([]);
  });

  it('excludes all activity types when "Clear All" is pressed', () => {
    render(
      <CalendarFilterSheet
        visible={true}
        onClose={mockOnClose}
        excludedActivities={['deadline_due_completed', 'note']}
        onExcludedActivitiesChange={mockOnExcludedActivitiesChange}
      />
    );

    fireEvent.press(screen.getByText('Clear All'));
    // "Clear All" hides all calendar items by adding all types to excluded list
    expect(mockOnExcludedActivitiesChange).toHaveBeenCalledWith([
      'deadline_due_completed',
      'deadline_due_good',
      'deadline_due_approaching',
      'deadline_due_urgent',
      'custom_date',
      'progress_complete',
      'deadline_created',
      'progress',
      'status',
      'note',
      'review',
      'review_due',
    ]);
  });

  it('calls onClose when "Done" or "APPLY" is pressed', () => {
    render(
      <CalendarFilterSheet
        visible={true}
        onClose={mockOnClose}
        excludedActivities={[]}
        onExcludedActivitiesChange={mockOnExcludedActivitiesChange}
      />
    );

    fireEvent.press(screen.getByText('Done'));
    expect(mockOnClose).toHaveBeenCalled();

    fireEvent.press(screen.getByText('APPLY'));
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });
});
