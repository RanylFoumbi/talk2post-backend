import { z } from 'zod';
import { Language, WritingStyle } from '../types/enums';

export const upsertPreferencesSchema = z.object({
  writing_style: z.nativeEnum(WritingStyle).optional(),
  language: z.nativeEnum(Language).optional(),
  role: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  audience: z.string().max(100).optional(),
  onboarding_completed: z.boolean().optional(),
  goal: z.string().max(200).optional(),
});

export type UpsertPreferencesInput = z.infer<typeof upsertPreferencesSchema>;
