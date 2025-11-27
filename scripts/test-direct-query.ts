// scripts/test-direct-query.ts
// Test vector search with direct SQL query via RPC
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const OPENAI_KEY = process.env.OPENAI_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_KEY) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createEmbedding(text: string) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text })
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${errorText}`);
  }
  const data = await res.json();
  if (!data.data || !data.data[0]) {
    throw new Error(`Invalid OpenAI response`);
  }
  return data.data[0].embedding;
}

async function main() {
  const query = process.argv[2] || 'BOMBA';
  console.log('Query:', query);
  
  const embedding = await createEmbedding(query);
  console.log('Embedding created:', embedding.length, 'dimensions');
  
  // Pass embedding as array - Supabase will encode as jsonb
  console.log('Passing embedding as array to RPC...');
  
  const { data, error } = await supabase.rpc('match_chunks_exact', {
    p_embedding: embedding,
    p_k: 5
  });
  
  if (error) {
    console.error('RPC error:', error);
    return;
  }
  
  console.log('\nResults:', data?.length || 0, 'matches');
  data?.forEach((match: any, idx: number) => {
    console.log(`\n--- Match ${idx + 1} (score: ${match.score?.toFixed(4) || 'N/A'}) ---`);
    console.log(match.content?.substring(0, 150) || 'No content');
  });
}

main().catch(err => console.error(err));
