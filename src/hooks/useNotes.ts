import { MUTATION_KEYS, QUERY_KEYS } from '@/constants/queryKeys';
import { useAuth } from '@/providers/AuthProvider';
import { notesService } from '@/services';
import { DeadlineNote } from '@/types/notes.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useGetNotes = (deadlineId: string | undefined) => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery<DeadlineNote[]>({
    queryKey:
      userId && deadlineId
        ? QUERY_KEYS.NOTES.BY_DEADLINE(userId, deadlineId)
        : ['notes', undefined, undefined],
    queryFn: async () => {
      if (!userId || !deadlineId) return [];
      return notesService.getNotes(userId, deadlineId);
    },
    enabled: !!userId && !!deadlineId,
  });
};

export const useAddNote = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.NOTES.ADD],
    mutationFn: async ({
      deadlineId,
      noteText,
      deadlineProgress,
    }: {
      deadlineId: string;
      noteText: string;
      deadlineProgress?: number;
    }) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return notesService.addNote(
        userId,
        deadlineId,
        noteText,
        deadlineProgress
      );
    },
    onSuccess: (_, variables) => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.NOTES.BY_DEADLINE(userId, variables.deadlineId),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.HASHTAGS.ALL(userId),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.HASHTAGS.ALL_NOTE_HASHTAGS(
            userId,
            variables.deadlineId
          ),
        });
      }
    },
    onError: error => {
      console.error('Error adding note:', error);
    },
  });
};

export const useUpdateNote = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.NOTES.UPDATE],
    mutationFn: async ({
      noteId,
      noteText,
    }: {
      noteId: string;
      deadlineId: string;
      noteText: string;
    }) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return notesService.updateNote(noteId, userId, noteText);
    },
    onSuccess: (_, variables) => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.NOTES.BY_DEADLINE(userId, variables.deadlineId),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.HASHTAGS.ALL(userId),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.HASHTAGS.ALL_NOTE_HASHTAGS(
            userId,
            variables.deadlineId
          ),
        });
      }
    },
    onError: error => {
      console.error('Error updating note:', error);
    },
  });
};

export const useDeleteNote = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.NOTES.DELETE],
    mutationFn: async ({ noteId }: { noteId: string; deadlineId: string }) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return notesService.deleteNote(noteId, userId);
    },
    onSuccess: (_, variables) => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.NOTES.BY_DEADLINE(userId, variables.deadlineId),
        });
      }
    },
    onError: error => {
      console.error('Error deleting note:', error);
    },
  });
};
