import { MUTATION_KEYS, QUERY_KEYS } from '@/constants/queryKeys';
import { posthog } from '@/lib/posthog';
import { useAuth } from '@/providers/AuthProvider';
import { disclosureTemplatesService } from '@/services/disclosureTemplates.service';
import {
  DisclosureTemplate,
  CreateDisclosureTemplateInput,
  UpdateDisclosureTemplateInput,
} from '@/types/disclosure.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useGetTemplates = (sourceName?: string) => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery<DisclosureTemplate[]>({
    queryKey: userId
      ? QUERY_KEYS.DISCLOSURE_TEMPLATES.BY_SOURCE(userId, sourceName)
      : ['disclosure_templates', undefined, undefined],
    queryFn: async () => {
      if (!userId) return [];
      return disclosureTemplatesService.getTemplates(userId, sourceName);
    },
    enabled: !!userId,
  });
};

export const useGetTemplateById = (templateId: string | undefined) => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery<DisclosureTemplate | null>({
    queryKey:
      userId && templateId
        ? QUERY_KEYS.DISCLOSURE_TEMPLATES.BY_ID(userId, templateId)
        : ['disclosure_template', undefined, undefined],
    queryFn: async () => {
      if (!userId || !templateId) return null;
      return disclosureTemplatesService.getTemplateById(templateId, userId);
    },
    enabled: !!userId && !!templateId,
  });
};

export const useCreateTemplate = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.DISCLOSURE_TEMPLATES.CREATE],
    mutationFn: async (templateData: CreateDisclosureTemplateInput) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return disclosureTemplatesService.createTemplate(userId, templateData);
    },
    onSuccess: (_, variables) => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DISCLOSURE_TEMPLATES.BY_SOURCE(
            userId,
            variables.source_name
          ),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DISCLOSURE_TEMPLATES.ALL(userId),
        });
      }
    },
    onError: (error: Error) => {
      console.error('Error creating disclosure template:', error);
      posthog.captureException(error);
    },
  });
};

export const useUpdateTemplate = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.DISCLOSURE_TEMPLATES.UPDATE],
    mutationFn: async ({
      templateId,
      templateData,
    }: {
      templateId: string;
      templateData: UpdateDisclosureTemplateInput;
    }) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return disclosureTemplatesService.updateTemplate(
        templateId,
        userId,
        templateData
      );
    },
    onSuccess: (_, variables) => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DISCLOSURE_TEMPLATES.BY_ID(
            userId,
            variables.templateId
          ),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DISCLOSURE_TEMPLATES.ALL(userId),
        });
      }
    },
    onError: (error: Error) => {
      console.error('Error updating disclosure template:', error);
      posthog.captureException(error);
    },
  });
};

export const useDeleteTemplate = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.DISCLOSURE_TEMPLATES.DELETE],
    mutationFn: async (templateId: string) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return disclosureTemplatesService.deleteTemplate(templateId, userId);
    },
    onSuccess: (_, templateId) => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DISCLOSURE_TEMPLATES.ALL(userId),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DISCLOSURE_TEMPLATES.BY_ID(userId, templateId),
        });
      }
    },
    onError: (error: Error) => {
      console.error('Error deleting disclosure template:', error);
      posthog.captureException(error);
    },
  });
};

export const useUpdateDeadlineDisclosure = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.DISCLOSURE_TEMPLATES.UPDATE_DEADLINE],
    mutationFn: async ({
      deadlineId,
      disclosureData,
    }: {
      deadlineId: string;
      disclosureData: {
        disclosure_text: string | null;
        disclosure_source_name: string | null;
        disclosure_template_id?: string | null;
      };
    }) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      return disclosureTemplatesService.updateDeadlineDisclosure(
        deadlineId,
        userId,
        disclosureData
      );
    },
    onSuccess: (_, variables) => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DEADLINES.DETAIL(userId, variables.deadlineId),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DEADLINES.ALL(userId),
        });
      }
    },
    onError: (error: Error) => {
      console.error('Error updating deadline disclosure:', error);
      posthog.captureException(error);
    },
  });
};
