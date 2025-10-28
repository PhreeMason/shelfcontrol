import { useEffect, useRef } from 'react';
import { analytics } from '@/lib/analytics/client';

interface SearchResults {
  bookList?: unknown[];
}

interface SearchError {
  message?: string;
}

interface UseSearchTrackingParams {
  query: string;
  debouncedQuery: string;
  searchResults?: SearchResults | null | undefined;
  searchError?: SearchError | null;
}

export function useSearchTracking({
  query,
  debouncedQuery,
  searchResults,
  searchError,
}: UseSearchTrackingParams) {
  const searchStartTimeRef = useRef(0);

  useEffect(() => {
    if (query.trim().length > 0) {
      analytics.track('book_search_performed', {
        query_length: query.trim().length,
      });
      searchStartTimeRef.current = Date.now();
    }
  }, [debouncedQuery]);

  useEffect(() => {
    if (searchResults?.bookList && searchStartTimeRef.current > 0) {
      const loadTime = Date.now() - searchStartTimeRef.current;
      analytics.track('book_search_results_loaded', {
        results_count: searchResults.bookList.length,
        search_term: debouncedQuery,
        load_time_ms: loadTime,
      });
      searchStartTimeRef.current = 0;
    }
  }, [searchResults, debouncedQuery]);

  useEffect(() => {
    if (searchError && debouncedQuery.trim().length > 0) {
      analytics.track('book_search_failed', {
        error_message: searchError.message || 'Unknown error',
        search_term: debouncedQuery,
      });
    }
  }, [searchError, debouncedQuery]);
}
