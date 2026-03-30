import { Language, WritingStyle } from 'types/enums';
import { z } from 'zod';

export const generatePostSchema = z
  .object({
    recordingId: z.string().uuid().optional(),
    transcript: z.string().min(10, 'Transcript is too short').optional(),
    writingStyle: z.nativeEnum(WritingStyle).default(WritingStyle.PROFESSIONAL),
    language: z.nativeEnum(Language).optional(),
    authorContext: z
      .object({
        role: z.string().optional(),
        industry: z.string().optional(),
        audience: z.string().optional(),
        goal: z.string().optional(),
      })
      .optional(),
  })
  .refine((data) => data.recordingId || data.transcript, {
    message: 'Either recordingId or transcript is required',
  });

export type GeneratePostInput = z.infer<typeof generatePostSchema>;

export const updatePostSchema = z.object({
  content: z.string().min(1).optional(),
  is_favorite: z.boolean().optional(),
  copied: z.boolean().optional(),
});

export type UpdatePostInput = z.infer<typeof updatePostSchema>;
