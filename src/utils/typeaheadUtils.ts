export interface HighlightResult {
  beforeMatch: string;
  match: string;
  afterMatch: string;
  matchIndex: number;
}

export const filterSuggestions = (
  query: string,
  sources: string[]
): string[] => {
  if (!query.trim()) {
    return sources;
  }
  return sources.filter(source =>
    source.toLowerCase().includes(query.toLowerCase())
  );
};

export const highlightMatch = (
  text: string,
  query: string
): HighlightResult => {
  if (!query.trim()) {
    return {
      beforeMatch: text,
      match: '',
      afterMatch: '',
      matchIndex: -1,
    };
  }

  const matchIndex = text.toLowerCase().indexOf(query.toLowerCase());

  if (matchIndex === -1) {
    return {
      beforeMatch: text,
      match: '',
      afterMatch: '',
      matchIndex: -1,
    };
  }

  const beforeMatch = text.slice(0, matchIndex);
  const match = text.slice(matchIndex, matchIndex + query.length);
  const afterMatch = text.slice(matchIndex + query.length);

  return {
    beforeMatch,
    match,
    afterMatch,
    matchIndex,
  };
};

export const shouldShowSuggestions = (
  showSuggestions: boolean,
  filteredSuggestions: string[],
  isLoading: boolean
): boolean => {
  return showSuggestions && filteredSuggestions.length > 0 && !isLoading;
};

export const shouldShowNoResults = (
  showSuggestions: boolean,
  query: string,
  filteredSuggestions: string[],
  isLoading: boolean
): boolean => {
  return (
    showSuggestions &&
    query.trim() !== '' &&
    filteredSuggestions.length === 0 &&
    !isLoading
  );
};

export const mergeWithDefaults = (
  userItems: string[],
  defaultItems: string[]
): string[] => {
  const uniqueUserItems = userItems
    .filter(
      item =>
        !defaultItems.some(
          defaultItem => defaultItem.toLowerCase() === item.toLowerCase()
        )
    )
    .sort((a, b) => a.localeCompare(b));

  return [...uniqueUserItems, ...defaultItems];
};
