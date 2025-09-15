import { useAuth } from "@/providers/AuthProvider";
import { AddDeadlineParams, deadlinesService, UpdateDeadlineParams } from "@/services";
import { ReadingDeadlineWithProgress } from "@/types/deadline.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useAddDeadline = () => {
    const { profile: user } = useAuth();
    const userId = user?.id;
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ['addDeadline'],
        mutationFn: async (params: AddDeadlineParams) => {
            if (!userId) {
                throw new Error("User not authenticated");
            }
            return deadlinesService.addDeadline(userId, params);
        },
        onSuccess: () => {
            // Invalidate and refetch deadlines after successful addition
            queryClient.invalidateQueries({ queryKey: ['deadlines', userId] });
        },
        onError: (error) => {
            console.error("Error adding deadline:", error);
        },
    })
}

export const useUpdateDeadline = () => {
    const { profile: user } = useAuth();
    const userId = user?.id;
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ['updateDeadline'],
        mutationFn: async (params: UpdateDeadlineParams) => {
            if (!userId) {
                throw new Error("User not authenticated");
            }
            return deadlinesService.updateDeadline(userId, params);
        },
        onSuccess: () => {
            // Invalidate and refetch deadlines after successful update
            queryClient.invalidateQueries({ queryKey: ['deadlines', userId] });
        },
        onError: (error) => {
            console.error("Error updating deadline:", error);
        },
    })
}

export const useDeleteDeadline = () => {
    const { profile: user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ['deleteDeadline'],
        mutationFn: async (deadlineId: string) => {
            if (!user?.id) {
                throw new Error("User not authenticated");
            }
            return deadlinesService.deleteDeadline(user.id, deadlineId);
        },
        onSuccess: () => {
            // Invalidate and refetch deadlines after successful deletion
            queryClient.invalidateQueries({ queryKey: ['deadlines', user?.id] });
        },
        onError: (error) => {
            console.error("Error deleting deadline:", error);
        },
    })
}

export const useUpdateDeadlineProgress = () => {
    const { profile: user } = useAuth();
    const userId = user?.id;
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ['updateDeadlineProgress'],
        mutationFn: async (progressDetails: {
            deadlineId: string;
            currentProgress: number;
            timeSpentReading?: number;
        }) => {
            if (!userId) {
                throw new Error("User not authenticated");
            }
            return deadlinesService.updateDeadlineProgress(progressDetails);
        },
        onSuccess: () => {
            // Invalidate and refetch deadlines after successful update
            queryClient.invalidateQueries({ queryKey: ['deadlines', userId] });
        },
        onError: (error) => {
            console.error("Error updating deadline progress:", error);
        },
    })
}

export const useGetDeadlines = () => {
    const { session, profile: user } = useAuth();
    const userId = user?.id || session?.user?.id;

    return useQuery<ReadingDeadlineWithProgress[]>({
        queryKey: ['deadlines', userId],
        queryFn: async () => {
            if (!userId) throw new Error("User not authenticated");
            return deadlinesService.getDeadlines(userId);
        },
        enabled: !!userId,
        // staleTime: 1000 * 60 * 60 * 5, // 5 hours
    })
}

const useUpdateDeadlineStatus = (status: 'complete' | 'set_aside' | 'reading') => {
    const { session, profile: user } = useAuth();
    const userId = user?.id || session?.user?.id;
    const queryClient = useQueryClient();

    const getActionName = (status: string) => {
        switch (status) {
            case 'complete': return 'completing';
            case 'set_aside': return 'setting aside';
            case 'reading': return 'reactivating';
            default: return 'updating';
        }
    };

    const getMutationKey = (status: string) => {
        switch (status) {
            case 'complete': return 'completeDeadline';
            case 'set_aside': return 'setAsideDeadline';
            case 'reading': return 'reactivateDeadline';
            default: return 'updateDeadlineStatus';
        }
    };

    const actionName = getActionName(status);
    const mutationKey = getMutationKey(status);

    return useMutation({
        mutationKey: [mutationKey],
        mutationFn: async (deadlineId: string) => {
            if (!userId) {
                throw new Error("User not authenticated");
            }

            try {
                return await deadlinesService.updateDeadlineStatus(deadlineId, status);
            } catch (error) {
                console.error(`Error ${actionName} deadline:`, error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deadlines', userId] });
        },
        onError: (error) => {
            console.error(`Error ${actionName} deadline:`, error);
        },
    })
}

export const useCompleteDeadline = () => {
    const { session, profile: user } = useAuth();
    const userId = user?.id || session?.user?.id;
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ['completeDeadline'],
        mutationFn: async (deadlineId: string) => {
            if (!userId) {
                throw new Error("User not authenticated");
            }
            return deadlinesService.completeDeadline(userId, deadlineId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deadlines', userId] });
        },
        onError: (error) => {
            console.error('Error completing deadline:', error);
        },
    })
};

export const useSetAsideDeadline = () => useUpdateDeadlineStatus('set_aside');

export const useReactivateDeadline = () => useUpdateDeadlineStatus('reading');

export const useGetArchivedDeadlines = () => {
    const { session, profile: user } = useAuth();
    const userId = user?.id || session?.user?.id;

    return useQuery<ReadingDeadlineWithProgress[]>({
        queryKey: ['ArchivedDeadlines', userId],
        queryFn: async () => {
            if (!userId) throw new Error("User not authenticated");
            return deadlinesService.getArchivedDeadlines(userId);
        },
        enabled: !!userId,
        refetchOnWindowFocus: false,
    })
}

export const useGetDeadlineById = (deadlineId: string | undefined) => {
    const { session, profile: user } = useAuth();
    const userId = user?.id || session?.user?.id;

    return useQuery<ReadingDeadlineWithProgress | null>({
        queryKey: ['deadline', userId, deadlineId],
        queryFn: async () => {
            if (!userId || !deadlineId) return null;
            return deadlinesService.getDeadlineById(userId, deadlineId);
        },
        enabled: !!userId && !!deadlineId,
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

export const useDeleteFutureProgress = () => {
    const { session, profile: user } = useAuth();
    const userId = user?.id || session?.user?.id;
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ['deleteFutureProgress'],
        mutationFn: async ({ deadlineId, newProgress }: { deadlineId: string; newProgress: number }) => {
            if (!userId) {
                throw new Error("User not authenticated");
            }
            return deadlinesService.deleteFutureProgress(deadlineId, newProgress);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deadlines', userId] });
        },
        onError: (error) => {
            console.error("Error deleting future progress:", error);
        },
    })
}