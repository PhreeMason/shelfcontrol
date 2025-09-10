import { generateId, supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { ReadingDeadlineInsert, ReadingDeadlineProgressInsert, ReadingDeadlineWithProgress } from "@/types/deadline.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useAddDeadline = () => {
    const { profile: user } = useAuth();
    const userId = user?.id;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationKey: ['addDeadline'],
        mutationFn: async (
            {
                deadlineDetails,
                progressDetails,
                bookData,
                startDate
            }: {
                deadlineDetails: Omit<ReadingDeadlineInsert, 'user_id'>,
                progressDetails: ReadingDeadlineProgressInsert,
                bookData?: { api_id: string; book_id?: string },
                startDate?: Date
            }) => {
            if (!userId) {
                throw new Error("User not authenticated");
            }
            
            // Generate IDs
            const finalDeadlineId = generateId('rd');
            const finalProgressId = generateId('rdp');
            
            deadlineDetails.id = finalDeadlineId;
            progressDetails.id = finalProgressId;
            progressDetails.deadline_id = finalDeadlineId;

            // Handle book linking if bookData is provided
            let finalBookId = deadlineDetails.book_id;
            if (bookData?.api_id && !bookData.book_id) {
                // Book was selected but may not exist in our database yet
                // Check if book exists first
                const { data: existingBook } = await supabase
                    .from('books')
                    .select('id')
                    .eq('api_id', bookData.api_id)
                    .single();
                
                if (existingBook) {
                    finalBookId = existingBook.id;
                } else {
                    // Need to fetch and insert book data
                    try {
                        const bookResponse = await supabase.functions.invoke('book-data', {
                            body: { api_id: bookData.api_id },
                        });
                        
                        if (bookResponse.data && !bookResponse.error) {
                            const finalNewBookId = generateId('book');
                            const { error: insertBookError } = await supabase
                                .from('books')
                                .insert({
                                    ...bookResponse.data,
                                    id: finalNewBookId,
                                });
                            
                            if (!insertBookError) {
                                finalBookId = finalNewBookId;
                            }
                        }
                    } catch (bookError) {
                        console.warn('Failed to fetch/insert book data:', bookError);
                        // Continue without book linking if it fails
                    }
                }
            } else if (bookData?.book_id) {
                finalBookId = bookData.book_id;
            }

            const { data, error } = await supabase.from('deadlines').insert({
                ...deadlineDetails,
                book_id: finalBookId || null,
                user_id: userId,
            })
                .select()
                .single();

            if (error) {
                console.error('Error inserting deadline:', error);
                throw new Error(error.message);
            }

            const { data: progressData, error: progressError } = await supabase.from('deadline_progress')
                .insert(progressDetails)
                .select()
                .single();

                        if (progressError) {
                console.error('Error inserting progress:', progressError);
                throw new Error(progressError.message);
            }

            // Create deadline status entry. If the user specified when they started reading (startDate),
            // use that for the status created_at to accurately track when they transitioned to "reading" status.
            // This ensures historical accuracy for users who started reading before adding the deadline.
            const { data: statusData, error: statusError } = await supabase.from('deadline_status')
                .insert({
                    deadline_id: finalDeadlineId,
                    status: 'reading',
                    created_at: startDate ? startDate.toISOString() : new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (statusError) {
                console.error('Error inserting initial status:', statusError);
                throw new Error(statusError.message);
            }
    
            const result = {
                ...data,
                id: finalDeadlineId,
                user_id: userId,
                progress: progressData,
                status: [statusData]
            }
            return result;
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
        mutationFn: async (
            {
                deadlineDetails,
                progressDetails,
                bookData: _bookData
            }: {
                deadlineDetails: ReadingDeadlineInsert,
                progressDetails: ReadingDeadlineProgressInsert,
                bookData?: { api_id: string; book_id?: string }
            }) => {
            if (!userId) {
                throw new Error("User not authenticated");
            }
            
            // Update deadline
            const { data: deadlineData, error: deadlineError } = await supabase
                .from('deadlines')
                .update({
                    ...deadlineDetails,
                    updated_at: new Date().toISOString()
                })
                .eq('id', deadlineDetails.id!)
                .eq('user_id', userId)
                .select()
                .single();

            if (deadlineError) {
                console.error('Error updating deadline:', deadlineError);
                throw new Error(deadlineError.message);
            }

            // Update or create progress entry
            let progressData;
            if (progressDetails.id) {
                // Update existing progress
                const { data, error: progressError } = await supabase
                    .from('deadline_progress')
                    .update({
                        current_progress: progressDetails.current_progress!,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', progressDetails.id)
                    .select()
                    .single();

                if (progressError) {
                    console.error('Error updating progress:', progressError);
                    throw new Error(progressError.message);
                }
                
                progressData = data;
            } else {
                // Create new progress entry
                const finalProgressId = generateId('rdp');

                const { data, error: progressError } = await supabase
                    .from('deadline_progress')
                    .insert({
                        id: finalProgressId,
                        deadline_id: deadlineDetails.id!,
                        current_progress: progressDetails.current_progress!,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (progressError) {
                    console.error('Error creating progress:', progressError);
                    throw new Error(progressError.message);
                }
                
                progressData = data;
            }
            return {...deadlineData, progress: progressData};
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
            
            // Delete associated progress entries first
            const { error: progressError } = await supabase
                .from('deadline_progress')
                .delete()
                .eq('deadline_id', deadlineId);

            if (progressError) {
                console.error('Error deleting progress entries:', progressError);
                throw new Error(progressError.message);
            }

            // Delete the deadline
            const { error: deadlineError } = await supabase
                .from('deadlines')
                .delete()
                .eq('id', deadlineId)
                .eq('user_id', user.id);

            if (deadlineError) {
                console.error('Error deleting deadline:', deadlineError);
                throw new Error(deadlineError.message);
            }
            
            return deadlineId;
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
            
            // Generate progress ID using RPC with crypto fallback
            const finalProgressId = generateId('rdp');

            // Create new progress entry
            const { data, error } = await supabase
                .from('deadline_progress')
                .insert({
                    id: finalProgressId,
                    deadline_id: progressDetails.deadlineId,
                    current_progress: progressDetails.currentProgress,
                    time_spent_reading: progressDetails.timeSpentReading || null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                throw error;
            }

            return data;
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

export const useGetDeadlines = (options?: { includeNonActive?: boolean }) => {
    const { profile: user } = useAuth();
    const userId = user?.id;
    const includeNonActive = options?.includeNonActive ?? false;

    return useQuery<ReadingDeadlineWithProgress[]>({
        queryKey: ['deadlines', userId, includeNonActive],
        queryFn: async () => {
            if (!userId) throw new Error("User not authenticated");
            const { data, error } = await supabase
                .from('deadlines')
                .select(`
                    *,
                    progress:deadline_progress(*),
                    status:deadline_status(*)
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw new Error(error.message);
            
            // Filter based on includeNonActive option
            const filteredData = includeNonActive 
                ? (data || [])
                : (data?.filter(deadline => {
                    const latestStatus = deadline.status?.[deadline.status.length - 1]?.status;
                    return !latestStatus || latestStatus === 'reading';
                }) || []);
            
            return filteredData as ReadingDeadlineWithProgress[];
        },
        enabled: !!userId,
        refetchOnWindowFocus: false,
        // staleTime: 1000 * 60 * 60 * 5, // 5 hours
    })
}

const useUpdateDeadlineStatus = (status: 'complete' | 'set_aside' | 'reading') => {
    
    const { profile: user } = useAuth();
    const userId = user?.id;
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
            
            const { data, error } = await supabase
                .from('deadline_status')
                .insert({
                    deadline_id: deadlineId,
                    status,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error(`Error ${actionName} deadline:`, error);
                throw new Error(error.message);
            }
            
            return data;
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
    const { profile: user } = useAuth();
    const userId = user?.id;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationKey: ['completeDeadline'],
        mutationFn: async (deadlineId: string) => {
            if (!userId) {
                throw new Error("User not authenticated");
            }
            
            // First, get the deadline details to check current progress
            const { data: deadline, error: deadlineError } = await supabase
                .from('deadlines')
                .select(`
                    *,
                    progress:deadline_progress(*)
                `)
                .eq('id', deadlineId)
                .eq('user_id', userId)
                .single();

            if (deadlineError) {
                console.error('Error fetching deadline for completion:', deadlineError);
                throw new Error(deadlineError.message);
            }

            // Calculate current progress (latest progress entry)
            const latestProgress = deadline.progress?.length > 0 
                ? Math.max(...deadline.progress.map(p => p.current_progress))
                : 0;

            // If current progress is not at max, update it to max first
            if (latestProgress < deadline.total_quantity) {
                // Generate progress ID using RPC with crypto fallback
                const finalProgressId = generateId('rdp');

                // Create new progress entry at max progress
                const { error: progressError } = await supabase
                    .from('deadline_progress')
                    .insert({
                        id: finalProgressId,
                        deadline_id: deadlineId,
                        current_progress: deadline.total_quantity,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });

                if (progressError) {
                    console.error('Error updating progress to max:', progressError);
                    throw new Error(progressError.message);
                }
            }
            
            // Now mark as complete
            const { data, error } = await supabase
                .from('deadline_status')
                .insert({
                    deadline_id: deadlineId,
                    status: 'complete',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error('Error completing deadline:', error);
                throw new Error(error.message);
            }
            
            return data;
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
    
    const {profile: user} = useAuth();
    const userId = user?.id;

    return useQuery<ReadingDeadlineWithProgress[]>({
        queryKey: ['ArchivedDeadlines', userId],
        queryFn: async () => {
            if (!userId) throw new Error("User not authenticated");
            const { data, error } = await supabase
                .from('deadlines')
                .select(`
                    *,
                    progress:deadline_progress(*),
                    status:deadline_status(*)
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw new Error(error.message);
            
            // Filter for completed and set_aside deadlines only
            const filteredData = data?.filter(deadline => {
                const latestStatus = deadline.status?.[deadline.status.length - 1]?.status;
                return latestStatus === 'complete' || latestStatus === 'set_aside';
            }) || [];
            
            // Sort by completion date (most recent status entry)
            filteredData.sort((a, b) => {
                const aDate = a.status?.[a.status.length - 1]?.created_at || a.created_at;
                const bDate = b.status?.[b.status.length - 1]?.created_at || b.created_at;
                if (!aDate || !bDate) return 0; // Handle cases where dates might be missing
                return new Date(bDate).getTime() - new Date(aDate).getTime();
            });
            
            return filteredData as ReadingDeadlineWithProgress[];
        },
        enabled: !!userId,
        refetchOnWindowFocus: false,
    })
}

export const useGetDeadlineById = (deadlineId: string | undefined) => {
   const { profile: user } = useAuth();
    const userId = user?.id;

    return useQuery<ReadingDeadlineWithProgress | null>({
        queryKey: ['deadline', userId, deadlineId],
        queryFn: async () => {
            if (!userId || !deadlineId) return null;
            
            const { data, error } = await supabase
                .from('deadlines')
                .select(`
                    *,
                    progress:deadline_progress(*),
                    status:deadline_status(*)
                `)
                .eq('user_id', userId)
                .eq('id', deadlineId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows returned
                    return null;
                }
                throw new Error(error.message);
            }
            
            return data as ReadingDeadlineWithProgress;
        },
        enabled: !!userId && !!deadlineId,
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

export const useDeleteFutureProgress = () => {
    
    const {profile: user} = useAuth();
    const userId = user?.id;
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ['deleteFutureProgress'],
        mutationFn: async ({ deadlineId, newProgress }: { deadlineId: string; newProgress: number }) => {
            if (!userId) {
                throw new Error("User not authenticated");
            }
            
            // Delete all progress entries greater than the new progress value
            const { error } = await supabase
                .from('deadline_progress')
                .delete()
                .eq('deadline_id', deadlineId)
                .gt('current_progress', newProgress);

            if (error) {
                console.error('Error deleting future progress:', error);
                throw new Error(error.message);
            }
            
            return { deadlineId, newProgress };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deadlines', userId] });
        },
        onError: (error) => {
            console.error("Error deleting future progress:", error);
        },
    })
}