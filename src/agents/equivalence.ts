// src/agents/equivalence.ts
import type { Env } from "../types";
import { callOpenAIJSON } from "../ai/openai";
import { EQUIVALENCE_SPEC } from "./config";
import type { FichaTecnica } from "./engineer";

export interface ItemCanonico {
  categoria: string;
  fabricante_maquina: string;
  modelo_maquina: string;
  oem_principal: string | null;
  descricao_tecnica: string;
}

export interface CodigoPremium {
  marca: string;
  codigo: string;
  comentario?: string;
}

export interface CodigosPesquisa {
  oem_primario: string[];
  oem_secundarios: string[];
  marcas_premium: CodigoPremium[];
  palavras_chave: string[];
}

export interface EquivalenceResult {
  item_canonico: ItemCanonico;
  codigos_pesquisa: CodigosPesquisa;
  // opcionalmente podemos carregar a ficha original junto
  ficha_original?: FichaTecnica;
}

/**
 * Agente de equivalência técnica / cross-reference.
 * Recebe a ficha do engenheiro e devolve:
 * - item canônico
 * - códigos de pesquisa (OEMs e equivalentes premium)
 */
export async function equivalenceAgent(
  env: Env,
  ficha: FichaTecnica
): Promise<EquivalenceResult> {
  const system = EQUIVALENCE_SPEC + "\nLembre-se: responda APENAS o JSON.";
  const user = JSON.stringify(ficha);

  const json = await callOpenAIJSON(env, { system, user });

  const item = json.item_canonico ?? {};
  const cod = json.codigos_pesquisa ?? {};

  const itemCanonico: ItemCanonico = {
    categoria: item.categoria ?? (ficha.categoria || "desconhecido"),
    fabricante_maquina: item.fabricante_maquina ?? ficha.fabricante_maquina ?? "desconhecido",
    modelo_maquina: item.modelo_maquina ?? ficha.modelo_maquina ?? "desconhecido",
    oem_principal: item.oem_principal ?? ficha.oem_code ?? null,
    descricao_tecnica:
      item.descricao_tecnica ?? ficha.descricao_tecnica ?? "Componente para máquina pesada."
  };

  const codigosPesquisa: CodigosPesquisa = {
    oem_primario: Array.isArray(cod.oem_primario) ? cod.oem_primario : [],
    oem_secundarios: Array.isArray(cod.oem_secundarios) ? cod.oem_secundarios : [],
    marcas_premium: Array.isArray(cod.marcas_premium) ? cod.marcas_premium : [],
    palavras_chave: Array.isArray(cod.palavras_chave) ? cod.palavras_chave : []
  };

  return {
    item_canonico: itemCanonico,
    codigos_pesquisa: codigosPesquisa,
    ficha_original: ficha
  };
}
