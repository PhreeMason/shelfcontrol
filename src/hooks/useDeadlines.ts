import { MUTATION_KEYS, QUERY_KEYS } from '@/constants/queryKeys';
import { BOOK_FORMAT, DEADLINE_STATUS } from '@/constants/status';
import { analytics } from '@/lib/analytics/client';
import { useAuth } from '@/providers/AuthProvider';
import {
  AddDeadlineParams,
  deadlinesService,
  UpdateDeadlineParams,
} from '@/services';
import { Database } from '@/types/database.types';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { mergeWithDefaults } from '@/utils/typeaheadUtils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useAddDeadline = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.DEADLINES.ADD],
    mutationFn: async (params: AddDeadlineParams) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return deadlinesService.addDeadline(userId, params);
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DEADLINES.ALL(userId),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DEADLINES.TYPES(userId),
        });
      }
    },
    onError: (error: Error, variables) => {
      console.error('Error adding deadline:', error);
      analytics.track('deadline_creation_failed', {
        error_message: error.message,
        book_source: variables.bookData?.api_id ? 'search' : 'manual',
      });
    },
  });
};

export const useUpdateDeadline = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.DEADLINES.UPDATE],
    mutationFn: async (params: UpdateDeadlineParams) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return deadlinesService.updateDeadline(userId, params);
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DEADLINES.ALL(userId),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DEADLINES.TYPES(userId),
        });
      }
    },
    onError: (error: Error, variables) => {
      console.error('Error updating deadline:', error);
      analytics.track('deadline_update_failed', {
        error_message: error.message,
        deadline_id: variables.deadlineDetails.id ?? '',
      });
    },
  });
};

export const useUpdateDeadlineDate = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.DEADLINES.UPDATE_DATE],
    mutationFn: async ({
      deadlineId,
      newDate,
    }: {
      deadlineId: string;
      newDate: string;
    }) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return deadlinesService.updateDeadlineDate(userId, deadlineId, newDate);
    },
    onSuccess: (_data, variables) => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DEADLINES.ALL(userId),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DEADLINES.DETAIL(userId, variables.deadlineId),
        });
      }
    },
    onError: (error: Error, variables) => {
      console.error('Error updating deadline date:', error);
      analytics.track('deadline_date_update_failed', {
        error_message: error.message,
        deadline_id: variables.deadlineId,
      });
    },
  });
};

export const useUploadDeadlineCover = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.DEADLINES.UPLOAD_COVER],
    mutationFn: async ({
      uri,
      oldCoverPath,
    }: {
      uri: string;
      oldCoverPath?: string | null;
    }) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return deadlinesService.uploadCoverImage(userId, uri, oldCoverPath);
    },
    onSuccess: () => {
      if (userId) {
        // Invalidate all deadlines to refresh any that might display this cover
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DEADLINES.ALL(userId),
        });
      }
    },
    onError: (error: Error) => {
      console.error('Error uploading cover image:', error);
      analytics.track('cover_image_upload_failed', {
        error_message: error.message,
        deadline_id: '', // Not available at hook level - tracked at service level if needed
        failure_stage: error.message.includes('fetch') ? 'fetch' : 'upload',
      });
    },
  });
};

export const useDeleteDeadlineCover = () => {
  return useMutation({
    mutationKey: [MUTATION_KEYS.DEADLINES.DELETE_COVER],
    mutationFn: async (coverPath: string) => {
      return deadlinesService.deleteCoverImage(coverPath);
    },
    onError: (error: Error) => {
      console.error('Error deleting cover image:', error);
      analytics.track('cover_image_deletion_failed', {
        error_message: error.message,
        deadline_id: '', // Cover path doesn't contain deadline_id
      });
    },
  });
};

export const useDeleteDeadline = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.DEADLINES.DELETE],
    mutationFn: async (deadlineId: string) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return deadlinesService.deleteDeadline(userId, deadlineId);
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DEADLINES.ALL(userId),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DEADLINES.TYPES(userId),
        });
      }
    },
    onError: (error: Error, deadlineId) => {
      console.error('Error deleting deadline:', error);
      analytics.track('deadline_deletion_failed', {
        error_message: error.message,
        deadline_id: deadlineId,
      });
    },
  });
};

