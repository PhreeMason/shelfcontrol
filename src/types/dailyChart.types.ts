/**
 * Types for daily reading/listening chart components
 */

import type { Dayjs } from 'dayjs';

/**
 * Represents progress data for a single day in the chart
 */
export interface DailyProgressPoint {
  /** Display date in 'M/DD' format (e.g., '1/15') */
  date: string;
  /** Full Dayjs object for calculations */
  fullDate: Dayjs;
  /** Required cumulative progress by this date (using hero card formula) */
  required: number;
  /** Actual cumulative progress from progress array */
  actual: number;
  /** Progress made on this specific day only */
  dailyActual: number;
  /** Whether user had any reading/listening activity this day */
  hasActivity: boolean;
}

/**
 * Transformed data ready for react-native-gifted-charts LineChart
 */
export interface DailyChartData {
  /** Actual progress line data points */
  actualLineData: LineDataPoint[];
  /** Required pace line data points */
  requiredLineData: LineDataPoint[];
  /** Maximum value for y-axis scaling */
  maxValue: number;
  /** Current ahead/behind status */
  status: ProgressStatus;
}

/**
 * Progress status calculation result
 */
export interface ProgressStatus {
  /** Units ahead (positive) or behind (negative) */
  difference: number;
  /** Whether user is ahead of required pace */
  isAhead: boolean;
  /** Formatted display text (e.g., "+10 min ahead" or "5 pages behind") */
  displayText: string;
  /** Color for status display (success green or warning orange) */
  color: string;
}

/**
 * Data point for LineChart from react-native-gifted-charts
 */
export interface LineDataPoint {
  /** Y-axis value */
  value: number;
  /** X-axis label */
  label: string;
  /** Optional text to display on the data point */
  dataPointText?: string;
  /** Custom color for this data point */
  dataPointColor?: string;
  /** Custom radius for this data point */
  dataPointRadius?: number;
}
