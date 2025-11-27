/**
 * Processador de documentos para ingestão automática no RAG
 * Converte arquivos em chunks e gera embeddings
 */

import { createEmbedding } from "./embeddings";
import type { Env } from "../types";

interface ProcessResult {
  success: boolean;
  documentId: number;
  chunksCreated: number;
  category: string;
  filename: string;
  error?: string;
}

/**
 * Divide texto em chunks de tamanho máximo
 */
function chunkText(text: string, maxChunkSize = 1000): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxChunkSize;
    
    // Se não é o último chunk, tenta quebrar em ponto ou quebra de linha
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > start) {
        end = breakPoint + 1;
      }
    }
    
    chunks.push(text.slice(start, end).trim());
    start = end;
  }

  return chunks.filter(c => c.length > 0);
}

/**
 * Processa um arquivo e insere chunks no banco
 */
export async function processDocument(
  env: Env,
  content: string,
  filename: string,
  category: string
): Promise<ProcessResult> {
  try {
    // Validar Supabase client
    if (!env.SUPABASE) {
      return {
        success: false,
        documentId: 0,
        chunksCreated: 0,
        category,
        filename,
        error: "Supabase client não está configurado"
      };
    }

    // 1. Criar um document_id único (número sequencial menor)
    const documentId = Math.floor(Date.now() / 1000); // Timestamp em segundos (cabe em INT)

    // 2. Dividir em chunks
    const chunks = chunkText(content);
    
    if (chunks.length === 0) {
      return {
        success: false,
        documentId,
        chunksCreated: 0,
        category,
        filename,
        error: "Nenhum chunk gerado (arquivo vazio?)"
      };
    }

    // 3. Processar cada chunk
    let chunksCreated = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Gerar embedding
      const embedding = await createEmbedding(env, chunk);
      
      // Preparar metadados
      const metadata = {
        source_file: filename,
        category: category,
        chunk_index: i,
        total_chunks: chunks.length,
        ingested_at: new Date().toISOString()
      };

      // Formatar embedding como string para RPC
      const embeddingStr = `[${embedding.join(',')}]`;

      // Inserir via RPC
      const { data, error } = await env.SUPABASE
        .rpc('insert_chunk', {
          p_document_id: documentId,
          p_content: chunk,
          p_metadata: metadata,
          p_embedding: embeddingStr
        });

      if (error) {
        console.error(`Erro ao inserir chunk ${i}:`, error);
        continue;
      }

      chunksCreated++;
    }

    return {
      success: true,
      documentId,
      chunksCreated,
      category,
      filename
    };

  } catch (error) {
    return {
      success: false,
      documentId: 0,
      chunksCreated: 0,
      category,
      filename,
      error: String(error)
    };
  }
}
