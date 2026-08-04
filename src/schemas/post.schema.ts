import { Language, PostStatus, WritingStyle } from '../types/enums';
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

export const createDraftSchema = z.object({
  recordingId: z.string().uuid().optional(),
  content: z.string().optional().default(''),
  writingStyle: z.nativeEnum(WritingStyle).optional(),
});

export type CreateDraftInput = z.infer<typeof createDraftSchema>;

export const updatePostSchema = z.object({
  content: z.string().min(1).optional(),
  is_favorite: z.boolean().optional(),
  copied: z.boolean().optional(),
  post_type: z.nativeEnum(WritingStyle).optional(),
});

export type UpdatePostInput = z.infer<typeof updatePostSchema>;

export const listPostsQuerySchema = z.object({
  status: z.nativeEnum(PostStatus).optional(),
});

export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;
