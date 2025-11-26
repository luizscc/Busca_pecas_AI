// src/agents/qa.ts
import { QA_SPEC } from "./config";

export interface QaResult {
  status: "ok" | "rever_eng" | "rever_ncm" | "rever_ambos";
  comentarios: string;
}

export async function qaAgent(ficha: any, ncm: any): Promise<QaResult> {
  console.log("[QA] Spec ativo:", QA_SPEC.slice(0, 120), "...");

  const comentarios: string[] = [];
  let status: QaResult["status"] = "ok";

  // Regra bem simples por enquanto, só pra ter validação:
  if (!ficha.categoria) {
    status = "rever_eng";
    comentarios.push("Categoria da peça não informada pelo engenheiro.");
  }

  if (!ncm?.ncm_sugerido) {
    status = status === "ok" ? "rever_ncm" : "rever_ambos";
    comentarios.push("NCM sugerido ausente.");
  }

  if (ficha.categoria && ncm?.ncm_sugerido?.startsWith("84") === false) {
    comentarios.push("Categoria parece ser peça de máquina, mas NCM não começa em 84/85/87 (verificar).");
    if (status === "ok") status = "rever_ncm";
    else if (status === "rever_eng") status = "rever_ambos";
  }

  if (!ficha.fabricante_maquina || !ficha.modelo_maquina) {
    comentarios.push("Fabricante ou modelo da máquina não identificado com clareza.");
    if (status === "ok") status = "rever_eng";
    else if (status === "rever_ncm") status = "rever_ambos";
  }

  if (comentarios.length === 0) {
    comentarios.push("Ficha e NCM parecem coerentes para uma primeira análise.");
  }

  return {
    status,
    comentarios: comentarios.join(" ")
  };
}
