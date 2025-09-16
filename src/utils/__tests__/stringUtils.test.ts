import { toTitleCase } from '../stringUtils';

describe('stringUtils', () => {
  describe('toTitleCase', () => {
    it('should convert basic string to title case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
    });

    it('should handle empty string', () => {
      expect(toTitleCase('')).toBe('');
    });

    it('should handle undefined/null input gracefully', () => {
      expect(toTitleCase(null as any)).toBe(null);
      expect(toTitleCase(undefined as any)).toBe(undefined);
    });

    it('should keep lowercase articles and prepositions in the middle', () => {
      expect(toTitleCase('the lord of the rings')).toBe(
        'The Lord of the Rings'
      );
      expect(toTitleCase('a tale of two cities')).toBe('A Tale of Two Cities');
      expect(toTitleCase('for whom the bell tolls')).toBe(
        'For Whom the Bell Tolls'
      );
    });

    it('should capitalize first word even if it is typically lowercase', () => {
      expect(toTitleCase('the great gatsby')).toBe('The Great Gatsby');
      expect(toTitleCase('and then there were none')).toBe(
        'And Then There Were None'
      );
    });

    it('should handle roman numerals correctly', () => {
      expect(toTitleCase('world war ii')).toBe('World War II');
      expect(toTitleCase('chapter iii begins')).toBe('Chapter III Begins');
      expect(toTitleCase('part iv of the story')).toBe('Part IV of the Story');
    });

    it('should preserve acronyms in all caps', () => {
      expect(toTitleCase('the FBI investigation')).toBe(
        'The Fbi Investigation'
      );
      expect(toTitleCase('NASA space program')).toBe('NASA Space Program');
    });

    it('should handle contractions properly', () => {
      expect(toTitleCase("don't stop believin'")).toBe("Don't Stop Believin'");
      expect(toTitleCase("it's a wonderful life")).toBe(
        "It's a Wonderful Life"
      );
      expect(toTitleCase("can't buy me love")).toBe("Can't Buy Me Love");
    });

    it('should handle hyphenated words', () => {
      expect(toTitleCase('well-known author')).toBe('Well-Known Author');
      expect(toTitleCase('twenty-first century')).toBe('Twenty-First Century');
      expect(toTitleCase('state-of-the-art technology')).toBe(
        'State-Of-The-Art Technology'
      );
    });

    it('should handle complex mixed cases', () => {
      expect(toTitleCase("HARRY POTTER and the SORCERER'S STONE")).toBe(
        "HARRY POTTER and the SORCERER'S STONE"
      );
      expect(
        toTitleCase('the lord of the rings: the fellowship of the ring')
      ).toBe('The Lord of the Rings: the Fellowship of the Ring');
    });

    it('should handle single words', () => {
      expect(toTitleCase('hello')).toBe('Hello');
      expect(toTitleCase('WORLD')).toBe('WORLD');
      expect(toTitleCase('tHe')).toBe('The');
    });

    it('should handle numbers and special characters', () => {
      expect(toTitleCase('2001: a space odyssey')).toBe(
        '2001: a Space Odyssey'
      );
      expect(toTitleCase('catch-22 by joseph heller')).toBe(
        'Catch-22 by Joseph Heller'
      );
    });

    it('should preserve spacing', () => {
      expect(toTitleCase('hello  world')).toBe('Hello  World');
      expect(toTitleCase(' leading space')).toBe(' Leading Space');
    });
  });
});
