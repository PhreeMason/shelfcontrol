import { CalendarFilterToggle } from '@/components/features/calendar/CalendarFilterToggle';
import { usePreferences } from '@/providers/PreferencesProvider';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock the preferences provider
jest.mock('@/providers/PreferencesProvider');

const mockUsePreferences = usePreferences as jest.MockedFunction<
  typeof usePreferences
>;

describe('CalendarFilterToggle', () => {
  const mockSetExcludedCalendarActivities = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the toggle button with no filters', () => {
    mockUsePreferences.mockReturnValue({
      excludedCalendarActivities: [],
      setExcludedCalendarActivities: mockSetExcludedCalendarActivities,
    } as any);

    render(<CalendarFilterToggle />);

    const button = screen.getByLabelText(
      'No filters active. Tap to filter activities.'
    );
    expect(button).toBeTruthy();
  });

  it('should show active filter accessibility label when filters are active', () => {
    mockUsePreferences.mockReturnValue({
      excludedCalendarActivities: ['note', 'progress'],
      setExcludedCalendarActivities: mockSetExcludedCalendarActivities,
    } as any);

    render(<CalendarFilterToggle />);

    const button = screen.getByLabelText(
      'Filters active. Tap to change filters.'
    );
    expect(button).toBeTruthy();
  });

  it('should open filter sheet when pressed', () => {
    mockUsePreferences.mockReturnValue({
      excludedCalendarActivities: [],
      setExcludedCalendarActivities: mockSetExcludedCalendarActivities,
    } as any);

    const { getByLabelText } = render(<CalendarFilterToggle />);

    const button = getByLabelText(
      'No filters active. Tap to filter activities.'
    );
    fireEvent.press(button);

    // Filter sheet should be visible
    expect(screen.getByText('Filter Activities')).toBeTruthy();
  });
});
