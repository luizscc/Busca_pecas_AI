// src/lib/rag.ts
import type { Env } from '../types';
import createSupabaseClient from './supabase';
import { createEmbedding } from './embeddings';

export async function retrieveChunks(env: Env, text: string, k = 5, documentId?: number) {
  const supabase = createSupabaseClient(env);
  if (!supabase) return [];

  const embedding = await createEmbedding(env, text);

  // choose filtered RPC if documentId is provided
  const rpcName = documentId ? 'match_chunks_filtered' : 'match_chunks';
  const params = documentId ? { p_embedding: embedding, p_k: k, p_doc_id: documentId } : { p_embedding: embedding, p_k: k };

  const { data, error } = await supabase.rpc(rpcName, params);
  if (error) {
    console.error('Supabase RPC error for RAG:', error);
    return [];
  }
  return data ?? [];
}
