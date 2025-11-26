// scripts/test-rls.ts
// Usage: set SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY env vars then run:
// npx ts-node scripts/test-rls.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testInsertChunks() {
  const payload = {
    document_id: Math.floor(Math.random() * 100000),
    content: 'RLs test chunk ' + new Date().toISOString(),
    metadata: { test: true },
    embedding: Array(1536).fill(0)
  };

  console.log('Trying to insert chunk as ANON (should fail if policy restricts it)');
  const anonRes = await anonClient.from('chunks').insert([payload]);
  console.log('ANON result:', anonRes.error, anonRes.data);

  console.log('Trying to insert chunk as SERVICE (should succeed)');
  const svcRes = await serviceClient.from('chunks').insert([payload]);
  console.log('SERVICE result:', svcRes.error, svcRes.data);
}

async function main() {
  await testInsertChunks();
}

main().catch(e => console.error(e));