export const useUpdateDeadlineProgress = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.DEADLINES.UPDATE_PROGRESS],
    mutationFn: async (progressDetails: {
      deadlineId: string;
      currentProgress: number;
      timeSpentReading?: number;
    }) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return deadlinesService.updateDeadlineProgress(progressDetails);
    },
    onMutate: async progressDetails => {
      if (!userId) return;

      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.DEADLINES.ALL(userId),
      });

      const previousDeadlines = queryClient.getQueryData<
        ReadingDeadlineWithProgress[]
      >(QUERY_KEYS.DEADLINES.ALL(userId));

      queryClient.setQueryData<ReadingDeadlineWithProgress[]>(
        QUERY_KEYS.DEADLINES.ALL(userId),
        old => {
          if (!old) return old;

          return old.map(deadline => {
            if (deadline.id === progressDetails.deadlineId) {
              return {
                ...deadline,
                progress: [
                  ...deadline.progress,
                  {
                    id: 'temp-' + Date.now(),
                    deadline_id: deadline.id,
                    current_progress: progressDetails.currentProgress,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    ignore_in_calcs: false,
                    time_spent_reading:
                      progressDetails.timeSpentReading || null,
                  },
                ],
              };
            }
            return deadline;
          });
        }
      );

      return { previousDeadlines };
    },
    onError: (error: Error, variables, context) => {
      console.error('Error updating deadline progress:', error);
      analytics.track('deadline_progress_update_failed', {
        error_message: error.message,
        deadline_id: variables.deadlineId,
        progress_type: variables.timeSpentReading ? 'time' : 'pages',
      });

      if (context?.previousDeadlines && userId) {
        queryClient.setQueryData(
          QUERY_KEYS.DEADLINES.ALL(userId),
          context.previousDeadlines
        );
      }
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DEADLINES.ALL(userId),
        });
      }
    },
  });
};

export const useGetDeadlines = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery<ReadingDeadlineWithProgress[]>({
    queryKey: userId
      ? QUERY_KEYS.DEADLINES.ALL(userId)
      : ['deadlines', undefined],
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      return deadlinesService.getDeadlines(userId);
    },
    enabled: !!userId,
  });
};

const useUpdateDeadlineStatus = (
  status: Database['public']['Enums']['deadline_status_enum']
) => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const getActionName = (status: string) => {
    switch (status) {
      case DEADLINE_STATUS.COMPLETE:
        return 'completing';
      case DEADLINE_STATUS.DID_NOT_FINISH:
        return 'marking as did not finish';
      case DEADLINE_STATUS.READING:
        return 'reactivating';
      case DEADLINE_STATUS.PAUSED:
        return 'pausing';
      default:
        return 'updating';
    }
  };

  const getMutationKey = (status: string) => {
    switch (status) {
      case DEADLINE_STATUS.COMPLETE:
        return MUTATION_KEYS.DEADLINES.COMPLETE;
      case DEADLINE_STATUS.DID_NOT_FINISH:
        return MUTATION_KEYS.DEADLINES.DID_NOT_FINISH;
      default:
        return MUTATION_KEYS.DEADLINES.UPDATE_STATUS;
    }
  };

  const actionName = getActionName(status);
  const mutationKey = getMutationKey(status);

  return useMutation({
    mutationKey: [mutationKey],
    mutationFn: async (deadlineId: string) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      try {
        const isTerminalStatus =
          status === DEADLINE_STATUS.COMPLETE ||
          status === DEADLINE_STATUS.DID_NOT_FINISH;

        const result = await deadlinesService.updateDeadlineStatus(
          userId,
          deadlineId,
          status,
          isTerminalStatus
            ? { skipValidation: true, skipRefetch: true }
            : undefined
        );

        return result;
      } catch (error) {
        console.error(`Error ${actionName} deadline:`, error);
        throw error;
      }
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DEADLINES.ALL(userId),
        });
      }
    },
    onError: (error: Error, deadlineId) => {
      console.error(`Error ${actionName} deadline:`, error);

      // Track specific status update failures
      if (status === DEADLINE_STATUS.READING) {
        analytics.track('deadline_start_failed', {
          error_message: error.message,
          deadline_id: deadlineId,
        });
      } else if (status === DEADLINE_STATUS.PAUSED) {
        analytics.track('deadline_pause_failed', {
          error_message: error.message,
          deadline_id: deadlineId,
        });
      } else if (status === DEADLINE_STATUS.DID_NOT_FINISH) {
        analytics.track('deadline_dnf_failed', {
          error_message: error.message,
          deadline_id: deadlineId,
        });
      }
    },
  });
};

export const useCompleteDeadline = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.DEADLINES.COMPLETE],
    mutationFn: async ({
      deadlineId,
      deadline,
    }: {
      deadlineId: string;
      deadline?: {
        total_quantity: number;
        progress?: { current_progress: number }[];
      };
    }) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const result = await deadlinesService.completeDeadline(
        userId,
        deadlineId,
        deadline
      );

      return result;
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DEADLINES.ALL(userId),
        });
      }
    },
    onError: (error: Error, variables) => {
      console.error('Error completing deadline:', error);
      analytics.track('deadline_completion_failed', {
        error_message: error.message,
        deadline_id: variables.deadlineId,
      });
    },
  });
};

