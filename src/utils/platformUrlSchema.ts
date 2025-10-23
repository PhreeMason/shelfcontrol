import { z } from 'zod';

export const platformUrlSchema = z.object({
  platforms: z.record(
    z.string(),
    z
      .string()
      .url('Please enter a valid URL')
      .or(z.literal(''))
      .optional()
  ),
});

export type PlatformUrlFormData = z.infer<typeof platformUrlSchema>;
