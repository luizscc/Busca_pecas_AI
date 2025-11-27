import { createSupabaseClient } from "../lib/supabase";
import { classifyISO14224 } from "../agents/iso14224-classifier";

export async function insertComponente(env: Env, componente) {
  // Classificar componente com ISO 14224
  let taxonomia = null;
  try {
    taxonomia = await classifyISO14224(env, {
      categoria: componente.categoria,
      oem_code: componente.oem_code,
      fabricante_maquina: componente.fabricante_maquina,
      modelo_maquina: componente.modelo_maquina,
      descricao_tecnica: componente.descricao_tecnica,
      descricao_busca: componente.descricao_busca
    });
    console.log(`[ISO14224] Classificado: ${taxonomia.taxonomia_iso14224} (confiança: ${(taxonomia.confianca * 100).toFixed(0)}%)`);
  } catch (err) {
    console.error("[ISO14224] Erro na classificação:", err);
  }

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
      ncm_validado_por: "agente_ncm",
      equipamento: taxonomia?.equipamento || null,
      sistema: taxonomia?.sistema || null,
      subsistema: taxonomia?.subsistema || null,
      taxonomia_iso14224: taxonomia?.taxonomia_iso14224 || null
    };

    // Verificar se já existe
    if (componente.oem_code) {
      const { data: existing } = await supabase
        .from('componentes')
        .select('id')
        .eq('oem_code', componente.oem_code)
        .single();

      if (existing) {
        // Atualizar registro existente
        const { error } = await supabase
          .from('componentes')
          .update(payload)
          .eq('oem_code', componente.oem_code);
        
        if (error) {
          console.error('❌ Supabase update error:', error);
          throw error;
        }
        return;
      }
    }

    // Inserir novo registro
    const { data, error } = await supabase
      .from('componentes')
      .insert([payload])
      .select();
    
    if (error) {
      console.error('❌ Supabase insert error:', error);
      console.log('⚠️ Tentando fallback para D1 local...');
      // Fallback para D1 se Supabase falhar
    } else {
      console.log(`✅ Componente salvo no Supabase (ID: ${data?.[0]?.id})`);
      return;
    }
  }

  // fallback D1
  console.log('💾 Salvando no D1 local...');
  const stmt = `
    INSERT INTO componentes (
      categoria, nome_comercial, fabricante_maquina, modelo_maquina,
      oem_code, outros_codigos, descricao_tecnica, specs_json,
      ncm_sugerido, ncm_confianca, ncm_alternativas_json,
      ncm_status_validacao, ncm_validado_por,
      equipamento, sistema, subsistema, taxonomia_iso14224
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const result = await env.DB.prepare(stmt)
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
      "agente_ncm",
      taxonomia?.equipamento || null,
      taxonomia?.sistema || null,
      taxonomia?.subsistema || null,
      taxonomia?.taxonomia_iso14224 || null
    ).run();
  
  console.log(`✅ Componente salvo no D1 local (last_row_id: ${result.meta.last_row_id})`);
}

