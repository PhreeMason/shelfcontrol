import { MUTATION_KEYS, QUERY_KEYS } from '@/constants/queryKeys';
import { BOOK_FORMAT, DEADLINE_STATUS } from '@/constants/status';
import { useAuth } from '@/providers/AuthProvider';
import {
  AddDeadlineParams,
  deadlinesService,
  UpdateDeadlineParams,
} from '@/services';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
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
          queryKey: QUERY_KEYS.DEADLINES.SOURCES(userId),
        });
      }
    },
    onError: error => {
      console.error('Error adding deadline:', error);
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
          queryKey: QUERY_KEYS.DEADLINES.SOURCES(userId),
        });
      }
    },
    onError: error => {
      console.error('Error updating deadline:', error);
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
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DEADLINES.ALL(userId),
        });
      }
    },
    onError: error => {
      console.error('Error updating deadline date:', error);
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
          queryKey: QUERY_KEYS.DEADLINES.SOURCES(userId),
        });
      }
    },
    onError: error => {
      console.error('Error deleting deadline:', error);
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
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DEADLINES.ALL(userId),
        });
      }
    },
    onError: error => {
      console.error('Error updating deadline progress:', error);
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
  status: 'complete' | 'paused' | 'reading' | 'did_not_finish'
) => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const getActionName = (status: string) => {
    switch (status) {
      case DEADLINE_STATUS.COMPLETE:
        return 'completing';
      case DEADLINE_STATUS.PAUSED:
        return 'pausing';
      case DEADLINE_STATUS.DID_NOT_FINISH:
        return 'marking as did not finish';
      case DEADLINE_STATUS.READING:
        return 'reactivating';
      default:
        return 'updating';
    }
  };

  const getMutationKey = (status: string) => {
    switch (status) {
      case DEADLINE_STATUS.COMPLETE:
        return MUTATION_KEYS.DEADLINES.COMPLETE;
      case DEADLINE_STATUS.PAUSED:
        return MUTATION_KEYS.DEADLINES.PAUSE;
      case DEADLINE_STATUS.DID_NOT_FINISH:
        return MUTATION_KEYS.DEADLINES.DID_NOT_FINISH;
      case DEADLINE_STATUS.READING:
        return MUTATION_KEYS.DEADLINES.REACTIVATE;
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
        return await deadlinesService.updateDeadlineStatus(deadlineId, status);
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
    onError: error => {
      console.error(`Error ${actionName} deadline:`, error);
    },
  });
};

export const useCompleteDeadline = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.DEADLINES.COMPLETE],
    mutationFn: async (deadlineId: string) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return deadlinesService.completeDeadline(userId, deadlineId);
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DEADLINES.ALL(userId),
        });
      }
    },
    onError: error => {
      console.error('Error completing deadline:', error);
    },
  });
};

export const usePauseDeadline = () =>
  useUpdateDeadlineStatus(DEADLINE_STATUS.PAUSED);

export const useReactivateDeadline = () =>
  useUpdateDeadlineStatus(DEADLINE_STATUS.READING);

export const useStartReadingDeadline = () =>
  useUpdateDeadlineStatus(DEADLINE_STATUS.READING);

export const useDidNotFinishDeadline = () =>
  useUpdateDeadlineStatus(DEADLINE_STATUS.DID_NOT_FINISH);

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
