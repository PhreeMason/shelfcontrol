import { dayjs } from '@/lib/dayjs';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  calculateCutoffTime,
  calculateRequiredPace,
  processBookProgress,
} from '@/utils/paceCalculations';

export interface ReadingDay {
  date: string;
  progressRead: number;
  format: 'physical' | 'eBook' | 'audio';
}

export interface ChartDataItem {
  value: number;
  label: string;
  frontColor: string;
  spacing: number;
  labelWidth: number;
  labelTextStyle: {
    color: string;
    fontSize: number;
    fontWeight: 'normal';
  };
  topLabelComponent: () => React.ReactElement;
}

export const getBookReadingDays = (
  deadline: ReadingDeadlineWithProgress
): ReadingDay[] => {
  const dailyProgress: { [date: string]: number } = {};
  if (!deadline.progress || !Array.isArray(deadline.progress)) return [];

  const cutoffTime = calculateCutoffTime([deadline]);
  if (cutoffTime === null) {
    return [];
  }

  processBookProgress(deadline, cutoffTime, dailyProgress, deadline.format);

  const result = Object.entries(dailyProgress)
    .map(([date, progressRead]) => ({
      date,
      progressRead: Number(progressRead.toFixed(2)),
      format: deadline.format as 'physical' | 'eBook' | 'audio',
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return result;
};

export const getUnitLabel = (format: string): string => {
  switch (format) {
    case 'audio':
      return 'min';
    default:
      return 'pg';
  }
};

export const getChartTitle = (format: string): string => {
  switch (format) {
    case 'audio':
      return 'Daily Listening Progress';
    default:
      return 'Daily Reading Progress';
  }
};

export const transformReadingDaysToChartData = (
  readingDays: ReadingDay[],
  colors: { primary: string; text: string },
  topLabelComponentFactory: (value: number) => React.ReactElement
): ChartDataItem[] => {
  return readingDays.map(day => {
    const label = dayjs(day.date).format('M/DD');
    return {
      value: Math.round(day.progressRead),
      label: label,
      frontColor: colors.primary,
      spacing: 2,
      labelWidth: 40,
      labelTextStyle: {
        color: colors.text,
        fontSize: 9,
        fontWeight: 'normal' as const,
      },
      topLabelComponent: () => topLabelComponentFactory(Math.round(day.progressRead)),
    };
  });
};

export const calculateChartMaxValue = (
  chartData: ChartDataItem[],
  dailyMinimum: number
): number => {
  if (chartData.length === 0) return 10;

  const maxBarValue = Math.max(...chartData.map(d => d.value));
  const maxValue = Math.max(maxBarValue, dailyMinimum);
  return Math.ceil(maxValue * 1.2);
};

export const calculateDynamicBarWidth = (dataLength: number): number => {
  if (dataLength === 0) return 30;

  const calculatedWidth = Math.max(20, Math.min(30, 320 / dataLength));
  return Math.round(calculatedWidth);
};

export const getCurrentProgressFromDeadline = (
  deadline: ReadingDeadlineWithProgress
): number => {
  return deadline.progress?.length > 0
    ? deadline.progress[deadline.progress.length - 1].current_progress
    : 0;
};

export const calculateDaysLeft = (deadlineDate: string): number => {
  const deadline = new Date(deadlineDate);
  const today = new Date();
  return Math.max(
    1,
    Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );
};

export const calculateDailyMinimum = (
  deadline: ReadingDeadlineWithProgress
): number => {
  const currentProgress = getCurrentProgressFromDeadline(deadline);
  const daysLeft = calculateDaysLeft(deadline.deadline_date);

  return calculateRequiredPace(
    deadline.total_quantity,
    currentProgress,
    daysLeft,
    deadline.format
  );
};