import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Config } from './env';

export class SupabaseConfig {
  private static client: SupabaseClient | null = null;
  private static adminClient: SupabaseClient | null = null;

  static getClient(): SupabaseClient {
    if (!this.client) {
      this.client = createClient(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY);
    }
    return this.client;
  }

  static getAdmin(): SupabaseClient {
    if (!this.adminClient) {
      this.adminClient = createClient(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_KEY);
    }
    return this.adminClient;
  }
}
