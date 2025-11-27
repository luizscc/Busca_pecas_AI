// scripts/verify-rpc.ts
// Verify which RPC functions exist in Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  // Try to call match_chunks_exact with a dummy embedding
  const dummyEmbedding = new Array(1536).fill(0);
  
  console.log('Testing match_chunks_exact...');
  const { data, error } = await supabase.rpc('match_chunks_exact', {
    p_embedding: dummyEmbedding,
    p_k: 2
  });
  
  if (error) {
    console.error('❌ Function does NOT exist or has an error:', error.message);
    console.log('\nYou need to run the migration in Supabase SQL Editor:');
    console.log('migrations/0004_exact_vector_search.sql');
  } else {
    console.log('✅ Function exists! Results:', data);
  }
}

main().catch(err => console.error(err));
