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
