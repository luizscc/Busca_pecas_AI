-- TABELA: componentes
CREATE TABLE IF NOT EXISTS componentes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  categoria TEXT NOT NULL,
  nome_comercial TEXT,
  fabricante_maquina TEXT,
  modelo_maquina TEXT,
  oem_code TEXT,
  outros_codigos TEXT,
  descricao_tecnica TEXT,
  specs_json TEXT,

  ncm_sugerido TEXT,
  ncm_confianca TEXT,
  ncm_alternativas_json TEXT,
  ncm_status_validacao TEXT,
  ncm_validado_por TEXT,

  criado_em TEXT DEFAULT (datetime('now')),
  atualizado_em TEXT
);

-- TABELA: fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  pais TEXT,
  cidade TEXT,
  marketplace TEXT,
  url_loja TEXT,

  reputacao_score REAL,
  reputacao_detalhes_json TEXT,

  criado_em TEXT DEFAULT (datetime('now')),
  atualizado_em TEXT
);

-- TABELA: ofertas
CREATE TABLE IF NOT EXISTS ofertas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  componente_id INTEGER NOT NULL,
  fornecedor_id INTEGER NOT NULL,
  url_produto TEXT,

  preco_unitario_original REAL,
  moeda_original TEXT,
  preco_usd REAL,
  preco_brl REAL,
  incoterm TEXT,
  moq INTEGER,

  status_compatibilidade TEXT,
  origem_regra TEXT,
  status_oferta TEXT,
  coletado_em TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (componente_id) REFERENCES componentes(id),
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
);

-- Histórico NCM
CREATE TABLE IF NOT EXISTS classificacoes_ncm_historico (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  componente_id INTEGER NOT NULL,
  ncm TEXT NOT NULL,
  origem TEXT,
  confianca TEXT,
  observacoes TEXT,
  criado_em TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (componente_id) REFERENCES componentes(id)
);
