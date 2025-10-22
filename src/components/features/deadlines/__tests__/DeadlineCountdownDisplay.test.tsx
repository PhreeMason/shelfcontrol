import { render } from '@testing-library/react-native';
import React from 'react';
import { DeadlineCountdownDisplay } from '../DeadlineCountdownDisplay';

describe('DeadlineCountdownDisplay', () => {
  const defaultProps = {
    latestStatus: 'reading',
    daysLeft: 5,
    countdownColor: '#7251b5',
    borderColor: '#B8A9D9',
  };

  describe('Active reading status', () => {
    it('should display days left for active reading', () => {
      const { getByText } = render(
        <DeadlineCountdownDisplay {...defaultProps} />
      );

      expect(getByText('5')).toBeTruthy();
      expect(getByText('days')).toBeTruthy();
    });

    it('should display 1 day left correctly', () => {
      const { getByText } = render(
        <DeadlineCountdownDisplay {...defaultProps} daysLeft={1} />
      );

      expect(getByText('1')).toBeTruthy();
      expect(getByText('days')).toBeTruthy();
    });
  });

  describe('Complete status', () => {
    it('should display trophy emoji and done label', () => {
      const { getByText } = render(
        <DeadlineCountdownDisplay {...defaultProps} latestStatus="complete" />
      );

      expect(getByText('🏆')).toBeTruthy();
      expect(getByText('done')).toBeTruthy();
    });
  });

  describe('Did not finish status', () => {
    it('should display dnf label', () => {
      const { getByText } = render(
        <DeadlineCountdownDisplay
          {...defaultProps}
          latestStatus="did_not_finish"
        />
      );

      expect(getByText('dnf')).toBeTruthy();
    });
  });

  describe('To review status', () => {
    it('should display emoji and review label when no review data provided', () => {
      const { getByText } = render(
        <DeadlineCountdownDisplay {...defaultProps} latestStatus="to_review" />
      );

      expect(getByText('📝')).toBeTruthy();
      expect(getByText('review')).toBeTruthy();
    });

    it('should display review days left when reviewDaysLeft is provided', () => {
      const { getByText } = render(
        <DeadlineCountdownDisplay
          {...defaultProps}
          latestStatus="to_review"
          reviewDaysLeft={7}
        />
      );

      expect(getByText('7')).toBeTruthy();
      expect(getByText('days')).toBeTruthy();
    });

    it('should display negative days when review is overdue', () => {
      const { getByText } = render(
        <DeadlineCountdownDisplay
          {...defaultProps}
          latestStatus="to_review"
          reviewDaysLeft={-2}
        />
      );

      expect(getByText('-2')).toBeTruthy();
      expect(getByText('days')).toBeTruthy();
    });
  });
});
