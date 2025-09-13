import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useFetchBookData, useSearchBooksList } from '@/hooks/useBooks';
import { useTheme } from '@/hooks/useThemeColor';
import { BookSearchResult, SelectedBook } from '@/types/bookSearch';
import { DeadlineFormData } from '@/utils/deadlineFormSchema';
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

interface DeadlineFormStep1Props {
    onBookSelected: (book: SelectedBook | null) => void;
    onManualEntry: () => void;
    setValue: (name: keyof DeadlineFormData, value: any) => void;
}

export const DeadlineFormStep1 = ({
    onBookSelected,
    onManualEntry,
    setValue
}: DeadlineFormStep1Props) => {
    const { colors } = useTheme();
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [selectedApiId, setSelectedApiId] = useState<string | null>(null);
    const [isLoadingBookDetails, setIsLoadingBookDetails] = useState(false);

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
    } = useFetchBookData(selectedApiId || '');

    // Handle book selection and fetch full data
    const handleBookSelection = useCallback(async (book: BookSearchResult) => {
        if (!book.api_id) return;
        
        setSelectedApiId(book.api_id);
        setIsLoadingBookDetails(true);
    }, []);

    // When full book data is fetched, populate form and proceed
    useEffect(() => {
        if (fullBookData && selectedApiId && isLoadingBookDetails) {
            const selectedBookData: SelectedBook = {
                id: fullBookData.id || '',
                api_id: selectedApiId,
                title: fullBookData.title || '',
                author: fullBookData.metadata?.authors?.[0] || '',
                cover_image_url: fullBookData.cover_image_url || undefined,
                total_pages: fullBookData.total_pages || undefined,
                total_duration: fullBookData.total_duration || null,
            };
            
            // Set form values
            setValue('bookTitle', selectedBookData.title);
            setValue('bookAuthor', selectedBookData.author || '');
            setValue('book_id', selectedBookData.id);
            setValue('api_id', selectedBookData.api_id);
            
            // Auto-populate total pages if available
            if (selectedBookData.total_pages) {
                setValue('totalQuantity', selectedBookData.total_pages);
            }
            
            setIsLoadingBookDetails(false);
            onBookSelected(selectedBookData);
        }
    }, [fullBookData, selectedApiId, isLoadingBookDetails, setValue, onBookSelected]);

    const renderSearchResults = () => {
        if (searchLoading && query.length > 2) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <ThemedText color="textMuted" style={styles.loadingText}>
                        Searching books...
                    </ThemedText>
                </View>
            );
        }

        if (searchError) {
            return (
                <View style={styles.centerContainer}>
                    <ThemedText color="danger" style={styles.errorText}>
                        Failed to search books. Please try again.
                    </ThemedText>
                </View>
            );
        }

        if (searchResults?.bookList && searchResults.bookList.length > 0) {
            return (
                <ScrollView
                    style={styles.resultsList}
                    contentContainerStyle={styles.resultsContent}
                    showsVerticalScrollIndicator={false}
                >
                    {searchResults.bookList.map((item) => (
                        <TouchableOpacity
                            key={item.api_id || Math.random().toString()}
                            style={[styles.resultItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            onPress={() => handleBookSelection(item)}
                            disabled={isLoadingBookDetails}
                        >
                            <View style={styles.resultContent}>
                                {item.cover_image_url ? (
                                    <Image 
                                        source={{ uri: item.cover_image_url }} 
                                        style={styles.bookCover}
                                    />
                                ) : (
                                    <View style={[styles.bookCoverPlaceholder, { backgroundColor: colors.border }]}>
                                        <IconSymbol name="book" size={24} color={colors.textMuted} />
                                    </View>
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
                                <IconSymbol name="chevron.right" size={20} color={colors.textMuted} />
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            );
        }

        if (query.length > 2 && !searchLoading) {
            return (
                <View style={styles.centerContainer}>
                    <IconSymbol name="magnifyingglass" size={48} color={colors.textMuted} />
                    <ThemedText color="textMuted" style={styles.noResultsText}>
                        No books found for "{query}"
                    </ThemedText>
                    <ThemedText color="textMuted" style={styles.noResultsSubtext}>
                        Try a different search or add manually
                    </ThemedText>
                </View>
            );
        }

        if (query.length === 0) {
            return (
                <View style={styles.centerContainer}>
                    <IconSymbol name="magnifyingglass" size={48} color={colors.textMuted} />
                    <ThemedText color="textMuted" style={styles.promptText}>
                        Search for a book to get started
                    </ThemedText>
                    <ThemedText color="textMuted" style={styles.promptSubtext}>
                        We'll auto-fill the details for you
                    </ThemedText>
                </View>
            );
        }

        return null;
    };

    if (isLoadingBookDetails) {
        return (
            <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <ThemedText style={styles.loadingOverlayText}>Loading book details...</ThemedText>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ThemedText color="textMuted" style={styles.description}>
                Search our library to automatically fill in book details
            </ThemedText>

            <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <IconSymbol name="magnifyingglass" size={20} color={colors.textMuted} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search by title or author..."
                    placeholderTextColor={colors.textMuted}
                    autoCorrect={false}
                    autoCapitalize="words"
                    autoFocus={true}
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')}>
                        <IconSymbol name="xmark.circle.fill" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.resultsContainer}>
                {renderSearchResults()}
            </View>

            <View style={styles.manualEntryContainer}>
                <View style={[styles.divider, { backgroundColor: colors.border }]}>
                    <ThemedText color="textMuted" style={styles.dividerText}>OR</ThemedText>
                </View>
                
                <TouchableOpacity
                    style={[styles.manualEntryButton, { borderColor: colors.primary }]}
                    onPress={onManualEntry}
                >
                    <IconSymbol name="pencil" size={20} color={colors.primary} />
                    <ThemedText color="primary" style={styles.manualEntryText}>
                        Can't find your book? Add it manually
                    </ThemedText>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    resultsContainer: {
        flex: 1,
        marginTop: 20,
    },
    resultsList: {
        flex: 1,
    },
    resultsContent: {
        paddingBottom: 20,
    },
    resultItem: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    resultContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bookCover: {
        width: 50,
        height: 75,
        borderRadius: 6,
        marginRight: 12,
    },
    bookCoverPlaceholder: {
        width: 50,
        height: 75,
        borderRadius: 6,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookInfo: {
        flex: 1,
    },
    bookTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    bookAuthor: {
        fontSize: 14,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    loadingText: {
        fontSize: 16,
        marginTop: 12,
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
    },
    noResultsText: {
        fontSize: 18,
        fontWeight: '500',
        marginTop: 16,
        textAlign: 'center',
    },
    noResultsSubtext: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    promptText: {
        fontSize: 18,
        fontWeight: '500',
        marginTop: 16,
        textAlign: 'center',
    },
    promptSubtext: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    manualEntryContainer: {
        paddingTop: 20,
    },
    divider: {
        height: 1,
        marginVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dividerText: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        fontSize: 14,
        position: 'absolute',
    },
    manualEntryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderRadius: 12,
        paddingVertical: 16,
        gap: 8,
    },
    manualEntryText: {
        fontSize: 16,
        fontWeight: '600',
    },
    loadingOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingOverlayText: {
        marginTop: 12,
        fontSize: 16,
    },
});