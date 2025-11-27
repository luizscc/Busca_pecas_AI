// src/agents/updater.ts
import type { Env } from "../types";
import { orchestrator } from "./orchestrator";

export interface UpdaterConfig {
  minQualityImprovement: number; // ex: 0.1 = 10% melhoria na reputação
  minPriceImprovement: number;   // ex: 0.05 = 5% melhoria no preço
  autoInactivate: boolean;       // inativar automaticamente fornecedores piores
}

export interface UpdaterResult {
  componentesProcessados: number;
  fornecedoresAdicionados: number;
  fornecedoresInativados: number;
  ofertasAtualizadas: number;
  errors: string[];
  details: any[];
}

/**
 * Agente de atualização periódica.
 * Revisa toda a base de componentes, roda busca atualizada, compara fornecedores/ofertas,
 * inativa antigos inferiores e adiciona novos melhores.
 */
export async function updaterAgent(
  env: Env,
  config: UpdaterConfig
): Promise<UpdaterResult> {
  const result: UpdaterResult = {
    componentesProcessados: 0,
    fornecedoresAdicionados: 0,
    fornecedoresInativados: 0,
    ofertasAtualizadas: 0,
    errors: [],
    details: []
  };

  try {
    // 1) Buscar todos os componentes ativos
    const componentes = await env.DB.prepare(
      `SELECT id, categoria, oem_code, fabricante_maquina, modelo_maquina, descricao_tecnica
       FROM componentes
       ORDER BY id`
    ).all();

    if (!componentes.results || componentes.results.length === 0) {
      result.errors.push("Nenhum componente encontrado na base");
      return result;
    }

    console.log(`[UPDATER] Processando ${componentes.results.length} componentes...`);

    // 2) Para cada componente, rodar busca atualizada
    for (const comp of componentes.results) {
      try {
        result.componentesProcessados++;

        // Montar descrição para busca
        const descricao = [
          comp.categoria,
          comp.oem_code,
          comp.fabricante_maquina,
          comp.modelo_maquina,
          comp.descricao_tecnica
        ]
          .filter(Boolean)
          .join(" ");

        console.log(`[UPDATER] Componente ${comp.id}: ${descricao.substring(0, 60)}...`);

        // Rodar orquestrador completo (com hunters)
        const searchResult = await orchestrator(env, {
          descricao,
          fast: false,
          noCache: true
        });

        if (!searchResult.resultados || searchResult.resultados.length === 0) {
          console.log(`[UPDATER] Nenhum resultado novo para componente ${comp.id}`);
          continue;
        }

        // 3) Buscar fornecedores/ofertas atuais do componente
        const ofertasAtuais = await env.DB.prepare(
          `SELECT o.*, f.nome, f.pais, f.reputacao_score
           FROM ofertas o
           JOIN fornecedores f ON o.fornecedor_id = f.id
           WHERE o.componente_id = ? AND o.ativo = 1`
        )
          .bind(comp.id)
          .all();

        const currentOffers = ofertasAtuais.results || [];

        // 4) Comparar novos resultados com ofertas atuais
        for (const novoResultado of searchResult.resultados) {
          const novoFornecedor = novoResultado.fornecedor || {};
          const novaOferta = novoResultado.oferta || {};

          // Verificar se fornecedor já existe
          let fornecedorId: number | null = null;
          const existingSupplier = await env.DB.prepare(
            `SELECT id FROM fornecedores WHERE nome = ? AND pais = ?`
          )
            .bind(novoFornecedor.nome || "Desconhecido", novoFornecedor.pais || "Desconhecido")
            .first();

          if (existingSupplier) {
            fornecedorId = existingSupplier.id as number;
          } else {
            // Inserir novo fornecedor
            const insertSupplier = await env.DB.prepare(
              `INSERT INTO fornecedores (nome, pais, cidade, marketplace, url_loja, reputacao_score, ativo)
               VALUES (?, ?, ?, ?, ?, ?, 1)`
            )
              .bind(
                novoFornecedor.nome || "Desconhecido",
                novoFornecedor.pais || "Desconhecido",
                novoFornecedor.cidade || null,
                novoFornecedor.marketplace || null,
                novoFornecedor.url_loja || null,
                novoFornecedor.reputacao_score || null
              )
              .run();

            fornecedorId = insertSupplier.meta.last_row_id;
            result.fornecedoresAdicionados++;
            console.log(`[UPDATER] Novo fornecedor adicionado: ${novoFornecedor.nome} (ID ${fornecedorId})`);
          }

          // Verificar se já existe oferta deste fornecedor para este componente
          const existingOffer = currentOffers.find(
            (o: any) => o.fornecedor_id === fornecedorId
          );

          if (existingOffer) {
            // Atualizar preço e data se mudou
            const precoNovo = novaOferta.preco_usd || null;
            const precoAtual = existingOffer.preco_usd;

            const precoNovoNum: number = Number(precoNovo ?? 0);
            const precoAtualNum: number = Number(precoAtual ?? 0);
            if (
              Number.isFinite(precoNovoNum) &&
              Number.isFinite(precoAtualNum) &&
              Math.abs(precoNovoNum - precoAtualNum) > 0.01
            ) {
              await env.DB.prepare(
                `UPDATE ofertas 
                 SET preco_usd = ?, preco_unitario_original = ?, data_preco = datetime('now'), atualizado_em = datetime('now')
                 WHERE id = ?`
              )
                .bind(precoNovo, novaOferta.preco_unitario_original || precoNovo, existingOffer.id)
                .run();

              result.ofertasAtualizadas++;
              console.log(
                `[UPDATER] Preço atualizado: componente ${comp.id}, fornecedor ${fornecedorId}, ${precoAtual} → ${precoNovo} USD`
              );
            }
          } else {
            // Inserir nova oferta
            await env.DB.prepare(
              `INSERT INTO ofertas (componente_id, fornecedor_id, url_produto, preco_unitario_original, moeda_original, preco_usd, preco_brl, incoterm, moq, status_compatibilidade, status_oferta, data_preco, ativo)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 1)`
            )
              .bind(
                comp.id,
                fornecedorId,
                novaOferta.url_produto || null,
                novaOferta.preco_unitario_original || null,
                novaOferta.moeda_original || "USD",
                novaOferta.preco_usd || null,
                novaOferta.preco_brl || null,
                novaOferta.incoterm || null,
                novaOferta.moq || null,
                novaOferta.status_compatibilidade || "pendente",
                novaOferta.status_oferta || "ativo"
              )
              .run();

            result.ofertasAtualizadas++;
            console.log(`[UPDATER] Nova oferta adicionada: componente ${comp.id}, fornecedor ${fornecedorId}`);
          }

          // 5) Avaliar se novos fornecedores são melhores; inativar antigos se necessário
          if (config.autoInactivate && currentOffers.length > 0) {
            const novaReputacao = novoFornecedor.reputacao_score || 0;
            const novoPreco = novaOferta.preco_usd || 0;

            for (const ofertaAntiga of currentOffers) {
              const reputacaoAntiga = ofertaAntiga.reputacao_score || 0;
              const precoAntigo: number = Number(ofertaAntiga.preco_usd ?? 0);

              const melhorReputacao =
                Number(novaReputacao) > Number(reputacaoAntiga) * (1 + Number(config.minQualityImprovement));
              const melhorPreco =
                Number(novoPreco) > 0 &&
                Number(precoAntigo) > 0 &&
                Number(novoPreco) < Number(precoAntigo) * (1 - Number(config.minPriceImprovement));

              // Regra atualizada: inativar quando preço melhora OU reputação melhora
              if (config.autoInactivate && (melhorReputacao || melhorPreco) && ofertaAntiga.fornecedor_id !== fornecedorId) {
                // Inativar oferta antiga
                await env.DB.prepare(
                  `UPDATE ofertas
                   SET ativo = 0, inativado_em = datetime('now'), motivo_inativacao = ?
                   WHERE id = ?`
                )
                  .bind(
                    melhorReputacao && melhorPreco
                      ? "Substituído: melhor reputação e preço"
                      : melhorReputacao
                      ? "Substituído: melhor reputação"
                      : "Substituído: melhor preço",
                    ofertaAntiga.id
                  )
                  .run();

                result.fornecedoresInativados++;
                console.log(
                  `[UPDATER] Oferta inativada: componente ${comp.id}, fornecedor antigo ${ofertaAntiga.fornecedor_id}`
                );
              }
            }
          }
        }

        result.details.push({
          componenteId: comp.id,
          descricao: descricao.substring(0, 80),
          novosResultados: searchResult.resultados.length
        });
      } catch (err) {
        const msg = `Erro ao processar componente ${comp.id}: ${err}`;
        console.error(`[UPDATER] ${msg}`);
        result.errors.push(msg);
      }
    }

    console.log(`[UPDATER] Concluído: ${result.componentesProcessados} processados, ${result.fornecedoresAdicionados} novos, ${result.fornecedoresInativados} inativados, ${result.ofertasAtualizadas} atualizados`);
  } catch (err) {
    const msg = `Erro geral no updater: ${err}`;
    console.error(`[UPDATER] ${msg}`);
    result.errors.push(msg);
  }

  return result;
}
