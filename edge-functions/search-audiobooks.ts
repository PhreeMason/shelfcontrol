import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, getSpotifyToken, Logger } from './utils.ts';

interface AudiobookSearchResult {
  spotify_id: string;
  title: string;
  author: string;
  narrator: string;
  cover_url: string | null;
  total_chapters: number;
}

async function searchSpotify(supabase: any, query: string, limit: number): Promise<AudiobookSearchResult[]> {
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

    const { query, limit = 10 } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (query.length < 2) {
      return new Response(
        JSON.stringify({ error: 'query must be at least 2 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.log(`Searching audiobooks: "${query}"`);
    const results = await searchSpotify(supabase, query, Math.min(limit, 50));
    logger.log(`Found ${results.length} results`);

    return new Response(
      JSON.stringify({ success: true, data: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('search-audiobooks error:', message);

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
