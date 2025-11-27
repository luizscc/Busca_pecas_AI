// src/lib/job-runner.ts
import type { Env } from "../types";
import { updaterAgent, type UpdaterConfig } from "../agents/updater";

/**
 * Verifica se um job deve ser executado e o dispara se necessário.
 */
export async function checkAndRunJobs(env: Env): Promise<void> {
  try {
    const now = new Date();

    // Buscar jobs habilitados
    const jobs = await env.DB.prepare(
      `SELECT * FROM jobs_config WHERE enabled = 1`
    ).all();

    if (!jobs.results || jobs.results.length === 0) {
      return;
    }

    for (const job of jobs.results) {
      const jobName = job.job_name as string;
      const intervalDays = (job.interval_days as number) || 7;
      const lastRun = job.last_run ? new Date(job.last_run as string) : null;

      // Verificar se precisa rodar
      let shouldRun = false;
      if (!lastRun) {
        shouldRun = true; // nunca rodou
      } else {
        const daysSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60 * 24);
        shouldRun = daysSinceLastRun >= intervalDays;
      }

      if (shouldRun) {
        console.log(`[JOB-RUNNER] Executando job: ${jobName}`);
        await runJob(env, jobName);
      }
    }
  } catch (err) {
    console.error("[JOB-RUNNER] Erro ao verificar jobs:", err);
  }
}

/**
 * Executa um job específico.
 */
export async function runJob(env: Env, jobName: string): Promise<any> {
  const startTime = new Date().toISOString();

  // Buscar configuração do job
  const jobConfig = await env.DB.prepare(
    `SELECT * FROM jobs_config WHERE job_name = ?`
  )
    .bind(jobName)
    .first();

  if (!jobConfig) {
    throw new Error(`Job não encontrado: ${jobName}`);
  }

  // Criar log de execução
  const logInsert = await env.DB.prepare(
    `INSERT INTO jobs_log (job_name, started_at, status) VALUES (?, ?, 'running')`
  )
    .bind(jobName, startTime)
    .run();

  const logId = logInsert.meta.last_row_id;

  try {
    let result: any = {};

    // Executar job específico
    if (jobName === "update_suppliers") {
      const config: UpdaterConfig = jobConfig.config_json
        ? JSON.parse(jobConfig.config_json as string)
        : { minQualityImprovement: 0.1, minPriceImprovement: 0.05, autoInactivate: true };

      result = await updaterAgent(env, config);

      // Atualizar log com resultados
      await env.DB.prepare(
        `UPDATE jobs_log
         SET finished_at = datetime('now'),
             status = ?,
             componentes_processados = ?,
             fornecedores_adicionados = ?,
             fornecedores_inativados = ?,
             ofertas_atualizadas = ?,
             errors_json = ?,
             resultado_json = ?
         WHERE id = ?`
      )
        .bind(
          result.errors.length > 0 ? "completed_with_errors" : "completed",
          result.componentesProcessados,
          result.fornecedoresAdicionados,
          result.fornecedoresInativados,
          result.ofertasAtualizadas,
          JSON.stringify(result.errors),
          JSON.stringify(result.details),
          logId
        )
        .run();
    }

    // Atualizar last_run e next_run no jobs_config
    const intervalDays = (jobConfig.interval_days as number) || 7;
    const nextRun = new Date();
    nextRun.setDate(nextRun.getDate() + intervalDays);

    await env.DB.prepare(
      `UPDATE jobs_config
       SET last_run = datetime('now'),
           next_run = ?,
           atualizado_em = datetime('now')
       WHERE job_name = ?`
    )
      .bind(nextRun.toISOString(), jobName)
      .run();

    console.log(`[JOB-RUNNER] Job ${jobName} concluído com sucesso`);
    return result;
  } catch (err) {
    // Log de erro
    await env.DB.prepare(
      `UPDATE jobs_log
       SET finished_at = datetime('now'),
           status = 'failed',
           errors_json = ?
       WHERE id = ?`
    )
      .bind(JSON.stringify([String(err)]), logId)
      .run();

    console.error(`[JOB-RUNNER] Erro ao executar job ${jobName}:`, err);
    throw err;
  }
}
