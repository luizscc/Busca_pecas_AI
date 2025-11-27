// src/agents/ncm.ts
import type { Env } from "../types";
import { callOpenAIJSON } from "../ai/openai";
import type { FichaTecnica } from "./engineer";
import type { EquivalenceResult } from "./equivalence";
import { searchWithConfidence, enrichPrompt } from "../lib/rag-helper";

export interface NcmResult {
  ncm_sugerido: string | null;
  confianca: "baixo" | "médio" | "alto";
  alternativas: { ncm: string; motivo: string }[];
  justificativa: string;
  riscos_fiscais?: string;
}

const NCM_SPEC = `
Você é um especialista em CLASSIFICAÇÃO FISCAL (NCM) para importação no Brasil.

Foco:
- Peças e partes de máquinas e equipamentos dos capítulos 84, 85 e 87,
  com ênfase em máquinas pesadas, tratores, escavadeiras, bombas hidráulicas,
  bombas de concreto (Putzmeister, Zoomlion, Schwing), componentes hidráulicos e elétricos.

Tarefa:
Dada uma ficha técnica de uma peça em JSON, você deve responder APENAS em JSON:

{
  "ncm_sugerido": "código NCM com 8 dígitos ou null se não for possível",
  "confianca": "baixo" | "médio" | "alto",
  "alternativas": [
    {
      "ncm": "código alternativo",
      "motivo": "explicação objetiva do porquê da alternativa"
    }
  ],
  "justificativa": "texto curto explicando o raciocínio da classificação",
  "riscos_fiscais": "alertas de risco ou dúvidas (opcional)"
}

Regras:
- Se a informação da peça for insuficiente, coloque ncm_sugerido = null e confiança = "baixo".
- Nunca invente NCM inexistente; sempre 8 dígitos.
- Se houver dúvida entre duas NCMs, escolha a principal, liste as outras em 'alternativas' com motivo.
- Responda APENAS o JSON, sem texto extra.
`;

/**
 * NCM Agent usando OpenAI com RAG.
 */
export async function ncmAgent(
  env: Env,
  ficha: FichaTecnica,
  opts?: { equivalencePromise?: Promise<EquivalenceResult>; waitMs?: number }
): Promise<NcmResult> {
  console.log('🔄 [NCM] Iniciando classificação fiscal...');
  
  // Try to enrich context with equivalence if it resolves quickly
  let equivalencia: EquivalenceResult | null = null;
  if (opts?.equivalencePromise) {
    const waitMs = opts.waitMs ?? 2000; // small wait budget
    try {
      equivalencia = await Promise.race([
        opts.equivalencePromise,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), waitMs))
      ]) as any;
    } catch {}
  }
  
  // Build query for RAG from technical specs
  const ragQuery = `NCM classificação fiscal ${ficha.categoria} ${ficha.oem_code || ''} ${ficha.descricao_tecnica || ''} capítulo 84 85 87`;
  
  // Search internal knowledge base with confidence scoring
  const ragResult = await searchWithConfidence(env, ragQuery, 'ncm', 5);
  
  // Add equivalence hints to context if available
  let equivalenceContext = '';
  if (equivalencia) {
    const eq = equivalencia;
    const hints: string[] = [];
    if (eq.item_canonico?.oem_principal) hints.push(`OEM principal: ${eq.item_canonico.oem_principal}`);
    if (Array.isArray(eq.codigos_pesquisa?.oem_primario)) hints.push(`OEMs principais: ${eq.codigos_pesquisa.oem_primario.join(', ')}`);
    if (Array.isArray(eq.codigos_pesquisa?.palavras_chave)) hints.push(`Palavras-chave: ${eq.codigos_pesquisa.palavras_chave.slice(0, 6).join(', ')}`);
    if (hints.length) {
      equivalenceContext = `\n\nEquivalência técnica (hints):\n- ${hints.join('\n- ')}`;
    }
  }
  
  // Enrich prompt based on RAG confidence
  const basePrompt = NCM_SPEC + equivalenceContext + "\nLembre-se: responda APENAS o JSON.";
  const { prompt: system, mode } = enrichPrompt(basePrompt, ragResult);
  
  console.log(`📊 [NCM] Modo de busca: ${mode} (confiança RAG: ${(ragResult.confidence * 100).toFixed(0)}%)`);
  
  const user = JSON.stringify({ ficha, equivalencia: equivalencia ? {
    item_canonico: equivalencia.item_canonico,
    codigos_pesquisa: equivalencia.codigos_pesquisa
  } : null });

  const json = await callOpenAIJSON(env, { system, user });

  return {
    ncm_sugerido: json.ncm_sugerido ?? null,
    confianca: (json.confianca as NcmResult["confianca"]) ?? "baixo",
    alternativas: Array.isArray(json.alternativas) ? json.alternativas : [],
    justificativa: json.justificativa ?? "",
    riscos_fiscais: json.riscos_fiscais ?? ""
  };
}

