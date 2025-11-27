// scripts/test-rag.ts
// Usage: set SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY env vars then run:
// npx ts-node scripts/test-rag.ts "search query text"
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const OPENAI_KEY = process.env.OPENAI_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env vars (SUPABASE_URL or SUPABASE_SERVICE_KEY)');
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
    throw new Error(`Invalid OpenAI response: ${JSON.stringify(data)}`);
  }
  return data.data[0].embedding;
}

async function main() {
  const q = process.argv[2] || 'hydraulic pump for Komatsu PC200-8';
  if (!OPENAI_KEY) {
    console.error('Missing OPENAI_API_KEY');
    process.exit(1);
  }
  // Create embedding
  console.log('Query:', q);
  const embedding = await createEmbedding(q);
  console.log('Embedding created: length =', embedding.length);

  // First, check how many chunks exist
  const { count } = await supabase.from('chunks').select('*', { count: 'exact', head: true });
  console.log(`Total chunks in DB: ${count}`);

  // call RPC (use exact search for small datasets)
  const rpcFunction = count && count < 1000 ? 'match_chunks_exact' : 'match_chunks';
  console.log(`Using RPC function: ${rpcFunction}`);
  const params = { p_embedding: embedding, p_k: 5 } as any;
  console.log('Calling RPC with params:', { p_k: params.p_k, embedding_length: embedding.length });
  const { data, error } = await supabase.rpc(rpcFunction, params);
  if (error) {
    console.error('RPC error:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    return;
  }
  console.log('RPC returned data:', data);
  
  if (!data || data.length === 0) {
    console.log('No matches found. This might be due to insufficient data for the vector index.');
    console.log('Try adding more documents or querying directly without vector search.');
  } else {
    console.log(`Found ${data.length} matches:`);
    data.forEach((match: any, idx: number) => {
      console.log(`\n--- Match ${idx + 1} (score: ${match.score.toFixed(4)}) ---`);
      console.log(match.content.substring(0, 200));
    });
  }
}

main().catch(err => console.error(err));
