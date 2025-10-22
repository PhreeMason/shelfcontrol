// Types that match the actual edge function outputs

export interface BookSearchResultMetadata {
  goodreads_id?: string;
  google_books_id?: string;
  edition_count?: number | null;
  ratings_count?: number | null;
  series?: string | null;
  series_number?: number | null;
  authors: string[];
  isbn?: string | null;
}

export interface BookSearchResult {
  api_id: string;
  google_volume_id?: string;
  api_source: string;
  bookUrl: string;
  cover_image_url: string | null;
  title: string;
  publication_date: string | null;
  rating: number | null;
  source: string;
  epub_url: string;
  metadata: BookSearchResultMetadata;
}

export interface SearchBooksResponse {
  bookList: BookSearchResult[];
}

export interface FullBookMetadata {
  extraction_method?: string;
  authors?: string[];
  rating_count?: number;
  review_count?: number;
  awards?: string;
  series?: string;
  series_number?: number;
  goodreads_id?: string;
}

export interface FullBookData {
  api_id: string;
  api_source: string;
  cover_image_url: string | null;
  description: string | null;
  edition: string | null;
  format: string | null;
  genres: string[];
  google_volume_id?: string | null;
  has_user_edits: boolean;
  isbn10: string | null;
  isbn13: string | null;
  language: string | null;
  metadata: FullBookMetadata;
  publication_date: string | null;
  publisher: string | null;
  rating: number | null;
  source: string;
  title: string;
  total_duration: number | null;
  total_pages: number | null;
  bookUrl?: string;
  epub_url?: string;
  id?: string; // Added when stored in database
}

// The interface we use internally for selected books
export interface SelectedBook {
  id: string;
  api_id: string;
  title: string;
  author?: string;
  cover_image_url?: string | undefined;
  total_pages?: number | undefined;
  total_duration?: number | null;
  publication_date?: string | null;
}
