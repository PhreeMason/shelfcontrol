import { z } from 'zod';

export const reviewFormSchema = z.object({
  hasReviewDeadline: z.boolean(),
  reviewDueDate: z.date().optional().nullable(),
  needsLinkSubmission: z.boolean(),
  reviewNotes: z
    .string()
    .max(10000, 'Review notes must be 10000 characters or less')
    .optional(),
});

export type ReviewFormData = z.infer<typeof reviewFormSchema>;
