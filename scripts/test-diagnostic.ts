// scripts/test-diagnostic.ts
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
  console.log('Testing vector comparison with "BOMBA"...\n');
  
  const { data, error } = await supabase.rpc('test_vector_compare', {
    p_embedding: embedding
  });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${data?.length || 0} results:\n`);
  data?.forEach((row: any, idx: number) => {
    console.log(`${idx + 1}. Chunk ID: ${row.chunk_id}`);
    console.log(`   Content: ${row.content_preview}...`);
    console.log(`   Embedding type: ${row.embedding_type}`);
    console.log(`   Distance: ${row.distance}`);
    console.log('');
  });
}

main().catch(err => console.error(err));
