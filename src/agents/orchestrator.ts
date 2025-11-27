// src/agents/orchestrator.ts
import type { Env } from "../types";
import { engineerAgent } from "./engineer";
import { ncmAgent } from "./ncm";
import { equivalenceAgent } from "./equivalence";
import { hunterChina } from "./hunter-china";
import { hunterIndia } from "./hunter-india";
import { hunterTurkey } from "./hunter-turkey";
import { etlAgent } from "./etl";

// Simple in-memory cache (per worker instance) to speed up repeated queries
const ORCH_CACHE = new Map<string, { ts: number; data: any }>();

function computeConfidence(equivalencia: any, ncm: any) {
  let score = 0;
  const reasons: string[] = [];

  const oemPrincipal = equivalencia?.item_canonico?.oem_principal;
  if (oemPrincipal) {
    score += 0.25;
    reasons.push("OEM principal identificado");
  }

  const primarios = Array.isArray(equivalencia?.codigos_pesquisa?.oem_primario)
    ? equivalencia.codigos_pesquisa.oem_primario.length
    : 0;
  if (primarios >= 3) {
    score += 0.35;
    reasons.push("Múltiplos OEMs primários (>=3)");
  } else if (primarios >= 1) {
    score += 0.2;
    reasons.push("Alguns OEMs primários (>=1)");
  }

  const keywords = Array.isArray(equivalencia?.codigos_pesquisa?.palavras_chave)
    ? equivalencia.codigos_pesquisa.palavras_chave.length
    : 0;
  if (keywords >= 5) {
    score += 0.1;
    reasons.push("Palavras‑chave suficientes (>=5)");
  } else if (keywords >= 1) {
    score += 0.05;
    reasons.push("Algumas palavras‑chave");
  }

  if (ncm?.ncm_sugerido) {
    score += 0.15;
    reasons.push("NCM sugerido presente");
  }
  if (ncm?.confianca === "alto") {
    score += 0.25;
    reasons.push("NCM confiança alta");
  } else if (ncm?.confianca === "médio") {
    score += 0.12;
    reasons.push("NCM confiança média");
  }

  if (score > 1) score = 1;
  return { score, reasons };
}

export async function orchestrator(env: Env, input: any) {
  const itemDescricao = (input?.descricao as string) ?? "";
  const fast = Boolean(input?.fast);
  const auto = Boolean((input as any)?.auto);
  const noCache = Boolean(input?.noCache);

  // Cache lookup (5 minutes TTL)
  const key = JSON.stringify({ d: itemDescricao, fast, auto });
  if (!noCache) {
    const hit = ORCH_CACHE.get(key);
    if (hit && Date.now() - hit.ts < 5 * 60 * 1000) {
      return { ...hit.data, cache: true };
    }
  }

  // 1) Engenheiro (OpenAI) → ficha técnica base
  const ficha = await engineerAgent(env, itemDescricao);

  // 2) e 3) em paralelo: equivalência e NCM (NCM tenta usar equivalência se ficar pronta rápido)
  const eqPromise = equivalenceAgent(env, ficha);
  const ncmPromise = ncmAgent(env, ficha, { equivalencePromise: eqPromise, waitMs: 2000 });
  const [equivalencia, ncm] = await Promise.all([eqPromise, ncmPromise]);

  // 4) Hunters (China, Índia, Turquia) → agora usam equivalência
  let resultados: any[] = [];
  let modeUsed: "fast" | "full" | "auto-fast" | "auto-full" = "full";

  if (fast) {
    modeUsed = "fast";
  } else if (auto) {
    const { score, reasons } = computeConfidence(equivalencia, ncm);
    if (score >= 0.6) {
      modeUsed = "auto-fast"; // suficiente, pula hunters
    } else {
      // baixa confiança → rodar hunters
      const [resultadosChina, resultadosIndia, resultadosTurquia] = await Promise.all([
        hunterChina(env, equivalencia),
        hunterIndia(env, equivalencia),
        hunterTurkey(env, equivalencia)
      ]);
      resultados = [...resultadosChina, ...resultadosIndia, ...resultadosTurquia];
      modeUsed = "auto-full";
    }
  } else {
    // modo completo padrão
    const [resultadosChina, resultadosIndia, resultadosTurquia] = await Promise.all([
      hunterChina(env, equivalencia),
      hunterIndia(env, equivalencia),
      hunterTurkey(env, equivalencia)
    ]);
    resultados = [...resultadosChina, ...resultadosIndia, ...resultadosTurquia];
    modeUsed = "full";
  }

  // 5) ETL → no futuro, usar equivalencia + resultados para gravar no D1
  console.log('🔄 [ORCHESTRATOR] Iniciando ETL para salvar componente...');
  try {
    await etlAgent(env, ficha, ncm, resultados);
    console.log('✅ [ORCHESTRATOR] ETL completado');
  } catch (error) {
    console.error('❌ [ORCHESTRATOR] Erro no ETL:', error);
  }

  const confidence = computeConfidence(equivalencia, ncm);
  const payload = {
    sucesso: true,
    mensagem: "Processamento concluído.",
    ficha,
    equivalencia,
    ncm,
    resultados,
    meta: {
      modeRequested: fast ? "fast" : (auto ? "auto" : "full"),
      modeUsed,
      confidence: confidence.score,
      reasons: confidence.reasons
    }
  };

  // Save in cache
  if (!noCache) {
    ORCH_CACHE.set(key, { ts: Date.now(), data: payload });
    // best-effort prune to avoid unbounded growth
    if (ORCH_CACHE.size > 50) {
      const firstKey = ORCH_CACHE.keys().next().value;
      ORCH_CACHE.delete(firstKey);
    }
  }

  return payload;
}

