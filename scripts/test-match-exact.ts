// Test match_chunks_exact directly
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const OPENAI_KEY = process.env.OPENAI_API_KEY!;

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
  const data = await res.json();
  return data.data[0].embedding;
}

async function main() {
  const embedding = await createEmbedding('BOMBA');
  console.log('Testing match_chunks_exact directly...\n');
  console.log('Embedding length:', embedding.length);
  console.log('Embedding type:', typeof embedding);
  console.log('Is array:', Array.isArray(embedding));
  
  const { data, error } = await supabase.rpc('match_chunks_exact', {
    p_embedding: embedding,
    p_k: 5
  });
  
  console.log('\nRPC call complete');
  console.log('Error:', error);
  console.log('Data:', data);
  console.log('Data type:', typeof data);
  console.log('Data length:', data?.length);
  
  if (data && data.length > 0) {
    console.log('\nResults:');
    data.forEach((row: any, idx: number) => {
      console.log(`${idx + 1}. ID: ${row.id}, Score: ${row.score}`);
      console.log(`   Content: ${row.content?.substring(0, 100)}...`);
    });
  }
}

main().catch(err => console.error(err));
