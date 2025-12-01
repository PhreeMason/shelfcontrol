import { z } from 'zod';

export const customDateFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .transform(val => val.trim()),
  date: z
    .string()
    .min(1, 'Date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
});

export type CustomDateFormData = z.infer<typeof customDateFormSchema>;
