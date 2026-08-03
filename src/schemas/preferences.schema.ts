import { z } from 'zod';
import { Language, WritingStyle } from '../types/enums';

export const upsertPreferencesSchema = z.object({
  writing_style: z.nativeEnum(WritingStyle).optional().default(WritingStyle.CREATIVE),
  language: z.nativeEnum(Language).optional().default(Language.ENGLISH),
  role: z.string().optional().default('User'),
  industry: z.string().optional().default('Technology'),
  audience: z.string().optional().default('General Public'),
  onboarding_completed: z.boolean().optional().default(false),
  goal: z.string().optional().default('Enhance productivity and creativity'),
});

export type UpsertPreferencesInput = z.infer<typeof upsertPreferencesSchema>;
