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
        expect(screen.getByText('Books Due')).toBeTruthy();
        expect(screen.getByText('New Books Added')).toBeTruthy();
    });

    it('toggles activity filters correctly', () => {
        render(
            <CalendarFilterSheet
                visible={true}
                onClose={mockOnClose}
                excludedActivities={[]}
                onExcludedActivitiesChange={mockOnExcludedActivitiesChange}
            />
        );

        fireEvent.press(screen.getByText('Books Due'));
        expect(mockOnExcludedActivitiesChange).toHaveBeenCalledWith(['deadline_due']);
    });

    it('removes activity from excluded list when toggled again', () => {
        render(
            <CalendarFilterSheet
                visible={true}
                onClose={mockOnClose}
                excludedActivities={['deadline_due']}
                onExcludedActivitiesChange={mockOnExcludedActivitiesChange}
            />
        );

        fireEvent.press(screen.getByText('Books Due'));
        expect(mockOnExcludedActivitiesChange).toHaveBeenCalledWith([]);
    });

    it('clears all filters when "Clear All" is pressed', () => {
        render(
            <CalendarFilterSheet
                visible={true}
                onClose={mockOnClose}
                excludedActivities={['deadline_due', 'note']}
                onExcludedActivitiesChange={mockOnExcludedActivitiesChange}
            />
        );

        fireEvent.press(screen.getByText('Clear All'));
        expect(mockOnExcludedActivitiesChange).toHaveBeenCalledWith([]);
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
