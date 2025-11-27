// Test using test_simple_compare which we know works
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
  const query = process.argv[2] || 'BOMBA';
  console.log('Query:', query);
  
  const embedding = await createEmbedding(query);
  console.log('Embedding created:', embedding.length, 'dimensions\n');
  
  // Use test_simple_compare which we know works
  const { data, error } = await supabase.rpc('test_simple_compare', {
    p_embedding: embedding,
    p_k: 5
  });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${data?.length || 0} matches:\n`);
  
  // Now get the full content for each match
  if (data && data.length > 0) {
    for (const match of data) {
      const { data: chunkData } = await supabase
        .from('chunks')
        .select('content, metadata')
        .eq('id', match.chunk_id)
        .single();
      
      console.log(`--- Match (score: ${match.distance.toFixed(4)}) ---`);
      console.log(chunkData?.content || 'No content');
      console.log('');
    }
  }
}

main().catch(err => console.error(err));