export const useStartReadingDeadline = () =>
  useUpdateDeadlineStatus(DEADLINE_STATUS.READING);

export const useDidNotFinishDeadline = () =>
  useUpdateDeadlineStatus(DEADLINE_STATUS.DID_NOT_FINISH);

export const useToReviewDeadline = () =>
  useUpdateDeadlineStatus(DEADLINE_STATUS.TO_REVIEW);

export const usePauseDeadline = () =>
  useUpdateDeadlineStatus(DEADLINE_STATUS.PAUSED);

export const useResumeDeadline = () =>
  useUpdateDeadlineStatus(DEADLINE_STATUS.READING);

export const useRejectDeadline = () =>
  useUpdateDeadlineStatus(DEADLINE_STATUS.REJECTED);

export const useWithdrawDeadline = () =>
  useUpdateDeadlineStatus(DEADLINE_STATUS.WITHDREW);

export const useGetDeadlineById = (deadlineId: string | undefined) => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery<ReadingDeadlineWithProgress | null>({
    queryKey:
      userId && deadlineId
        ? QUERY_KEYS.DEADLINES.DETAIL(userId, deadlineId)
        : ['deadline', undefined, undefined],
    queryFn: async () => {
      if (!userId || !deadlineId) return null;
      return deadlinesService.getDeadlineById(userId, deadlineId);
    },
    enabled: !!userId && !!deadlineId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export const useDeleteFutureProgress = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.DEADLINES.DELETE_FUTURE_PROGRESS],
    mutationFn: async ({
      deadlineId,
      newProgress,
    }: {
      deadlineId: string;
      newProgress: number;
    }) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return deadlinesService.deleteFutureProgress(deadlineId, newProgress);
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DEADLINES.ALL(userId),
        });
      }
    },
    onError: error => {
      console.error('Error deleting future progress:', error);
    },
  });
};

export const useGetUserProgressForToday = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: userId
      ? QUERY_KEYS.DEADLINES.PROGRESS(userId)
      : ['deadline_progress', undefined],
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      return deadlinesService.getUserProgressForToday(userId);
    },
    enabled: !!userId,
  });
};

export const useGetAudioProgressForToday = () => {
  const progressRecords = useGetUserProgressForToday();
  return {
    ...progressRecords,
    data: progressRecords.data?.filter(
      record => record.deadline.format === BOOK_FORMAT.AUDIO
    ),
  };
};

export const useGetReadingProgressForToday = () => {
  const progressRecords = useGetUserProgressForToday();
  return {
    ...progressRecords,
    data: progressRecords.data?.filter(
      record => record.deadline.format !== BOOK_FORMAT.AUDIO
    ),
  };
};

const DEFAULT_TYPES = ['ARC', 'Library', 'Personal', 'Book Club'];

export const useDeadlineTypes = () => {
  const { profile, session } = useAuth();
  const userId = profile?.id || session?.user?.id;

  const result = useQuery({
    queryKey: userId
      ? QUERY_KEYS.DEADLINES.TYPES(userId)
      : ['deadline', 'types', undefined],
    queryFn: async () => {
      try {
        if (!userId) {
          return DEFAULT_TYPES;
        }
        const userTypes = await deadlinesService.getUniqueDeadlineTypes(userId);
        return mergeWithDefaults(userTypes, DEFAULT_TYPES);
      } catch (error) {
        console.error('Error fetching deadline types:', error);
        return DEFAULT_TYPES;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  if (!userId) {
    return {
      ...result,
      data: DEFAULT_TYPES,
    };
  }

  return result;
};

const DEFAULT_SOURCES = ['NetGalley', 'Edelweiss', 'Direct'];

export const useAcquisitionSources = () => {
  const { profile, session } = useAuth();
  const userId = profile?.id || session?.user?.id;

  const result = useQuery({
    queryKey: userId
      ? QUERY_KEYS.DEADLINES.ACQUISITION_SOURCES(userId)
      : ['deadline', 'acquisition_sources', undefined],
    queryFn: async () => {
      try {
        if (!userId) {
          return DEFAULT_SOURCES;
        }
        const userSources =
          await deadlinesService.getUniqueAcquisitionSources(userId);
        return mergeWithDefaults(userSources, DEFAULT_SOURCES);
      } catch (error) {
        console.error('Error fetching acquisition sources:', error);
        return DEFAULT_SOURCES;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  if (!userId) {
    return {
      ...result,
      data: DEFAULT_SOURCES,
    };
  }

  return result;
};
