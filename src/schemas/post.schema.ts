import { WritingStyle } from 'types/enums';
import { z } from 'zod';

export const generatePostSchema = z.object({
  transcript: z.string().min(10, 'Transcript is too short'),
  writingStyle: z.nativeEnum(WritingStyle).default(WritingStyle.PROFESSIONAL),
  language: z.string().min(2).max(10).optional(),
  authorContext: z
    .object({
      role: z.string().optional(),
      industry: z.string().optional(),
      audience: z.string().optional(),
      goal: z.string().optional(),
    })
    .optional(),
});

export type GeneratePostInput = z.infer<typeof generatePostSchema>;
