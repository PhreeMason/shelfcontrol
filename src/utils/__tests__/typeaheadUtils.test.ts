import {
  filterSuggestions,
  highlightMatch,
  shouldShowSuggestions,
  shouldShowNoResults,
} from '../typeaheadUtils';

describe('typeaheadUtils', () => {
  describe('filterSuggestions', () => {
    const mockSources = ['Fiction', 'Non-Fiction', 'Science Fiction', 'Biography', 'ARC'];

    it('should return all sources for empty query', () => {
      expect(filterSuggestions('', mockSources)).toEqual(mockSources);
    });

    it('should return all sources for whitespace-only query', () => {
      expect(filterSuggestions('   ', mockSources)).toEqual(mockSources);
      expect(filterSuggestions('\t\n', mockSources)).toEqual(mockSources);
    });

    it('should filter sources with case-insensitive matching', () => {
      expect(filterSuggestions('fiction', mockSources)).toEqual(['Fiction', 'Non-Fiction', 'Science Fiction']);
      expect(filterSuggestions('FICTION', mockSources)).toEqual(['Fiction', 'Non-Fiction', 'Science Fiction']);
      expect(filterSuggestions('Fiction', mockSources)).toEqual(['Fiction', 'Non-Fiction', 'Science Fiction']);
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
      expect(filterSuggestions('-', sourcesWithSpecial)).toEqual(['Non-Fiction', 'Sci-Fi']);
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
      expect(shouldShowSuggestions(false, ['item1', 'item2'], false)).toBe(false);
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
});