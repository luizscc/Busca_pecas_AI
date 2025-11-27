// scripts/debug-chunks.ts
// Check what chunks are in the database
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
  // Get all chunks
  const { data, error } = await supabase
    .from('chunks')
    .select('id, document_id, content, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data?.length || 0} chunks:`);
  data?.forEach((chunk, idx) => {
    console.log(`\n--- Chunk ${idx + 1} ---`);
    console.log(`ID: ${chunk.id}`);
    console.log(`Document ID: ${chunk.document_id}`);
    console.log(`Content preview: ${chunk.content.substring(0, 150)}...`);
    console.log(`Metadata: ${JSON.stringify(chunk.metadata)}`);
  });
}

main().catch(err => console.error(err));
