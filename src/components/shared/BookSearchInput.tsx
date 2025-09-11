import { ThemedText } from '@/components/themed';
import { useFetchBookData, useSearchBooksList } from '@/hooks/useBooks';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BookSearchResult, SelectedBook } from '@/types/bookSearch';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { IconSymbol } from '../ui/IconSymbol';


interface BookSearchInputProps {
    onBookSelected: (book: SelectedBook | null) => void;
    selectedBook?: SelectedBook | null;
    placeholder?: string;
    testID?: string;
}

const BookSearchInput: React.FC<BookSearchInputProps> = ({
    onBookSelected,
    selectedBook,
    placeholder = 'Search for a book to link...',
    testID = 'book-search-input',
}) => {
    const border = useThemeColor({}, 'border');
    const surface = useThemeColor({}, 'surface');
    const primary = useThemeColor({}, 'primary');
    const text = useThemeColor({}, 'text');
    const textMuted = useThemeColor({}, 'textMuted');
    const [query, setQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [selectedApiId, setSelectedApiId] = useState<string | null>(null);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Search books hook
    const {
        data: searchResults,
        isLoading: searchLoading,
        error: searchError
    } = useSearchBooksList(debouncedQuery);

    // Fetch full book data hook
    const {
        data: fullBookData,
        isLoading: bookLoading,
    } = useFetchBookData(selectedApiId || '');

    // Handle book selection and fetch full data
    const handleBookSelection = useCallback(async (book: BookSearchResult) => {
        if (!book.api_id) return;
        
        setSelectedApiId(book.api_id);
        setShowResults(false);
        setQuery(book.title || '');
    }, []);

    // When full book data is fetched, call the parent callback
    useEffect(() => {
        if (fullBookData && selectedApiId) {
            const selectedBookData: SelectedBook = {
                id: fullBookData.id || '',
                api_id: selectedApiId,
                title: fullBookData.title || '',
                author: fullBookData.metadata?.authors?.[0] || '',
                cover_image_url: fullBookData.cover_image_url || undefined,
                total_pages: fullBookData.total_pages || undefined,
                total_duration: fullBookData.total_duration || null,
            };
            onBookSelected(selectedBookData);
        }
    }, [fullBookData, selectedApiId, onBookSelected]);

    const handleTextChange = (text: string) => {
        setQuery(text);
        setShowResults(text.length > 2);
        
        if (text.length === 0) {
            // Clear selection if user clears the input
            handleClearSelection();
        }
    };

    const handleClearSelection = () => {
        setSelectedApiId(null);
        setQuery('');
        setShowResults(false);
        onBookSelected(null);
    };


    const renderSelectedBook = () => {
        if (!selectedBook) return null;

        return (
            <View style={[styles.selectedBookContainer, { backgroundColor: surface, borderColor: primary }]}>
                <View style={styles.selectedBookContent}>
                    {selectedBook.cover_image_url && (
                        <Image 
                            source={{ uri: selectedBook.cover_image_url }} 
                            style={styles.selectedBookCover}
                            testID="selected-book-cover"
                        />
                    )}
                    <View style={styles.selectedBookInfo}>
                        <ThemedText style={styles.selectedBookTitle} numberOfLines={2}>
                            {selectedBook.title}
                        </ThemedText>
                        {selectedBook.author && (
                            <ThemedText color="textMuted" style={styles.selectedBookAuthor} numberOfLines={1}>
                                by {selectedBook.author}
                            </ThemedText>
                        )}
                        <ThemedText color="primary" style={styles.linkedBadge}>
                            📚 Linked from library
                        </ThemedText>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={handleClearSelection}
                    testID="clear-book-selection"
                >
                    <IconSymbol name="xmark.circle.fill" size={24} color={textMuted} />
                </TouchableOpacity>
            </View>
        );
    };

    if (selectedBook) {
        return (
            <View>
                {renderSelectedBook()}
                {bookLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={primary} />
                        <ThemedText color="textMuted" style={styles.loadingText}>
                            Loading book details...
                        </ThemedText>
                    </View>
                )}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TextInput
                style={[
                    styles.searchInput,
                    {
                        backgroundColor: surface,
                        borderColor: border,
                        color: text,
                    }
                ]}
                value={query}
                onChangeText={handleTextChange}
                placeholder={placeholder}
                placeholderTextColor={textMuted}
                testID={testID}
                autoCorrect={false}
                autoCapitalize="words"
            />

            {searchLoading && query.length > 2 && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={primary} />
                    <ThemedText color="textMuted" style={styles.loadingText}>
                        Searching books...
                    </ThemedText>
                </View>
            )}

            {searchError && (
                <View style={styles.errorContainer}>
                    <ThemedText color="danger" style={styles.errorText}>
                        Failed to search books. Please try again.
                    </ThemedText>
                </View>
            )}

            {showResults && searchResults?.bookList && searchResults.bookList.length > 0 && (
                <View style={[styles.resultsContainer, { backgroundColor: surface, borderColor: border }]}>
                    <ScrollView
                        style={styles.resultsList}
                        testID="book-search-results"
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled={true}
                    >
                        {searchResults.bookList.map((item) => (
                            <TouchableOpacity
                                key={item.api_id || Math.random().toString()}
                                style={[styles.resultItem, { borderBottomColor: border }]}
                                onPress={() => handleBookSelection(item)}
                                testID={`book-result-${item.api_id}`}
                            >
                                <View style={styles.resultContent}>
                                    {item.cover_image_url && (
                                        <Image 
                                            source={{ uri: item.cover_image_url }} 
                                            style={styles.bookCover}
                                            testID={`book-cover-${item.api_id}`}
                                        />
                                    )}
                                    <View style={styles.bookInfo}>
                                        <ThemedText style={styles.bookTitle} numberOfLines={2}>
                                            {item.title}
                                        </ThemedText>
                                        {item.metadata.authors && item.metadata.authors.length > 0 && (
                                            <ThemedText color="textMuted" style={styles.bookAuthor} numberOfLines={1}>
                                                by {item.metadata.authors[0]}
                                            </ThemedText>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {showResults && searchResults?.bookList && searchResults.bookList.length === 0 && !searchLoading && (
                <View style={[styles.noResultsContainer, { backgroundColor: surface, borderColor: border }]}>
                    <ThemedText color="textMuted" style={styles.noResultsText}>
                        No books found for "{query}"
                    </ThemedText>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    searchInput: {
        borderWidth: 2,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 8,
    },
    loadingText: {
        fontSize: 14,
    },
    errorContainer: {
        paddingVertical: 8,
    },
    errorText: {
        fontSize: 14,
    },
    resultsContainer: {
        borderWidth: 1,
        borderRadius: 8,
        marginTop: 4,
        maxHeight: 200,
    },
    resultsList: {
        maxHeight: 200,
    },
    resultItem: {
        borderBottomWidth: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    resultContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bookCover: {
        width: 40,
        height: 60,
        borderRadius: 4,
        marginRight: 12,
    },
    bookInfo: {
        flex: 1,
    },
    bookTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    bookAuthor: {
        fontSize: 14,
    },
    noResultsContainer: {
        borderWidth: 1,
        borderRadius: 8,
        marginTop: 4,
        padding: 12,
        alignItems: 'center',
    },
    noResultsText: {
        fontSize: 14,
    },
    selectedBookContainer: {
        borderWidth: 2,
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectedBookContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectedBookCover: {
        width: 50,
        height: 75,
        borderRadius: 6,
        marginRight: 12,
    },
    selectedBookInfo: {
        flex: 1,
    },
    selectedBookTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    selectedBookAuthor: {
        fontSize: 14,
        marginBottom: 6,
    },
    linkedBadge: {
        fontSize: 12,
        fontWeight: '500',
    },
    clearButton: {
        padding: 8,
    },
});

export default BookSearchInput;