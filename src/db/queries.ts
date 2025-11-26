import { createSupabaseClient } from "../lib/supabase";

export async function insertComponente(env: Env, componente) {
  // If Supabase is configured, use it; otherwise fallback to D1
  const supabase = createSupabaseClient(env);
  if (supabase) {
    const payload = {
      categoria: componente.categoria,
      nome_comercial: componente.nome_comercial || null,
      fabricante_maquina: componente.fabricante_maquina,
      modelo_maquina: componente.modelo_maquina,
      oem_code: componente.oem_code,
      outros_codigos: componente.outros_codigos || [],
      descricao_tecnica: componente.descricao_tecnica,
      specs_json: componente.specs || {},
      ncm_sugerido: componente.ncm?.ncm_sugerido ?? null,
      ncm_confianca: componente.ncm?.confianca ?? null,
      ncm_alternativas_json: componente.ncm?.alternativas || [],
      ncm_status_validacao: "auto",
      ncm_validado_por: "agente_ncm"
    };

    const { error } = await supabase.from('componentes').insert([payload]);
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    return;
  }

  // fallback D1
  const stmt = `
    INSERT INTO componentes (
      categoria, nome_comercial, fabricante_maquina, modelo_maquina,
      oem_code, outros_codigos, descricao_tecnica, specs_json,
      ncm_sugerido, ncm_confianca, ncm_alternativas_json,
      ncm_status_validacao, ncm_validado_por
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await env.DB.prepare(stmt)
    .bind(
      componente.categoria,
      componente.nome_comercial || null,
      componente.fabricante_maquina,
      componente.modelo_maquina,
      componente.oem_code,
      JSON.stringify(componente.outros_codigos || []),
      componente.descricao_tecnica,
      JSON.stringify(componente.specs || {}),
      componente.ncm?.ncm_sugerido,
      componente.ncm?.confianca,
      JSON.stringify(componente.ncm?.alternativas || []),
      "auto",
      "agente_ncm"
    ).run();
}

