// src/lib/rag-helper.ts
import type { Env } from '../types';
import { retrieveChunks } from './rag';

export interface RAGResult {
  context: string;
  confidence: number;
  sources: Array<{ content: string; similarity: number; category?: string }>;
  hasContext: boolean;
}

/**
 * Hybrid RAG search with confidence scoring
 * Returns formatted context + confidence to decide if GPT fallback is needed
 */
export async function searchWithConfidence(
  env: Env, 
  query: string, 
  category?: string,
  topK: number = 5
): Promise<RAGResult> {
  console.log(`🔍 [RAG] Buscando conhecimento interno: "${query.substring(0, 50)}..."`);
  
  try {
    const chunks = await retrieveChunks(env, query, topK);
    
    if (!chunks || chunks.length === 0) {
      console.log('⚠️ [RAG] Nenhum resultado encontrado na base');
      return {
        context: '',
        confidence: 0,
        sources: [],
        hasContext: false
      };
    }

    // Filter by category if specified
    let filteredChunks = chunks;
    if (category) {
      filteredChunks = chunks.filter((c: any) => c.category === category);
      console.log(`📂 [RAG] Filtrado por categoria "${category}": ${filteredChunks.length}/${chunks.length} chunks`);
    }

    // Calculate average similarity as confidence
    const avgSimilarity = filteredChunks.reduce((sum: number, c: any) => sum + (c.similarity || 0), 0) / filteredChunks.length;
    const confidence = Math.min(avgSimilarity, 1.0);

    // Format context for LLM
    const context = filteredChunks
      .map((c: any, i: number) => `[Fonte ${i + 1} - Similaridade: ${(c.similarity * 100).toFixed(0)}%]\n${c.content}`)
      .join('\n\n---\n\n');

    const sources = filteredChunks.map((c: any) => ({
      content: c.content,
      similarity: c.similarity,
      category: c.category
    }));

    console.log(`✅ [RAG] ${filteredChunks.length} chunks encontrados (confiança: ${(confidence * 100).toFixed(0)}%)`);

    return {
      context,
      confidence,
      sources,
      hasContext: filteredChunks.length > 0
    };
  } catch (error) {
    console.error('❌ [RAG] Erro na busca:', error);
    return {
      context: '',
      confidence: 0,
      sources: [],
      hasContext: false
    };
  }
}

/**
 * Enrich prompt with RAG context based on confidence thresholds
 */
export function enrichPrompt(basePrompt: string, ragResult: RAGResult): { prompt: string; mode: 'rag-only' | 'hybrid' | 'gpt-only' } {
  const { context, confidence, hasContext } = ragResult;

  // High confidence: use RAG primarily
  if (confidence >= 0.8 && hasContext) {
    console.log('🎯 [RAG] Alta confiança - Modo RAG prioritário');
    return {
      prompt: `${basePrompt}

CONHECIMENTO INTERNO (Alta Confiança - ${(confidence * 100).toFixed(0)}%):
${context}

INSTRUÇÕES:
- Priorize as informações do conhecimento interno acima
- Use seu conhecimento geral apenas para complementar
- Se houver conflito, prefira o conhecimento interno`,
      mode: 'rag-only'
    };
  }

  // Medium confidence: hybrid mode
  if (confidence >= 0.5 && hasContext) {
    console.log('⚖️ [RAG] Confiança média - Modo híbrido');
    return {
      prompt: `${basePrompt}

CONHECIMENTO INTERNO (Confiança Média - ${(confidence * 100).toFixed(0)}%):
${context}

INSTRUÇÕES:
- Use as informações do conhecimento interno como referência
- Complemente com seu conhecimento técnico geral
- Valide e expanda as informações quando necessário`,
      mode: 'hybrid'
    };
  }

  // Low/no confidence: GPT only
  console.log('🤖 [RAG] Baixa confiança - Modo GPT puro');
  return {
    prompt: hasContext 
      ? `${basePrompt}

CONTEXTO DISPONÍVEL (Baixa Relevância - ${(confidence * 100).toFixed(0)}%):
${context}

INSTRUÇÕES:
- O contexto acima tem baixa relevância
- Use principalmente seu conhecimento técnico geral
- Apenas considere o contexto se for claramente aplicável`
      : basePrompt,
    mode: 'gpt-only'
  };
}
