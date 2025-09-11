import { supabase } from "@/lib/supabase";
import { FullBookData, SearchBooksResponse } from "@/types/bookSearch";
import { useQuery } from "@tanstack/react-query";

export const searchBookList = async (query: string): Promise<SearchBooksResponse> => {
   if (!query.trim()) return { bookList: [] };
    const { data, error } = await supabase.functions.invoke('search-books', {
        body: { query },
    });

    if (error) throw error;
    return data;
};

export const fetchBookData = async (api_id: string): Promise<FullBookData> => {
   const { data, error } = await supabase.functions.invoke('book-data', {
        body: { api_id },
    });

    if (error) throw error;
    return data;
};
/**
 * Fetch book data directly from the books table by book_id
 * This is different from fetchBookData which uses api_id and edge functions
 */
export const fetchBookById = async (book_id: string) => {
    const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', book_id)
        .single();

    if (error) {
        throw new Error(`Failed to fetch book data: ${error.message}`);
    }

    return data;
};


/* 
    React Query hooks for fetching book data 
    returns a list of books matching the search query
**/
export const useSearchBooksList = (query: string) => {
    return useQuery({
        queryKey: ['books', 'search', query],
        queryFn: async () => searchBookList(query),
        staleTime: 1000 * 60 * 5,
        enabled: !!query && query.length > 2,
    });
};

/* 
    React Query hook for fetching book data by api_id ID
**/
export const useFetchBookData = (api_id: string) => {
    return useQuery({
        queryKey: ['book', api_id],
        queryFn: async () => fetchBookData(api_id),
        staleTime: 1000 * 60 * 30,
    });
}

/* 
    React Query hook for fetching book data by book_id from the database
**/
export const useFetchBookById = (book_id: string | null) => {
    return useQuery({
        queryKey: ['book', 'id', book_id],
        queryFn: async () => fetchBookById(book_id!),
        staleTime: 1000 * 60 * 30,
        enabled: !!book_id,
    });
}