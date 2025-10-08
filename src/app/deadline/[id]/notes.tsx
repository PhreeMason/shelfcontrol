import { ThemedText, ThemedView } from '@/components/themed';
import { useGetDeadlineById } from '@/hooks/useDeadlines';
import { useAddNote, useGetNotes } from '@/hooks/useNotes';
import { useTheme } from '@/hooks/useThemeColor';
import { dayjs } from '@/lib/dayjs';
import { DeadlineNote } from '@/types/notes.types';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
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

  const { data: deadline } = useGetDeadlineById(id);
  const { data: notes, isLoading } = useGetNotes(id);
  const addNoteMutation = useAddNote();

  const currentProgress =
    deadline?.progress && deadline.progress.length > 0
      ? Math.max(...deadline.progress.map(p => p.current_progress))
      : 0;

  const currentProgressPercentage = deadline?.total_quantity
    ? Math.round((currentProgress / deadline.total_quantity) * 100)
    : 0;

  const handleAddNote = () => {
    if (!noteText.trim() || !id) return;

    addNoteMutation.mutate(
      {
        deadlineId: id,
        noteText: noteText.trim(),
        deadlineProgress: currentProgressPercentage,
      },
      {
        onSuccess: () => {
          setNoteText('');
        },
      }
    );
  };

  const renderNote = ({ item }: { item: DeadlineNote }) => {
    const formattedDate = dayjs(item.created_at).format('MMM D, h:mma');
    const progressText = `At ${item.deadline_progress}%`;

    return (
      <View style={styles.noteItem}>
        <ThemedText style={styles.noteText}>{item.note_text}</ThemedText>
        <ThemedText style={styles.noteMetadata}>
          {formattedDate} • {progressText}
        </ThemedText>
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>
          Notes for {deadline?.book_title || ''}
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
            onSubmitEditing={handleAddNote}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !noteText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleAddNote}
            disabled={!noteText.trim()}
          >
            <ThemedText
              style={[
                styles.sendButtonText,
                !noteText.trim() && styles.sendButtonTextDisabled,
              ]}
            >
              Add
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
    padding: 16,
    flexGrow: 1,
  },
  noteItem: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  noteText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  noteMetadata: {
    fontSize: 13,
    opacity: 0.6,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#007AFF',
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
    color: '#007AFF',
    fontWeight: '600',
  },
});
