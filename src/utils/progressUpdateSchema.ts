import { z } from 'zod';

export const progressUpdateSchema = z.object({
    currentProgress: z.coerce.number()
        .int('Progress must be a whole number')
        .min(0, 'Progress cannot be negative')
        .refine((val) => val !== undefined && val !== null, {
            message: 'Progress is required'
        }),
});

export type ProgressUpdateData = z.infer<typeof progressUpdateSchema>;

// Dynamic schema factory for validation against total quantity
export const createProgressUpdateSchema = (totalQuantity: number, format: 'physical' | 'eBook' | 'audio') => {
    const unitName = format === 'audio' ? 'minutes' : 'pages';
    
    return z.object({
        currentProgress: z.preprocess(
            (val) => {
                // Handle null, undefined, and empty strings
                if (val === null || val === undefined || val === '') {
                    return undefined;
                }
                
                // Handle strings
                if (typeof val === 'string') {
                    const trimmed = val.trim();
                    if (trimmed === '') {
                        return undefined;
                    }
                    const parsed = parseFloat(trimmed);
                    return isNaN(parsed) ? 'INVALID_NUMBER' : parsed;
                }
                
                // Handle numbers
                if (typeof val === 'number') {
                    return isNaN(val) ? 'INVALID_NUMBER' : val;
                }
                
                return 'INVALID_NUMBER';
            },
            z.union([
                z.undefined().transform(() => {
                    throw new z.ZodError([{
                        code: 'custom',
                        message: 'Please enter your current progress',
                        path: ['currentProgress']
                    }]);
                }),
                z.literal('INVALID_NUMBER').transform(() => {
                    throw new z.ZodError([{
                        code: 'custom',
                        message: 'Please enter a valid number',
                        path: ['currentProgress']
                    }]);
                }),
                z.number()
                    .refine((val) => Number.isInteger(val), {
                        message: 'Progress must be a whole number'
                    })
                    .refine((val) => val >= 0, {
                        message: 'Progress cannot be negative'
                    })
                    .refine((val) => val <= totalQuantity, {
                        message: `Progress cannot exceed ${totalQuantity} ${unitName}`
                    })
            ])
        )
    });
};
