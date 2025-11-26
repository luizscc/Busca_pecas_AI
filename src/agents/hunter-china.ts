// src/agents/hunter-china.ts
import type { Env } from "../types";
import { HUNTER_CHINA_SPEC } from "./config";
import type { EquivalenceResult } from "./equivalence";
import { buscarOfertasWeb, WebSearchOferta } from "./web-search";

export async function hunterChina(
  env: Env,
  equivalencia: EquivalenceResult
): Promise<WebSearchOferta[]> {
  console.log("[HUNTER-CHINA] Spec ativo:", HUNTER_CHINA_SPEC.slice(0, 80), "...");

  const { item_canonico, codigos_pesquisa } = equivalencia;

  // 1) tenta buscar no backend real
  const ofertasWeb = await buscarOfertasWeb(env, {
    pais: "china",
    item_canonico,
    codigos_pesquisa
  });

  if (ofertasWeb.length > 0) {
    return ofertasWeb;
  }

  // 2) Fallback MOCK, usando informação técnica (até o backend ficar pronto)
  const desc = item_canonico.descricao_tecnica;
  const categoria = (item_canonico.categoria || "").toLowerCase();
  const isFiltro = categoria.includes("filtro") || desc.toLowerCase().includes("filter");

  const preco = isFiltro ? 80 : 1250;
  const baseNome = isFiltro ? "Xuzhou Filter Co., Ltd." : "Xuzhou Hydraulic Co., Ltd.";

  return [
    {
      fornecedor: {
        nome: baseNome,
        pais: "China",
        cidade: "Xuzhou",
        marketplace: "Alibaba",
        url_loja: "https://alibaba.com/xuzhouhydraulic"
      },
      oferta: {
        url_produto: "https://alibaba.com/search?keyword=" +
          encodeURIComponent(desc.slice(0, 60)),
        preco_unitario_original: preco,
        moeda_original: "USD",
        moq: isFiltro ? 10 : 1,
        observacoes: `Oferta simulada coerente com item canônico: ${desc}`
      },
      notas_compatibilidade: `Mock China baseado em equivalência técnica.`,
      qualidade_fornecedor: "media"
    }
  ];
}

