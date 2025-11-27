// scripts/ingest-all.ts
// Automatic batch ingestion of all files in knowledge-base folder
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const OPENAI_KEY = process.env.OPENAI_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_KEY) {
  console.error('Missing environment variables');
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

function splitChunks(text: string, chunkSize = 1000) {
  const arr = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    arr.push(text.slice(i, i + chunkSize));
  }
  return arr;
}

async function ingestFile(filePath: string, category: string) {
  const documentId = Math.floor(Math.random() * 1000000);
  const fileName = path.basename(filePath);
  const text = fs.readFileSync(filePath, 'utf8');
  const chunks = splitChunks(text, 1000);
  
  console.log(`\n📄 Processing: ${fileName}`);
  console.log(`   Category: ${category}`);
  console.log(`   Chunks: ${chunks.length}`);
  
  let successCount = 0;
  for (const [index, chunk] of chunks.entries()) {
    try {
      const embedding = await createEmbedding(chunk);
      const vectorStr = '[' + embedding.join(',') + ']';
      
      const { error } = await supabase.rpc('insert_chunk', {
        p_document_id: documentId,
        p_content: chunk,
        p_metadata: { 
          index, 
          source_file: fileName, 
          category,
          ingested_at: new Date().toISOString()
        },
        p_embedding: vectorStr
      });
      
      if (error) {
        console.error(`   ❌ Chunk ${index} failed:`, error.message);
      } else {
        successCount++;
        process.stdout.write(`\r   ✅ Ingested: ${successCount}/${chunks.length} chunks`);
      }
    } catch (err: any) {
      console.error(`\n   ❌ Error on chunk ${index}:`, err.message);
    }
  }
  
  console.log(`\n   📊 Document ID: ${documentId} - ${successCount}/${chunks.length} chunks successful\n`);
  return { documentId, fileName, category, totalChunks: chunks.length, successCount };
}

async function findFiles(dir: string, category: string, extensions = ['.txt', '.md']): Promise<string[]> {
  const files: string[] = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isFile()) {
      const ext = path.extname(item).toLowerCase();
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

async function main() {
  const baseDir = path.resolve('./docs/knowledge-base');
  
  if (!fs.existsSync(baseDir)) {
    console.error('❌ Knowledge base directory not found:', baseDir);
    console.log('\nPlease create docs/knowledge-base/ and add your documentation files.');
    process.exit(1);
  }
  
  console.log('🚀 Starting automatic knowledge base ingestion...');
  console.log('📁 Base directory:', baseDir);
  
  const categories = [
    { name: 'ncm', folder: 'ncm' },
    { name: 'equivalences', folder: 'equivalences' },
    { name: 'technical', folder: 'technical' },
    { name: 'suppliers', folder: 'suppliers' }
  ];
  
  const results = [];
  let totalFiles = 0;
  let totalChunks = 0;
  let successfulChunks = 0;
  
  for (const cat of categories) {
    const categoryPath = path.join(baseDir, cat.folder);
    const files = await findFiles(categoryPath, cat.name);
    
    if (files.length === 0) {
      console.log(`\n📂 ${cat.name}: No files found`);
      continue;
    }
    
    console.log(`\n📂 ${cat.name}: Found ${files.length} file(s)`);
    
    for (const file of files) {
      const result = await ingestFile(file, cat.name);
      results.push(result);
      totalFiles++;
      totalChunks += result.totalChunks;
      successfulChunks += result.successCount;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 INGESTION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total files processed: ${totalFiles}`);
  console.log(`Total chunks created: ${successfulChunks}/${totalChunks}`);
  console.log(`Success rate: ${totalChunks > 0 ? ((successfulChunks/totalChunks)*100).toFixed(1) : 0}%`);
  console.log('\n📝 Documents by category:');
  
  const grouped = results.reduce((acc: any, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});
  
  for (const [cat, docs] of Object.entries(grouped)) {
    console.log(`\n  ${cat}:`);
    (docs as any[]).forEach(d => {
      console.log(`    - ${d.fileName} (${d.successCount} chunks, ID: ${d.documentId})`);
    });
  }
  
  console.log('\n✅ Ingestion complete!');
  console.log('\nTest your knowledge base:');
  console.log('  npx ts-node scripts/test-rag.ts "your search query"');
}

main().catch(err => console.error('Fatal error:', err));
