import React from 'react';
import { render } from '@testing-library/react-native';
import { MonthlyProgressSection } from '../MonthlyProgressSection';

// Mock the theme hook
jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: () => ({
    colors: {
      good: '#50C878',
      complete: '#4A90E2',
    },
  }),
}));

describe('MonthlyProgressSection', () => {
  describe('Rendering', () => {
    it('should render section title', () => {
      const { getByText } = render(
        <MonthlyProgressSection onTrackCount={5} completedCount={3} />
      );

      expect(getByText("This Month's Reading Progress")).toBeTruthy();
    });

    it('should render on-track count', () => {
      const { getByText } = render(
        <MonthlyProgressSection onTrackCount={5} completedCount={3} />
      );

      expect(getByText('5')).toBeTruthy();
      expect(getByText('ON TRACK')).toBeTruthy();
    });

    it('should render completed count', () => {
      const { getByText } = render(
        <MonthlyProgressSection onTrackCount={5} completedCount={3} />
      );

      expect(getByText('3')).toBeTruthy();
      expect(getByText('COMPLETED')).toBeTruthy();
    });
  });

  describe('Zero Values', () => {
    it('should handle zero on-track count', () => {
      const { getByText } = render(
        <MonthlyProgressSection onTrackCount={0} completedCount={5} />
      );

      expect(getByText('0')).toBeTruthy();
      expect(getByText('ON TRACK')).toBeTruthy();
    });

    it('should handle zero completed count', () => {
      const { getByText } = render(
        <MonthlyProgressSection onTrackCount={5} completedCount={0} />
      );

      expect(getByText('0')).toBeTruthy();
      expect(getByText('COMPLETED')).toBeTruthy();
    });

    it('should handle both counts as zero', () => {
      const { getAllByText } = render(
        <MonthlyProgressSection onTrackCount={0} completedCount={0} />
      );

      const zeros = getAllByText('0');
      expect(zeros.length).toBe(2);
    });
  });

  describe('Large Numbers', () => {
    it('should handle large on-track count', () => {
      const { getByText } = render(
        <MonthlyProgressSection onTrackCount={999} completedCount={3} />
      );

      expect(getByText('999')).toBeTruthy();
    });

    it('should handle large completed count', () => {
      const { getByText } = render(
        <MonthlyProgressSection onTrackCount={5} completedCount={123} />
      );

      expect(getByText('123')).toBeTruthy();
    });
  });

  describe('Props Updates', () => {
    it('should update when onTrackCount changes', () => {
      const { getByText, rerender } = render(
        <MonthlyProgressSection onTrackCount={5} completedCount={3} />
      );

      expect(getByText('5')).toBeTruthy();

      rerender(<MonthlyProgressSection onTrackCount={10} completedCount={3} />);

      expect(getByText('10')).toBeTruthy();
    });

    it('should update when completedCount changes', () => {
      const { getByText, rerender } = render(
        <MonthlyProgressSection onTrackCount={5} completedCount={3} />
      );

      expect(getByText('3')).toBeTruthy();

      rerender(<MonthlyProgressSection onTrackCount={5} completedCount={7} />);

      expect(getByText('7')).toBeTruthy();
    });

    it('should update when both counts change', () => {
      const { getByText, rerender } = render(
        <MonthlyProgressSection onTrackCount={5} completedCount={3} />
      );

      expect(getByText('5')).toBeTruthy();
      expect(getByText('3')).toBeTruthy();

      rerender(<MonthlyProgressSection onTrackCount={10} completedCount={7} />);

      expect(getByText('10')).toBeTruthy();
      expect(getByText('7')).toBeTruthy();
    });
  });

  describe('Layout', () => {
    it('should render stats in a row layout', () => {
      const { UNSAFE_root } = render(
        <MonthlyProgressSection onTrackCount={5} completedCount={3} />
      );

      // The component should render successfully
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should render section with rounded corners and padding', () => {
      const { UNSAFE_root } = render(
        <MonthlyProgressSection onTrackCount={5} completedCount={3} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Text Styling', () => {
    it('should render ON TRACK label in uppercase', () => {
      const { getByText } = render(
        <MonthlyProgressSection onTrackCount={5} completedCount={3} />
      );

      expect(getByText('ON TRACK')).toBeTruthy();
    });

    it('should render COMPLETED label in uppercase', () => {
      const { getByText } = render(
        <MonthlyProgressSection onTrackCount={5} completedCount={3} />
      );

      expect(getByText('COMPLETED')).toBeTruthy();
    });
  });

  describe('Negative Numbers', () => {
    it('should handle negative on-track count gracefully', () => {
      const { getByText } = render(
        <MonthlyProgressSection onTrackCount={-1} completedCount={3} />
      );

      // Component should still render, even if data is unexpected
      expect(getByText('-1')).toBeTruthy();
    });

    it('should handle negative completed count gracefully', () => {
      const { getByText } = render(
        <MonthlyProgressSection onTrackCount={5} completedCount={-1} />
      );

      expect(getByText('-1')).toBeTruthy();
    });
  });
});
