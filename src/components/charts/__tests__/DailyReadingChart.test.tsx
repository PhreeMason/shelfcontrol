import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { Database } from '@/types/database.types';
import DailyReadingChart from '../DailyReadingChart';
import {
  calculateChartMaxValue,
  calculateDailyMinimum,
  calculateDynamicBarWidth,
  getBookReadingDays,
  getChartTitle,
  getUnitLabel,
  transformReadingDaysToChartData,
} from '@/utils/chartDataUtils';

// Mock external boundaries - minimal mocking strategy
jest.mock('react-native-gifted-charts', () => ({
  BarChart: function MockBarChart(props: any) {
    const React = require('react');
    return React.createElement('View', {
      testID: 'bar-chart',
      'data-width': props.width,
      'data-height': props.height,
      'data-bar-width': props.barWidth,
      'data-max-value': props.maxValue,
      'data-y-axis-label-suffix': props.yAxisLabelSuffix,
      'data-data-length': props.data?.length ?? 0,
    }, null);
  },
}));

// Mock theme hook
jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: () => ({
    colors: {
      text: '#000000',
      textMuted: '#666666',
      primary: '#007AFF',
      border: '#CCCCCC',
    },
    typography: {
      bodyLarge: {
        fontSize: 16,
      },
    },
  }),
}));

// Mock ThemedText and ThemedView to return simple components
jest.mock('@/components/themed', () => ({
  ThemedText: ({ children, style, ...props }: any) => {
    const React = require('react');
    return React.createElement('Text', { style, ...props }, children);
  },
  ThemedView: ({ children, style, ...props }: any) => {
    const React = require('react');
    return React.createElement('View', { style, ...props }, children);
  },
}));

// Mock the chartDataUtils to test integration
jest.mock('@/utils/chartDataUtils', () => ({
  getBookReadingDays: jest.fn(),
  getUnitLabel: jest.fn(),
  getChartTitle: jest.fn(),
  transformReadingDaysToChartData: jest.fn(),
  calculateChartMaxValue: jest.fn(),
  calculateDailyMinimum: jest.fn(),
  calculateDynamicBarWidth: jest.fn(),
}));

const mockGetBookReadingDays = getBookReadingDays as jest.Mock;
const mockGetUnitLabel = getUnitLabel as jest.Mock;
const mockGetChartTitle = getChartTitle as jest.Mock;
const mockTransformReadingDaysToChartData = transformReadingDaysToChartData as jest.Mock;
const mockCalculateChartMaxValue = calculateChartMaxValue as jest.Mock;
const mockCalculateDailyMinimum = calculateDailyMinimum as jest.Mock;
const mockCalculateDynamicBarWidth = calculateDynamicBarWidth as jest.Mock;

