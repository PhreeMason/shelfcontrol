import React from 'react';
import { render } from '@testing-library/react-native';
import { ReadingPaceSection } from '../ReadingPaceSection';

// Mock the theme hook
jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: () => ({
    colors: {
      primary: '#4A90E2',
      accent: '#FF6B6B',
      border: '#CCCCCC',
      surface: '#F5F5F5',
      textMuted: '#666666',
    },
  }),
  useThemedStyles: (stylesFn: any) =>
    stylesFn({
      colors: {
        border: '#CCCCCC',
        surface: '#F5F5F5',
        textMuted: '#666666',
      },
    }),
}));

describe('ReadingPaceSection', () => {
  const mockFormatPaceForFormat = jest.fn((pace: number, format: string) => {
    if (format === 'audio') {
      return `${pace}m/day`;
    }
    return `${pace} pages/day`;
  });

  const defaultReadingPaceData = {
    averagePace: 25,
    isReliable: true,
    readingDaysCount: 10,
  };

  const defaultListeningPaceData = {
    averagePace: 30,
    isReliable: true,
    listeningDaysCount: 8,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render section title', () => {
      const { getByText } = render(
        <ReadingPaceSection
          readingPaceData={defaultReadingPaceData}
          listeningPaceData={defaultListeningPaceData}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      expect(getByText('Reading & Listening Pace')).toBeTruthy();
    });

    it('should render reading pace label', () => {
      const { getByText } = render(
        <ReadingPaceSection
          readingPaceData={defaultReadingPaceData}
          listeningPaceData={defaultListeningPaceData}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      expect(getByText('Reading')).toBeTruthy();
    });

    it('should render listening pace label', () => {
      const { getByText } = render(
        <ReadingPaceSection
          readingPaceData={defaultReadingPaceData}
          listeningPaceData={defaultListeningPaceData}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      expect(getByText('Listening')).toBeTruthy();
    });
  });

  describe('Reading Pace Display', () => {
    it('should format and display reading pace correctly', () => {
      const { getByText } = render(
        <ReadingPaceSection
          readingPaceData={defaultReadingPaceData}
          listeningPaceData={defaultListeningPaceData}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      expect(mockFormatPaceForFormat).toHaveBeenCalledWith(25, 'physical');
      expect(getByText('25 pages/day')).toBeTruthy();
    });

    it('should display zero reading pace', () => {
      const zeroPaceData = { ...defaultReadingPaceData, averagePace: 0 };

      const { getByText } = render(
        <ReadingPaceSection
          readingPaceData={zeroPaceData}
          listeningPaceData={defaultListeningPaceData}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      expect(getByText('0 pages/day')).toBeTruthy();
    });

    it('should display reading days count when reliable', () => {
      const { getByText } = render(
        <ReadingPaceSection
          readingPaceData={defaultReadingPaceData}
          listeningPaceData={defaultListeningPaceData}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      expect(getByText('10 reading days')).toBeTruthy();
    });

    it('should not display reading days count when not reliable', () => {
      const unreliablePaceData = {
        ...defaultReadingPaceData,
        isReliable: false,
      };

      const { queryByText } = render(
        <ReadingPaceSection
          readingPaceData={unreliablePaceData}
          listeningPaceData={defaultListeningPaceData}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      expect(queryByText('10 reading days')).toBeNull();
    });
  });

  describe('Listening Pace Display', () => {
    it('should format and display listening pace correctly', () => {
      const { getByText } = render(
        <ReadingPaceSection
          readingPaceData={defaultReadingPaceData}
          listeningPaceData={defaultListeningPaceData}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      expect(mockFormatPaceForFormat).toHaveBeenCalledWith(30, 'audio');
      expect(getByText('30m/day')).toBeTruthy();
    });

    it('should display zero listening pace', () => {
      const zeroPaceData = { ...defaultListeningPaceData, averagePace: 0 };

      const { getByText } = render(
        <ReadingPaceSection
          readingPaceData={defaultReadingPaceData}
          listeningPaceData={zeroPaceData}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      expect(getByText('0m/day')).toBeTruthy();
    });

    it('should display listening days count when reliable', () => {
      const { getByText } = render(
        <ReadingPaceSection
          readingPaceData={defaultReadingPaceData}
          listeningPaceData={defaultListeningPaceData}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      expect(getByText('8 listening days')).toBeTruthy();
    });

    it('should not display listening days count when not reliable', () => {
      const unreliablePaceData = {
        ...defaultListeningPaceData,
        isReliable: false,
      };

      const { queryByText } = render(
        <ReadingPaceSection
          readingPaceData={defaultReadingPaceData}
          listeningPaceData={unreliablePaceData}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      expect(queryByText('8 listening days')).toBeNull();
    });
  });

  describe('Description Text', () => {
    it('should render description for reading pace', () => {
      const { getByText } = render(
        <ReadingPaceSection
          readingPaceData={defaultReadingPaceData}
          listeningPaceData={defaultListeningPaceData}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      expect(getByText('Based on recent reading activity')).toBeTruthy();
    });

    it('should render description for listening pace', () => {
      const { getByText } = render(
        <ReadingPaceSection
          readingPaceData={defaultReadingPaceData}
          listeningPaceData={defaultListeningPaceData}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      expect(getByText('Based on recent listening activity')).toBeTruthy();
    });
  });

  describe('Large Pace Values', () => {
    it('should handle large reading pace values', () => {
      const largePaceData = { ...defaultReadingPaceData, averagePace: 999 };

      render(
        <ReadingPaceSection
          readingPaceData={largePaceData}
          listeningPaceData={defaultListeningPaceData}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      expect(mockFormatPaceForFormat).toHaveBeenCalledWith(999, 'physical');
    });

    it('should handle large listening pace values', () => {
      const largePaceData = { ...defaultListeningPaceData, averagePace: 500 };

      render(
        <ReadingPaceSection
          readingPaceData={defaultReadingPaceData}
          listeningPaceData={largePaceData}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      expect(mockFormatPaceForFormat).toHaveBeenCalledWith(500, 'audio');
    });
  });

  describe('Decimal Pace Values', () => {
    it('should handle decimal reading pace values', () => {
      const decimalPaceData = {
        ...defaultReadingPaceData,
        averagePace: 25.5,
      };

      render(
        <ReadingPaceSection
          readingPaceData={decimalPaceData}
          listeningPaceData={defaultListeningPaceData}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      expect(mockFormatPaceForFormat).toHaveBeenCalledWith(25.5, 'physical');
    });

    it('should handle decimal listening pace values', () => {
      const decimalPaceData = {
        ...defaultListeningPaceData,
        averagePace: 30.7,
      };

      render(
        <ReadingPaceSection
          readingPaceData={defaultReadingPaceData}
          listeningPaceData={decimalPaceData}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      expect(mockFormatPaceForFormat).toHaveBeenCalledWith(30.7, 'audio');
    });
  });

  describe('Props Updates', () => {
    it('should update when reading pace changes', () => {
      const { rerender } = render(
        <ReadingPaceSection
          readingPaceData={defaultReadingPaceData}
          listeningPaceData={defaultListeningPaceData}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      const updatedPaceData = { ...defaultReadingPaceData, averagePace: 50 };

      rerender(
        <ReadingPaceSection
          readingPaceData={updatedPaceData}
          listeningPaceData={defaultListeningPaceData}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      expect(mockFormatPaceForFormat).toHaveBeenCalledWith(50, 'physical');
    });

    it('should update when listening pace changes', () => {
      const { rerender } = render(
        <ReadingPaceSection
          readingPaceData={defaultReadingPaceData}
          listeningPaceData={defaultListeningPaceData}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      const updatedPaceData = {
        ...defaultListeningPaceData,
        averagePace: 60,
      };

      rerender(
        <ReadingPaceSection
          readingPaceData={defaultReadingPaceData}
          listeningPaceData={updatedPaceData}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      expect(mockFormatPaceForFormat).toHaveBeenCalledWith(60, 'audio');
    });
  });

  describe('Reliability States', () => {
    it('should show days count only when reading pace is reliable', () => {
      const { rerender, getByText, queryByText } = render(
        <ReadingPaceSection
          readingPaceData={{ ...defaultReadingPaceData, isReliable: true }}
          listeningPaceData={defaultListeningPaceData}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      expect(getByText('10 reading days')).toBeTruthy();

      rerender(
        <ReadingPaceSection
          readingPaceData={{ ...defaultReadingPaceData, isReliable: false }}
          listeningPaceData={defaultListeningPaceData}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      expect(queryByText('10 reading days')).toBeNull();
    });

    it('should show days count only when listening pace is reliable', () => {
      const { rerender, getByText, queryByText } = render(
        <ReadingPaceSection
          readingPaceData={defaultReadingPaceData}
          listeningPaceData={{ ...defaultListeningPaceData, isReliable: true }}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      expect(getByText('8 listening days')).toBeTruthy();

      rerender(
        <ReadingPaceSection
          readingPaceData={defaultReadingPaceData}
          listeningPaceData={{ ...defaultListeningPaceData, isReliable: false }}
          formatPaceForFormat={mockFormatPaceForFormat}
        />
      );

      expect(queryByText('8 listening days')).toBeNull();
    });
  });
});
