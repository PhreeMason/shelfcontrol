import { z } from 'zod';

export const deadlineFormSchema = z.object({
  bookTitle: z.string().min(1, 'Book title is required'),
  bookAuthor: z.string().optional(),
  format: z.enum(['physical', 'eBook', 'audio'], {
    errorMap: () => ({ message: 'Please select a format' }),
  }),
  source: z.string().min(1, 'Please select or enter a source'),
  deadline: z.date({
    required_error: 'Deadline is required',
  }),
  totalQuantity: z.coerce
    .number({
      required_error: 'Please enter the total pages',
      invalid_type_error: 'Please enter a valid number',
    })
    .int('Please enter a whole number')
    .positive('Total must be greater than 0'),
  totalMinutes: z.coerce
    .number({
      invalid_type_error: 'Please enter a valid number',
    })
    .int('Please enter whole minutes')
    .min(0, 'Minutes must be 0 or greater')
    .optional(),
  currentMinutes: z.coerce
    .number({
      invalid_type_error: 'Please enter a valid number',
    })
    .int('Please enter whole minutes')
    .min(0, 'Minutes must be 0 or greater')
    .optional(),
  currentProgress: z.coerce
    .number({
      invalid_type_error: 'Please enter a valid number',
    })
    .int('Please enter a whole number')
    .min(0, 'Progress cannot be negative')
    .optional(),
  flexibility: z.enum(['flexible', 'strict'], {
    errorMap: () => ({ message: 'Please select deadline flexibility' }),
  }),
  // Optional book linking fields
  book_id: z.string().optional(), // Links to books table
  api_id: z.string().optional(), // External API ID for book fetching
});

export type DeadlineFormData = z.infer<typeof deadlineFormSchema>;
