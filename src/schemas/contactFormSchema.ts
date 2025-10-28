import { z } from 'zod';

export const contactFormSchema = z
  .object({
    contact_name: z.string().optional(),
    email: z
      .string()
      .email('Invalid email address')
      .optional()
      .or(z.literal('')),
    username: z.string().optional(),
  })
  .refine(
    data => {
      const hasContactName =
        data.contact_name && data.contact_name.trim().length > 0;
      const hasEmail = data.email && data.email.trim().length > 0;
      const hasUsername = data.username && data.username.trim().length > 0;
      return hasContactName || hasEmail || hasUsername;
    },
    {
      message: 'At least one field (name, email, or username) must be filled',
      path: ['contact_name'],
    }
  );

export type ContactFormData = z.infer<typeof contactFormSchema>;
