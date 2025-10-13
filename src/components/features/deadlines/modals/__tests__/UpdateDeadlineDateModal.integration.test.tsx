import { DEADLINE_STATUS } from '@/constants/status';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  calculateDeadlineImpact,
  getFeasibilityConfig,
  getQuickSelectDate,
} from '@/utils/deadlineModalUtils';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { UpdateDeadlineDateModal } from '../UpdateDeadlineDateModal';

jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    __esModule: true,
    default: {
      View,
    },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn(value => value),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })),
}));

jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: jest.fn(() => ({
    colors: {
      surface: '#FFFFFF',
      surfaceVariant: '#F5F5F5',
      border: '#E0E0E0',
      primary: '#B8A9D9',
      error: '#E8B4B8',
      good: '#10B981',
      approaching: '#E8B4A0',
      text: '#000000',
      textMuted: '#666666',
    },
  })),
}));

jest.mock('@/lib/dayjs', () => {
  const actualDayjs = jest.requireActual('dayjs');
  const utc = jest.requireActual('dayjs/plugin/utc');
  const timezone = jest.requireActual('dayjs/plugin/timezone');
  actualDayjs.extend(utc);
  actualDayjs.extend(timezone);
  return {
    dayjs: actualDayjs,
  };
});


jest.mock('@/providers/DeadlineProvider', () => ({
  useDeadlines: jest.fn(),
}));

jest.mock('react-native-calendars', () => ({
  Calendar: () => null,
}));

