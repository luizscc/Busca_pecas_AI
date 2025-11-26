// src/agents/orchestrator.ts
import type { Env } from "../types";
import { engineerAgent } from "./engineer";
import { ncmAgent } from "./ncm";
import { equivalenceAgent } from "./equivalence";
import { hunterChina } from "./hunter-china";
import { hunterIndia } from "./hunter-india";
import { hunterTurkey } from "./hunter-turkey";
import { etlAgent } from "./etl";

export async function orchestrator(env: Env, input: any) {
  const itemDescricao = (input?.descricao as string) ?? "";

  // 1) Engenheiro (OpenAI) → ficha técnica base
  const ficha = await engineerAgent(env, itemDescricao);

  // 2) Agente de equivalência técnica / cross-ref
  const equivalencia = await equivalenceAgent(env, ficha);

  // 3) NCM (OpenAI)
  const ncm = await ncmAgent(env, ficha);

  // 4) Hunters (China, Índia, Turquia) → agora usam equivalência
  const [resultadosChina, resultadosIndia, resultadosTurquia] = await Promise.all([
    hunterChina(env, equivalencia),
    hunterIndia(env, equivalencia),
    hunterTurkey(env, equivalencia)
  ]);

  const resultados = [
    ...resultadosChina,
    ...resultadosIndia,
    ...resultadosTurquia
  ];

  // 5) ETL → no futuro, usar equivalencia + resultados para gravar no D1
  await etlAgent(env, ficha, ncm, resultados);

  return {
    sucesso: true,
    mensagem: "Processamento concluído.",
    ficha,
    equivalencia,
    ncm,
    resultados
  };
}




