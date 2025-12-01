import { QUERY_KEYS } from '@/constants/queryKeys';
import { booksService } from '@/services';
import {
  GetAudiobookRequest,
  GetAudibleAudiobookRequest,
} from '@/types/audiobook.types';
import { FullBookData, SearchBooksResponse } from '@/types/bookSearch';
import { useQuery } from '@tanstack/react-query';

export const searchBookList = async (
  query: string
): Promise<SearchBooksResponse> => {
  return booksService.searchBooks(query);
};

export const fetchBookData = async (
  identifier:
    | string
    | { api_id?: string; isbn?: string; google_volume_id?: string }
): Promise<FullBookData> => {
  return booksService.fetchBookData(identifier);
};

export const fetchBookById = async (book_id: string) => {
  return booksService.fetchBookById(book_id);
};

export const useSearchBooksList = (query: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.BOOKS.SEARCH(query),
    queryFn: async () => searchBookList(query),
    staleTime: 1000 * 60 * 5,
    enabled: !!query && query.length > 2,
  });
};

export const useFetchBookData = (
  identifier:
    | string
    | { api_id?: string; isbn?: string; google_volume_id?: string }
) => {
  const queryKey =
    typeof identifier === 'string'
      ? QUERY_KEYS.BOOKS.BY_API_ID(identifier)
      : QUERY_KEYS.BOOKS.BY_API_ID(
          identifier.google_volume_id ||
            identifier.isbn ||
            identifier.api_id ||
            ''
        );

  return useQuery({
    queryKey,
    queryFn: async () => fetchBookData(identifier),
    staleTime: 1000 * 60 * 30,
    enabled:
      typeof identifier === 'string'
        ? !!identifier
        : !!(
            identifier.api_id ||
            identifier.isbn ||
            identifier.google_volume_id
          ),
  });
};

export const useFetchBookById = (book_id: string | null) => {
  return useQuery({
    queryKey: book_id ? QUERY_KEYS.BOOKS.BY_ID(book_id) : ['book', 'id', null],
    queryFn: async () => fetchBookById(book_id!),
    staleTime: 1000 * 60 * 30,
    enabled: !!book_id,
  });
};

/**
 * Hook to get audiobook duration data.
 * First checks community cache (2+ users with same duration), then falls back to Spotify.
 */
export const useGetAudiobookDuration = (
  request: GetAudiobookRequest | null
) => {
  return useQuery({
    queryKey: QUERY_KEYS.BOOKS.AUDIOBOOK_DURATION(
      request?.bookId || request?.title || ''
    ),
    queryFn: () => booksService.getAudiobookDuration(request!),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    enabled: !!request && !!(request.bookId || request.title),
  });
};

/**
 * Hook to get audiobook duration from Audible (fallback).
 * Used when user rejects Spotify result via "Not right?" button.
 */
export const useGetAudiobookFromAudible = (
  request: GetAudibleAudiobookRequest | null,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: QUERY_KEYS.BOOKS.AUDIOBOOK_AUDIBLE(request?.title || ''),
    queryFn: () => booksService.getAudiobookFromAudible(request!),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    enabled: enabled && !!request?.title,
  });
};
