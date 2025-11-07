import {
  extractHashtags,
  findHashtagAtCursor,
  getNextHashtagColor,
  HASHTAG_COLOR_PALETTE,
  parseTextWithHashtags,
} from '../hashtagUtils';

describe('hashtagUtils', () => {
  describe('extractHashtags', () => {
    it('should extract single hashtag from text', () => {
      const text = 'This is a #test note';
      const hashtags = extractHashtags(text);
      expect(hashtags).toEqual(['test']);
    });

    it('should extract multiple hashtags', () => {
      const text = 'This #book is #amazing and #thrilling';
      const hashtags = extractHashtags(text);
      expect(hashtags).toEqual(['book', 'amazing', 'thrilling']);
    });

    it('should handle hashtags with hyphens', () => {
      const text = 'This #enemies-to-lovers is so good';
      const hashtags = extractHashtags(text);
      expect(hashtags).toEqual(['enemies-to-lovers']);
    });

    it('should handle hashtags with underscores', () => {
      const text = 'Reading #book_1 now';
      const hashtags = extractHashtags(text);
      expect(hashtags).toEqual(['book_1']);
    });

    it('should handle hashtags with numbers', () => {
      const text = 'My #top10 favorite books';
      const hashtags = extractHashtags(text);
      expect(hashtags).toEqual(['top10']);
    });

    it('should handle hashtags at the beginning', () => {
      const text = '#review of the book';
      const hashtags = extractHashtags(text);
      expect(hashtags).toEqual(['review']);
    });

    it('should handle hashtags at the end', () => {
      const text = 'Great book #recommend';
      const hashtags = extractHashtags(text);
      expect(hashtags).toEqual(['recommend']);
    });

    it('should return unique hashtags', () => {
      const text = '#book is about a #book that has #book in the title';
      const hashtags = extractHashtags(text);
      expect(hashtags).toEqual(['book']);
    });

    it('should handle empty text', () => {
      const hashtags = extractHashtags('');
      expect(hashtags).toEqual([]);
    });

    it('should handle text with no hashtags', () => {
      const text = 'This is a note without hashtags';
      const hashtags = extractHashtags(text);
      expect(hashtags).toEqual([]);
    });

    it('should ignore # at end of word', () => {
      const text = 'Price is $100# not a hashtag';
      const hashtags = extractHashtags(text);
      expect(hashtags).toEqual([]);
    });

    it('should be case insensitive', () => {
      const text = '#Review and #REVIEW and #review';
      const hashtags = extractHashtags(text);
      expect(hashtags).toEqual(['review']);
    });

    it('should handle multiple hashtags on same line', () => {
      const text = '#fiction #romance #contemporary all together';
      const hashtags = extractHashtags(text);
      expect(hashtags).toEqual(['fiction', 'romance', 'contemporary']);
    });
  });

  describe('getNextHashtagColor', () => {
    it('should return first color for empty array', () => {
      const color = getNextHashtagColor([]);
      expect(color).toBe(HASHTAG_COLOR_PALETTE[0]);
    });

    it('should return next available color', () => {
      const existingHashtags = [HASHTAG_COLOR_PALETTE[0]];
      const color = getNextHashtagColor(existingHashtags);
      expect(color).toBe(HASHTAG_COLOR_PALETTE[1]);
    });

    it('should cycle through colors when all are used', () => {
      const existingHashtags = [...HASHTAG_COLOR_PALETTE];
      const color = getNextHashtagColor(existingHashtags);
      expect(HASHTAG_COLOR_PALETTE).toContain(color);
    });

    it('should skip used colors', () => {
      const existingHashtags = [
        HASHTAG_COLOR_PALETTE[0],
        HASHTAG_COLOR_PALETTE[2],
      ];
      const color = getNextHashtagColor(existingHashtags);
      expect(color).toBe(HASHTAG_COLOR_PALETTE[1]);
    });
  });

  describe('parseTextWithHashtags', () => {
    it('should parse text with hashtags', () => {
      const text = 'This is #test text';
      const hashtagsMap = new Map([['test', { color: '#ff0000' }]]);
      const segments = parseTextWithHashtags(text, hashtagsMap);

      expect(segments).toHaveLength(3);
      expect(segments[0]).toEqual({ text: 'This is ', type: 'text' });
      expect(segments[1]).toEqual({
        text: '#test',
        type: 'hashtag',
        color: '#ff0000',
      });
      expect(segments[2]).toEqual({ text: ' text', type: 'text' });
    });

    it('should handle multiple hashtags', () => {
      const text = '#one and #two';
      const hashtagsMap = new Map([
        ['one', { color: '#ff0000' }],
        ['two', { color: '#00ff00' }],
      ]);
      const segments = parseTextWithHashtags(text, hashtagsMap);

      expect(segments).toHaveLength(3);
      expect(segments[0]).toEqual({
        text: '#one',
        type: 'hashtag',
        color: '#ff0000',
      });
      expect(segments[1]).toEqual({ text: ' and ', type: 'text' });
      expect(segments[2]).toEqual({
        text: '#two',
        type: 'hashtag',
        color: '#00ff00',
      });
    });

    it('should handle text without hashtags', () => {
      const text = 'Plain text';
      const hashtagsMap = new Map();
      const segments = parseTextWithHashtags(text, hashtagsMap);

      expect(segments).toHaveLength(1);
      expect(segments[0]).toEqual({ text: 'Plain text', type: 'text' });
    });

    it('should handle empty text', () => {
      const segments = parseTextWithHashtags('', new Map());
      expect(segments).toEqual([]);
    });
  });

  describe('findHashtagAtCursor', () => {
    it('should find hashtag at cursor position', () => {
      const text = 'This is #test';
      const result = findHashtagAtCursor(text, 13);

      expect(result).toEqual({ hashtag: 'test', start: 8 });
    });

    it('should find partial hashtag being typed', () => {
      const text = 'This is #te';
      const result = findHashtagAtCursor(text, 11);

      expect(result).toEqual({ hashtag: 'te', start: 8 });
    });

    it('should return null when not in a hashtag', () => {
      const text = 'This is a note';
      const result = findHashtagAtCursor(text, 5);

      expect(result).toBeNull();
    });

    it('should return null when cursor is before #', () => {
      const text = 'This is #test';
      const result = findHashtagAtCursor(text, 8);

      expect(result).toBeNull();
    });

    it('should return null immediately after # with no text', () => {
      const text = 'This is #';
      const result = findHashtagAtCursor(text, 9);

      expect(result).toBeNull();
    });

    it('should handle hashtag at beginning', () => {
      const text = '#test';
      const result = findHashtagAtCursor(text, 5);

      expect(result).toEqual({ hashtag: 'test', start: 0 });
    });

    it('should handle empty text', () => {
      const result = findHashtagAtCursor('', 0);
      expect(result).toBeNull();
    });

    it('should handle negative cursor position', () => {
      const text = 'This is #test';
      const result = findHashtagAtCursor(text, -1);

      expect(result).toBeNull();
    });
  });
});
