import {
  getDisplayValue,
  getRemainingText,
  getEncouragementMessage,
  getProgressBackgroundColor,
} from '../todaysProgressUtils';

// Mock the formatProgressDisplay function
jest.mock('../deadlineUtils', () => ({
  formatProgressDisplay: jest.fn((format: string, value: number) => {
    if (format === 'audio') {
      const hours = Math.floor(value / 60);
      const minutes = value % 60;
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    return `${value}`;
  }),
}));

describe('todaysProgressUtils', () => {
  describe('getDisplayValue', () => {
    describe('Reading format', () => {
      it('should return basic number format for reading', () => {
        const result = getDisplayValue(150, 300, false);
        expect(result).toBe('150/300');
      });

      it('should handle zero current progress', () => {
        const result = getDisplayValue(0, 250, false);
        expect(result).toBe('0/250');
      });

      it('should handle progress equal to total', () => {
        const result = getDisplayValue(100, 100, false);
        expect(result).toBe('100/100');
      });

      it('should handle progress exceeding total', () => {
        const result = getDisplayValue(150, 100, false);
        expect(result).toBe('150/100');
      });

      it('should handle large numbers', () => {
        const result = getDisplayValue(9999, 10000, false);
        expect(result).toBe('9999/10000');
      });
    });

    describe('Listening format', () => {
      it('should format minutes only for listening', () => {
        const result = getDisplayValue(45, 120, true);
        expect(result).toBe('45m/2h 0m');
      });

      it('should format hours and minutes for listening', () => {
        const result = getDisplayValue(125, 185, true);
        expect(result).toBe('2h 5m/3h 5m');
      });

      it('should handle zero current progress', () => {
        const result = getDisplayValue(0, 60, true);
        expect(result).toBe('0m/1h 0m');
      });

      it('should handle progress equal to total', () => {
        const result = getDisplayValue(90, 90, true);
        expect(result).toBe('1h 30m/1h 30m');
      });

      it('should handle progress exceeding total', () => {
        const result = getDisplayValue(150, 90, true);
        expect(result).toBe('2h 30m/1h 30m');
      });

      it('should handle large time values', () => {
        const result = getDisplayValue(1440, 2880, true);
        expect(result).toBe('24h 0m/48h 0m');
      });
    });
  });

  describe('getRemainingText', () => {
    describe('Reading format - positive remaining', () => {
      it('should return pages left for reading', () => {
        const result = getRemainingText(150, 300, false);
        expect(result).toBe('150 pages left');
      });

      it('should handle zero remaining', () => {
        const result = getRemainingText(100, 100, false);
        expect(result).toBe('0 pages left');
      });

      it('should handle 1 page remaining', () => {
        const result = getRemainingText(99, 100, false);
        expect(result).toBe('1 pages left');
      });
    });

    describe('Reading format - negative remaining (extra)', () => {
      it('should return pages extra for reading when over', () => {
        const result = getRemainingText(350, 300, false);
        expect(result).toBe('+50 pages extra');
      });

      it('should handle 1 page extra', () => {
        const result = getRemainingText(101, 100, false);
        expect(result).toBe('+1 pages extra');
      });

      it('should handle large extra amounts', () => {
        const result = getRemainingText(1500, 1000, false);
        expect(result).toBe('+500 pages extra');
      });
    });

    describe('Listening format - positive remaining', () => {
      it('should return time left for listening', () => {
        const result = getRemainingText(120, 180, true);
        expect(result).toBe('1h 0m left');
      });

      it('should return minutes only when under 1 hour', () => {
        const result = getRemainingText(30, 75, true);
        expect(result).toBe('45m left');
      });

      it('should handle zero remaining', () => {
        const result = getRemainingText(60, 60, true);
        expect(result).toBe('0m left');
      });

      it('should handle large time remaining', () => {
        const result = getRemainingText(60, 1500, true);
        expect(result).toBe('24h 0m left');
      });
    });

    describe('Listening format - negative remaining (extra)', () => {
      it('should return time extra for listening when over', () => {
        const result = getRemainingText(180, 120, true);
        expect(result).toBe('+1h 0m extra');
      });

      it('should return minutes only extra when under 1 hour', () => {
        const result = getRemainingText(105, 60, true);
        expect(result).toBe('+45m extra');
      });

      it('should handle large extra time', () => {
        const result = getRemainingText(1500, 60, true);
        expect(result).toBe('+24h 0m extra');
      });
    });
  });

  describe('getEncouragementMessage', () => {
    it('should return correct message for 0% progress', () => {
      const result = getEncouragementMessage(0);
      expect(result).toBe("Let's get started!");
    });

    it('should return correct message for 25% progress', () => {
      const result = getEncouragementMessage(25);
      expect(result).toBe('Keep it up!');
    });

    it('should return correct message for 50% progress', () => {
      const result = getEncouragementMessage(50);
      expect(result).toBe('Great pace!');
    });

    it('should return correct message for 75% progress', () => {
      const result = getEncouragementMessage(75);
      expect(result).toBe("You're doing great!");
    });

    it('should return correct message for 100% progress', () => {
      const result = getEncouragementMessage(100);
      expect(result).toBe('Amazing work!');
    });

    it('should return correct message for 250% progress', () => {
      const result = getEncouragementMessage(250);
      expect(result).toBe('Incredible!');
    });

    it('should return correct message for 500% progress', () => {
      const result = getEncouragementMessage(500);
      expect(result).toBe('Unstoppable!');
    });

    it('should return correct message for 1000% progress', () => {
      const result = getEncouragementMessage(1000);
      expect(result).toBe('Legendary!');
    });

    it('should return correct message for 2500% progress', () => {
      const result = getEncouragementMessage(2500);
      expect(result).toBe('Mythical!');
    });

    it('should return correct message for 5000% progress', () => {
      const result = getEncouragementMessage(5000);
      expect(result).toBe('Godlike!');
    });

    it('should return correct message for 10000% progress', () => {
      const result = getEncouragementMessage(10000);
      expect(result).toBe('Immortal!');
    });

    it('should handle boundary values', () => {
      expect(getEncouragementMessage(19.99)).toBe("Let's get started!");
      expect(getEncouragementMessage(20)).toBe('Keep it up!');
      expect(getEncouragementMessage(49.99)).toBe('Keep it up!');
      expect(getEncouragementMessage(50)).toBe('Great pace!');
    });

    it('should handle decimal percentages', () => {
      expect(getEncouragementMessage(74.5)).toBe('Great pace!');
      expect(getEncouragementMessage(75.1)).toBe("You're doing great!");
    });

    it('should handle extremely high percentages', () => {
      const result = getEncouragementMessage(50000);
      expect(result).toBe('Immortal!');
    });

    it('should handle negative percentages', () => {
      const result = getEncouragementMessage(-10);
      expect(result).toBe("Let's get started!");
    });
  });

  describe('getProgressBackgroundColor', () => {
    // Simplified logic: Just find the right background color for the percentage
    // Thresholds: [1000, 900, 800, 700, 600, 500, 400, 300, 200, 100, 0] (sorted desc)

    it('should return base color for 0% progress', () => {
      const result = getProgressBackgroundColor(0);
      expect(result).toBe('#E8C2B999');
    });

    it('should return appropriate color for 100% progress', () => {
      const result = getProgressBackgroundColor(100);
      expect(result).toBe('#dac3e899');
    });

    it('should return appropriate color for 200% progress', () => {
      const result = getProgressBackgroundColor(200);
      expect(result).toBe('#d2b7e599');
    });

    it('should return appropriate color for 500% progress', () => {
      const result = getProgressBackgroundColor(500);
      expect(result).toBe('#a06cd599');
    });

    it('should return appropriate color for 1000% progress', () => {
      const result = getProgressBackgroundColor(1000);
      expect(result).toBe('#4b2e8399');
    });

    it('should handle boundary values', () => {
      expect(getProgressBackgroundColor(99)).toBe('#E8C2B999');
      expect(getProgressBackgroundColor(100)).toBe('#dac3e899');
      expect(getProgressBackgroundColor(199)).toBe('#dac3e899');
      expect(getProgressBackgroundColor(200)).toBe('#d2b7e599');
    });

    it('should handle intermediate values', () => {
      expect(getProgressBackgroundColor(150)).toBe('#dac3e899');
      expect(getProgressBackgroundColor(250)).toBe('#d2b7e599');
      expect(getProgressBackgroundColor(750)).toBe('#815ac099');
    });

    it('should handle decimal percentages', () => {
      expect(getProgressBackgroundColor(99.5)).toBe('#E8C2B999');
      expect(getProgressBackgroundColor(100.1)).toBe('#dac3e899');
    });

    it('should handle extremely high percentages', () => {
      const result = getProgressBackgroundColor(50000);
      expect(result).toBe('#4b2e8399');
    });

    it('should handle negative percentages', () => {
      const result = getProgressBackgroundColor(-10);
      expect(result).toBe('#E8C2B999');
    });

    it('should always return valid hex colors with transparency', () => {
      const testPercentages = [0, 25, 50, 75, 100, 200, 500, 1000];

      testPercentages.forEach(percentage => {
        const result = getProgressBackgroundColor(percentage);
        // Check background color has transparency and is valid hex
        expect(result).toMatch(/^#[0-9a-fA-F]{6}99$/);
      });
    });
  });
});