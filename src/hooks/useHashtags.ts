import { MUTATION_KEYS, QUERY_KEYS } from '@/constants/queryKeys';
import { posthog } from '@/lib/posthog';
import { useAuth } from '@/providers/AuthProvider';
import { hashtagsService } from '@/services/hashtags.service';
import { Hashtag, HashtagInsert, NoteHashtag } from '@/types/hashtags.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useGetAllHashtags = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery<Hashtag[]>({
    queryKey: userId
      ? QUERY_KEYS.HASHTAGS.ALL(userId)
      : ['hashtags', undefined],
    queryFn: async () => {
      if (!userId) return [];
      return hashtagsService.getAllHashtags(userId);
    },
    enabled: !!userId,
  });
};

export const useGetNoteHashtags = (noteId: string | undefined) => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery<Hashtag[]>({
    queryKey:
      userId && noteId
        ? QUERY_KEYS.HASHTAGS.BY_NOTE(userId, noteId)
        : ['hashtags', undefined, undefined],
    queryFn: async () => {
      if (!userId || !noteId) return [];
      return hashtagsService.getNoteHashtags(userId, noteId);
    },
    enabled: !!userId && !!noteId,
  });
};

export const useGetAllNoteHashtags = (deadlineId: string | undefined) => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery<NoteHashtag[]>({
    queryKey:
      userId && deadlineId
        ? QUERY_KEYS.HASHTAGS.ALL_NOTE_HASHTAGS(userId, deadlineId)
        : ['note_hashtags', undefined, undefined],
    queryFn: async () => {
      if (!userId || !deadlineId) return [];
      return hashtagsService.getAllNoteHashtags(userId, deadlineId);
    },
    enabled: !!userId && !!deadlineId,
  });
};

export const useCreateHashtag = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.HASHTAGS.CREATE],
    mutationFn: async ({ hashtagData }: { hashtagData: HashtagInsert }) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return hashtagsService.createHashtag(userId, hashtagData);
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.HASHTAGS.ALL(userId),
        });
      }
    },
    onError: (error: Error) => {
      console.error('Error creating hashtag:', error);
      posthog.captureException(error);
    },
  });
};

export const useAddHashtagToNote = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.HASHTAGS.ADD_TO_NOTE],
    mutationFn: async ({
      noteId,
      hashtagId,
    }: {
      noteId: string;
      hashtagId: string;
    }) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return hashtagsService.addHashtagToNote(userId, noteId, hashtagId);
    },
    onSuccess: (_, variables) => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.HASHTAGS.BY_NOTE(userId, variables.noteId),
        });
      }
    },
    onError: (error: Error) => {
      console.error('Error adding hashtag to note:', error);
      posthog.captureException(error);
    },
  });
};

export const useRemoveHashtagFromNote = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.HASHTAGS.REMOVE_FROM_NOTE],
    mutationFn: async ({
      noteId,
      hashtagId,
    }: {
      noteId: string;
      hashtagId: string;
    }) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return hashtagsService.removeHashtagFromNote(userId, noteId, hashtagId);
    },
    onSuccess: (_, variables) => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.HASHTAGS.BY_NOTE(userId, variables.noteId),
        });
      }
    },
    onError: (error: Error) => {
      console.error('Error removing hashtag from note:', error);
      posthog.captureException(error);
    },
  });
};

export const useSyncNoteHashtags = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.HASHTAGS.SYNC],
    mutationFn: async ({
      noteId,
      noteText,
      deadlineId: _deadlineId,
    }: {
      noteId: string;
      noteText: string;
      deadlineId: string;
    }) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return hashtagsService.syncNoteHashtags(userId, noteId, noteText);
    },
    onSuccess: (_, variables) => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.HASHTAGS.BY_NOTE(userId, variables.noteId),
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
    onError: (error: Error) => {
      console.error('Error syncing note hashtags:', error);
      posthog.captureException(error);
    },
  });
};
