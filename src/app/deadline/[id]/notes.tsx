import AppHeader from '@/components/shared/AppHeader';
import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useGetDeadlineById } from '@/hooks/useDeadlines';
import {
  useAddNote,
  useDeleteNote,
  useGetNotes,
  useUpdateNote,
} from '@/hooks/useNotes';
import { useTheme } from '@/hooks/useThemeColor';
import { dayjs } from '@/lib/dayjs';
import { analytics } from '@/lib/analytics/client';
import { DeadlineNote } from '@/types/notes.types';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
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

  const { data: deadline } = useGetDeadlineById(id);
  const { data: notes, isLoading } = useGetNotes(id);
  const addNoteMutation = useAddNote();
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();

  useEffect(() => {
    analytics.track('notes_screen_viewed', {
      deadline_id: id,
      existing_notes_count: notes?.length || 0,
    });

    return () => {
      if (noteText.trim().length > 0 && !editingNoteId) {
        analytics.track('note_creation_cancelled');
      }
    };
  }, []);

  const currentProgress =
    deadline?.progress && deadline.progress.length > 0
      ? Math.max(...deadline.progress.map(p => p.current_progress))
      : 0;

  const currentProgressPercentage = deadline?.total_quantity
    ? Math.round((currentProgress / deadline.total_quantity) * 100)
    : 0;

  const handleSubmitNote = () => {
    if (!noteText.trim() || !id) return;

    if (editingNoteId) {
      updateNoteMutation.mutate(
        {
          noteId: editingNoteId,
          deadlineId: id,
          noteText: noteText.trim(),
        },
        {
          onSuccess: () => {
            const lengthDelta = noteText.trim().length - initialNoteTextRef.current.length;
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
      addNoteMutation.mutate(
        {
          deadlineId: id,
          noteText: noteText.trim(),
          deadlineProgress: currentProgressPercentage,
        },
        {
          onSuccess: () => {
            analytics.track('note_created', {
              note_length: noteText.trim().length,
              progress_percentage: currentProgressPercentage,
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
    analytics.track('note_copied');
  };

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
        <ThemedText style={styles.noteText}>{item.note_text}</ThemedText>
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
      <AppHeader title="Notes" onBack={() => router.back()} />
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>
          {deadline?.book_title || 'Deadline'}
        </ThemedText>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={100}
      >
        <FlatList
          data={notes || []}
          inverted={true}
          renderItem={renderNote}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            isLoading ? (
              <ThemedView style={styles.emptyContainer}>
                <ThemedText>Loading notes...</ThemedText>
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

        <View
          style={[styles.inputContainer, { borderTopColor: colors.border }]}
        >
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.surface, color: colors.text },
            ]}
            placeholder="Add notes about this book..."
            placeholderTextColor={colors.textSecondary}
            value={noteText}
            onChangeText={setNoteText}
            multiline
            onSubmitEditing={handleSubmitNote}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !noteText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSubmitNote}
            disabled={!noteText.trim()}
          >
            <ThemedText
              style={[
                styles.sendButtonText,
                !noteText.trim() && styles.sendButtonTextDisabled,
              ]}
            >
              {editingNoteId ? 'Update' : 'Add'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    gap: 4,
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
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.light.darkPurple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButtonTextDisabled: {
    color: '#999',
  },
  doneButton: {
    fontSize: 17,
    color: Colors.light.darkPurple,
    fontWeight: '600',
  },
});
