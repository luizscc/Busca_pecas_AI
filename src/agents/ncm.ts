// src/agents/ncm.ts
import type { Env } from "../types";
import { callOpenAIJSON } from "../ai/openai";
import type { FichaTecnica } from "./engineer";

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
 * NCM Agent usando OpenAI.
 */
export async function ncmAgent(env: Env, ficha: FichaTecnica): Promise<NcmResult> {
  const system = NCM_SPEC + "\nLembre-se: responda APENAS o JSON.";
  const user = JSON.stringify(ficha);

  const json = await callOpenAIJSON(env, { system, user });

  return {
    ncm_sugerido: json.ncm_sugerido ?? null,
    confianca: (json.confianca as NcmResult["confianca"]) ?? "baixo",
    alternativas: Array.isArray(json.alternativas) ? json.alternativas : [],
    justificativa: json.justificativa ?? "",
    riscos_fiscais: json.riscos_fiscais ?? ""
  };
}

