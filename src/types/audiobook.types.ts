/**
 * Types for audiobook data from the get-audiobook edge function
 */

export interface AudiobookData {
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
  /** Where the data came from - used for attribution display */
  source?: 'community' | 'spotify' | 'audible' | 'cache' | undefined;
  /** Audible ASIN (Amazon ID) if from Audible */
  asin?: string | null | undefined;
}

export interface GetAudiobookResponse {
  success: boolean;
  data?: AudiobookData;
  source?: 'community' | 'spotify' | 'audible' | 'cache';
  error?: string;
}

export interface GetAudibleAudiobookRequest {
  /** Book title for Audible search */
  title: string;
  /** Book author for Audible search (optional, improves accuracy) */
  author?: string | undefined;
}

export interface GetAudibleAudiobookResponse {
  success: boolean;
  data?: {
    asin: string | null;
    title: string | null;
    author: string | null;
    narrator: string | null;
    duration_ms: number | null;
    cover_url: string | null;
  };
  source?: 'audible';
  error?: string;
}

export interface GetAudiobookRequest {
  /** Direct Spotify audiobook ID lookup */
  audiobookId?: string | undefined;
  /** Book ID for community cache lookup */
  bookId?: string | undefined;
  /** Book title for Spotify search fallback */
  title?: string | undefined;
  /** Book author for Spotify search fallback */
  author?: string | undefined;
}
