import { Language, WritingStyle } from '../types/enums';
import { z } from 'zod';

export const upsertPreferencesSchema = z.object({
  writing_style: z.nativeEnum(WritingStyle).optional(),
  language: z.nativeEnum(Language).optional(),
  role: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  audience: z.string().max(100).optional(),
  goal: z.string().max(200).optional(),
});

export type UpsertPreferencesInput = z.infer<typeof upsertPreferencesSchema>;
