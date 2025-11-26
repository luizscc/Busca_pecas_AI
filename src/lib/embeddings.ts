// src/lib/embeddings.ts
import type { Env } from '../types';
import { fetchWithTimeout, retry } from './fetch-utils';

export async function createEmbedding(env: Env, text: string): Promise<number[]> {
  if (!env.OPENAI_API_KEY) throw new Error('No OpenAI key');

  const body = { model: 'text-embedding-3-large', input: text };

  const res = await retry(() => fetchWithTimeout('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: JSON.stringify(body)
  }, 15000), 2);

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Embedding error: ${res.status} ${txt}`);
  }

  const data: any = await res.json();
  const embedding = data?.data?.[0]?.embedding;
  if (!embedding) throw new Error('Embedding response invalid');
  return embedding as number[];
}
