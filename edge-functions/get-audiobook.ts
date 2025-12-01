import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, getSpotifyToken, Logger, sanitizeSearchQuery } from './utils.ts';

interface AudiobookData {
  spotify_id: string | null;
  title: string | null;
  author: string | null;
  narrator: string | null;
  description: string | null;
  duration_ms: number | null;
  total_chapters: number | null;
  publisher: string | null;
  release_date: string | null;
  isbn: string | null;
  cover_url: string | null;
}

interface AudiobookSearchResult {
  spotify_id: string;
  title: string;
  author: string;
  narrator: string;
  cover_url: string | null;
  total_chapters: number;
}

async function fetchFromSpotify(supabase: any, audiobookId: string): Promise<AudiobookData> {
  const token = await getSpotifyToken(supabase);

  const response = await fetch(
    `https://api.spotify.com/v1/audiobooks/${audiobookId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Spotify API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
    );
  }

  const data = await response.json();

  // Only calculate duration if we have actual chapter data - no guessing
  const totalDurationMs = data.chapters?.items?.reduce(
    (sum: number, chapter: { duration_ms: number }) => sum + chapter.duration_ms,
    0
  ) || null;

  return {
    spotify_id: audiobookId,
    title: data.name,
    author: data.authors?.map((a: { name: string }) => a.name).join(', ') || 'Unknown',
    narrator: data.narrators?.map((n: { name: string }) => n.name).join(', ') || 'Unknown',
    description: data.description || null,
    duration_ms: totalDurationMs,
    total_chapters: data.total_chapters || 0,
    publisher: data.publisher || null,
    release_date: data.release_date || null,
    isbn: data.external_ids?.isbn || null,
    cover_url: data.images?.[0]?.url || null,
  };
}

async function getAudiobookData(supabase: any, audiobookId: string, logger: Logger): Promise<AudiobookData> {
  // Check cache first
  const { data: cached } = await supabase
    .from('audiobook_cache')
    .select('*')
    .eq('spotify_id', audiobookId)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (cached) {
    logger.log('Cache hit for', audiobookId);
    return {
      spotify_id: cached.spotify_id,
      title: cached.title,
      author: cached.author,
      narrator: cached.narrator,
      description: cached.description,
      duration_ms: cached.duration_ms,
      total_chapters: cached.total_chapters,
      publisher: cached.publisher,
      release_date: cached.release_date,
      isbn: cached.isbn,
      cover_url: cached.cover_url,
    };
  }

  logger.log('Cache miss, fetching from Spotify');
  const audiobookData = await fetchFromSpotify(supabase, audiobookId);

  // Only cache if we have duration (the main value we care about)
  if (audiobookData.duration_ms) {
    const { error: cacheError } = await supabase.from('audiobook_cache').upsert({
      spotify_id: audiobookId,
      ...audiobookData,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }, { onConflict: 'spotify_id' });

    if (cacheError) {
      logger.error('Cache write failed:', cacheError.message);
    }
  } else {
    logger.log('Skipping cache - no duration available');
  }

  return audiobookData;
}

/**
 * Check if 2+ users have added this book as an audiobook with the same duration.
 * Returns the duration in hours if found, null otherwise.
 */
async function checkCommunityData(supabase: any, bookId: string, logger: Logger): Promise<number | null> {
  const { data, error } = await supabase
    .from('deadlines')
    .select('total_quantity')
    .eq('book_id', bookId)
    .eq('format', 'audio')
    .gt('total_quantity', 0);

  if (error || !data || data.length < 2) {
    logger.log(`Community cache: ${data?.length || 0} audio deadlines found for book ${bookId}`);
    return null;
  }

  // Count occurrences of each duration
  const counts: Record<number, number> = {};
  for (const row of data) {
    const qty = row.total_quantity;
    counts[qty] = (counts[qty] || 0) + 1;
  }

  // Find duration with 2+ users
  for (const [duration, count] of Object.entries(counts)) {
    if (count >= 2) {
      logger.log(`Community cache hit: ${count} users have duration ${duration} hours`);
      return parseInt(duration);
    }
  }

  logger.log('Community cache miss: no duration with 2+ users');
  return null;
}

/**
 * Search Spotify for audiobooks by query string
 */
async function searchSpotify(supabase: any, query: string, limit: number, logger: Logger): Promise<AudiobookSearchResult[]> {
  const token = await getSpotifyToken(supabase);

  const params = new URLSearchParams({
    q: query,
    type: 'audiobook',
    limit: String(limit),
    market: 'US',
  });

  const response = await fetch(
    `https://api.spotify.com/v1/search?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Spotify search error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
    );
  }

  const data = await response.json();
  const audiobooks = data.audiobooks?.items || [];

  logger.log(`Spotify search for "${query}" returned ${audiobooks.length} results`);

  return audiobooks.map((item: any) => ({
    spotify_id: item.id,
    title: item.name,
    author: item.authors?.map((a: { name: string }) => a.name).join(', ') || 'Unknown',
    narrator: item.narrators?.map((n: { name: string }) => n.name).join(', ') || 'Unknown',
    cover_url: item.images?.[0]?.url || null,
    total_chapters: item.total_chapters || 0,
  }));
}

Deno.serve(async (req) => {
  const logger = new Logger();

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { audiobookId, bookId, title, author } = await req.json();

    // Path 1: Direct Spotify ID lookup (existing behavior)
    if (audiobookId && typeof audiobookId === 'string') {
      logger.log(`Direct Spotify lookup for: ${audiobookId}`);
      const audiobookData = await getAudiobookData(supabase, audiobookId, logger);
      return new Response(
        JSON.stringify({ success: true, source: 'spotify', data: audiobookData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Path 2: Book-based lookup with community cache
    if (bookId && typeof bookId === 'string') {
      logger.log(`Checking community cache for book: ${bookId}`);
      const communityDuration = await checkCommunityData(supabase, bookId, logger);

      if (communityDuration !== null) {
        // Convert hours to milliseconds for consistent response format
        const audiobookData: AudiobookData = {
          spotify_id: null,
          title: null,
          author: null,
          narrator: null,
          description: null,
          duration_ms: communityDuration * 60 * 60 * 1000,
          total_chapters: null,
          publisher: null,
          release_date: null,
          isbn: null,
          cover_url: null,
        };

        return new Response(
          JSON.stringify({ success: true, source: 'community', data: audiobookData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Path 3: Fall back to Spotify search by title/author
    if (title && typeof title === 'string') {
      const searchQuery = sanitizeSearchQuery(`${title} ${author || ''}`);
      logger.log(`Searching Spotify for: "${searchQuery}"`);

      const searchResults = await searchSpotify(supabase, searchQuery, 1, logger);

      if (searchResults.length > 0) {
        const firstResult = searchResults[0];
        logger.log(`Found match: ${firstResult.title} (${firstResult.spotify_id})`);

        const audiobookData = await getAudiobookData(supabase, firstResult.spotify_id, logger);
        return new Response(
          JSON.stringify({ success: true, source: 'spotify', data: audiobookData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      logger.log('No Spotify results found');
    }

    // No valid input or no results
    return new Response(
      JSON.stringify({ success: false, error: 'No audiobook found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('get-audiobook error:', message);

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
