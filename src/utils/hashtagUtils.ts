export const MAX_HASHTAGS_PER_NOTE = 8;

export const HASHTAG_COLOR_PALETTE = [
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#ef4444',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#6366f1',
  '#14b8a6',
  '#f97316',
  '#a855f7',
] as const;

/**
 * Extracts unique hashtags from text.
 * Supports hashtags with letters, numbers, underscores, and hyphens.
 * Examples: #review, #enemies-to-lover, #book_1
 *
 * @param text - The text to extract hashtags from
 * @returns Array of unique hashtag names (without the # symbol)
 */
export const extractHashtags = (text: string): string[] => {
  if (!text) return [];

  // Match hashtags: # followed by letters, numbers, underscores, or hyphens
  // Must start with a letter or number
  const hashtagRegex = /#([a-zA-Z0-9][a-zA-Z0-9_-]*)/g;
  const matches = text.matchAll(hashtagRegex);

  const hashtags = Array.from(matches, match => match[1].toLowerCase());

  // Return unique hashtags
  return [...new Set(hashtags)];
};

/**
 * Gets the next available color for a new hashtag
 *
 * @param existingHashtags - Array of existing hashtag color strings
 * @returns Next available color from palette
 */
export const getNextHashtagColor = (existingHashtags: string[]): string => {
  if (existingHashtags.length === 0) {
    return HASHTAG_COLOR_PALETTE[0];
  }

  const usedColors = new Set(existingHashtags);
  const availableColors = HASHTAG_COLOR_PALETTE.filter(
    color => !usedColors.has(color)
  );

  if (availableColors.length > 0) {
    return availableColors[0];
  }

  // All colors used: cycle back through palette using modulo operator
  // This ensures color selection wraps around when more hashtags exist than colors
  return HASHTAG_COLOR_PALETTE[
    existingHashtags.length % HASHTAG_COLOR_PALETTE.length
  ];
};

/**
 * Parses text and returns segments with hashtag information
 * Useful for rendering text with colored hashtags
 *
 * @param text - The text to parse
 * @param hashtagsMap - Map of hashtag name to hashtag object with color
 * @returns Array of text segments with type and optional color
 */
export interface TextSegment {
  text: string;
  type: 'text' | 'hashtag';
  color?: string;
  id?: string;
}

export const parseTextWithHashtags = (
  text: string,
  hashtagsMap: Map<string, { color: string; id?: string }>
): TextSegment[] => {
  if (!text) return [];

  const segments: TextSegment[] = [];
  const hashtagRegex = /#([a-zA-Z0-9][a-zA-Z0-9_-]*)/g;

  let lastIndex = 0;
  let match;

  while ((match = hashtagRegex.exec(text)) !== null) {
    // Add text before hashtag
    if (match.index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, match.index),
        type: 'text',
      });
    }

    // Add hashtag
    const hashtagName = match[1].toLowerCase();
    const hashtagData = hashtagsMap.get(hashtagName);
    const segment: TextSegment = {
      text: match[0], // Include the # symbol
      type: 'hashtag',
    };
    if (hashtagData?.color) {
      segment.color = hashtagData.color;
    }
    if (hashtagData?.id) {
      segment.id = hashtagData.id;
    }
    segments.push(segment);

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      type: 'text',
    });
  }

  return segments;
};

/**
 * Finds the hashtag being typed at a given cursor position
 *
 * @param text - The full text
 * @param cursorPosition - The cursor position in the text
 * @returns Object with hashtag name (without #) and start position, or null
 */
export const findHashtagAtCursor = (
  text: string,
  cursorPosition: number
): { hashtag: string; start: number } | null => {
  if (!text || cursorPosition < 0) return null;

  // Find the start of the current word (look backwards for # or space)
  let start = cursorPosition - 1;
  while (start >= 0 && text[start] !== ' ' && text[start] !== '\n') {
    start--;
  }
  start++; // Move to the first character of the word

  // Check if this word starts with #
  if (start >= text.length || text[start] !== '#') return null;

  // Extract the hashtag being typed
  const wordEnd = Math.min(cursorPosition, text.length);
  const word = text.slice(start + 1, wordEnd); // +1 to skip the #

  // Only return if there's at least one character after #
  if (word.length === 0) return null;

  return {
    hashtag: word.toLowerCase(),
    start,
  };
};
