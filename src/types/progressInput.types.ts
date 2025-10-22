import { BookFormat } from './deadline.types';

export type ProgressInputMode = 'direct' | 'percentage' | 'remaining';

export type ProgressInputModePreferences = Record<BookFormat, ProgressInputMode>;

export const DEFAULT_PROGRESS_INPUT_MODES: ProgressInputModePreferences = {
  physical: 'direct',
  eBook: 'direct',
  audio: 'direct',
};

export const getAvailableModesForFormat = (
  format: BookFormat
): ProgressInputMode[] => {
  if (format === 'audio') {
    return ['direct', 'percentage', 'remaining'];
  }
  return ['direct', 'percentage'];
};

export const getModeLabelForFormat = (
  mode: ProgressInputMode,
  format: BookFormat
): string => {
  const labels: Record<ProgressInputMode, string> = {
    direct: format === 'audio' ? 'Time' : 'Page',
    percentage: '%',
    remaining: 'Left',
  };
  return labels[mode];
};
