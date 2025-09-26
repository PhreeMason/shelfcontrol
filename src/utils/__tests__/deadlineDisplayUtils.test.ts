import { getBookCoverIcon, getGradientBackground, formatRemainingDisplay } from '../deadlineDisplayUtils';

describe('deadlineDisplayUtils', () => {
  describe('getBookCoverIcon', () => {
    const mockDeadline = {
      id: 1,
      book_title: 'Test Book',
      format: 'physical' as const,
    };

    it('should return consistent icon for same input', () => {
      const icon1 = getBookCoverIcon(mockDeadline, 5);
      const icon2 = getBookCoverIcon(mockDeadline, 5);
      expect(icon1).toBe(icon2);
    });

    it('should return different icons for different titles', () => {
      const deadline1 = { ...mockDeadline, book_title: 'Book A' };
      const deadline2 = { ...mockDeadline, book_title: 'Book B' };

      const icon1 = getBookCoverIcon(deadline1, 5);
      const icon2 = getBookCoverIcon(deadline2, 5);

      expect(icon1).not.toBe(icon2);
    });

    it('should return different icons for different IDs', () => {
      const deadline1 = { ...mockDeadline, id: 1 };
      const deadline2 = { ...mockDeadline, id: 2 };

      const icon1 = getBookCoverIcon(deadline1, 5);
      const icon2 = getBookCoverIcon(deadline2, 5);

      expect(icon1).not.toBe(icon2);
    });

    it('should return different icons for different days left', () => {
      const icon1 = getBookCoverIcon(mockDeadline, 1);
      const icon2 = getBookCoverIcon(mockDeadline, 10);

      expect(icon1).not.toBe(icon2);
    });

    it('should return different icons for different formats', () => {
      const physicalDeadline = { ...mockDeadline, format: 'physical' as const };
      const audioDeadline = { ...mockDeadline, format: 'audio' as const };
      const eBookDeadline = { ...mockDeadline, format: 'eBook' as const };

      const physicalIcon = getBookCoverIcon(physicalDeadline, 5);
      const audioIcon = getBookCoverIcon(audioDeadline, 5);
      const eBookIcon = getBookCoverIcon(eBookDeadline, 5);

      expect(physicalIcon).not.toBe(audioIcon);
      expect(audioIcon).not.toBe(eBookIcon);
      expect(physicalIcon).not.toBe(eBookIcon);
    });

    it('should handle string ID input', () => {
      const deadline = { ...mockDeadline, id: '123' };
      const icon = getBookCoverIcon(deadline, 5);
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThanOrEqual(1); // Emoji length varies
    });

    it('should handle non-numeric string ID', () => {
      const deadline = { ...mockDeadline, id: 'abc-def' };
      const icon = getBookCoverIcon(deadline, 5);
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThanOrEqual(1); // Emoji length varies
    });

    it('should handle empty title', () => {
      const deadline = { ...mockDeadline, book_title: '' };
      const icon = getBookCoverIcon(deadline, 5);
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThanOrEqual(1); // Emoji length varies
    });

    it('should handle zero days left', () => {
      const icon = getBookCoverIcon(mockDeadline, 0);
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThanOrEqual(1); // Emoji length varies
    });

    it('should handle negative days left', () => {
      const icon = getBookCoverIcon(mockDeadline, -5);
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThanOrEqual(1); // Emoji length varies
    });

    it('should handle large days left value', () => {
      const icon = getBookCoverIcon(mockDeadline, 999);
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThanOrEqual(1); // Emoji length varies
    });

    it('should return one of the predefined icons', () => {
      const expectedIcons = [
        '📕', '📗', '📘', '📙', '📔', '📓', '📑', '📜',
        '💰', '⚔️', '🏃', '🎭', '🔬', '🎨', '🏛️', '🌟', '🔮', '⭐'
      ];

      const icon = getBookCoverIcon(mockDeadline, 5);
      expect(expectedIcons).toContain(icon);
    });

    it('should handle special characters in title', () => {
      const deadline = { ...mockDeadline, book_title: 'Test & Book: Part 1!' };
      const icon = getBookCoverIcon(deadline, 5);
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThanOrEqual(1); // Emoji length varies
    });

    it('should handle unicode characters in title', () => {
      const deadline = { ...mockDeadline, book_title: 'Tëst Bøøk 中文' };
      const icon = getBookCoverIcon(deadline, 5);
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThanOrEqual(1); // Emoji length varies
    });

    it('should be deterministic across multiple calls', () => {
      const icons = Array.from({ length: 10 }, () => getBookCoverIcon(mockDeadline, 5));
      const allSame = icons.every(icon => icon === icons[0]);
      expect(allSame).toBe(true);
    });

    it('should handle very long titles', () => {
      const longTitle = 'A'.repeat(1000);
      const deadline = { ...mockDeadline, book_title: longTitle };
      const icon = getBookCoverIcon(deadline, 5);
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThanOrEqual(1); // Emoji length varies
    });

    it('should produce different results for similar but different inputs', () => {
      const deadline1 = { ...mockDeadline, book_title: 'Harry Potter' };
      const deadline2 = { ...mockDeadline, book_title: 'Harry Potter 2' };

      const icon1 = getBookCoverIcon(deadline1, 5);
      const icon2 = getBookCoverIcon(deadline2, 5);

      expect(icon1).not.toBe(icon2);
    });
  });

  describe('getGradientBackground', () => {
    const mockDeadline = {
      id: 1,
      book_title: 'Test Book',
      format: 'physical' as const,
    };

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return consistent gradient for same input', () => {
      const gradient1 = getGradientBackground(mockDeadline, 5);
      const gradient2 = getGradientBackground(mockDeadline, 5);
      expect(gradient1).toEqual(gradient2);
    });

    it('should return array of two hex color strings', () => {
      const gradient = getGradientBackground(mockDeadline, 5);
      expect(Array.isArray(gradient)).toBe(true);
      expect(gradient).toHaveLength(2);
      expect(typeof gradient[0]).toBe('string');
      expect(typeof gradient[1]).toBe('string');
      expect(gradient[0]).toMatch(/^#[0-9A-F]{6}$/i);
      expect(gradient[1]).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('should return different gradients for different titles', () => {
      const deadline1 = { ...mockDeadline, book_title: 'Book A' };
      const deadline2 = { ...mockDeadline, book_title: 'Book B' };

      const gradient1 = getGradientBackground(deadline1, 5);
      const gradient2 = getGradientBackground(deadline2, 5);

      expect(gradient1).not.toEqual(gradient2);
    });

    it('should return different gradients for different IDs', () => {
      const deadline1 = { ...mockDeadline, id: 1 };
      const deadline2 = { ...mockDeadline, id: 2 };

      const gradient1 = getGradientBackground(deadline1, 5);
      const gradient2 = getGradientBackground(deadline2, 5);

      expect(gradient1).not.toEqual(gradient2);
    });

    it('should return different gradients for different days left', () => {
      const gradient1 = getGradientBackground(mockDeadline, 1);
      const gradient2 = getGradientBackground(mockDeadline, 10);

      expect(gradient1).not.toEqual(gradient2);
    });

    it('should return different gradients for different formats', () => {
      const physicalDeadline = { ...mockDeadline, format: 'physical' as const };
      const audioDeadline = { ...mockDeadline, format: 'audio' as const };
      const eBookDeadline = { ...mockDeadline, format: 'eBook' as const };

      const physicalGradient = getGradientBackground(physicalDeadline, 5);
      const audioGradient = getGradientBackground(audioDeadline, 5);
      const eBookGradient = getGradientBackground(eBookDeadline, 5);

      // At least one pair should be different due to different format seeds
      const allSame = (
        JSON.stringify(physicalGradient) === JSON.stringify(audioGradient) &&
        JSON.stringify(audioGradient) === JSON.stringify(eBookGradient)
      );
      expect(allSame).toBe(false);
    });

    it('should handle string ID input', () => {
      const deadline = { ...mockDeadline, id: '123' };
      const gradient = getGradientBackground(deadline, 5);
      expect(Array.isArray(gradient)).toBe(true);
      expect(gradient).toHaveLength(2);
    });

    it('should handle non-numeric string ID', () => {
      const deadline = { ...mockDeadline, id: 'abc-def' };
      const gradient = getGradientBackground(deadline, 5);
      expect(Array.isArray(gradient)).toBe(true);
      expect(gradient).toHaveLength(2);
    });

    it('should handle empty title', () => {
      const deadline = { ...mockDeadline, book_title: '' };
      const gradient = getGradientBackground(deadline, 5);
      expect(Array.isArray(gradient)).toBe(true);
      expect(gradient).toHaveLength(2);
    });

    it('should handle zero days left', () => {
      const gradient = getGradientBackground(mockDeadline, 0);
      expect(Array.isArray(gradient)).toBe(true);
      expect(gradient).toHaveLength(2);
    });

    it('should handle negative days left', () => {
      const gradient = getGradientBackground(mockDeadline, -5);
      expect(Array.isArray(gradient)).toBe(true);
      expect(gradient).toHaveLength(2);
    });

    it('should handle large days left value', () => {
      const gradient = getGradientBackground(mockDeadline, 999);
      expect(Array.isArray(gradient)).toBe(true);
      expect(gradient).toHaveLength(2);
    });

    it('should return one of the predefined gradients', () => {
      const expectedGradients = [
        ['#FF6B6B', '#4DABF7'], ['#9775FA', '#51CF66'], ['#FFD43B', '#FF6B6B'],
        ['#4DABF7', '#E599F7'], ['#51CF66', '#FFB366'], ['#FF8787', '#74C0FC'],
        ['#69DB7C', '#F783AC'], ['#FFB366', '#9775FA'], ['#E599F7', '#51CF66'],
        ['#74C0FC', '#FFD43B'], ['#F783AC', '#69DB7C'], ['#8CE99A', '#A78BFA'],
        ['#FFE066', '#FB7185'], ['#A78BFA', '#FFB366'], ['#FB7185', '#74C0FC']
      ];

      const gradient = getGradientBackground(mockDeadline, 5);
      const found = expectedGradients.some(expected =>
        expected[0] === gradient[0] && expected[1] === gradient[1]
      );
      expect(found).toBe(true);
    });

    it('should be deterministic across multiple calls', () => {
      const gradients = Array.from({ length: 10 }, () => getGradientBackground(mockDeadline, 5));
      const allSame = gradients.every(gradient =>
        gradient[0] === gradients[0][0] && gradient[1] === gradients[0][1]
      );
      expect(allSame).toBe(true);
    });

    it('should handle special characters in title', () => {
      const deadline = { ...mockDeadline, book_title: 'Test & Book: Part 1!' };
      const gradient = getGradientBackground(deadline, 5);
      expect(Array.isArray(gradient)).toBe(true);
      expect(gradient).toHaveLength(2);
    });

    it('should vary with date changes', () => {
      const gradient1 = getGradientBackground(mockDeadline, 5);

      jest.setSystemTime(new Date('2024-01-16'));
      const gradient2 = getGradientBackground(mockDeadline, 5);

      expect(gradient1).not.toEqual(gradient2);
    });
  });

  describe('formatRemainingDisplay', () => {
    it('should return "Complete!" when remaining is 0', () => {
      expect(formatRemainingDisplay(0, 'physical')).toBe('Complete!');
      expect(formatRemainingDisplay(0, 'eBook')).toBe('Complete!');
      expect(formatRemainingDisplay(0, 'audio')).toBe('Complete!');
    });

    it('should return "Complete!" when remaining is negative', () => {
      expect(formatRemainingDisplay(-1, 'physical')).toBe('Complete!');
      expect(formatRemainingDisplay(-10, 'eBook')).toBe('Complete!');
      expect(formatRemainingDisplay(-5, 'audio')).toBe('Complete!');
    });

    it('should format physical books with pages remaining', () => {
      const result = formatRemainingDisplay(50, 'physical');
      expect(result).toBe('50 pages remaining');
    });

    it('should format eBooks with pages remaining', () => {
      const result = formatRemainingDisplay(125, 'eBook');
      expect(result).toBe('125 pages remaining');
    });

    it('should format audio books with formatted time remaining', () => {
      const result = formatRemainingDisplay(90, 'audio');
      expect(result).toContain('remaining');
      expect(result).toContain('1h 30m');
    });

    it('should handle single page/minute remaining', () => {
      expect(formatRemainingDisplay(1, 'physical')).toBe('1 pages remaining');
      expect(formatRemainingDisplay(1, 'eBook')).toBe('1 pages remaining');
    });

    it('should handle large remaining amounts', () => {
      expect(formatRemainingDisplay(1000, 'physical')).toBe('1000 pages remaining');
      expect(formatRemainingDisplay(500, 'eBook')).toBe('500 pages remaining');
    });

    it('should handle audio format with small minutes', () => {
      const result = formatRemainingDisplay(5, 'audio');
      expect(result).toContain('remaining');
      expect(result).toContain('5m');
    });

    it('should handle audio format with hours and minutes', () => {
      const result = formatRemainingDisplay(125, 'audio');
      expect(result).toContain('remaining');
      expect(result).toContain('2h 5m');
    });

    it('should handle audio format with exact hours', () => {
      const result = formatRemainingDisplay(120, 'audio');
      expect(result).toContain('remaining');
      expect(result).toContain('2h');
    });
  });
});