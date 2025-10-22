import { z } from 'zod';

export const deadlineFormSchema = z.object({
  bookTitle: z.string().min(1, 'Book title is required'),
  bookAuthor: z.string().optional(),
  format: z.enum(['physical', 'eBook', 'audio'], {
    errorMap: () => ({ message: 'Please select a format' }),
  }),
  deadline_type: z
    .string()
    .min(1, 'Please select or enter a source')
    .max(30, 'Source cannot exceed 30 characters'),
  acquisition_source: z
    .string()
    .max(30, 'Acquisition source cannot exceed 30 characters')
    .optional(),
  publishers: z
    .array(z.string().max(99, 'Publisher name cannot exceed 99 characters'))
    .max(5, 'Maximum 5 publishers allowed')
    .optional(),
  isPublisherAutofilled: z.boolean().optional(),
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
  status: z.enum(['pending', 'active'], {
    errorMap: () => ({ message: 'Please select a status' }),
  }),
  // Optional book linking fields
  book_id: z.string().optional(), // Links to books table
  api_id: z.string().optional(), // External API ID for book fetching
  api_source: z.string().optional(), // Source of the API ID (goodreads, google_books, etc.)
  google_volume_id: z.string().optional(), // Google Books volume ID
  isbn: z.string().optional(), // ISBN for book fetching
  ignoreInCalcs: z.boolean().optional(),
});

export type DeadlineFormData = z.infer<typeof deadlineFormSchema>;
