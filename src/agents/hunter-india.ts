// src/agents/hunter-india.ts
import type { Env } from "../types";
import { HUNTER_INDIA_SPEC } from "./config";
import type { EquivalenceResult } from "./equivalence";
import { buscarOfertasWeb, WebSearchOferta } from "./web-search";

export async function hunterIndia(
  env: Env,
  equivalencia: EquivalenceResult
): Promise<WebSearchOferta[]> {
  console.log("[HUNTER-INDIA] Spec ativo:", HUNTER_INDIA_SPEC.slice(0, 80), "...");

  const { item_canonico, codigos_pesquisa } = equivalencia;

  const ofertasWeb = await buscarOfertasWeb(env, {
    pais: "india",
    item_canonico,
    codigos_pesquisa
  });

  if (ofertasWeb.length > 0) {
    return ofertasWeb;
  }

  const desc = item_canonico.descricao_tecnica;
  const categoria = (item_canonico.categoria || "").toLowerCase();
  const isFiltro = categoria.includes("filtro") || desc.toLowerCase().includes("filter");

  const preco = isFiltro ? 60 : 980;
  const nomeFornecedor = isFiltro ? "HydroFilter India" : "HydroTech Pumps India";

  return [
    {
      fornecedor: {
        nome: nomeFornecedor,
        pais: "India",
        cidade: "Pune",
        marketplace: "IndiaMART",
        url_loja: "https://www.indiamart.com/hydrotech-pumps"
      },
      oferta: {
        url_produto:
          "https://www.indiamart.com/search.html?q=" +
          encodeURIComponent(desc.slice(0, 60)),
        preco_unitario_original: preco,
        moeda_original: "USD",
        moq: isFiltro ? 20 : 2,
        observacoes: `Oferta simulada coerente com item canônico: ${desc}`
      },
      notas_compatibilidade: `Mock Índia baseado em equivalência técnica.`,
      qualidade_fornecedor: "media"
    }
  ];
}

