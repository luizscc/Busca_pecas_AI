// Check what's actually stored
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('Checking stored embedding types...\n');
  
  const { data, error } = await supabase.rpc('check_embedding_storage');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Results:\n');
  data?.forEach((row: any) => {
    console.log(`Chunk ${row.chunk_id}:`);
    console.log(`  Content: ${row.content_preview}...`);
    console.log(`  Type: ${row.embedding_pg_type}`);
    console.log(`  Is NULL: ${row.embedding_is_null}`);
    console.log(`  Length: ${row.embedding_length}`);
    console.log('');
  });
}

main().catch(err => console.error(err));
