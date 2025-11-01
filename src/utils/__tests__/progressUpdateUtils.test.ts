import {
  calculateNewProgress,
  formatBackwardProgressWarning,
  formatCompletionMessage,
  formatProgressUpdateMessage,
  getErrorToastMessage,
  hasProgressChanged,
  isBookComplete,
  shouldShowBackwardProgressWarning,
} from '../progressUpdateUtils';

// Mock the formatProgressDisplay function
jest.mock('../deadlineUtils', () => ({
  formatProgressDisplay: jest.fn((format: string, progress: number) => {
    if (format === 'audio') {
      const hours = Math.floor(progress / 60);
      const minutes = progress % 60;
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    return `${progress} pages`;
  }),
}));

describe('progressUpdateUtils', () => {
  describe('calculateNewProgress', () => {
    const currentProgress = 100;
    const totalQuantity = 500;

    it('should handle number input correctly', () => {
      const result = calculateNewProgress(
        150,
        10,
        currentProgress,
        totalQuantity
      );
      expect(result).toBe(160);
    });

    it('should handle string input correctly', () => {
      const result = calculateNewProgress(
        '150',
        10,
        currentProgress,
        totalQuantity
      );
      expect(result).toBe(160);
    });

    it('should handle string with whitespace', () => {
      const result = calculateNewProgress(
        '  150  ',
        10,
        currentProgress,
        totalQuantity
      );
      expect(result).toBe(160);
    });

    it('should use currentProgress for undefined input', () => {
      const result = calculateNewProgress(
        undefined,
        10,
        currentProgress,
        totalQuantity
      );
      expect(result).toBe(110);
    });

    it('should use currentProgress for empty string', () => {
      const result = calculateNewProgress(
        '',
        10,
        currentProgress,
        totalQuantity
      );
      expect(result).toBe(110);
    });

    it('should use currentProgress for invalid string', () => {
      const result = calculateNewProgress(
        'abc',
        10,
        currentProgress,
        totalQuantity
      );
      expect(result).toBe(110);
    });

    it('should handle NaN input', () => {
      const result = calculateNewProgress(
        NaN,
        10,
        currentProgress,
        totalQuantity
      );
      expect(result).toBe(110);
    });

    it('should cap at totalQuantity', () => {
      const result = calculateNewProgress(
        490,
        20,
        currentProgress,
        totalQuantity
      );
      expect(result).toBe(500);
    });

    it('should floor at 0', () => {
      const result = calculateNewProgress(
        10,
        -20,
        currentProgress,
        totalQuantity
      );
      expect(result).toBe(0);
    });

    it('should handle negative increment', () => {
      const result = calculateNewProgress(
        150,
        -10,
        currentProgress,
        totalQuantity
      );
      expect(result).toBe(140);
    });

    it('should handle zero increment', () => {
      const result = calculateNewProgress(
        150,
        0,
        currentProgress,
        totalQuantity
      );
      expect(result).toBe(150);
    });

    it('should handle decimal strings', () => {
      const result = calculateNewProgress(
        '150.5',
        10,
        currentProgress,
        totalQuantity
      );
      expect(result).toBe(160.5);
    });

    it('should handle exact boundary values', () => {
      const result = calculateNewProgress(0, 0, currentProgress, totalQuantity);
      expect(result).toBe(0);

      const result2 = calculateNewProgress(
        totalQuantity,
        0,
        currentProgress,
        totalQuantity
      );
      expect(result2).toBe(totalQuantity);
    });

    it('should handle percentage mode correctly - increment by 1%', () => {
      const result = calculateNewProgress(
        100,
        1,
        currentProgress,
        totalQuantity,
        'percentage'
      );
      expect(result).toBe(105);
    });

    it('should handle percentage mode correctly - increment by 5%', () => {
      const result = calculateNewProgress(
        100,
        5,
        currentProgress,
        totalQuantity,
        'percentage'
      );
      expect(result).toBe(125);
    });

    it('should handle percentage mode correctly - increment by 10%', () => {
      const result = calculateNewProgress(
        100,
        10,
        currentProgress,
        totalQuantity,
        'percentage'
      );
      expect(result).toBe(150);
    });

    it('should handle percentage mode correctly - decrement by 1%', () => {
      const result = calculateNewProgress(
        100,
        -1,
        currentProgress,
        totalQuantity,
        'percentage'
      );
      expect(result).toBe(95);
    });

    it('should handle percentage mode with boundary - max at totalQuantity', () => {
      const result = calculateNewProgress(
        490,
        5,
        490,
        totalQuantity,
        'percentage'
      );
      expect(result).toBe(500);
    });

    it('should handle percentage mode with boundary - min at 0', () => {
      const result = calculateNewProgress(
        10,
        -5,
        10,
        totalQuantity,
        'percentage'
      );
      expect(result).toBe(0);
    });

    it('should use direct mode when inputMode is direct', () => {
      const result = calculateNewProgress(
        100,
        5,
        currentProgress,
        totalQuantity,
        'direct'
      );
      expect(result).toBe(105);
    });

    it('should use direct mode when inputMode is not provided', () => {
      const result = calculateNewProgress(
        100,
        5,
        currentProgress,
        totalQuantity
      );
      expect(result).toBe(105);
    });

    it('should handle odd page counts in percentage mode - 497 pages', () => {
      const result = calculateNewProgress(100, 1, 100, 497, 'percentage');
      expect(result).toBe(105);
    });

    it('should handle odd page counts in percentage mode - 501 pages', () => {
      const result = calculateNewProgress(100, 1, 100, 501, 'percentage');
      expect(result).toBe(105);
    });

    it('should handle odd page counts in percentage mode - 333 pages', () => {
      const result = calculateNewProgress(100, 1, 100, 333, 'percentage');
      expect(result).toBe(103);
    });

    it('should handle fractional percentages with rounding - 5% of 497', () => {
      const result = calculateNewProgress(100, 5, 100, 497, 'percentage');
      expect(result).toBe(125);
    });
  });

  describe('shouldShowBackwardProgressWarning', () => {
    it('should return true when new progress is less than current', () => {
      expect(shouldShowBackwardProgressWarning(50, 100)).toBe(true);
    });

    it('should return false when new progress is greater than current', () => {
      expect(shouldShowBackwardProgressWarning(150, 100)).toBe(false);
    });

    it('should return false when new progress equals current', () => {
      expect(shouldShowBackwardProgressWarning(100, 100)).toBe(false);
    });

    it('should handle zero values', () => {
      expect(shouldShowBackwardProgressWarning(0, 100)).toBe(true);
      expect(shouldShowBackwardProgressWarning(100, 0)).toBe(false);
    });

    it('should handle negative difference', () => {
      expect(shouldShowBackwardProgressWarning(1, 2)).toBe(true);
    });
  });

  describe('isBookComplete', () => {
    it('should return true when progress equals total', () => {
      expect(isBookComplete(300, 300)).toBe(true);
    });

    it('should return true when progress exceeds total', () => {
      expect(isBookComplete(350, 300)).toBe(true);
    });

    it('should return false when progress is less than total', () => {
      expect(isBookComplete(299, 300)).toBe(false);
    });

    it('should handle zero total', () => {
      expect(isBookComplete(0, 0)).toBe(true);
    });

    it('should handle small differences', () => {
      expect(isBookComplete(299.9, 300)).toBe(false);
      expect(isBookComplete(300.1, 300)).toBe(true);
    });
  });

  describe('formatProgressUpdateMessage', () => {
    it('should format physical book progress', () => {
      const result = formatProgressUpdateMessage('physical', 150);
      expect(result).toBe('Updated to 150 pages');
    });

    it('should format eBook progress', () => {
      const result = formatProgressUpdateMessage('eBook', 200);
      expect(result).toBe('Updated to 200 pages');
    });

    it('should format audio progress in minutes only', () => {
      const result = formatProgressUpdateMessage('audio', 45);
      expect(result).toBe('Updated to 45m');
    });

    it('should format audio progress in hours and minutes', () => {
      const result = formatProgressUpdateMessage('audio', 125);
      expect(result).toBe('Updated to 2h 5m');
    });

    it('should handle zero progress', () => {
      const result = formatProgressUpdateMessage('physical', 0);
      expect(result).toBe('Updated to 0 pages');
    });
  });

  describe('formatCompletionMessage', () => {
    it('should format completion message for physical book', () => {
      const result = formatCompletionMessage('physical', 300, 'Test Book');
      expect(result).toContain('Progress updated to 300 pages');
      expect(result).toContain('You\'ve reached the end of "Test Book"');
      expect(result).toContain('Would you like to mark this book as complete?');
    });

    it('should format completion message for audio book', () => {
      const result = formatCompletionMessage('audio', 480, 'Audio Book Title');
      expect(result).toContain('Progress updated to 8h 0m');
      expect(result).toContain('You\'ve reached the end of "Audio Book Title"');
    });

    it('should handle special characters in book title', () => {
      const result = formatCompletionMessage(
        'eBook',
        250,
        'Book with "quotes"'
      );
      expect(result).toContain('Book with "quotes"');
    });
  });

  describe('formatBackwardProgressWarning', () => {
    it('should format warning for physical book', () => {
      const result = formatBackwardProgressWarning('physical', 150, 100);
      expect(result.unit).toBe('page');
      expect(result.message).toContain('updating from 150 pages to 100 pages');
      expect(result.message).toContain(
        'delete all progress entries greater than the new page'
      );
    });

    it('should format warning for audio book', () => {
      const result = formatBackwardProgressWarning('audio', 120, 60);
      expect(result.unit).toBe('time');
      expect(result.message).toContain('updating from 2h 0m to 1h 0m');
      expect(result.message).toContain(
        'delete all progress entries greater than the new time'
      );
    });

    it('should format warning for eBook', () => {
      const result = formatBackwardProgressWarning('eBook', 200, 150);
      expect(result.unit).toBe('page');
      expect(result.message).toContain('updating from 200 pages to 150 pages');
    });

    it('should handle zero values', () => {
      const result = formatBackwardProgressWarning('physical', 100, 0);
      expect(result.message).toContain('updating from 100 pages to 0 pages');
    });
  });

  describe('hasProgressChanged', () => {
    it('should return true when progress has changed', () => {
      expect(hasProgressChanged(150, 100)).toBe(true);
    });

    it('should return false when progress is the same', () => {
      expect(hasProgressChanged(100, 100)).toBe(false);
    });

    it('should handle zero values', () => {
      expect(hasProgressChanged(0, 0)).toBe(false);
      expect(hasProgressChanged(0, 100)).toBe(true);
    });

    it('should handle decimal differences', () => {
      expect(hasProgressChanged(100.1, 100)).toBe(true);
      expect(hasProgressChanged(100.0, 100)).toBe(false);
    });
  });

  describe('getErrorToastMessage', () => {
    it('should format update error message', () => {
      const result = getErrorToastMessage('update');
      expect(result.title).toBe('Update Failed');
      expect(result.message).toBe('Please try again');
    });

    it('should format complete error message without error object', () => {
      const result = getErrorToastMessage('complete');
      expect(result.title).toBe('Failed to complete deadline');
      expect(result.message).toBe('Please try again');
    });

    it('should format complete error message with error object', () => {
      const error = new Error('Network error');
      const result = getErrorToastMessage('complete', error);
      expect(result.title).toBe('Failed to complete deadline');
      expect(result.message).toBe('Network error');
    });

    it('should format delete future progress error', () => {
      const result = getErrorToastMessage('deleteFuture');
      expect(result.title).toBe('Failed to Delete Future Progress');
      expect(result.message).toBe('Please try again');
    });

    it('should handle unknown action type', () => {
      const result = getErrorToastMessage('unknown' as any);
      expect(result.title).toBe('Operation Failed');
      expect(result.message).toBe('Please try again');
    });

    it('should handle null error object', () => {
      const result = getErrorToastMessage('complete', null);
      expect(result.title).toBe('Failed to complete deadline');
      expect(result.message).toBe('Please try again');
    });

    it('should handle error without message', () => {
      const error = new Error();
      const result = getErrorToastMessage('complete', error);
      expect(result.title).toBe('Failed to complete deadline');
      expect(result.message).toBe('Please try again');
    });
  });
});
