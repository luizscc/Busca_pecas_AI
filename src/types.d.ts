// src/types.d.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export interface Env {
  DB: D1Database;
  OPENAI_API_KEY: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE?: SupabaseClient<any>;
}
