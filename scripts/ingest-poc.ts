// scripts/ingest-poc.ts
// POC: ingest a text file as document into Supabase chunks with embeddings
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const OPENAI_KEY = process.env.OPENAI_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env vars.');
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
  const data = await res.json();
  return data.data[0].embedding;
}

function splitChunks(text: string, chunkSize = 1024) {
  const arr = [];
  let i = 0;
  while (i < text.length) {
    arr.push(text.slice(i, i + chunkSize));
    i += chunkSize;
  }
  return arr;
}

async function ingest(documentPath: string) {
  const documentId = Math.floor(Math.random() * 1000000);
  const text = fs.readFileSync(path.resolve(documentPath), 'utf8');
  const chunks = splitChunks(text, 1000);
  for (const [index, chunk] of chunks.entries()) {
    const embedding = await createEmbedding(chunk);
    
    // Format as pgvector string: [1.23,4.56,...]
    const vectorStr = '[' + embedding.join(',') + ']';
    
    // Use RPC to insert with proper vector type
    const { data, error } = await supabase.rpc('insert_chunk', {
      p_document_id: documentId,
      p_content: chunk,
      p_metadata: { index },
      p_embedding: vectorStr
    });
    
    if (error) {
      console.error('Insert error', error);
      return;
    }
    console.log('Inserted chunk', index);
  }
  console.log('Document ingested with id', documentId);
}

const file = process.argv[2];
if (!file) {
  console.error('Usage: node ingest-poc.js <file>');
  process.exit(1);
}
ingest(file).catch(err => console.error('Error:', err));
