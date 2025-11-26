// scripts/test-rag.ts
// Usage: set SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY env vars then run:
// npx ts-node scripts/test-rag.ts "search query text"
import { createClient } from '@supabase/supabase-js';
import { createEmbedding } from '../src/lib/embeddings';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env vars (SUPABASE_URL or SUPABASE_SERVICE_KEY)');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const q = process.argv[2] || 'hydraulic pump for Komatsu PC200-8';
  if (!process.env.OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY');
    process.exit(1);
  }
  // Create embedding (using our helper)
  const embedding = await createEmbedding({ OPENAI_API_KEY: process.env.OPENAI_API_KEY } as any, q);
  console.log('Embedding created: length =', embedding.length);

  // call RPC
  const params = { p_embedding: embedding, p_k: 5 } as any;
  const { data, error } = await supabase.rpc('match_chunks', params);
  if (error) {
    console.error('RPC error:', error);
    return;
  }
  console.log('Chunks match:', JSON.stringify(data, null, 2));
}

main().catch(err => console.error(err));
