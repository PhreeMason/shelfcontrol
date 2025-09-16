/**
 * Converts a string to title case, handling common words that should remain lowercase
 * and preserving certain formatting patterns
 */
export function toTitleCase(str: string): string {
  if (!str) return str;

  // Words that should remain lowercase unless they start the title
  const lowercaseWords = new Set([
    'a',
    'an',
    'the',
    'and',
    'but',
    'or',
    'for',
    'nor',
    'on',
    'at',
    'to',
    'from',
    'by',
    'in',
    'of',
    'with',
    'as',
    'up',
    'off',
    'out',
  ]);

  // Words that should always be uppercase
  const uppercaseWords = new Set([
    'I',
    'II',
    'III',
    'IV',
    'V',
    'VI',
    'VII',
    'VIII',
    'IX',
    'X',
  ]);

  return str
    .split(' ')
    .map((word, index) => {
      // Preserve empty strings
      if (!word) return word;

      // If the word is all caps and longer than 3 chars, preserve it (likely an acronym)
      if (
        word.length > 3 &&
        word === word.toUpperCase() &&
        /[A-Z]/.test(word)
      ) {
        return word;
      }

      // Check if it's a Roman numeral or uppercase word
      if (uppercaseWords.has(word.toUpperCase())) {
        return word.toUpperCase();
      }

      // For words with apostrophes (like "don't", "it's")
      if (word.includes("'")) {
        const parts = word.split("'");
        return (
          parts[0].charAt(0).toUpperCase() +
          parts[0].slice(1).toLowerCase() +
          "'" +
          (parts[1] ? parts[1].toLowerCase() : '')
        );
      }

      // For hyphenated words
      if (word.includes('-')) {
        return word
          .split('-')
          .map(
            part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
          )
          .join('-');
      }

      // First word or important word
      const lowerWord = word.toLowerCase();
      if (index === 0 || !lowercaseWords.has(lowerWord)) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }

      // Lowercase word in the middle
      return lowerWord;
    })
    .join(' ');
}
