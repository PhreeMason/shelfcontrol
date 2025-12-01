import { DB_TABLES } from '@/constants/database';
import { supabase } from '@/lib/supabase';
import {
  AudiobookData,
  GetAudiobookRequest,
  GetAudiobookResponse,
  GetAudibleAudiobookRequest,
  GetAudibleAudiobookResponse,
} from '@/types/audiobook.types';
import { FullBookData, SearchBooksResponse } from '@/types/bookSearch';
import { activityService } from './activity.service';

class BooksService {
  /**
   * Search for books using the edge function
   */
  async searchBooks(query: string): Promise<SearchBooksResponse> {
    if (!query.trim()) return { bookList: [] };

    const { data, error } = await supabase.functions.invoke('search-books-v2', {
      body: { query },
    });

    if (error) throw error;

    activityService.trackUserActivity('book_search_v2', { query });

    return data;
  }

  /**
   * Fetch full book data using the edge function
   * Supports multiple identifier types: api_id, isbn, or google_volume_id
   */
  async fetchBookData(
    identifier:
      | string
      | { api_id?: string; isbn?: string; google_volume_id?: string }
  ): Promise<FullBookData> {
    // Handle legacy string parameter (assumed to be api_id)
    const body =
      typeof identifier === 'string' ? { api_id: identifier } : identifier;

    const { data, error } = await supabase.functions.invoke('book-data', {
      body,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Fetch book data by ISBN
   */
  async fetchBookDataByISBN(isbn: string): Promise<FullBookData> {
    return this.fetchBookData({ isbn });
  }

  /**
   * Fetch book data by Google Volume ID
   */
  async fetchBookDataByGoogleVolumeId(volumeId: string): Promise<FullBookData> {
    return this.fetchBookData({ google_volume_id: volumeId });
  }

  /**
   * Fetch book from the database by book ID
   */
  async fetchBookById(bookId: string) {
    const { data: results, error } = await supabase
      .from(DB_TABLES.BOOKS)
      .select('*')
      .eq('id', bookId)
      .limit(1);

    const data = results?.[0];

    if (error) {
      throw new Error(`Failed to fetch book data: ${error.message}`);
    }

    return data;
  }

  /**
   * Check if a book exists in the database by API ID
   */
  async getBookByApiId(apiId: string) {
    const { data: results, error } = await supabase
      .from(DB_TABLES.BOOKS)
      .select('id')
      .eq('api_id', apiId)
      .limit(1);

    const data = results?.[0];

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  /**
   * Insert a new book into the database
   */
  async insertBook(bookId: string, bookData: FullBookData) {
    const { format, metadata, edition, ...bookDataRest } = bookData;

    const { data: insertResults, error } = await supabase
      .from(DB_TABLES.BOOKS)
      .insert({
        ...bookDataRest,
        id: bookId,
        format: format as 'physical' | 'eBook' | 'audio' | null,
        metadata: metadata as any,
        edition: edition as any,
      })
      .select()
      .limit(1);

    const data = insertResults?.[0];

    if (error) throw error;

    activityService.trackUserActivity('book_added', {
      bookId,
      title: bookData.title,
    });

    return data;
  }

  /**
   * Get audiobook duration data
   * First checks community cache (2+ users with same duration), then falls back to Spotify
   */
  async getAudiobookDuration(
    request: GetAudiobookRequest
  ): Promise<AudiobookData> {
    const { data, error } =
      await supabase.functions.invoke<GetAudiobookResponse>('get-audiobook', {
        body: request,
      });

    if (error || !data?.success) {
      throw new Error(
        data?.error || error?.message || 'Failed to fetch audiobook data'
      );
    }

    // Include source for attribution display
    return {
      ...data.data!,
      source: data.source,
    };
  }

  /**
   * Get audiobook duration from Audible (fallback when Spotify result is rejected)
   * Scrapes Audible search results for duration data
   */
  async getAudiobookFromAudible(
    request: GetAudibleAudiobookRequest
  ): Promise<AudiobookData | null> {
    const { data, error } =
      await supabase.functions.invoke<GetAudibleAudiobookResponse>(
        'get-audiobook-audible',
        { body: request }
      );

    if (error || !data?.success || !data.data) {
      // Return null instead of throwing - this is a fallback, not critical
      return null;
    }

    // Map Audible response to AudiobookData format
    const result: AudiobookData = {
      spotify_id: null,
      title: data.data.title,
      author: data.data.author,
      narrator: data.data.narrator,
      description: null,
      duration_ms: data.data.duration_ms,
      total_chapters: null,
      publisher: null,
      release_date: null,
      isbn: null,
      cover_url: data.data.cover_url,
      source: 'audible',
    };

    // Only add asin if present
    if (data.data.asin) {
      result.asin = data.data.asin;
    }

    return result;
  }
}

export const booksService = new BooksService();
