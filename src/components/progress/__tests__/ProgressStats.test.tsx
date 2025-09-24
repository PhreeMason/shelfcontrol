import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ProgressStats from '../ProgressStats';

// Mock formatProgressDisplay
jest.mock('@/utils/deadlineUtils', () => ({
  formatProgressDisplay: jest.fn((format: string, value: number) => {
    if (format === 'audio') {
      const hours = Math.floor(value / 60);
      const minutes = value % 60;
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    return `${value} pages`;
  }),
}));

// Mock ThemedText
jest.mock('@/components/themed', () => ({
  ThemedText: ({ children, variant, style }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(
      Text,
      { testID: `themed-text-${variant || 'default'}`, style },
      typeof children === 'string' ? children : (Array.isArray(children) ? children.join('') : String(children))
    );
  },
}));

describe('ProgressStats', () => {
  const defaultProps = {
    currentProgress: 150,
    totalQuantity: 300,
    remaining: 150,
    format: 'physical' as const,
    urgencyLevel: 'good' as const,
    progressPercentage: 50,
  };

  describe('Physical/eBook format', () => {
    it('should display remaining pages', () => {
      render(<ProgressStats {...defaultProps} />);
      expect(screen.getByText('150 pages')).toBeTruthy();
      expect(screen.getByText('PAGES LEFT')).toBeTruthy();
    });

    it('should display progress percentage', () => {
      render(<ProgressStats {...defaultProps} />);
      expect(screen.getByText('50%')).toBeTruthy();
      expect(screen.getByText('COMPLETE')).toBeTruthy();
    });

    it('should handle zero remaining pages', () => {
      render(<ProgressStats {...defaultProps} remaining={0} />);
      expect(screen.getByText('0 pages')).toBeTruthy();
    });

    it('should handle 100% completion', () => {
      render(<ProgressStats {...defaultProps} progressPercentage={100} />);
      expect(screen.getByText('100%')).toBeTruthy();
    });

    it('should handle eBook format', () => {
      render(<ProgressStats {...defaultProps} format="eBook" />);
      expect(screen.getByText('150 pages')).toBeTruthy();
      expect(screen.getByText('PAGES LEFT')).toBeTruthy();
    });
  });

  describe('Audio format', () => {
    const audioProps = {
      ...defaultProps,
      format: 'audio' as const,
      remaining: 125,
    };

    it('should display remaining time', () => {
      render(<ProgressStats {...audioProps} />);
      expect(screen.getByText('2h 5m')).toBeTruthy();
      expect(screen.getByText('TIME LEFT')).toBeTruthy();
    });

    it('should handle minutes only', () => {
      render(<ProgressStats {...audioProps} remaining={45} />);
      expect(screen.getByText('45m')).toBeTruthy();
    });

    it('should handle zero remaining time', () => {
      render(<ProgressStats {...audioProps} remaining={0} />);
      expect(screen.getByText('0m')).toBeTruthy();
    });

    it('should handle exact hours', () => {
      render(<ProgressStats {...audioProps} remaining={120} />);
      expect(screen.getByText('2h 0m')).toBeTruthy();
    });
  });

  describe('Urgency level styling', () => {
    it('should apply success variant for good urgency', () => {
      render(<ProgressStats {...defaultProps} urgencyLevel="good" />);

      const successTexts = screen.getAllByTestId('themed-text-success');
      expect(successTexts).toHaveLength(2);
      expect(successTexts[0].children[0]).toBe('150 pages');
      expect(successTexts[1].children[0]).toBe('50%');
    });

    it('should apply warning variant for approaching urgency', () => {
      render(<ProgressStats {...defaultProps} urgencyLevel="approaching" />);

      const texts = screen.getAllByTestId('themed-text-warning');
      expect(texts).toHaveLength(2);
    });

    it('should apply warning variant for urgent urgency', () => {
      render(<ProgressStats {...defaultProps} urgencyLevel="urgent" />);

      const texts = screen.getAllByTestId('themed-text-warning');
      expect(texts).toHaveLength(2);
    });

    it('should apply error variant for overdue urgency', () => {
      render(<ProgressStats {...defaultProps} urgencyLevel="overdue" />);

      const texts = screen.getAllByTestId('themed-text-error');
      expect(texts).toHaveLength(2);
    });

    it('should apply error variant for impossible urgency', () => {
      render(<ProgressStats {...defaultProps} urgencyLevel="impossible" />);

      const texts = screen.getAllByTestId('themed-text-error');
      expect(texts).toHaveLength(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle decimal progress percentage', () => {
      render(<ProgressStats {...defaultProps} progressPercentage={33.33} />);
      expect(screen.getByText('33.33%')).toBeTruthy();
    });

    it('should handle large remaining values', () => {
      render(<ProgressStats {...defaultProps} remaining={9999} />);
      expect(screen.getByText('9999 pages')).toBeTruthy();
    });

    it('should handle large audio minutes', () => {
      render(<ProgressStats {...defaultProps} format="audio" remaining={1440} />);
      expect(screen.getByText('24h 0m')).toBeTruthy();
    });

    it('should display correct labels consistently', () => {
      const { rerender } = render(<ProgressStats {...defaultProps} />);

      expect(screen.getByText('PAGES LEFT')).toBeTruthy();
      expect(screen.getByText('COMPLETE')).toBeTruthy();

      rerender(<ProgressStats {...defaultProps} format="audio" />);

      expect(screen.getByText('TIME LEFT')).toBeTruthy();
      expect(screen.getByText('COMPLETE')).toBeTruthy();
    });
  });

  describe('Component structure', () => {
    it('should render two stat items', () => {
      render(<ProgressStats {...defaultProps} />);

      const mutedTexts = screen.getAllByTestId('themed-text-muted');
      expect(mutedTexts).toHaveLength(2);
      expect(mutedTexts[0].children[0]).toBe('PAGES LEFT');
      expect(mutedTexts[1].children[0]).toBe('COMPLETE');
    });

    it('should apply correct styles to stat numbers', () => {
      render(<ProgressStats {...defaultProps} />);

      const successTexts = screen.getAllByTestId('themed-text-success');
      successTexts.forEach(text => {
        expect(text.props.style).toEqual(
          expect.objectContaining({
            fontSize: 24,
            fontWeight: 'bold',
            lineHeight: 33,
            marginBottom: 4,
          })
        );
      });
    });

    it('should apply correct styles to stat labels', () => {
      render(<ProgressStats {...defaultProps} />);

      const mutedTexts = screen.getAllByTestId('themed-text-muted');
      mutedTexts.forEach(text => {
        expect(text.props.style).toEqual(
          expect.objectContaining({
            letterSpacing: 1,
            fontSize: 12,
          })
        );
      });
    });
  });
});