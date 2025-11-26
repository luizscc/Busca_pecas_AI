// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../types';

export function createSupabaseClient(env: Env): SupabaseClient | null {
  const url = (env as any).SUPABASE_URL;
  const key = (env as any).SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { global: { fetch } });
}

export default createSupabaseClient;
