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
  const mockSetShowAllCalendarActivities = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the toggle button', () => {
    mockUsePreferences.mockReturnValue({
      showAllCalendarActivities: false,
      setShowAllCalendarActivities: mockSetShowAllCalendarActivities,
    } as any);

    render(<CalendarFilterToggle />);

    const button = screen.getByLabelText(
      'Showing only deadlines. Tap to show all activities.'
    );
    expect(button).toBeTruthy();
  });

  it('should show filtered state accessibility label when filter is active', () => {
    mockUsePreferences.mockReturnValue({
      showAllCalendarActivities: false,
      setShowAllCalendarActivities: mockSetShowAllCalendarActivities,
    } as any);

    render(<CalendarFilterToggle />);

    const button = screen.getByLabelText(
      'Showing only deadlines. Tap to show all activities.'
    );
    expect(button).toBeTruthy();
  });

  it('should show all activities state accessibility label when filter is off', () => {
    mockUsePreferences.mockReturnValue({
      showAllCalendarActivities: true,
      setShowAllCalendarActivities: mockSetShowAllCalendarActivities,
    } as any);

    render(<CalendarFilterToggle />);

    const button = screen.getByLabelText(
      'Showing all activities. Tap to show only deadlines.'
    );
    expect(button).toBeTruthy();
  });

  it('should call toggle function when pressed', () => {
    mockUsePreferences.mockReturnValue({
      showAllCalendarActivities: false,
      setShowAllCalendarActivities: mockSetShowAllCalendarActivities,
    } as any);

    const { getByLabelText } = render(<CalendarFilterToggle />);

    const button = getByLabelText(
      'Showing only deadlines. Tap to show all activities.'
    );
    fireEvent.press(button);

    expect(mockSetShowAllCalendarActivities).toHaveBeenCalledWith(true);
  });

  it('should toggle from all activities to filtered when pressed', () => {
    mockUsePreferences.mockReturnValue({
      showAllCalendarActivities: true,
      setShowAllCalendarActivities: mockSetShowAllCalendarActivities,
    } as any);

    const { getByLabelText } = render(<CalendarFilterToggle />);

    const button = getByLabelText(
      'Showing all activities. Tap to show only deadlines.'
    );
    fireEvent.press(button);

    expect(mockSetShowAllCalendarActivities).toHaveBeenCalledWith(false);
  });
});
