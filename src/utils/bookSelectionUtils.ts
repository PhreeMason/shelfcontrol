import {
  BookSearchResult,
  SelectedBook,
  FullBookData,
} from '@/types/bookSearch';
import { DeadlineFormData } from '@/utils/deadlineFormSchema';

export const transformBookSearchResult = (
  fullBookData: FullBookData,
  apiId: string
): SelectedBook => {
  return {
    id: fullBookData.id || '',
    api_id: apiId,
    title: fullBookData.title || '',
    author: fullBookData.metadata?.authors?.[0] || '',
    cover_image_url: fullBookData.cover_image_url || undefined,
    total_pages: fullBookData.total_pages || undefined,
    total_duration: fullBookData.total_duration || null,
    publication_date: fullBookData.publication_date,
  };
};

export const shouldTriggerSearch = (query: string): boolean => {
  return query.length > 2;
};

export const getSearchStatusMessage = (
  query: string,
  isLoading: boolean,
  hasError: boolean,
  hasResults: boolean
): {
  type: 'loading' | 'error' | 'no-results' | 'prompt' | null;
  message?: string;
  subMessage?: string;
} => {
  if (hasError) {
    return {
      type: 'error',
      message: 'Failed to search books. Please try again.',
    };
  }

  if (isLoading && shouldTriggerSearch(query)) {
    return { type: 'loading', message: 'Searching books...' };
  }

  if (shouldTriggerSearch(query) && !isLoading && !hasResults) {
    return {
      type: 'no-results',
      message: `No books found for "${query}"`,
      subMessage: 'Try a different search or add manually',
    };
  }

  if (query.length === 0) {
    return {
      type: 'prompt',
      message: 'Search for a book to get started',
      subMessage: "We'll grab the page count and details for you",
    };
  }

  return { type: null };
};

export const populateFormFromBook = (
  selectedBook: SelectedBook,
  setValue: (name: keyof DeadlineFormData, value: any) => void
): void => {
  setValue('bookTitle', selectedBook.title);
  setValue('bookAuthor', selectedBook.author || '');
  setValue('book_id', selectedBook.id);
  setValue('api_id', selectedBook.api_id);

  if (selectedBook.total_pages) {
    setValue('totalQuantity', selectedBook.total_pages);
  }
};

export const hasValidApiId = (book: BookSearchResult): boolean => {
  return !!book.api_id;
};

export const getBookDisplayInfo = (item: BookSearchResult) => {
  return {
    title: item.title,
    author: item.metadata?.authors?.[0] || null,
    coverImageUrl: item.cover_image_url || null,
  };
};