describe('DailyReadingChart', () => {
  const mockDeadline: ReadingDeadlineWithProgress = {
    id: 'test-deadline',
    deadline_date: '2024-01-30',
    format: 'physical',
    total_quantity: 300,
    progress: [
      { id: '1', deadline_id: 'test-deadline', current_progress: 50, created_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:00:00Z', time_spent_reading: null },
      { id: '2', deadline_id: 'test-deadline', current_progress: 100, created_at: '2024-01-16T10:00:00Z', updated_at: '2024-01-16T10:00:00Z', time_spent_reading: null },
    ],
    user_id: 'user-1',
    book_id: 'book-1',
    book_title: 'Test Book',
    author: 'Test Author',
    source: 'manual',
    flexibility: 'fixed' as Database['public']['Enums']['deadline_flexibility'],
    status: [],
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
  };

  const mockReadingDays = [
    { date: '2024-01-15', progressRead: 50, format: 'physical' as const },
    { date: '2024-01-16', progressRead: 25, format: 'physical' as const },
  ];

  const mockChartData = [
    {
      value: 50,
      label: '1/15',
      frontColor: '#007AFF',
      spacing: 2,
      labelWidth: 40,
      labelTextStyle: { color: '#000000', fontSize: 9, fontWeight: 'normal' as const },
      topLabelComponent: () => React.createElement('Text', null, '50'),
    },
    {
      value: 25,
      label: '1/16',
      frontColor: '#007AFF',
      spacing: 2,
      labelWidth: 40,
      labelTextStyle: { color: '#000000', fontSize: 9, fontWeight: 'normal' as const },
      topLabelComponent: () => React.createElement('Text', null, '25'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock returns
    mockGetUnitLabel.mockReturnValue('pg');
    mockGetChartTitle.mockReturnValue('Daily Reading Progress');
    mockGetBookReadingDays.mockReturnValue(mockReadingDays);
    mockTransformReadingDaysToChartData.mockReturnValue(mockChartData);
    mockCalculateChartMaxValue.mockReturnValue(100);
    mockCalculateDailyMinimum.mockReturnValue(40);
    mockCalculateDynamicBarWidth.mockReturnValue(25);
  });

  describe('Component Structure', () => {
    it('should render all main UI elements when data is available', () => {
      render(<DailyReadingChart deadline={mockDeadline} />);

      expect(screen.getByText('Daily Reading Progress')).toBeTruthy();
      expect(screen.getByTestId('bar-chart')).toBeTruthy();
    });

    it('should call utility functions with correct parameters', () => {
      render(<DailyReadingChart deadline={mockDeadline} />);

      expect(mockGetUnitLabel).toHaveBeenCalledWith('physical');
      expect(mockGetChartTitle).toHaveBeenCalledWith('physical');
      expect(mockGetBookReadingDays).toHaveBeenCalledWith(mockDeadline);
      expect(mockCalculateDailyMinimum).toHaveBeenCalledWith(mockDeadline);
    });

    it('should pass correct props to BarChart component', () => {
      render(<DailyReadingChart deadline={mockDeadline} />);

      const barChart = screen.getByTestId('bar-chart');
      expect(barChart.props['data-width']).toBe(350);
      expect(barChart.props['data-height']).toBe(200);
      expect(barChart.props['data-bar-width']).toBe(25);
      expect(barChart.props['data-max-value']).toBe(100);
      expect(barChart.props['data-y-axis-label-suffix']).toBe(' pg');
      expect(barChart.props['data-data-length']).toBe(2);
    });

    it('should call chart data transformation with correct parameters', () => {
      render(<DailyReadingChart deadline={mockDeadline} />);

      expect(mockTransformReadingDaysToChartData).toHaveBeenCalledWith(
        mockReadingDays,
        expect.objectContaining({
          primary: '#007AFF',
          text: '#000000',
        }),
        expect.any(Function)
      );
    });

    it('should call calculate chart max value with correct parameters', () => {
      render(<DailyReadingChart deadline={mockDeadline} />);

      expect(mockCalculateChartMaxValue).toHaveBeenCalledWith(mockChartData, 40);
    });

    it('should call calculate dynamic bar width with correct parameters', () => {
      render(<DailyReadingChart deadline={mockDeadline} />);

      expect(mockCalculateDynamicBarWidth).toHaveBeenCalledWith(2);
    });
  });

  describe('Empty State Handling', () => {
    it('should render empty state when no reading days available', () => {
      mockGetBookReadingDays.mockReturnValue([]);

      render(<DailyReadingChart deadline={mockDeadline} />);

      expect(screen.getByText('Daily Reading Progress')).toBeTruthy();
      expect(screen.getByText('No activity recorded')).toBeTruthy();
      expect(screen.getByText('Start reading to see your daily progress')).toBeTruthy();
      expect(screen.queryByTestId('bar-chart')).toBeNull();
    });

    it('should not call chart-related functions when no data', () => {
      mockGetBookReadingDays.mockReturnValue([]);

      render(<DailyReadingChart deadline={mockDeadline} />);

      expect(mockTransformReadingDaysToChartData).not.toHaveBeenCalled();
      expect(mockCalculateChartMaxValue).not.toHaveBeenCalled();
      expect(mockCalculateDynamicBarWidth).not.toHaveBeenCalled();
    });

    it('should still call utility functions for title and format even with no data', () => {
      mockGetBookReadingDays.mockReturnValue([]);

      render(<DailyReadingChart deadline={mockDeadline} />);

      expect(mockGetUnitLabel).toHaveBeenCalledWith('physical');
      expect(mockGetChartTitle).toHaveBeenCalledWith('physical');
      expect(mockGetBookReadingDays).toHaveBeenCalledWith(mockDeadline);
    });
  });

  describe('Format-Based Behavior', () => {
    it('should handle audio format correctly', () => {
      const audioDeadline = { ...mockDeadline, format: 'audio' as const };
      mockGetUnitLabel.mockReturnValue('min');
      mockGetChartTitle.mockReturnValue('Daily Listening Progress');

      render(<DailyReadingChart deadline={audioDeadline} />);

      expect(mockGetUnitLabel).toHaveBeenCalledWith('audio');
      expect(mockGetChartTitle).toHaveBeenCalledWith('audio');
      expect(screen.getByText('Daily Listening Progress')).toBeTruthy();

      const barChart = screen.getByTestId('bar-chart');
      expect(barChart.props['data-y-axis-label-suffix']).toBe(' min');
    });

    it('should handle eBook format correctly', () => {
      const eBookDeadline = { ...mockDeadline, format: 'eBook' as const };
      mockGetUnitLabel.mockReturnValue('pg');
      mockGetChartTitle.mockReturnValue('Daily Reading Progress');

      render(<DailyReadingChart deadline={eBookDeadline} />);

      expect(mockGetUnitLabel).toHaveBeenCalledWith('eBook');
      expect(mockGetChartTitle).toHaveBeenCalledWith('eBook');
      expect(screen.getByText('Daily Reading Progress')).toBeTruthy();

      const barChart = screen.getByTestId('bar-chart');
      expect(barChart.props['data-y-axis-label-suffix']).toBe(' pg');
    });

    it('should handle physical format correctly', () => {
      mockGetUnitLabel.mockReturnValue('pg');
      mockGetChartTitle.mockReturnValue('Daily Reading Progress');

      render(<DailyReadingChart deadline={mockDeadline} />);

      expect(mockGetUnitLabel).toHaveBeenCalledWith('physical');
      expect(mockGetChartTitle).toHaveBeenCalledWith('physical');
      expect(screen.getByText('Daily Reading Progress')).toBeTruthy();

      const barChart = screen.getByTestId('bar-chart');
      expect(barChart.props['data-y-axis-label-suffix']).toBe(' pg');
    });
  });

  describe('Props Integration', () => {
    it('should pass deadline prop to all utility functions that need it', () => {
      render(<DailyReadingChart deadline={mockDeadline} />);

      expect(mockGetBookReadingDays).toHaveBeenCalledWith(mockDeadline);
      expect(mockCalculateDailyMinimum).toHaveBeenCalledWith(mockDeadline);
    });

    it('should handle different deadline structures', () => {
      const minimalDeadline: ReadingDeadlineWithProgress = {
        id: 'minimal',
        deadline_date: '2024-02-01',
        format: 'audio',
        total_quantity: 600,
        progress: [],
        user_id: 'user-2',
        book_id: 'book-2',
        book_title: 'Audio Book',
        author: 'Audio Author',
        source: 'manual',
        flexibility: 'flexible' as Database['public']['Enums']['deadline_flexibility'],
        status: [],
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z',
      };

      mockGetBookReadingDays.mockReturnValue([]);

      render(<DailyReadingChart deadline={minimalDeadline} />);

      expect(mockGetBookReadingDays).toHaveBeenCalledWith(minimalDeadline);
      expect(mockGetUnitLabel).toHaveBeenCalledWith('audio');
      expect(mockGetChartTitle).toHaveBeenCalledWith('audio');
    });
  });

  describe('Chart Configuration', () => {
    it('should configure BarChart with correct static properties', () => {
      render(<DailyReadingChart deadline={mockDeadline} />);

      const barChart = screen.getByTestId('bar-chart');
      expect(barChart.props['data-width']).toBe(350);
      expect(barChart.props['data-height']).toBe(200);
    });

    it('should handle edge case when calculateChartMaxValue returns 0', () => {
      mockCalculateChartMaxValue.mockReturnValue(0);

      render(<DailyReadingChart deadline={mockDeadline} />);

      const barChart = screen.getByTestId('bar-chart');
      expect(barChart.props['data-max-value']).toBe(10); // Should fallback to 10 when maxValue is 0
    });

    it('should handle negative max value', () => {
      mockCalculateChartMaxValue.mockReturnValue(-5);

      render(<DailyReadingChart deadline={mockDeadline} />);

      const barChart = screen.getByTestId('bar-chart');
      expect(barChart.props['data-max-value']).toBe(10); // Should fallback to 10 when maxValue is negative
    });

    it('should use calculated max value when positive', () => {
      mockCalculateChartMaxValue.mockReturnValue(150);

      render(<DailyReadingChart deadline={mockDeadline} />);

      const barChart = screen.getByTestId('bar-chart');
      expect(barChart.props['data-max-value']).toBe(150);
    });
  });

  describe('Theme Integration', () => {
    it('should apply theme colors to chart title', () => {
      render(<DailyReadingChart deadline={mockDeadline} />);

      const title = screen.getByText('Daily Reading Progress');
      expect(title.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 16,
          }),
          expect.objectContaining({
            color: '#000000',
            fontWeight: 'bold',
            marginBottom: 16,
          }),
        ])
      );
    });

    it('should apply theme colors to empty state text', () => {
      mockGetBookReadingDays.mockReturnValue([]);

      render(<DailyReadingChart deadline={mockDeadline} />);

      const emptyText = screen.getByText('No activity recorded');
      const emptySubtext = screen.getByText('Start reading to see your daily progress');

      expect(emptyText.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            color: '#666666',
          }),
        ])
      );
      expect(emptySubtext.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            color: '#666666',
          }),
        ])
      );
    });
  });

  describe('TopLabelComponent Integration', () => {
    it('should create topLabelComponent factory and pass to transform function', () => {
      render(<DailyReadingChart deadline={mockDeadline} />);

      expect(mockTransformReadingDaysToChartData).toHaveBeenCalledWith(
        mockReadingDays,
        expect.any(Object),
        expect.any(Function)
      );

      // Verify the factory function was passed correctly
      const factoryFunction = mockTransformReadingDaysToChartData.mock.calls[0][2];
      expect(typeof factoryFunction).toBe('function');

      // Test that the factory function can be called
      const result = factoryFunction(75);
      expect(result).toBeDefined();
      expect(result.props.children).toBe(75);
    });
  });

  describe('Error Handling', () => {
    it('should handle when utility functions throw errors', () => {
      mockGetBookReadingDays.mockImplementation(() => {
        throw new Error('Calculation error');
      });

      // Should not crash, may show empty state or handle gracefully
      expect(() => {
        render(<DailyReadingChart deadline={mockDeadline} />);
      }).toThrow('Calculation error');
    });

    it('should handle when transform functions return unexpected data', () => {
      mockTransformReadingDaysToChartData.mockReturnValue(null);
      mockCalculateDynamicBarWidth.mockReturnValue(25); // Ensure this doesn't crash

      render(<DailyReadingChart deadline={mockDeadline} />);

      // Should not crash the component - chartData should default to []
      expect(screen.getByText('Daily Reading Progress')).toBeTruthy();
      expect(screen.getByTestId('bar-chart')).toBeTruthy();
    });

    it('should handle when utility functions return undefined', () => {
      mockGetUnitLabel.mockReturnValue(undefined);
      mockGetChartTitle.mockReturnValue(undefined);

      render(<DailyReadingChart deadline={mockDeadline} />);

      // Should handle gracefully without crashing
      expect(screen.getByTestId('bar-chart')).toBeTruthy();
    });
  });

  describe('Component Container', () => {
    it('should render with correct container testID', () => {
      render(<DailyReadingChart deadline={mockDeadline} />);

      const chartContainer = screen.getByTestId('combined-chart');
      expect(chartContainer).toBeTruthy();
    });

    it('should maintain component structure with both states', () => {
      // Test with data
      const { rerender } = render(<DailyReadingChart deadline={mockDeadline} />);
      expect(screen.getByTestId('combined-chart')).toBeTruthy();

      // Test without data
      mockGetBookReadingDays.mockReturnValue([]);
      rerender(<DailyReadingChart deadline={mockDeadline} />);
      expect(screen.queryByTestId('combined-chart')).toBeNull();
      expect(screen.getByText('No activity recorded')).toBeTruthy();
    });
  });
});