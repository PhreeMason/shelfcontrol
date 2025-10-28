import { MUTATION_KEYS, QUERY_KEYS } from '@/constants/queryKeys';
import { useAuth } from '@/providers/AuthProvider';
import { contactsService } from '@/services/contacts.service';
import { DeadlineContact, DeadlineContactUpdate } from '@/types/contacts.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useGetContacts = (deadlineId: string | undefined) => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery<DeadlineContact[]>({
    queryKey:
      userId && deadlineId
        ? QUERY_KEYS.CONTACTS.BY_DEADLINE(userId, deadlineId)
        : ['contacts', undefined, undefined],
    queryFn: async () => {
      if (!userId || !deadlineId) return [];
      return contactsService.getContacts(userId, deadlineId);
    },
    enabled: !!userId && !!deadlineId,
  });
};

export const useAddContact = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.CONTACTS.ADD],
    mutationFn: async ({
      deadlineId,
      contactData,
    }: {
      deadlineId: string;
      contactData: {
        contact_name?: string | null;
        email?: string | null;
        username?: string | null;
      };
    }) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return contactsService.addContact(userId, deadlineId, contactData);
    },
    onSuccess: (_, variables) => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CONTACTS.BY_DEADLINE(
            userId,
            variables.deadlineId
          ),
        });
      }
    },
    onError: error => {
      console.error('Error adding contact:', error);
    },
  });
};

export const useUpdateContact = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.CONTACTS.UPDATE],
    mutationFn: async ({
      contactId,
      contactData,
    }: {
      contactId: string;
      deadlineId: string;
      contactData: DeadlineContactUpdate;
    }) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return contactsService.updateContact(contactId, userId, contactData);
    },
    onSuccess: (_, variables) => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CONTACTS.BY_DEADLINE(
            userId,
            variables.deadlineId
          ),
        });
      }
    },
    onError: error => {
      console.error('Error updating contact:', error);
    },
  });
};

export const useDeleteContact = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.CONTACTS.DELETE],
    mutationFn: async ({
      contactId,
    }: {
      contactId: string;
      deadlineId: string;
    }) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return contactsService.deleteContact(contactId, userId);
    },
    onSuccess: (_, variables) => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CONTACTS.BY_DEADLINE(
            userId,
            variables.deadlineId
          ),
        });
      }
    },
    onError: error => {
      console.error('Error deleting contact:', error);
    },
  });
};
