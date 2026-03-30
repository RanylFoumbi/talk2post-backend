import { SupabaseConfig } from '../config';
import type { UpsertPreferencesInput } from '../schemas/preferences.schema';

export class PreferencesService {
  static async getUserPreferences(userId: string) {
    const { data, error } = await SupabaseConfig.getAdmin()
      .from('user_preferences')
      .select()
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    return data;
  }

  static async upsertPreferences(userId: string, input: UpsertPreferencesInput) {
    const { data, error } = await SupabaseConfig.getAdmin()
      .from('user_preferences')
      .upsert({ user_id: userId, ...input }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    return data;
  }
}
