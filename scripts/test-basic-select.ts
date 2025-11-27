// Test basic select
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('Testing basic select from chunks...\n');
  
  const { data, error } = await supabase.rpc('test_basic_select');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${data?.length || 0} results:`);
  data?.forEach((row: any) => {
    console.log(`  Chunk ${row.chunk_id}: ${row.content_preview}...`);
  });
}

main().catch(err => console.error(err));
