import {
  filterSuggestions,
  highlightMatch,
  mergeWithDefaults,
  shouldShowSuggestions,
  shouldShowNoResults,
} from '../typeaheadUtils';

describe('typeaheadUtils', () => {
  describe('filterSuggestions', () => {
    const mockSources = [
      'Fiction',
      'Non-Fiction',
      'Science Fiction',
      'Biography',
      'ARC',
    ];

    it('should return all sources for empty query', () => {
      expect(filterSuggestions('', mockSources)).toEqual(mockSources);
    });

    it('should return all sources for whitespace-only query', () => {
      expect(filterSuggestions('   ', mockSources)).toEqual(mockSources);
      expect(filterSuggestions('\t\n', mockSources)).toEqual(mockSources);
    });

    it('should filter sources with case-insensitive matching', () => {
      expect(filterSuggestions('fiction', mockSources)).toEqual([
        'Fiction',
        'Non-Fiction',
        'Science Fiction',
      ]);
      expect(filterSuggestions('FICTION', mockSources)).toEqual([
        'Fiction',
        'Non-Fiction',
        'Science Fiction',
      ]);
      expect(filterSuggestions('Fiction', mockSources)).toEqual([
        'Fiction',
        'Non-Fiction',
        'Science Fiction',
      ]);
    });

    it('should return exact matches', () => {
      expect(filterSuggestions('ARC', mockSources)).toEqual(['ARC']);
      expect(filterSuggestions('arc', mockSources)).toEqual(['ARC']);
    });

    it('should return partial matches', () => {
      expect(filterSuggestions('Bio', mockSources)).toEqual(['Biography']);
      expect(filterSuggestions('bio', mockSources)).toEqual(['Biography']);
    });

    it('should return empty array for no matches', () => {
      expect(filterSuggestions('xyz', mockSources)).toEqual([]);
      expect(filterSuggestions('unknown', mockSources)).toEqual([]);
    });

    it('should handle empty sources array', () => {
      expect(filterSuggestions('test', [])).toEqual([]);
    });

    it('should handle special characters in query', () => {
      const sourcesWithSpecial = ['Non-Fiction', 'Sci-Fi', 'Test123'];
      expect(filterSuggestions('-', sourcesWithSpecial)).toEqual([
        'Non-Fiction',
        'Sci-Fi',
      ]);
      expect(filterSuggestions('123', sourcesWithSpecial)).toEqual(['Test123']);
    });

    it('should handle unicode characters', () => {
      const unicodeSources = ['Français', 'Español', 'English'];
      expect(filterSuggestions('ç', unicodeSources)).toEqual(['Français']);
      expect(filterSuggestions('ñ', unicodeSources)).toEqual(['Español']);
    });
  });

  describe('highlightMatch', () => {
    it('should return no match for empty query', () => {
      const result = highlightMatch('Fiction', '');
      expect(result).toEqual({
        beforeMatch: 'Fiction',
        match: '',
        afterMatch: '',
        matchIndex: -1,
      });
    });

    it('should return no match for whitespace-only query', () => {
      const result = highlightMatch('Fiction', '   ');
      expect(result).toEqual({
        beforeMatch: 'Fiction',
        match: '',
        afterMatch: '',
        matchIndex: -1,
      });
    });

    it('should highlight match at beginning of text', () => {
      const result = highlightMatch('Fiction', 'Fic');
      expect(result).toEqual({
        beforeMatch: '',
        match: 'Fic',
        afterMatch: 'tion',
        matchIndex: 0,
      });
    });

    it('should highlight match in middle of text', () => {
      const result = highlightMatch('Science Fiction', 'ence');
      expect(result).toEqual({
        beforeMatch: 'Sci',
        match: 'ence',
        afterMatch: ' Fiction',
        matchIndex: 3,
      });
    });

    it('should highlight match at end of text', () => {
      const result = highlightMatch('Biography', 'phy');
      expect(result).toEqual({
        beforeMatch: 'Biogra',
        match: 'phy',
        afterMatch: '',
        matchIndex: 6,
      });
    });

    it('should perform case-insensitive matching', () => {
      const result = highlightMatch('Fiction', 'fiction');
      expect(result).toEqual({
        beforeMatch: '',
        match: 'Fiction',
        afterMatch: '',
        matchIndex: 0,
      });
    });

    it('should handle case-insensitive match preserving original case', () => {
      const result = highlightMatch('Science Fiction', 'SCIENCE');
      expect(result).toEqual({
        beforeMatch: '',
        match: 'Science',
        afterMatch: ' Fiction',
        matchIndex: 0,
      });
    });

    it('should return no match when query not found', () => {
      const result = highlightMatch('Fiction', 'xyz');
      expect(result).toEqual({
        beforeMatch: 'Fiction',
        match: '',
        afterMatch: '',
        matchIndex: -1,
      });
    });

    it('should handle special characters', () => {
      const result = highlightMatch('Non-Fiction', '-');
      expect(result).toEqual({
        beforeMatch: 'Non',
        match: '-',
        afterMatch: 'Fiction',
        matchIndex: 3,
      });
    });

    it('should find first occurrence when multiple matches exist', () => {
      const result = highlightMatch('Test test TEST', 'test');
      expect(result).toEqual({
        beforeMatch: '',
        match: 'Test',
        afterMatch: ' test TEST',
        matchIndex: 0,
      });
    });

    it('should handle exact full match', () => {
      const result = highlightMatch('ARC', 'ARC');
      expect(result).toEqual({
        beforeMatch: '',
        match: 'ARC',
        afterMatch: '',
        matchIndex: 0,
      });
    });

    it('should handle unicode characters', () => {
      const result = highlightMatch('Français', 'ç');
      expect(result).toEqual({
        beforeMatch: 'Fran',
        match: 'ç',
        afterMatch: 'ais',
        matchIndex: 4,
      });
    });
  });

  describe('shouldShowSuggestions', () => {
    it('should return true when all conditions are met', () => {
      expect(shouldShowSuggestions(true, ['item1', 'item2'], false)).toBe(true);
    });

    it('should return false when showSuggestions is false', () => {
      expect(shouldShowSuggestions(false, ['item1', 'item2'], false)).toBe(
        false
      );
    });

    it('should return false when filteredSuggestions is empty', () => {
      expect(shouldShowSuggestions(true, [], false)).toBe(false);
    });

    it('should return false when isLoading is true', () => {
      expect(shouldShowSuggestions(true, ['item1', 'item2'], true)).toBe(false);
    });

    it('should return false when multiple conditions are false', () => {
      expect(shouldShowSuggestions(false, [], true)).toBe(false);
    });

    it('should handle single item in suggestions', () => {
      expect(shouldShowSuggestions(true, ['item1'], false)).toBe(true);
    });
  });

  describe('shouldShowNoResults', () => {
    it('should return true when all conditions are met', () => {
      expect(shouldShowNoResults(true, 'query', [], false)).toBe(true);
    });

    it('should return false when showSuggestions is false', () => {
      expect(shouldShowNoResults(false, 'query', [], false)).toBe(false);
    });

    it('should return false when query is empty', () => {
      expect(shouldShowNoResults(true, '', [], false)).toBe(false);
    });

    it('should return false when query is whitespace only', () => {
      expect(shouldShowNoResults(true, '   ', [], false)).toBe(false);
      expect(shouldShowNoResults(true, '\t\n', [], false)).toBe(false);
    });

    it('should return false when filteredSuggestions has items', () => {
      expect(shouldShowNoResults(true, 'query', ['item1'], false)).toBe(false);
    });

    it('should return false when isLoading is true', () => {
      expect(shouldShowNoResults(true, 'query', [], true)).toBe(false);
    });

    it('should return false when multiple conditions are false', () => {
      expect(shouldShowNoResults(false, '', ['item1'], true)).toBe(false);
    });

    it('should handle valid query with no results', () => {
      expect(shouldShowNoResults(true, 'nonexistent', [], false)).toBe(true);
    });

    it('should handle query with leading/trailing spaces', () => {
      expect(shouldShowNoResults(true, ' query ', [], false)).toBe(true);
    });
  });

  describe('mergeWithDefaults', () => {
    const DEFAULT_ITEMS = ['Apple', 'Banana', 'Cherry'];

    describe('Basic Functionality', () => {
      it('should return only defaults when user items are empty', () => {
        const result = mergeWithDefaults([], DEFAULT_ITEMS);
        expect(result).toEqual(['Apple', 'Banana', 'Cherry']);
      });

      it('should merge user items with defaults correctly', () => {
        const userItems = ['Mango', 'Orange'];
        const result = mergeWithDefaults(userItems, DEFAULT_ITEMS);
        expect(result).toEqual(['Mango', 'Orange', 'Apple', 'Banana', 'Cherry']);
      });

      it('should sort user items alphabetically', () => {
        const userItems = ['Zebra', 'Aardvark', 'Monkey'];
        const result = mergeWithDefaults(userItems, DEFAULT_ITEMS);
        expect(result).toEqual([
          'Aardvark',
          'Monkey',
          'Zebra',
          'Apple',
          'Banana',
          'Cherry',
        ]);
      });

      it('should place user items before defaults', () => {
        const userItems = ['Custom'];
        const result = mergeWithDefaults(userItems, DEFAULT_ITEMS);
        expect(result[0]).toBe('Custom');
        expect(result.slice(1)).toEqual(['Apple', 'Banana', 'Cherry']);
      });
    });

    describe('Deduplication', () => {
      it('should remove case-insensitive duplicates', () => {
        const userItems = ['apple', 'BANANA', 'cherry', 'Mango'];
        const result = mergeWithDefaults(userItems, DEFAULT_ITEMS);
        expect(result).toEqual(['Mango', 'Apple', 'Banana', 'Cherry']);
      });

      it('should handle mixed case duplicates', () => {
        const userItems = ['aPpLe', 'bAnAnA', 'Custom'];
        const result = mergeWithDefaults(userItems, DEFAULT_ITEMS);
        expect(result).toEqual(['Custom', 'Apple', 'Banana', 'Cherry']);
      });

      it('should keep user version when exact match exists', () => {
        const userItems = ['Apple', 'Custom'];
        const result = mergeWithDefaults(userItems, DEFAULT_ITEMS);
        expect(result).toEqual(['Custom', 'Apple', 'Banana', 'Cherry']);
      });

      it('should handle multiple duplicates in user items', () => {
        const userItems = ['apple', 'Apple', 'APPLE', 'Custom'];
        const result = mergeWithDefaults(userItems, DEFAULT_ITEMS);
        expect(result).toEqual(['Custom', 'Apple', 'Banana', 'Cherry']);
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty defaults array', () => {
        const userItems = ['Item1', 'Item2'];
        const result = mergeWithDefaults(userItems, []);
        expect(result).toEqual(['Item1', 'Item2']);
      });

      it('should handle both arrays empty', () => {
        const result = mergeWithDefaults([], []);
        expect(result).toEqual([]);
      });

      it('should handle items with special characters', () => {
        const userItems = ['Item & Co', 'Item-1', 'Item_2'];
        const result = mergeWithDefaults(userItems, DEFAULT_ITEMS);
        expect(result).toEqual([
          'Item & Co',
          'Item_2',
          'Item-1',
          'Apple',
          'Banana',
          'Cherry',
        ]);
      });

      it('should handle items with numbers', () => {
        const userItems = ['Item123', 'item456', 'Item789'];
        const result = mergeWithDefaults(userItems, DEFAULT_ITEMS);
        expect(result).toEqual([
          'Item123',
          'item456',
          'Item789',
          'Apple',
          'Banana',
          'Cherry',
        ]);
      });

      it('should handle items with whitespace', () => {
        const userItems = ['  Space  ', '\tTab\t', 'Normal'];
        const result = mergeWithDefaults(userItems, DEFAULT_ITEMS);
        expect(result).toEqual([
          '\tTab\t',
          '  Space  ',
          'Normal',
          'Apple',
          'Banana',
          'Cherry',
        ]);
      });

      it('should handle unicode characters', () => {
        const userItems = ['Café ☕', 'École 🏫', 'Naïve'];
        const result = mergeWithDefaults(userItems, DEFAULT_ITEMS);
        expect(result).toEqual([
          'Café ☕',
          'École 🏫',
          'Naïve',
          'Apple',
          'Banana',
          'Cherry',
        ]);
      });

      it('should handle very long strings', () => {
        const longString = 'A'.repeat(1000);
        const userItems = [longString, 'Short'];
        const result = mergeWithDefaults(userItems, DEFAULT_ITEMS);
        expect(result).toEqual([
          longString,
          'Short',
          'Apple',
          'Banana',
          'Cherry',
        ]);
      });

      it('should handle large number of items', () => {
        const userItems = Array.from({ length: 100 }, (_, i) => `Item${i}`);
        const result = mergeWithDefaults(userItems, DEFAULT_ITEMS);
        expect(result).toHaveLength(103);
        expect(result.slice(-3)).toEqual(['Apple', 'Banana', 'Cherry']);
      });
    });

    describe('Sorting Behavior', () => {
      it('should use locale-aware sorting', () => {
        const userItems = ['Äpfel', 'Zebra', 'Café'];
        const result = mergeWithDefaults(userItems, DEFAULT_ITEMS);
        expect(result.slice(0, 3)).toEqual(['Äpfel', 'Café', 'Zebra']);
      });

      it('should sort case-insensitively', () => {
        const userItems = ['zebra', 'Apple Tree', 'aardvark'];
        const result = mergeWithDefaults(userItems, DEFAULT_ITEMS);
        expect(result[0]).toBe('aardvark');
        expect(result[1]).toBe('Apple Tree');
        expect(result[2]).toBe('zebra');
      });

      it('should preserve original case in sorted results', () => {
        const userItems = ['ZeBrA', 'AaRdVaRk'];
        const result = mergeWithDefaults(userItems, DEFAULT_ITEMS);
        expect(result[0]).toBe('AaRdVaRk');
        expect(result[1]).toBe('ZeBrA');
      });
    });

    describe('Real-World Scenarios', () => {
      it('should handle deadline types scenario', () => {
        const defaults = ['ARC', 'Library', 'Personal', 'Book Club'];
        const userItems = ['Store', 'Gift', 'arc'];
        const result = mergeWithDefaults(userItems, defaults);
        expect(result).toEqual([
          'Gift',
          'Store',
          'ARC',
          'Library',
          'Personal',
          'Book Club',
        ]);
      });

      it('should handle acquisition sources scenario', () => {
        const defaults = ['NetGalley', 'Edelweiss', 'Direct'];
        const userItems = ['Amazon', 'Publisher', 'netgalley'];
        const result = mergeWithDefaults(userItems, defaults);
        expect(result).toEqual([
          'Amazon',
          'Publisher',
          'NetGalley',
          'Edelweiss',
          'Direct',
        ]);
      });
    });
  });
});
