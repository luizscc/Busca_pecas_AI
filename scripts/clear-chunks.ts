// scripts/clear-chunks.ts
// Delete all chunks to start fresh
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
  const { error } = await supabase.from('chunks').delete().neq('id', 0);
  
  if (error) {
    console.error('Error deleting chunks:', error);
    return;
  }
  
  console.log('✅ All chunks deleted');
}

main().catch(err => console.error(err));
