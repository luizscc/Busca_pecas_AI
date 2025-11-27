// src/agents/web-search.ts
import type { Env } from "../types";
import type { EquivalenceResult } from "./equivalence";
import { fetchWithTimeout, retry } from "../lib/fetch-utils";

export interface WebSearchOferta {
  fornecedor: {
    nome: string;
    pais: string;
    cidade?: string;
    marketplace?: string;
    url_loja?: string;
  };
  oferta: {
    url_produto?: string;
    preco_unitario_original: number;
    moeda_original: string;
    moq: number;
    observacoes?: string;
  };
  notas_compatibilidade: string;
  qualidade_fornecedor?: "alta" | "media" | "baixa";
}

export interface WebSearchRequest {
  pais: "china" | "india" | "turkey";
  item_canonico: EquivalenceResult["item_canonico"];
  codigos_pesquisa: EquivalenceResult["codigos_pesquisa"];
}

/**
 * Chama o backend externo de busca web.
 * Depois você vai implementar esse backend para realmente consultar Alibaba, IndiaMART, etc.
 */
export async function buscarOfertasWeb(
  env: Env,
  req: WebSearchRequest
): Promise<WebSearchOferta[]> {
  if (!env.BACKEND_SEARCH_URL) {
    return [];
  }

  try {
    const res = await retry(() => fetchWithTimeout(env.BACKEND_SEARCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req)
    }, 15000), 2);

    if (!res.ok) {
      const txt = await res.text();
      console.warn(`⚠️ Backend de busca (${req.pais}) indisponível:`, res.status);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      console.warn(`⚠️ Resposta inválida do backend (${req.pais})`);
      return [];
    }
    return data;
  } catch (e) {
    // Backend indisponível - modo silencioso, retorna array vazio
    return [];
  }
}
