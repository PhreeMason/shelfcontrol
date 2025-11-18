import { NoteFilterSheet } from '@/components/features/notes/NoteFilterSheet';
import AppHeader from '@/components/shared/AppHeader';
import { HashtagText } from '@/components/shared/HashtagText';
import { ThemedText, ThemedView } from '@/components/themed';
import { ThemedIconButton } from '@/components/themed/ThemedIconButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useFetchBookById } from '@/hooks/useBooks';
import { useGetDeadlineById } from '@/hooks/useDeadlines';
import { useGetAllHashtags, useGetAllNoteHashtags } from '@/hooks/useHashtags';
import {
  useAddNote,
  useDeleteNote,
  useGetNotes,
  useUpdateNote,
} from '@/hooks/useNotes';
import { useTheme } from '@/hooks/useThemeColor';
import { analytics } from '@/lib/analytics/client';
import { dayjs } from '@/lib/dayjs';
import { DeadlineNote } from '@/types/notes.types';
import {
  extractHashtags,
  findHashtagAtCursor,
  MAX_HASHTAGS_PER_NOTE,
} from '@/utils/hashtagUtils';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Notes = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [noteText, setNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const initialNoteTextRef = useRef('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showTypeahead, setShowTypeahead] = useState(false);
  const [selectedHashtagIds, setSelectedHashtagIds] = useState<string[]>([]);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const { data: deadline } = useGetDeadlineById(id);
  const { data: bookData } = useFetchBookById(deadline?.book_id ?? null);
  const { data: notes, isLoading } = useGetNotes(id);
  const { data: allHashtags = [] } = useGetAllHashtags();
  const { data: noteHashtags = [] } = useGetAllNoteHashtags(id);
  const addNoteMutation = useAddNote();
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();
  const isSubmitting =
    addNoteMutation.isPending || updateNoteMutation.isPending;

  useEffect(() => {
    return () => {
      if (noteText.trim().length > 0 && !editingNoteId) {
        analytics.track('note_creation_cancelled');
      }
    };
  }, []);

  // Detect hashtag typing for typeahead
  const currentHashtag = useMemo(() => {
    return findHashtagAtCursor(noteText, cursorPosition);
  }, [noteText, cursorPosition]);

  // Filter hashtags for typeahead
  const typeaheadHashtags = useMemo(() => {
    if (!currentHashtag) return [];
    return allHashtags.filter(h =>
      h.name.toLowerCase().startsWith(currentHashtag.hashtag.toLowerCase())
    );
  }, [allHashtags, currentHashtag]);

  // Show typeahead when typing hashtag
  useEffect(() => {
    setShowTypeahead(!!currentHashtag && typeaheadHashtags.length > 0);
  }, [currentHashtag, typeaheadHashtags]);

  // Count hashtags in current note text for validation
  const currentHashtagCount = useMemo(() => {
    return extractHashtags(noteText).length;
  }, [noteText]);

  const hasHashtagLimitError = currentHashtagCount > MAX_HASHTAGS_PER_NOTE;

  // Filter notes by selected hashtags
  const filteredNotes = useMemo(() => {
    if (!notes || selectedHashtagIds.length === 0) return notes || [];

    const noteIdsByHashtag = new Map<string, Set<string>>();
    selectedHashtagIds.forEach(hashtagId => {
      const noteIds = noteHashtags
        .filter(nh => nh.hashtag_id === hashtagId)
        .map(nh => nh.note_id);
      noteIdsByHashtag.set(hashtagId, new Set(noteIds));
    });

    // OR logic: show note if it has ANY of the selected hashtags
    return notes.filter(note => {
      return selectedHashtagIds.some(hashtagId => {
        const noteIds = noteIdsByHashtag.get(hashtagId);
        return noteIds?.has(note.id);
      });
    });
  }, [notes, noteHashtags, selectedHashtagIds]);

  // Get unique hashtags used in this deadline's notes
  const usedHashtags = useMemo(() => {
    const hashtagIds = new Set(noteHashtags.map(nh => nh.hashtag_id));
    return allHashtags.filter(h => hashtagIds.has(h.id));
  }, [allHashtags, noteHashtags]);

  const handleSubmitNote = () => {
    if (!noteText.trim() || !id) return;

    // Validate hashtag limit
    if (hasHashtagLimitError) {
      Alert.alert(
        'Too Many Hashtags',
        `Notes can have a maximum of ${MAX_HASHTAGS_PER_NOTE} hashtags. You have ${currentHashtagCount} hashtags. Please remove some before saving.`
      );
      return;
    }

    if (editingNoteId) {
      updateNoteMutation.mutate(
        {
          noteId: editingNoteId,
          deadlineId: id,
          noteText: noteText.trim(),
        },
        {
          onSuccess: () => {
            const lengthDelta =
              noteText.trim().length - initialNoteTextRef.current.length;
            analytics.track('note_edited', {
              note_id: editingNoteId,
              length_delta: lengthDelta,
            });
            setNoteText('');
            setEditingNoteId(null);
            initialNoteTextRef.current = '';
          },
        }
      );
    } else {
      // Progress is now automatically calculated and stored in notesService.addNote()
      addNoteMutation.mutate(
        {
          deadlineId: id,
          noteText: noteText.trim(),
        },
        {
          onSuccess: createdNote => {
            analytics.track('note_created', {
              note_length: noteText.trim().length,
              progress_percentage: createdNote.deadline_progress,
            });
            setNoteText('');
          },
        }
      );
    }
  };

  const handleEditNote = (note: DeadlineNote) => {
    setNoteText(note.note_text);
    setEditingNoteId(note.id);
    initialNoteTextRef.current = note.note_text;
  };

  const handleDeleteNote = (note: DeadlineNote) => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (!id) return;
          deleteNoteMutation.mutate(
            {
              noteId: note.id,
              deadlineId: id,
            },
            {
              onSuccess: () => {
                analytics.track('note_deleted', {
                  note_id: note.id,
                });
              },
            }
          );
        },
      },
    ]);
  };

  const handleCopyNote = async (note: DeadlineNote) => {
    await Clipboard.setStringAsync(note.note_text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSelectHashtag = (hashtagName: string) => {
    if (!currentHashtag) return;

    const before = noteText.slice(0, currentHashtag.start);
    const after = noteText.slice(cursorPosition);
    const newText = `${before}#${hashtagName} ${after}`;

    setNoteText(newText);
    setCursorPosition(currentHashtag.start + hashtagName.length + 2); // +2 for # and space
    setShowTypeahead(false);
  };

  const handleTextChange = (text: string) => {
    setNoteText(text);
  };

  const handleSelectionChange = (event: any) => {
    setCursorPosition(event.nativeEvent.selection.start);
  };

  const handleHashtagPress = (_hashtagName: string, hashtagId: string) => {
    setSelectedHashtagIds([hashtagId]);
  };

  // Filter button for header
  const filterButton =
    usedHashtags.length > 0 ? (
      <View style={styles.filterButtonContainer}>
        {selectedHashtagIds.length > 0 && (
          <View style={styles.starIndicator}>
            <IconSymbol name="star.fill" size={12} color={colors.urgent} />
          </View>
        )}
        <ThemedIconButton
          icon="line.3.horizontal.decrease"
          onPress={() => setShowFilterSheet(true)}
          variant="ghost"
          iconColor={selectedHashtagIds.length > 0 ? 'accent' : 'background'}
          size="sm"
        />
      </View>
    ) : null;

  const renderNote = ({
    item,
    index,
  }: {
    item: DeadlineNote;
    index: number;
  }) => {
    const formattedDate = dayjs(item.created_at).format('MMM D, h:mma');
    const progressText = `At ${item.deadline_progress}%`;
    const isLateItemInList = index === 0;
    return (
      <View
        style={[styles.noteItem, isLateItemInList && { borderBottomWidth: 0 }]}
      >
        <HashtagText
          text={item.note_text}
          hashtags={allHashtags}
          style={[styles.noteText, { color: colors.text }]}
          onHashtagPress={handleHashtagPress}
        />
        <View style={styles.noteFooter}>
          <ThemedText style={styles.noteMetadata}>
            {formattedDate} • {progressText}
          </ThemedText>
          <View style={styles.noteActions}>
            <TouchableOpacity
              onPress={() => handleCopyNote(item)}
              style={styles.iconButton}
            >
              <IconSymbol
                name="doc.on.clipboard"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleEditNote(item)}
              style={styles.iconButton}
            >
              <IconSymbol
                name="pencil"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteNote(item)}
              style={styles.iconButton}
            >
              <IconSymbol
                name="trash.fill"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={['right', 'bottom', 'left']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader
        title="Notes"
        onBack={() => router.back()}
        rightElement={filterButton}
      />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {bookData?.cover_image_url && (
            <Image
              source={{ uri: bookData.cover_image_url }}
              style={styles.headerCover}
              resizeMode="cover"
            />
          )}
          <ThemedText style={styles.headerTitle}>
            {deadline?.book_title || 'Book'}
          </ThemedText>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={100}
      >
        <FlatList
          data={filteredNotes || []}
          inverted={true}
          renderItem={renderNote}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            isLoading ? (
              <ThemedView style={styles.emptyContainer}>
                <ThemedText>Loading notes...</ThemedText>
              </ThemedView>
            ) : selectedHashtagIds.length > 0 ? (
              <ThemedView style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>
                  No notes match the selected hashtags.
                </ThemedText>
              </ThemedView>
            ) : (
              <ThemedView style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>
                  No notes yet. Add your first note below.
                </ThemedText>
              </ThemedView>
            )
          }
        />

        {showTypeahead && typeaheadHashtags.length > 0 && (
          <View
            style={[
              styles.typeaheadContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <ScrollView
              style={styles.typeaheadScroll}
              keyboardShouldPersistTaps="handled"
            >
              {typeaheadHashtags.map(hashtag => (
                <TouchableOpacity
                  key={hashtag.id}
                  style={[
                    styles.typeaheadItem,
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() => handleSelectHashtag(hashtag.name)}
                >
                  <Text
                    style={[styles.typeaheadText, { color: hashtag.color }]}
                  >
                    #{hashtag.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View
          style={[styles.inputContainer, { borderTopColor: colors.border }]}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: hasHashtagLimitError ? '#ef4444' : 'transparent',
                  borderWidth: hasHashtagLimitError ? 1 : 0,
                },
              ]}
              placeholder="Add notes about this book. Use #hashtag to organize"
              placeholderTextColor={colors.textSecondary}
              value={noteText}
              onChangeText={handleTextChange}
              onSelectionChange={handleSelectionChange}
              multiline
              onSubmitEditing={handleSubmitNote}
              returnKeyType="done"
            />
            {hasHashtagLimitError && (
              <Text style={styles.hashtagLimitError}>
                Too many hashtags ({currentHashtagCount}/{MAX_HASHTAGS_PER_NOTE}
                ). Remove {currentHashtagCount - MAX_HASHTAGS_PER_NOTE} to save.
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: colors.darkPurple },
              (!noteText.trim() || isSubmitting || hasHashtagLimitError) &&
                styles.sendButtonDisabled,
            ]}
            onPress={handleSubmitNote}
            disabled={!noteText.trim() || isSubmitting || hasHashtagLimitError}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <ThemedText
                style={[
                  styles.sendButtonText,
                  { color: colors.textOnPrimary },
                  (!noteText.trim() || hasHashtagLimitError) &&
                    styles.sendButtonTextDisabled,
                ]}
              >
                {editingNoteId ? 'Update' : 'Add'}
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <NoteFilterSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        hashtags={usedHashtags}
        selectedHashtagIds={selectedHashtagIds}
        onHashtagsChange={setSelectedHashtagIds}
        filteredCount={filteredNotes.length}
      />
    </SafeAreaView>
  );
};

export default Notes;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    gap: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerCover: {
    width: 30,
    height: 45,
    borderRadius: 3,
  },
  headerTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
  },
  listContent: {
    padding: 4,
    flexGrow: 1,
  },
  noteItem: {
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingHorizontal: 12,
  },
  noteText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteMetadata: {
    fontSize: 13,
    opacity: 0.6,
  },
  noteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
  },
  input: {
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  hashtagLimitError: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
    fontWeight: '500',
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sendButtonTextDisabled: {
    opacity: 0.5,
  },
  doneButton: {
    fontSize: 17,
    fontWeight: '600',
  },
  typeaheadContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  typeaheadScroll: {
    maxHeight: 200,
  },
  typeaheadItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  typeaheadText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filterButtonContainer: {
    position: 'relative',
  },
  starIndicator: {
    position: 'absolute',
    top: 1,
    right: 1,
    zIndex: 1,
  },
});
