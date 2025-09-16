import { supabase } from '@/lib/supabase';
import { FullBookData, SearchBooksResponse } from '@/types/bookSearch';

class BooksService {
  /**
   * Search for books using the edge function
   */
  async searchBooks(query: string): Promise<SearchBooksResponse> {
    if (!query.trim()) return { bookList: [] };

    const { data, error } = await supabase.functions.invoke('search-books', {
      body: { query },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Fetch full book data using the edge function
   */
  async fetchBookData(apiId: string): Promise<FullBookData> {
    const { data, error } = await supabase.functions.invoke('book-data', {
      body: { api_id: apiId },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Fetch book from the database by book ID
   */
  async fetchBookById(bookId: string) {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch book data: ${error.message}`);
    }

    return data;
  }

  /**
   * Check if a book exists in the database by API ID
   */
  async getBookByApiId(apiId: string) {
    const { data, error } = await supabase
      .from('books')
      .select('id')
      .eq('api_id', apiId)
      .single();

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

    const { data, error } = await supabase
      .from('books')
      .insert({
        ...bookDataRest,
        id: bookId,
        format: format as 'physical' | 'eBook' | 'audio' | null,
        metadata: metadata as any,
        edition: edition as any,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const booksService = new BooksService();
