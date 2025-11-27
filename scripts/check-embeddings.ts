// scripts/check-embeddings.ts
// Check if embeddings are actually stored
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
  const { data, error } = await supabase
    .from('chunks')
    .select('id, document_id, content, embedding')
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data?.length || 0} chunks:\n`);
  data?.forEach((chunk) => {
    console.log(`ID: ${chunk.id}, Doc: ${chunk.document_id}`);
    console.log(`Content: ${chunk.content.substring(0, 50)}...`);
    
    if (chunk.embedding) {
      const embType = typeof chunk.embedding;
      const embSample = JSON.stringify(chunk.embedding).substring(0, 100);
      console.log(`Embedding type: ${embType}`);
      console.log(`Embedding sample: ${embSample}...`);
      
      if (Array.isArray(chunk.embedding)) {
        console.log(`Embedding: ✅ Array with ${chunk.embedding.length} elements`);
      } else if (typeof chunk.embedding === 'string') {
        console.log(`Embedding: ⚠️ String with ${chunk.embedding.length} characters`);
      } else {
        console.log(`Embedding: ❓ Unknown format`);
      }
    } else {
      console.log(`Embedding: ❌ NULL`);
    }
    console.log('---');
  });
}

main().catch(err => console.error(err));
