import { z } from 'zod';

export const deadlineFormSchema = z.object({
    bookTitle: z.string().min(1, 'Book title is required'),
    bookAuthor: z.string().optional(),
    format: z.enum(['physical', 'ebook', 'audio'], {
        errorMap: () => ({ message: 'Please select a format' })
    }),
    source: z.string().min(1, 'Please select or enter a source'),
    deadline: z.date({
        required_error: 'Deadline is required'
    }),
    totalQuantity: z.coerce.number().int().positive({
        message: 'Total must be a positive number'
    }),
    totalMinutes: z.coerce.number().int().min(0, {
        message: 'Minutes must be 0 or greater'
    }).optional(),
    currentMinutes: z.coerce.number().int().min(0, {
        message: 'Minutes must be 0 or greater'
    }).optional(),
    currentProgress: z.coerce.number().int().min(0).optional(),
    flexibility: z.enum(['flexible', 'strict'], {
        errorMap: () => ({ message: 'Please select deadline flexibility' })
    }),
    // Optional book linking fields
    book_id: z.string().optional(), // Links to books table
    api_id: z.string().optional(),  // External API ID for book fetching
    // Start date for when user began reading (used when currentProgress > 0)
    startDate: z.date().optional(),
}).refine(
    (data) => {
        // If startDate is provided, it should not be in the future
        if (data.startDate && data.startDate > new Date()) {
            return false;
        }
        return true;
    },
    {
        message: "Start date cannot be in the future",
        path: ["startDate"]
    }
).refine(
    (data) => {
        // If startDate is provided, it should be before or equal to the deadline
        if (data.startDate && data.startDate > data.deadline) {
            return false;
        }
        return true;
    },
    {
        message: "Start date must be before the deadline",
        path: ["startDate"]
    }
);

export type DeadlineFormData = z.infer<typeof deadlineFormSchema>; 