import { z } from 'zod';

export const emailSubmissionSchema = z.object({
  email: z
    .string()
    .min(1, 'E-mailadres is verplicht')
    .email('Voer een geldig e-mailadres in'),
});

export type EmailSubmissionData = z.infer<typeof emailSubmissionSchema>;
