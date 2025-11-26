// src/agents/engineer.ts
import type { Env } from "../types";
import { callOpenAIJSON } from "../ai/openai";
import { z } from "zod";
import { retrieveChunks } from "../lib/rag";

export interface FichaTecnica {
  categoria: string;
  fabricante_maquina: string;
  modelo_maquina: string;
  oem_code?: string | null;
  outros_codigos?: string[];
  descricao_tecnica: string;
  specs?: Record<string, any>;
}

const ENGINEER_SPEC = `
Você é um engenheiro especialista em MÁQUINAS PESADAS e EQUIPAMENTOS MÓVEIS.

Seu foco principal são:
- Escavadeiras, pás-carregadeiras, tratores agrícolas e florestais, retroescavadeiras, motoniveladoras, caminhões fora-de-estrada,
  bombas de concreto, harvesters, forwarders e equipamentos Ponsse.

Principais fabricantes que você conhece:
- Komatsu, Caterpillar, Volvo CE, JCB, John Deere, New Holland, Case, SANY,
  Putzmeister, Zoomlion, Schwing, Ponsse, Hyundai, XCMG, Liebherr, Hitachi, Doosan.

Tarefa:
Recebe uma descrição de peça (texto livre) e deve responder APENAS com um JSON no formato:

{
  "categoria": "bomba_hidraulica | motor_hidraulico | cilindro_hidraulico | motor_partida | alternador | outro",
  "fabricante_maquina": "Komatsu | Volvo | John Deere | ... ou 'desconhecido'",
  "modelo_maquina": "PC200-8 | WA200-6 | T7.245 | ... ou 'desconhecido'",
  "oem_code": "código OEM principal se houver, senão null",
  "outros_codigos": ["lista de outros códigos se existirem"],
  "descricao_tecnica": "frase técnica curta explicando função da peça",
  "specs": {
    "tipo": "pistao_axial | engrenagem | palheta | outro se aplicável",
    "observacoes": "campo livre para detalhes relevantes (opcional)"
  }
}

Regras:
- Nunca invente código OEM se não houver nenhuma indicação.
- Se tiver dúvida, use "desconhecido" em fabricante ou modelo.
- A resposta DEVE ser JSON válido conforme o formato acima, sem texto extra.
`;

/**
 * Engineer Agent usando OpenAI de verdade.
 */
export async function engineerAgent(env: Env, texto: string): Promise<FichaTecnica> {
  // Se descrição vier vazia, protege:
  const descricao = (texto || "").trim();
  if (!descricao) {
    return {
      categoria: "desconhecido",
      fabricante_maquina: "desconhecido",
      modelo_maquina: "desconhecido",
      oem_code: null,
      outros_codigos: [],
      descricao_tecnica: "Sem descrição informada.",
      specs: {}
    };
  }

  const system = ENGINEER_SPEC + "\nLembre-se: responda APENAS o JSON.";
  const user = descricao;

  // Retrieve relevant domain chunks from the RAG KB (if configured).
  const chunks = await retrieveChunks(env, descricao, 5);
  const contextText = Array.isArray(chunks) && chunks.length > 0 ? chunks.map((c: any) => `Fonte: ${c.metadata?.source || 'unknown'}\nTrecho: ${c.content}`).join('\n---\n') : '';
  const userWithContext = contextText ? `${user}\n\nContexto do conhecimento:\n${contextText}` : user;

  const json = await callOpenAIJSON(env, { system, user: userWithContext });
  // Schema validation using Zod
  const fichaSchema = z.object({
    categoria: z.string().nonempty().optional(),
    fabricante_maquina: z.string().optional(),
    modelo_maquina: z.string().optional(),
    oem_code: z.string().nullable().optional(),
    outros_codigos: z.array(z.string()).optional(),
    descricao_tecnica: z.string().optional(),
    specs: z.record(z.any()).optional()
  });

  const parsed = fichaSchema.safeParse(json);
  if (!parsed.success) {
    console.error("engineerAgent: resposta inválida do modelo", parsed.error);
    return {
      categoria: "desconhecido",
      fabricante_maquina: "desconhecido",
      modelo_maquina: "desconhecido",
      oem_code: null,
      outros_codigos: [],
      descricao_tecnica: descricao,
      specs: {}
    };
  }

  const out = parsed.data;
  return {
    categoria: out.categoria ?? "desconhecido",
    fabricante_maquina: out.fabricante_maquina ?? "desconhecido",
    modelo_maquina: out.modelo_maquina ?? "desconhecido",
    oem_code: out.oem_code ?? null,
    outros_codigos: out.outros_codigos ?? [],
    descricao_tecnica: out.descricao_tecnica ?? descricao,
    specs: out.specs ?? {}
  };
}


