// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../types';

export function createSupabaseClient(env: Env): SupabaseClient | null {
  // Reutilizar o client já inicializado se existir
  if (env.SUPABASE) {
    return env.SUPABASE;
  }
  
  const url = (env as any).SUPABASE_URL;
  const key = (env as any).SUPABASE_SERVICE_KEY;
  
  if (!url || !key) {
    console.error("❌ Credenciais Supabase não configuradas");
    return null;
  }
  
  try {
    const client = createClient(url, key, { global: { fetch } });
    
    // Cache o client para reutilização
    // @ts-ignore - Env is mutable at runtime
    env.SUPABASE = client;
    
    return client;
  } catch (err) {
    console.error("❌ Erro ao criar Supabase client:", err);
    return null;
  }
}

export default createSupabaseClient;
