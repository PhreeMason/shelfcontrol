export function generateUrl(query) {
  return `https://www.goodreads.com/search?q=${encodeURIComponent(query)}`;
}
export const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36';
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};
export async function getSpotifyToken(supabase: any): Promise<string> {
  const { data: tokenData } = await supabase
    .from('spotify_tokens')
    .select('access_token, expires_at')
    .eq('id', 1)
    .single();

  // Return cached token if still valid (with 60s buffer)
  if (tokenData && new Date(tokenData.expires_at) > new Date(Date.now() + 60000)) {
    return tokenData.access_token;
  }

  // Fetch new token from Spotify
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: Deno.env.get('SPOTIFY_CLIENT_ID')!,
      client_secret: Deno.env.get('SPOTIFY_CLIENT_SECRET')!,
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get Spotify token: ${response.status}`);
  }

  const tokenResponse = await response.json();
  const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

  // Cache the new token
  await supabase.from('spotify_tokens').upsert({
    id: 1,
    access_token: tokenResponse.access_token,
    expires_at: expiresAt,
  });

  return tokenResponse.access_token;
}

/**
 * Sanitizes a string for use in Spotify search queries.
 * Removes special characters that could cause issues.
 */
export function sanitizeSearchQuery(input: string): string {
  if (!input) return '';
  return input
    .replace(/[^\w\s\-']/g, '')  // Keep letters, numbers, spaces, hyphens, apostrophes
    .replace(/\s+/g, ' ')        // Collapse multiple spaces
    .trim()
    .slice(0, 100);              // Limit length
}

export class Logger {
  logs = [];
  log(...args) {
    const message = args.map(String).join(' ');
    this.logs.push({
      type: 'log',
      message,
      timestamp: Date.now()
    });
    console.log(...args);
  }
  error(...args) {
    const message = args.map(String).join(' ');
    this.logs.push({
      type: 'error',
      message,
      timestamp: Date.now()
    });
    console.error(...args);
  }
  getLogs() {
    return this.logs;
  }
}

/**
 * Calculate Levenshtein distance between two strings.
 * Returns a similarity score from 0 (completely different) to 1 (identical).
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix with Levenshtein distances
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const distance = matrix[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - (distance / maxLength);
}

/**
 * Check if a search result is a good match for the query.
 * Uses title and author similarity to validate results.
 */
export function isGoodMatch(
  searchTitle: string,
  resultTitle: string,
  searchAuthor: string | undefined,
  resultAuthor: string | undefined,
  logger: Logger
): { isMatch: boolean; titleScore: number; authorScore: number | null } {
  const titleScore = calculateSimilarity(searchTitle, resultTitle);

  logger.log(`Title similarity: "${searchTitle}" vs "${resultTitle}" = ${(titleScore * 100).toFixed(1)}%`);

  // If no author provided, only check title
  if (!searchAuthor) {
    const isMatch = titleScore >= 0.6;
    logger.log(`No author provided, title match: ${isMatch}`);
    return { isMatch, titleScore, authorScore: null };
  }

  // Check author similarity
  const authorScore = resultAuthor
    ? calculateSimilarity(searchAuthor, resultAuthor)
    : 0;

  logger.log(`Author similarity: "${searchAuthor}" vs "${resultAuthor}" = ${(authorScore * 100).toFixed(1)}%`);

  // Require both title and author to meet thresholds
  const isMatch = titleScore >= 0.6 && authorScore >= 0.5;

  logger.log(`Combined match result: ${isMatch} (title: ${titleScore >= 0.6}, author: ${authorScore >= 0.5})`);

  return { isMatch, titleScore, authorScore };
}
