import BookSearchInput from '@/components/shared/BookSearchInput';
import CustomDropdown from '@/components/shared/CustomDropdown';
import CustomInput from '@/components/shared/CustomInput';
import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DeadlineFormData } from '@/utils/deadlineFormSchema';
import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useCallback, useEffect, useState } from 'react';
import { Control, useWatch } from 'react-hook-form';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { FormatSelector } from './FormatSelector';

interface DeadlineFormStep1Props {
    control: Control<DeadlineFormData>;
    selectedFormat: 'physical' | 'ebook' | 'audio';
    onFormatChange: (format: 'physical' | 'ebook' | 'audio') => void;
    isEditMode?: boolean;
    setValue: (name: keyof DeadlineFormData, value: any) => void;
}

export const DeadlineFormStep1 = ({
    control,
    selectedFormat,
    onFormatChange,
    isEditMode = false,
    setValue
}: DeadlineFormStep1Props) => {
    const primary = useThemeColor({}, 'primary');
    const [showBookSearch, setShowBookSearch] = useState(false);
    const [selectedBook, setSelectedBook] = useState<any>(null);
    
    // Watch for changes to detect if book is manually cleared
    const watchedTitle = useWatch({ control, name: 'bookTitle' });
    const watchedBookId = useWatch({ control, name: 'book_id' });
    
    // Clear book selection if user manually clears the title and we have a linked book
    useEffect(() => {
        if (!watchedTitle && selectedBook && watchedBookId) {
            setSelectedBook(null);
            setValue('book_id', undefined);
            setValue('api_id', undefined);
        }
    }, [watchedTitle, selectedBook, watchedBookId, setValue]);

    const handleBookSelection = useCallback((book: any) => {
        if (book) {
            setSelectedBook(book);
            setValue('bookTitle', book.title);
            setValue('bookAuthor', book.author || '');
            setValue('book_id', book.id);
            setValue('api_id', book.api_id);
            
            // Only auto-populate quantity/time if user hasn't entered values yet
            const currentTotalQuantity = control._getWatch('totalQuantity');
            
            if (selectedFormat !== 'audio' && book.total_pages) {
                // Only update if user hasn't entered pages yet
                if (!currentTotalQuantity || currentTotalQuantity === 0) {
                    setValue('totalQuantity', book.total_pages);
                }
            }
        } else {
            setSelectedBook(null);
            setValue('book_id', undefined);
            setValue('api_id', undefined);
        }
        setShowBookSearch(false);
    }, [setValue, selectedFormat, control]);

    const getTotalQuantityLabel = () => {
        switch (selectedFormat) {
            case 'audio':
                return 'Total Time';
            default:
                return 'Total Pages';
        }
    };

    const getTotalQuantityPlaceholder = () => {
        switch (selectedFormat) {
            case 'audio':
                return 'Hours';
            default:
                return 'How many pages total?';
        }
    };

    return (
        <View style={{ flex: 1, gap: 24 }}>
            <ThemedText color="textMuted" style={{lineHeight: 24, fontSize: 16}}>
                Add a book with a deadline to track your reading progress.
            </ThemedText>

            {/* Book Search Section */}
            <View>
                <View style={styles.sectionHeader}>
                    <ThemedText variant="title" style={{marginBottom: 8}}>Find Book (Optional)</ThemedText>
                    <TouchableOpacity
                        onPress={() => setShowBookSearch(!showBookSearch)}
                        style={[styles.toggleButton, { borderColor: primary }]}
                        testID="toggle-book-search"
                    >
                        <IconSymbol 
                            name={showBookSearch ? "chevron.up" : "chevron.down"} 
                            size={16} 
                            color={primary} 
                        />
                        <ThemedText color="primary" style={styles.toggleText}>
                            {showBookSearch ? 'Hide search' : 'Search library'}
                        </ThemedText>
                    </TouchableOpacity>
                </View>
                
                {showBookSearch && (
                    <View style={{marginTop: 8}}>
                        <BookSearchInput
                            onBookSelected={handleBookSelection}
                            selectedBook={selectedBook}
                            placeholder="Search for a book to auto-fill details..."
                            testID="book-search-input-form"
                        />
                        <ThemedText color="textMuted" style={{marginTop: 6, lineHeight: 18, fontSize: 14}}>
                            Search our library to automatically fill in book details and get accurate page counts
                        </ThemedText>
                    </View>
                )}
            </View>

            <View>
                <ThemedText variant="title" style={{marginBottom: 8}}>Book Title *</ThemedText>
                <CustomInput
                    control={control}
                    name="bookTitle"
                    testID='input-bookTitle'
                    placeholder="Enter the book title"
                />
                {selectedBook && (
                    <ThemedText color="primary" style={styles.autoFilledIndicator}>
                        ✓ Auto-filled from linked book
                    </ThemedText>
                )}
            </View>

            <View>
                <ThemedText variant="title" style={{marginBottom: 8}}>Author</ThemedText>
                <CustomInput
                    control={control}
                    name="bookAuthor"
                    testID='input-bookAuthor'
                    placeholder="Author name (optional)"
                />
                {selectedBook && selectedBook.author && (
                    <ThemedText color="primary" style={styles.autoFilledIndicator}>
                        ✓ Auto-filled from linked book
                    </ThemedText>
                )}
            </View>

            <View>
                <ThemedText variant="title" style={{marginBottom: 8}}>Format</ThemedText>
                <FormatSelector
                    selectedFormat={selectedFormat}
                    onSelectFormat={onFormatChange}
                    disabled={isEditMode}
                />
                <ThemedText color="textMuted" style={{marginTop: 6, lineHeight: 18}}>
                    {isEditMode 
                        ? 'Format cannot be changed after creation'
                        : 'This affects how we calculate your reading pace'
                    }
                </ThemedText>
            </View>

            <View>
                <ThemedText variant="title" style={{marginBottom: 8}}>Where is this book from?</ThemedText>
                <CustomDropdown
                    control={control}
                    name="source"
                    placeholder="Select a source"
                    options={[
                        { label: 'ARC', value: 'arc' },
                        { label: 'Library', value: 'library' },
                        { label: 'Personal', value: 'personal' },
                        { label: 'Book Club', value: 'bookclub' }
                    ]}
                    allowCustom={true}
                    customPlaceholder="Enter custom source"
                    testID="dropdown-source"
                />
            </View>

            <View>
                <ThemedText variant="title" style={{marginBottom: 8}}>{getTotalQuantityLabel()}</ThemedText>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                        <CustomInput
                            control={control}
                            name="totalQuantity"
                            inputType="integer"
                            placeholder={getTotalQuantityPlaceholder()}
                            keyboardType="numeric"
                            testID='input-totalQuantity'
                        />
                    </View>
                    {selectedFormat === 'audio' ?
                        <View style={{ flex: 1 }}>
                            <CustomInput
                                control={control}
                                name="totalMinutes"
                                inputType="integer"
                                placeholder="Minutes (optional)"
                                keyboardType="numeric"
                                testID='input-totalMinutes'
                            />
                        </View> : null}
                </View>
                <ThemedText color="textMuted" style={{marginTop: 6, lineHeight: 18}}>
                    We&apos;ll use this to calculate your daily reading pace
                </ThemedText>
                {selectedBook && (
                    (selectedFormat === 'audio' && selectedBook.total_duration) ||
                    (selectedFormat !== 'audio' && selectedBook.total_pages)
                ) && (
                    <ThemedText color="primary" style={styles.autoFilledIndicator}>
                        ✓ Available from linked book (only fills if empty)
                    </ThemedText>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderRadius: 16,
        gap: 6,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '500',
    },
    autoFilledIndicator: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
    },
}); 