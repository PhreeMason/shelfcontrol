import { MUTATION_KEYS, QUERY_KEYS } from '@/constants/queryKeys';
import { useAuth } from '@/providers/AuthProvider';
import { tagsService } from '@/services/tags.service';
import { DeadlineTag, TagInsert, TagWithDetails } from '@/types/tags.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useGetAllTags = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery<TagWithDetails[]>({
    queryKey: userId ? QUERY_KEYS.TAGS.ALL(userId) : ['tags', undefined],
    queryFn: async () => {
      if (!userId) return [];
      return tagsService.getAllTags(userId);
    },
    enabled: !!userId,
  });
};

export const useGetDeadlineTags = (deadlineId: string | undefined) => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery<TagWithDetails[]>({
    queryKey:
      userId && deadlineId
        ? QUERY_KEYS.TAGS.BY_DEADLINE(userId, deadlineId)
        : ['tags', undefined, undefined],
    queryFn: async () => {
      if (!userId || !deadlineId) return [];
      return tagsService.getDeadlineTags(userId, deadlineId);
    },
    enabled: !!userId && !!deadlineId,
  });
};

export const useGetAllDeadlineTags = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery<DeadlineTag[]>({
    queryKey: userId
      ? QUERY_KEYS.TAGS.ALL_DEADLINE_TAGS(userId)
      : ['deadline_tags', undefined],
    queryFn: async () => {
      if (!userId) return [];
      return tagsService.getAllDeadlineTags(userId);
    },
    enabled: !!userId,
  });
};

export const useCreateTag = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.TAGS.CREATE],
    mutationFn: async ({ tagData }: { tagData: TagInsert }) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return tagsService.createTag(userId, tagData);
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.TAGS.ALL(userId),
        });
      }
    },
    onError: error => {
      console.error('Error creating tag:', error);
    },
  });
};

export const useAddTagToDeadline = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.TAGS.ADD_TO_DEADLINE],
    mutationFn: async ({
      deadlineId,
      tagId,
    }: {
      deadlineId: string;
      tagId: string;
    }) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return tagsService.addTagToDeadline(userId, deadlineId, tagId);
    },
    onSuccess: (_, variables) => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.TAGS.BY_DEADLINE(userId, variables.deadlineId),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.TAGS.ALL_DEADLINE_TAGS(userId),
        });
      }
    },
    onError: error => {
      console.error('Error adding tag to deadline:', error);
    },
  });
};

export const useRemoveTagFromDeadline = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.TAGS.REMOVE_FROM_DEADLINE],
    mutationFn: async ({
      deadlineId,
      tagId,
    }: {
      deadlineId: string;
      tagId: string;
    }) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return tagsService.removeTagFromDeadline(userId, deadlineId, tagId);
    },
    onSuccess: (_, variables) => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.TAGS.BY_DEADLINE(userId, variables.deadlineId),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.TAGS.ALL_DEADLINE_TAGS(userId),
        });
      }
    },
    onError: error => {
      console.error('Error removing tag from deadline:', error);
    },
  });
};
