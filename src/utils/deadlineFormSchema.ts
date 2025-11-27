import { z } from 'zod';

export const deadlineFormSchema = z
  .object({
    bookTitle: z.string().min(1, 'Book title is required'),
    bookAuthor: z.string().optional(),
    format: z.enum(['physical', 'eBook', 'audio'], {
      errorMap: () => ({ message: 'Please select a format' }),
    }),
    type: z
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
      required_error: 'Due date is required',
    }),
    totalQuantity: z.coerce
      .number({
        required_error: 'Please enter the total pages',
        invalid_type_error: 'Please enter a valid number',
      })
      .int('Please enter a whole number')
      .nonnegative('Total cannot be negative'),
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
      errorMap: () => ({ message: 'Please select pace flexibility' }),
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
    // Book's cover (for preview only, not saved to deadline)
    book_cover_image_url: z.string().optional(),
    // Cover image fields
    cover_image_url: z
      .string()
      .optional()
      .refine(
        val => {
          if (!val) return true; // Empty is okay
          // Allow file:// for uploads, http(s):// for URLs
          return val.startsWith('file://') || val.match(/^https?:\/\/.+/);
        },
        { message: 'Must be a valid URL or file path' }
      )
      .or(z.literal('')),
    cover_image_source: z.enum(['upload', 'url', 'none']).optional(),
  })
  .refine(
    data => {
      // Cross-field validation: if URL mode is selected, must have a valid HTTP(S) URL
      if (data.cover_image_source === 'url' && data.cover_image_url) {
        return !!data.cover_image_url.match(/^https?:\/\/.+/);
      }
      // If upload mode is selected, must have a file:// URI
      if (data.cover_image_source === 'upload' && data.cover_image_url) {
        return data.cover_image_url.startsWith('file://');
      }
      return true;
    },
    {
      message: 'Invalid cover image for selected mode',
      path: ['cover_image_url'],
    }
  )
  .refine(
    data => {
      // For audio: allow 0 hours if minutes > 0
      if (data.format === 'audio') {
        const hours = data.totalQuantity ?? 0;
        const minutes = data.totalMinutes ?? 0;
        return hours > 0 || minutes > 0;
      }
      // For physical/eBook: pages must be > 0
      return data.totalQuantity > 0;
    },
    {
      message: 'Total must be greater than 0',
      path: ['totalQuantity'],
    }
  );

export type DeadlineFormData = z.infer<typeof deadlineFormSchema>;
