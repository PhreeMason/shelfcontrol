import { booksService } from '@/services';
import { FullBookData, SearchBooksResponse } from '@/types/bookSearch';
import { useQuery } from '@tanstack/react-query';

export const searchBookList = async (
  query: string
): Promise<SearchBooksResponse> => {
  return booksService.searchBooks(query);
};

export const fetchBookData = async (api_id: string): Promise<FullBookData> => {
  return booksService.fetchBookData(api_id);
};
/**
 * Fetch book data directly from the books table by book_id
 * This is different from fetchBookData which uses api_id and edge functions
 */
export const fetchBookById = async (book_id: string) => {
  return booksService.fetchBookById(book_id);
};

export const useSearchBooksList = (query: string) => {
  return useQuery({
    queryKey: ['books', 'search', query],
    queryFn: async () => searchBookList(query),
    staleTime: 1000 * 60 * 5,
    enabled: !!query && query.length > 2,
  });
};

export const useFetchBookData = (api_id: string) => {
  return useQuery({
    queryKey: ['book', api_id],
    queryFn: async () => fetchBookData(api_id),
    staleTime: 1000 * 60 * 30,
  });
};

export const useFetchBookById = (book_id: string | null) => {
  return useQuery({
    queryKey: ['book', 'id', book_id],
    queryFn: async () => fetchBookById(book_id!),
    staleTime: 1000 * 60 * 30,
    enabled: !!book_id,
  });
};
