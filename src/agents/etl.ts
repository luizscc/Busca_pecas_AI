import type { Env } from "../types";

import { insertComponente } from "../db/queries";

export async function etlAgent(env: Env, ficha: any, ncm: any, resultados: any[]) {
  await insertComponente(env, {
    ...ficha,
    ncm
  });

  // depois adicionamos fornecedores e ofertas
}
