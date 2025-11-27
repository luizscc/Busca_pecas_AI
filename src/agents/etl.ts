import type { Env } from "../types";

import { insertComponente } from "../db/queries";

export async function etlAgent(env: Env, ficha: any, ncm: any, resultados: any[]) {
  console.log('💾 [ETL] Preparando dados para salvar...');
  const componente = {
    ...ficha,
    ncm
  };
  console.log('📦 [ETL] Componente:', JSON.stringify(componente, null, 2));
  
  try {
    await insertComponente(env, componente);
    console.log('✅ [ETL] insertComponente completado');
  } catch (error) {
    console.error('❌ [ETL] Erro ao salvar componente:', error);
    throw error;
  }

  // depois adicionamos fornecedores e ofertas
}
