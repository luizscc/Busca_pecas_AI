// src/agents/iso14224-classifier.ts
import type { Env } from "../types";
import { callOpenAIJSON } from "../ai/openai";

/**
 * Resultado da classificação ISO 14224
 */
export interface ISO14224Classification {
  equipamento: string;        // ex: "Escavadeira PC200-8", "Trator D6"
  sistema: string;            // ex: "Sistema Hidráulico", "Sistema de Transmissão"
  subsistema: string | null;  // ex: "Bomba", "Filtro", "Rolamento" (pode ser null)
  taxonomia_iso14224: string; // ex: "PC200-8.HYD.PUMP.001"
  confianca: number;          // 0-1, confiança na classificação
}

/**
 * Sistemas ISO 14224 mais comuns em equipamentos pesados
 */
const SISTEMAS_ISO14224 = {
  HYD: "Sistema Hidráulico",
  TRN: "Sistema de Transmissão",
  ENG: "Sistema Motor",
  ELE: "Sistema Elétrico",
  FUE: "Sistema de Combustível",
  COO: "Sistema de Arrefecimento",
  LUB: "Sistema de Lubrificação",
  BRA: "Sistema de Freios",
  STR: "Sistema de Direção",
  CAB: "Cabine e Controles",
  STR_SUP: "Estrutura e Suporte",
  TRA: "Sistema de Esteiras/Rodas"
};

/**
 * Classifica um componente usando ISO 14224 via GPT
 */
export async function classifyISO14224(
  env: Env,
  componenteInfo: {
    categoria?: string;
    oem_code?: string;
    fabricante_maquina?: string;
    modelo_maquina?: string;
    descricao_tecnica?: string;
    descricao_busca?: string;
  }
): Promise<ISO14224Classification> {
  const prompt = `Você é um especialista em taxonomia ISO 14224 para equipamentos industriais e de construção.

TAREFA: Classifique o componente abaixo de acordo com a hierarquia ISO 14224.

INFORMAÇÕES DO COMPONENTE:
- Categoria: ${componenteInfo.categoria || "não informado"}
- Código OEM: ${componenteInfo.oem_code || "não informado"}
- Fabricante do Equipamento: ${componenteInfo.fabricante_maquina || "não informado"}
- Modelo do Equipamento: ${componenteInfo.modelo_maquina || "não informado"}
- Descrição Técnica: ${componenteInfo.descricao_tecnica || "não informado"}
- Descrição da Busca: ${componenteInfo.descricao_busca || "não informado"}

SISTEMAS DISPONÍVEIS (códigos ISO):
${Object.entries(SISTEMAS_ISO14224).map(([cod, nome]) => `- ${cod}: ${nome}`).join("\n")}

INSTRUÇÕES:
1. Identifique o EQUIPAMENTO principal (ex: "Escavadeira PC200-8", "Trator D6", "Caminhão 789D")
2. Identifique o SISTEMA ao qual o componente pertence (use um dos códigos acima)
3. Identifique o SUBSISTEMA/tipo de componente (ex: "Bomba", "Filtro", "Rolamento", "Vedação")
4. Gere um código taxonomia no formato: MODELO.SISTEMA.SUBSISTEMA
   - Use siglas curtas (max 15 chars por parte)
   - Sem espaços, use hífen se necessário
   - Exemplo: "PC200-8.HYD.PUMP" ou "D6.TRN.BEARING"
5. Avalie sua confiança (0.0 a 1.0) na classificação

RESPONDA APENAS COM JSON VÁLIDO, SEM TEXTO ADICIONAL:
{
  "equipamento": "nome completo do equipamento",
  "sistema": "código do sistema (ex: HYD, TRN, ENG)",
  "subsistema": "tipo do componente (ex: Bomba, Filtro, Rolamento)",
  "taxonomia_iso14224": "MODELO.SISTEMA.SUBSISTEMA",
  "confianca": 0.95
}`;

  try {
    const result = await callOpenAIJSON(env, {
      system: "Você é um especialista em taxonomia ISO 14224 para equipamentos industriais e de construção. Responda apenas com JSON válido.",
      user: prompt
    });
    
    const content = typeof result === 'string' ? result : JSON.stringify(result);
    
    // Tentar extrair JSON mesmo se houver texto ao redor
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;
    
    const classification = JSON.parse(jsonStr) as ISO14224Classification;

    // Validar campos obrigatórios
    if (!classification.equipamento || !classification.sistema || !classification.taxonomia_iso14224) {
      throw new Error("Classificação incompleta retornada pela IA");
    }

    // Garantir que confiança está entre 0 e 1
    classification.confianca = Math.max(0, Math.min(1, classification.confianca || 0.5));

    return classification;
  } catch (err) {
    console.error("[ISO14224] Erro ao classificar:", err);
    
    // Classificação fallback básica
    const modelo = componenteInfo.modelo_maquina || componenteInfo.fabricante_maquina || "UNKNOWN";
    const categoria = componenteInfo.categoria || "COMPONENT";
    
    return {
      equipamento: modelo,
      sistema: "UNK",
      subsistema: categoria,
      taxonomia_iso14224: `${modelo.substring(0, 15).replace(/\s+/g, "-")}.UNK.${categoria.substring(0, 10).toUpperCase()}`,
      confianca: 0.3
    };
  }
}

/**
 * Classifica múltiplos componentes em batch (mais eficiente)
 */
export async function classifyISO14224Batch(
  env: Env,
  componentes: Array<{
    id?: number;
    categoria?: string;
    oem_code?: string;
    fabricante_maquina?: string;
    modelo_maquina?: string;
    descricao_tecnica?: string;
    descricao_busca?: string;
  }>
): Promise<Array<ISO14224Classification & { id?: number }>> {
  const results: Array<ISO14224Classification & { id?: number }> = [];

  // Processar em paralelo (máximo 5 por vez para não sobrecarregar a API)
  const batchSize = 5;
  for (let i = 0; i < componentes.length; i += batchSize) {
    const batch = componentes.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (comp) => {
        const classification = await classifyISO14224(env, comp);
        return { ...classification, id: comp.id };
      })
    );
    results.push(...batchResults);
  }

  return results;
}
