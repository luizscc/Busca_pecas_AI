-- Tabela temporária para verificar se colunas já existem (SQLite não tem IF NOT EXISTS para ALTER TABLE)

-- Tabela de configuração de jobs
CREATE TABLE IF NOT EXISTS jobs_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_name TEXT NOT NULL UNIQUE,
  enabled INTEGER DEFAULT 1,
  interval_days INTEGER DEFAULT 7,
  last_run TEXT,
  next_run TEXT,
  config_json TEXT,
  criado_em TEXT DEFAULT (datetime('now')),
  atualizado_em TEXT
);

-- Tabela de log de execução de jobs
CREATE TABLE IF NOT EXISTS jobs_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_name TEXT NOT NULL,
  started_at TEXT DEFAULT (datetime('now')),
  finished_at TEXT,
  status TEXT,
  componentes_processados INTEGER DEFAULT 0,
  fornecedores_adicionados INTEGER DEFAULT 0,
  fornecedores_inativados INTEGER DEFAULT 0,
  ofertas_atualizadas INTEGER DEFAULT 0,
  errors_json TEXT,
  resultado_json TEXT,
  FOREIGN KEY (job_name) REFERENCES jobs_config(job_name)
);

-- Inserir configuração padrão do job de atualização (apenas se não existir)
INSERT OR IGNORE INTO jobs_config (job_name, enabled, interval_days, config_json) 
VALUES (
  'update_suppliers',
  0,
  7,
  '{"minQualityImprovement": 0.1, "minPriceImprovement": 0.05, "autoInactivate": true}'
);
