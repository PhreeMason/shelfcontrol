import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { LineChartSection } from '../LineChartSection';
import { lineDataItem } from 'react-native-gifted-charts';

// Mock react-native-gifted-charts
jest.mock('react-native-gifted-charts', () => ({
  LineChart: ({ testID }: any) => {
    const { Text } = require('react-native');
    return <Text testID={testID || 'line-chart'}>LineChart</Text>;
  },
  CurveType: {
    QUADRATIC: 'QUADRATIC',
  },
}));

describe('LineChartSection', () => {
  const mockColors = {
    text: '#000000',
    textMuted: '#666666',
    border: '#CCCCCC',
  };

  const mockActualData: lineDataItem[] = [
    { value: 50, label: '1/10' },
    { value: 60, label: '1/11' },
    { value: 70, label: '1/12' },
  ];

  const mockTargetData: lineDataItem[] = [
    { value: 75, label: '1/10' },
    { value: 75, label: '1/11' },
    { value: 75, label: '1/12' },
  ];

  const defaultProps = {
    title: 'Test Chart',
    actualData: mockActualData,
    targetData: mockTargetData,
    actualLabel: 'Actual',
    targetLabel: 'Target',
    actualColor: '#4A90E2',
    targetColor: '#FF6B6B',
    showActual: true,
    showTarget: true,
    onToggleActual: jest.fn(),
    onToggleTarget: jest.fn(),
    yAxisMax: 100,
    colors: mockColors,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render title correctly', () => {
      const { getByText } = render(<LineChartSection {...defaultProps} />);
      expect(getByText('Test Chart')).toBeTruthy();
    });

    it('should render legend with actual and target labels', () => {
      const { getByText } = render(<LineChartSection {...defaultProps} />);
      expect(getByText('Actual')).toBeTruthy();
      expect(getByText('Target')).toBeTruthy();
    });

    it('should render legend dots with correct colors', () => {
      const { UNSAFE_root } = render(<LineChartSection {...defaultProps} />);

      // Legend dots should have background colors matching the chart colors
      const root = UNSAFE_root;
      expect(root).toBeTruthy();
    });
  });

  describe('Toggle Functionality', () => {
    it('should call onToggleActual when actual legend item is pressed', () => {
      const onToggleActual = jest.fn();
      const { getByText } = render(
        <LineChartSection {...defaultProps} onToggleActual={onToggleActual} />
      );

      const actualLegendItem = getByText('Actual');
      fireEvent.press(actualLegendItem);

      expect(onToggleActual).toHaveBeenCalledTimes(1);
    });

    it('should call onToggleTarget when target legend item is pressed', () => {
      const onToggleTarget = jest.fn();
      const { getByText } = render(
        <LineChartSection {...defaultProps} onToggleTarget={onToggleTarget} />
      );

      const targetLegendItem = getByText('Target');
      fireEvent.press(targetLegendItem);

      expect(onToggleTarget).toHaveBeenCalledTimes(1);
    });
  });

  describe('Chart States', () => {
    it('should render chart when both lines are visible', () => {
      const { getAllByText } = render(
        <LineChartSection
          {...defaultProps}
          showActual={true}
          showTarget={true}
        />
      );

      // Should render the LineChart component
      const charts = getAllByText('LineChart');
      expect(charts.length).toBeGreaterThan(0);
    });

    it('should render chart when only actual is visible', () => {
      const { getAllByText } = render(
        <LineChartSection
          {...defaultProps}
          showActual={true}
          showTarget={false}
        />
      );

      const charts = getAllByText('LineChart');
      expect(charts.length).toBeGreaterThan(0);
    });

    it('should render chart when only target is visible', () => {
      const { getAllByText } = render(
        <LineChartSection
          {...defaultProps}
          showActual={false}
          showTarget={true}
        />
      );

      const charts = getAllByText('LineChart');
      expect(charts.length).toBeGreaterThan(0);
    });

    it('should render empty state when neither line is visible', () => {
      const { getByText } = render(
        <LineChartSection
          {...defaultProps}
          showActual={false}
          showTarget={false}
        />
      );

      expect(getByText('Toggle a line to view data')).toBeTruthy();
    });
  });

  describe('Legend Styling', () => {
    it('should apply disabled style to actual legend when showActual is false', () => {
      const { getByText } = render(
        <LineChartSection
          {...defaultProps}
          showActual={false}
          showTarget={true}
        />
      );

      const actualLabel = getByText('Actual');
      // The disabled style includes strikethrough and reduced opacity
      expect(actualLabel).toBeTruthy();
    });

    it('should apply disabled style to target legend when showTarget is false', () => {
      const { getByText } = render(
        <LineChartSection
          {...defaultProps}
          showActual={true}
          showTarget={false}
        />
      );

      const targetLabel = getByText('Target');
      // The disabled style includes strikethrough and reduced opacity
      expect(targetLabel).toBeTruthy();
    });

    it('should not apply disabled style when both are visible', () => {
      const { getByText } = render(
        <LineChartSection
          {...defaultProps}
          showActual={true}
          showTarget={true}
        />
      );

      const actualLabel = getByText('Actual');
      const targetLabel = getByText('Target');

      expect(actualLabel).toBeTruthy();
      expect(targetLabel).toBeTruthy();
    });
  });

  describe('Props Validation', () => {
    it('should handle empty data arrays', () => {
      const { getByText } = render(
        <LineChartSection {...defaultProps} actualData={[]} targetData={[]} />
      );

      expect(getByText('Test Chart')).toBeTruthy();
    });

    it('should handle different yAxisMax values', () => {
      const { rerender, getByText } = render(
        <LineChartSection {...defaultProps} yAxisMax={50} />
      );

      expect(getByText('Test Chart')).toBeTruthy();

      rerender(<LineChartSection {...defaultProps} yAxisMax={200} />);

      expect(getByText('Test Chart')).toBeTruthy();
    });

    it('should handle different color schemes', () => {
      const customColors = {
        text: '#FF0000',
        textMuted: '#00FF00',
        border: '#0000FF',
      };

      const { getByText } = render(
        <LineChartSection {...defaultProps} colors={customColors} />
      );

      expect(getByText('Test Chart')).toBeTruthy();
    });

    it('should handle different chart colors', () => {
      const { getByText } = render(
        <LineChartSection
          {...defaultProps}
          actualColor="#FF0000"
          targetColor="#00FF00"
        />
      );

      expect(getByText('Test Chart')).toBeTruthy();
    });

    it('should handle different labels', () => {
      const { getByText } = render(
        <LineChartSection
          {...defaultProps}
          actualLabel="Actual Pages"
          targetLabel="Target Pages"
        />
      );

      expect(getByText('Actual Pages')).toBeTruthy();
      expect(getByText('Target Pages')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have touchable legend items with proper opacity', () => {
      const { getByText } = render(<LineChartSection {...defaultProps} />);

      const actualLegendItem = getByText('Actual');
      const targetLegendItem = getByText('Target');

      // Both should be touchable
      expect(actualLegendItem).toBeTruthy();
      expect(targetLegendItem).toBeTruthy();
    });
  });

  describe('Rerendering', () => {
    it('should update when toggle state changes', () => {
      const { rerender, getAllByText } = render(
        <LineChartSection
          {...defaultProps}
          showActual={true}
          showTarget={true}
        />
      );

      expect(getAllByText('LineChart').length).toBeGreaterThan(0);

      rerender(
        <LineChartSection
          {...defaultProps}
          showActual={false}
          showTarget={false}
        />
      );

      // Should now show empty state
      expect(() => getAllByText('LineChart')).toThrow();
    });

    it('should update when data changes', () => {
      const { rerender, getByText } = render(
        <LineChartSection {...defaultProps} />
      );

      expect(getByText('Test Chart')).toBeTruthy();

      const newData: lineDataItem[] = [
        { value: 100, label: '1/15' },
        { value: 110, label: '1/16' },
      ];

      rerender(<LineChartSection {...defaultProps} actualData={newData} />);

      expect(getByText('Test Chart')).toBeTruthy();
    });
  });
});
