import { QUERY_KEYS } from '@/constants/queryKeys';
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

export const useFetchBookData = (api_id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.BOOKS.BY_API_ID(api_id),
    queryFn: async () => fetchBookData(api_id),
    staleTime: 1000 * 60 * 30,
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