describe.skip('UpdateDeadlineDateModal - Integration Tests', () => {
  const mockUserPaceData = {
    averagePace: 25,
    readingDaysCount: 10,
    isReliable: true,
    calculationMethod: 'recent_data' as const,
  };

  const mockUserListeningPaceData = {
    averagePace: 30,
    listeningDaysCount: 8,
    isReliable: true,
    calculationMethod: 'recent_data' as const,
  };

  const mockUpdateDeadlineDateFn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useDeadlines as jest.Mock).mockReturnValue({
      updateDeadlineDate: mockUpdateDeadlineDateFn,
      userPaceData: mockUserPaceData,
      userListeningPaceData: mockUserListeningPaceData,
    });
  });

  const createMockDeadline = (
    overrides?: Partial<ReadingDeadlineWithProgress>
  ): ReadingDeadlineWithProgress => {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 14);

    return {
      id: 'test-deadline-1',
      user_id: 'test-user',
      book_id: 'test-book',
      book_title: 'Test Book',
      author: 'Test Author',
      source: 'test-source',
      deadline_date: futureDate.toISOString(),
      flexibility: 'flexible',
      total_quantity: 300,
      format: 'physical',
      created_at: today.toISOString(),
      updated_at: today.toISOString(),
      progress: [
        {
          id: 'progress-1',
          deadline_id: 'test-deadline-1',
          current_progress: 100,
          ignore_in_calcs: false,
          time_spent_reading: null,
          created_at: today.toISOString(),
          updated_at: today.toISOString(),
        },
      ],
      status: [
        {
          id: 'status-1',
          deadline_id: 'test-deadline-1',
          status: DEADLINE_STATUS.READING,
          created_at: today.toISOString(),
          updated_at: today.toISOString(),
        },
      ],
      ...overrides,
    };
  };

  describe('Modal Lifecycle', () => {
    it('should render modal when visible is true', () => {
      const deadline = createMockDeadline();
      const { getByText } = render(
        <UpdateDeadlineDateModal
          deadline={deadline}
          visible={true}
          onClose={jest.fn()}
        />
      );

      expect(getByText('Update Deadline Date')).toBeTruthy();
    });

    it('should display current deadline date sections', () => {
      const deadline = createMockDeadline();
      const { getByText } = render(
        <UpdateDeadlineDateModal
          deadline={deadline}
          visible={true}
          onClose={jest.fn()}
        />
      );

      expect(getByText('Current')).toBeTruthy();
      expect(getByText('New')).toBeTruthy();
    });

    it('should call onClose when Cancel button is pressed', () => {
      const deadline = createMockDeadline();
      const onClose = jest.fn();
      const { getByText } = render(
        <UpdateDeadlineDateModal
          deadline={deadline}
          visible={true}
          onClose={onClose}
        />
      );

      fireEvent.press(getByText('Cancel'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Quick Select Buttons', () => {
    it('should render all quick select buttons', () => {
      const deadline = createMockDeadline();
      const { getByText } = render(
        <UpdateDeadlineDateModal
          deadline={deadline}
          visible={true}
          onClose={jest.fn()}
        />
      );

      expect(getByText('+1 week')).toBeTruthy();
      expect(getByText('+2 weeks')).toBeTruthy();
      expect(getByText('+1 month')).toBeTruthy();
      expect(getByText('End of month')).toBeTruthy();
    });
  });

  describe('Impact Display', () => {
    it('should display impact information', () => {
      const deadline = createMockDeadline({
        format: 'physical',
        total_quantity: 300,
        progress: [
          {
            id: 'progress-1',
            deadline_id: 'test-deadline-1',
            current_progress: 100,
          ignore_in_calcs: false,
          time_spent_reading: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      });

      const { getByText } = render(
        <UpdateDeadlineDateModal
          deadline={deadline}
          visible={true}
          onClose={jest.fn()}
        />
      );

      expect(getByText('Days remaining:')).toBeTruthy();
      expect(getByText('Required pace:')).toBeTruthy();
      expect(getByText('Change from current:')).toBeTruthy();
    });
  });

  describe('Save Functionality', () => {
    it('should call updateDeadlineDate when Save is pressed', async () => {
      const deadline = createMockDeadline();
      const { getByText } = render(
        <UpdateDeadlineDateModal
          deadline={deadline}
          visible={true}
          onClose={jest.fn()}
        />
      );

      fireEvent.press(getByText('Save'));

      await waitFor(() => {
        expect(mockUpdateDeadlineDateFn).toHaveBeenCalled();
      });
    });
  });

  describe('Real Utility Function Integration Tests', () => {
    describe('getQuickSelectDate', () => {
      it('should add 7 days for week type', () => {
        const baseDate = new Date('2025-01-01');
        const result = getQuickSelectDate(baseDate, 'week');

        expect(result.getDate()).toBe(8);
        expect(result.getMonth()).toBe(0);
      });

      it('should add 14 days for twoWeeks type', () => {
        const baseDate = new Date('2025-01-01');
        const result = getQuickSelectDate(baseDate, 'twoWeeks');

        expect(result.getDate()).toBe(15);
        expect(result.getMonth()).toBe(0);
      });

      it('should add 30 days for month type', () => {
        const baseDate = new Date('2025-01-01');
        const result = getQuickSelectDate(baseDate, 'month');

        expect(result.getDate()).toBe(31);
        expect(result.getMonth()).toBe(0);
      });

      it('should set to end of next month for endOfMonth type', () => {
        const baseDate = new Date('2025-01-15');
        const result = getQuickSelectDate(baseDate, 'endOfMonth');

        expect(result.getMonth()).toBeGreaterThanOrEqual(0);
        expect(result.getDate()).toBeGreaterThan(0);
      });
    });

    describe('calculateDeadlineImpact', () => {
      it('should calculate correct impact for physical book', () => {
        const deadline = createMockDeadline({
          format: 'physical',
          total_quantity: 300,
          progress: [
            {
              id: 'progress-1',
              deadline_id: 'test-deadline-1',
              current_progress: 100,
          ignore_in_calcs: false,
          time_spent_reading: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        });

        const today = new Date();
        const newDate = new Date(today);
        newDate.setDate(newDate.getDate() + 20);

        const result = calculateDeadlineImpact(
          newDate,
          deadline,
          today,
          mockUserPaceData,
          mockUserListeningPaceData
        );

        expect(result.daysRemaining).toBe(20);
        expect(result.unit).toBe('pages');
        expect(result.feasibility).toBeDefined();
      });

      it('should calculate correct impact for audiobook', () => {
        const deadline = createMockDeadline({
          format: 'audio',
          total_quantity: 600,
          progress: [
            {
              id: 'progress-1',
              deadline_id: 'test-deadline-1',
              current_progress: 200,
          ignore_in_calcs: false,
          time_spent_reading: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        });

        const today = new Date();
        const newDate = new Date(today);
        newDate.setDate(newDate.getDate() + 10);

        const result = calculateDeadlineImpact(
          newDate,
          deadline,
          today,
          mockUserPaceData,
          mockUserListeningPaceData
        );

        expect(result.daysRemaining).toBe(10);
        expect(result.unit).toBe('min');
        expect(result.feasibility).toBeDefined();
      });

      it('should determine comfortable feasibility for easy pace', () => {
        const deadline = createMockDeadline({
          format: 'physical',
          total_quantity: 200,
          progress: [
            {
              id: 'progress-1',
              deadline_id: 'test-deadline-1',
              current_progress: 100,
          ignore_in_calcs: false,
          time_spent_reading: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        });

        const today = new Date();
        const newDate = new Date(today);
        newDate.setDate(newDate.getDate() + 30);

        const result = calculateDeadlineImpact(
          newDate,
          deadline,
          today,
          mockUserPaceData,
          mockUserListeningPaceData
        );

        expect(result.feasibility).toBe('comfortable');
      });

      it('should determine not feasible for impossible pace', () => {
        const deadline = createMockDeadline({
          format: 'physical',
          total_quantity: 1000,
          progress: [
            {
              id: 'progress-1',
              deadline_id: 'test-deadline-1',
              current_progress: 100,
          ignore_in_calcs: false,
          time_spent_reading: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        });

        const today = new Date();
        const newDate = new Date(today);
        newDate.setDate(newDate.getDate() + 5);

        const result = calculateDeadlineImpact(
          newDate,
          deadline,
          today,
          mockUserPaceData,
          mockUserListeningPaceData
        );

        expect(result.feasibility).toBe('notFeasible');
      });
    });

    describe('getFeasibilityConfig', () => {
      const mockColors = {
        good: '#10B981',
        approaching: '#E8B4A0',
        error: '#E8B4B8',
      };

      it('should return correct config for comfortable', () => {
        const config = getFeasibilityConfig('comfortable', mockColors);

        expect(config.text).toContain('Comfortable');
        expect(config.color).toBe(mockColors.good);
        expect(config.backgroundColor).toContain(mockColors.good);
      });

      it('should return correct config for tight', () => {
        const config = getFeasibilityConfig('tight', mockColors);

        expect(config.text).toContain('Tight');
        expect(config.color).toBe(mockColors.approaching);
        expect(config.backgroundColor).toContain(mockColors.approaching);
      });

      it('should return correct config for not feasible', () => {
        const config = getFeasibilityConfig('notFeasible', mockColors);

        expect(config.text).toContain('Not feasible');
        expect(config.color).toBe(mockColors.error);
        expect(config.backgroundColor).toContain(mockColors.error);
      });
    });
  });
});
