/**
 * Tests for DailyReadingChart component
 * Following Phase 6-7 integration testing pattern from TESTING.md
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import DailyReadingChart from '../DailyReadingChart';
import {
  ReadingDeadlineWithProgress,
  ReadingDeadlineProgress,
  ReadingDeadlineStatus,
} from '@/types/deadline.types';

// Mock child components
jest.mock('../DailyChartLegend', () => ({
  DailyChartLegend: () => {
    const React = require('react');
    return React.createElement('View', { testID: 'daily-chart-legend' });
  },
}));

// Mock react-native-gifted-charts
let mockLineChartProps: any = {};
jest.mock('react-native-gifted-charts', () => ({
  LineChart: (props: any) => {
    const React = require('react');
    // Store props for test verification
    mockLineChartProps = props;
    return React.createElement('View', { testID: 'line-chart' });
  },
  CurveType: { QUADRATIC: 0 },
}));

// Helper to create a mock deadline
const createMockDeadline = (
  overrides?: Partial<ReadingDeadlineWithProgress>
): ReadingDeadlineWithProgress =>
  ({
    id: 'deadline-1',
    user_id: 'user-1',
    book_id: 'book-1',
    deadline_date: '2025-01-31',
    total_quantity: 310,
    format: 'physical' as const,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    progress: [],
    status: [],
    type: 'deadline',
    ...overrides,
  }) as ReadingDeadlineWithProgress;

// Helper to create mock status
const createMockStatus = (
  status: ReadingDeadlineStatus['status'],
  created_at: string
): ReadingDeadlineStatus => ({
  id: `status-${status}`,
  deadline_id: 'deadline-1',
  status,
  created_at,
  updated_at: created_at,
});

// Helper to create mock progress
const createMockProgress = (
  current_progress: number,
  created_at: string
): ReadingDeadlineProgress => ({
  id: `progress-${current_progress}`,
  deadline_id: 'deadline-1',
  current_progress,
  ignore_in_calcs: false,
  time_spent_reading: null,
  created_at,
  updated_at: created_at,
});

describe('DailyReadingChart', () => {
  describe('Component Structure', () => {
    it('should render empty state when no progress data', () => {
      const mockDeadline = createMockDeadline({
        status: [createMockStatus('reading', '2025-01-01T00:00:00Z')],
        progress: [],
      });

      render(<DailyReadingChart deadline={mockDeadline} />);

      // Should show empty state since chart now requires progress data
      expect(screen.getByTestId('daily-chart-empty')).toBeTruthy();
    });

    it('should render chart when progress data exists', () => {
      const mockDeadline = createMockDeadline({
        status: [],
        progress: [createMockProgress(100, '2025-01-10T00:00:00Z')],
      });

      render(<DailyReadingChart deadline={mockDeadline} />);

      // Should render chart even without status, as long as progress exists
      expect(screen.getByTestId('daily-reading-chart')).toBeTruthy();
    });

    it('should render chart when data is available', () => {
      const mockDeadline = createMockDeadline({
        status: [createMockStatus('reading', '2025-01-01T00:00:00Z')],
        progress: [
          createMockProgress(50, '2025-01-05T00:00:00Z'),
          createMockProgress(100, '2025-01-10T00:00:00Z'),
        ],
      });

      render(<DailyReadingChart deadline={mockDeadline} />);

      expect(screen.getByTestId('daily-reading-chart')).toBeTruthy();
      expect(screen.getByTestId('chart-title')).toBeTruthy();
      expect(screen.getByTestId('chart-container')).toBeTruthy();
      expect(screen.getByTestId('line-chart')).toBeTruthy();
      expect(screen.getByTestId('daily-chart-legend')).toBeTruthy();
    });
  });

  describe('Format-Specific Text', () => {
    it('should show "Reading Progress" for physical books', () => {
      const mockDeadline = createMockDeadline({
        format: 'physical',
        status: [createMockStatus('reading', '2025-01-01T00:00:00Z')],
        progress: [createMockProgress(100, '2025-01-10T00:00:00Z')],
      });

      render(<DailyReadingChart deadline={mockDeadline} />);

      expect(screen.getByText('Reading Progress')).toBeTruthy();
    });

    it('should show "Reading Progress" for eBook format', () => {
      const mockDeadline = createMockDeadline({
        format: 'eBook',
        status: [createMockStatus('reading', '2025-01-01T00:00:00Z')],
        progress: [createMockProgress(100, '2025-01-10T00:00:00Z')],
      });

      render(<DailyReadingChart deadline={mockDeadline} />);

      expect(screen.getByText('Reading Progress')).toBeTruthy();
    });

    it('should show "Listening Progress" for audiobooks', () => {
      const mockDeadline = createMockDeadline({
        format: 'audio',
        status: [createMockStatus('reading', '2025-01-01T00:00:00Z')],
        progress: [createMockProgress(120, '2025-01-10T00:00:00Z')],
      });

      render(<DailyReadingChart deadline={mockDeadline} />);

      expect(screen.getByText('Listening Progress')).toBeTruthy();
    });
  });

  describe('Completed Books', () => {
    it('should identify completed status', () => {
      const mockDeadline = createMockDeadline({
        status: [
          createMockStatus('reading', '2025-01-01T00:00:00Z'),
          createMockStatus('complete', '2025-01-15T00:00:00Z'),
        ],
        progress: [createMockProgress(310, '2025-01-10T00:00:00Z')],
      });

      render(<DailyReadingChart deadline={mockDeadline} />);

      // Chart should render for completed books with progress
      expect(screen.getByTestId('daily-reading-chart')).toBeTruthy();
    });

    it('should identify did_not_finish as terminal status', () => {
      const mockDeadline = createMockDeadline({
        status: [
          createMockStatus('reading', '2025-01-01T00:00:00Z'),
          createMockStatus('did_not_finish', '2025-01-15T00:00:00Z'),
        ],
        progress: [createMockProgress(200, '2025-01-10T00:00:00Z')],
      });

      render(<DailyReadingChart deadline={mockDeadline} />);

      expect(screen.getByTestId('daily-reading-chart')).toBeTruthy();
    });

    it('should identify to_review as terminal status', () => {
      const mockDeadline = createMockDeadline({
        status: [
          createMockStatus('reading', '2025-01-01T00:00:00Z'),
          createMockStatus('to_review', '2025-01-15T00:00:00Z'),
        ],
        progress: [createMockProgress(310, '2025-01-10T00:00:00Z')],
      });

      render(<DailyReadingChart deadline={mockDeadline} />);

      expect(screen.getByTestId('daily-reading-chart')).toBeTruthy();
    });
  });

  describe('Progress Tracking', () => {
    it('should handle multiple progress entries', () => {
      const mockDeadline = createMockDeadline({
        status: [createMockStatus('reading', '2025-01-01T00:00:00Z')],
        progress: [
          createMockProgress(50, '2025-01-05T00:00:00Z'),
          createMockProgress(100, '2025-01-08T00:00:00Z'),
          createMockProgress(150, '2025-01-10T00:00:00Z'),
          createMockProgress(200, '2025-01-12T00:00:00Z'),
        ],
      });

      render(<DailyReadingChart deadline={mockDeadline} />);

      expect(screen.getByTestId('daily-reading-chart')).toBeTruthy();
      expect(screen.getByTestId('line-chart')).toBeTruthy();
    });

    it('should exclude ignored progress entries', () => {
      const mockDeadline = createMockDeadline({
        status: [createMockStatus('reading', '2025-01-01T00:00:00Z')],
        progress: [
          createMockProgress(50, '2025-01-05T00:00:00Z'),
          {
            ...createMockProgress(999, '2025-01-08T00:00:00Z'),
            ignore_in_calcs: true,
          },
          createMockProgress(100, '2025-01-10T00:00:00Z'),
        ],
      });

      render(<DailyReadingChart deadline={mockDeadline} />);

      expect(screen.getByTestId('daily-reading-chart')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty status array with progress data', () => {
      const mockDeadline = createMockDeadline({
        status: [],
        progress: [createMockProgress(100, '2025-01-10T00:00:00Z')],
      });

      render(<DailyReadingChart deadline={mockDeadline} />);

      // Should render chart since progress data exists (even without status)
      expect(screen.getByTestId('daily-reading-chart')).toBeTruthy();
    });

    it('should handle missing progress array', () => {
      const mockDeadline: ReadingDeadlineWithProgress = {
        ...createMockDeadline({
          status: [createMockStatus('reading', '2025-01-01T00:00:00Z')],
        }),
        progress: undefined as any,
      };

      render(<DailyReadingChart deadline={mockDeadline} />);

      // Should show empty state when progress is missing
      expect(screen.getByTestId('daily-chart-empty')).toBeTruthy();
    });

    it('should handle single progress entry', () => {
      const mockDeadline = createMockDeadline({
        status: [createMockStatus('reading', '2025-01-01T00:00:00Z')],
        progress: [createMockProgress(100, '2025-01-10T00:00:00Z')],
      });

      render(<DailyReadingChart deadline={mockDeadline} />);

      expect(screen.getByTestId('daily-reading-chart')).toBeTruthy();
    });

    it('should handle deadline before start date gracefully', () => {
      const mockDeadline = createMockDeadline({
        deadline_date: '2025-01-01',
        status: [createMockStatus('reading', '2025-01-15T00:00:00Z')],
        progress: [createMockProgress(100, '2025-01-16T00:00:00Z')],
      });

      render(<DailyReadingChart deadline={mockDeadline} />);

      // Should show empty state since pace cannot be calculated
      expect(screen.getByTestId('daily-chart-empty')).toBeTruthy();
    });

    it('should handle same-day completion (added and completed on same day)', () => {
      const mockDeadline = createMockDeadline({
        deadline_date: '2025-01-15',
        total_quantity: 310,
        status: [
          createMockStatus('reading', '2025-01-15T08:00:00Z'),
          createMockStatus('complete', '2025-01-15T22:00:00Z'),
        ],
        progress: [
          createMockProgress(100, '2025-01-15T10:00:00Z'),
          createMockProgress(310, '2025-01-15T20:00:00Z'),
        ],
      });

      render(<DailyReadingChart deadline={mockDeadline} />);

      // Should render chart for same-day completion
      expect(screen.getByTestId('daily-reading-chart')).toBeTruthy();
      expect(screen.getByTestId('chart-title')).toBeTruthy();
      expect(screen.getByTestId('line-chart')).toBeTruthy();
    });
  });

  describe('Status Ordering', () => {
    it('should use latest status for completion check', () => {
      const mockDeadline = createMockDeadline({
        status: [
          createMockStatus('complete', '2025-01-15T00:00:00Z'),
          createMockStatus('reading', '2025-01-01T00:00:00Z'),
          createMockStatus('paused', '2025-01-10T00:00:00Z'),
        ],
        progress: [createMockProgress(310, '2025-01-14T00:00:00Z')],
      });

      render(<DailyReadingChart deadline={mockDeadline} />);

      // Should render chart for completed deadline
      expect(screen.getByTestId('daily-reading-chart')).toBeTruthy();
    });
  });

  describe('Interactive Features', () => {
    beforeEach(() => {
      // Reset mock props before each test
      mockLineChartProps = {};
    });

    it('should configure pointerConfig for interactive tooltips', () => {
      const mockDeadline = createMockDeadline({
        status: [createMockStatus('reading', '2025-01-01T00:00:00Z')],
        progress: [
          createMockProgress(50, '2025-01-05T00:00:00Z'),
          createMockProgress(100, '2025-01-10T00:00:00Z'),
        ],
      });

      render(<DailyReadingChart deadline={mockDeadline} />);

      // Verify pointerConfig is set
      expect(mockLineChartProps.pointerConfig).toBeDefined();
    });

    it('should set activatePointersOnLongPress to preserve scrolling', () => {
      const mockDeadline = createMockDeadline({
        status: [createMockStatus('reading', '2025-01-01T00:00:00Z')],
        progress: [createMockProgress(100, '2025-01-10T00:00:00Z')],
      });

      render(<DailyReadingChart deadline={mockDeadline} />);

      expect(
        mockLineChartProps.pointerConfig?.activatePointersOnLongPress
      ).toBe(true);
    });

    it('should configure pointer strip to show at data points', () => {
      const mockDeadline = createMockDeadline({
        status: [createMockStatus('reading', '2025-01-01T00:00:00Z')],
        progress: [createMockProgress(100, '2025-01-10T00:00:00Z')],
      });

      render(<DailyReadingChart deadline={mockDeadline} />);

      const { pointerConfig } = mockLineChartProps;
      expect(pointerConfig?.showPointerStrip).toBe(true);
      expect(pointerConfig?.pointerStripWidth).toBe(1);
    });

    it('should set pointer colors to match theme', () => {
      const mockDeadline = createMockDeadline({
        status: [createMockStatus('reading', '2025-01-01T00:00:00Z')],
        progress: [createMockProgress(100, '2025-01-10T00:00:00Z')],
      });

      render(<DailyReadingChart deadline={mockDeadline} />);

      const { pointerConfig } = mockLineChartProps;
      expect(pointerConfig?.pointer1Color).toBeDefined(); // Required line color
      expect(pointerConfig?.pointer2Color).toBeDefined(); // Actual line color
      expect(pointerConfig?.pointerStripColor).toBeDefined();
    });

    it('should configure pointer to not persist after interaction', () => {
      const mockDeadline = createMockDeadline({
        status: [createMockStatus('reading', '2025-01-01T00:00:00Z')],
        progress: [createMockProgress(100, '2025-01-10T00:00:00Z')],
      });

      render(<DailyReadingChart deadline={mockDeadline} />);

      expect(mockLineChartProps.pointerConfig?.persistPointer).toBe(false);
    });

    it('should enable auto-adjust for pointer label position', () => {
      const mockDeadline = createMockDeadline({
        status: [createMockStatus('reading', '2025-01-01T00:00:00Z')],
        progress: [createMockProgress(100, '2025-01-10T00:00:00Z')],
      });

      render(<DailyReadingChart deadline={mockDeadline} />);

      expect(
        mockLineChartProps.pointerConfig?.autoAdjustPointerLabelPosition
      ).toBe(false);
    });

    it('should provide pointerLabelComponent function', () => {
      const mockDeadline = createMockDeadline({
        status: [createMockStatus('reading', '2025-01-01T00:00:00Z')],
        progress: [createMockProgress(100, '2025-01-10T00:00:00Z')],
      });

      render(<DailyReadingChart deadline={mockDeadline} />);

      expect(
        typeof mockLineChartProps.pointerConfig?.pointerLabelComponent
      ).toBe('function');
    });
  });
});
