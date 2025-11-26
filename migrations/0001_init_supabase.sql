-- migrations/0001_init_supabase.sql
-- Migration for Supabase / Postgres with pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Componentes table
CREATE TABLE IF NOT EXISTS componentes (
  id bigserial PRIMARY KEY,
  categoria text NOT NULL,
  nome_comercial text,
  fabricante_maquina text,
  modelo_maquina text,
  oem_code text,
  outros_codigos jsonb,
  descricao_tecnica text,
  specs_json jsonb,
  ncm_sugerido text,
  ncm_confianca text,
  ncm_alternativas_json jsonb,
  ncm_status_validacao text,
  ncm_validado_por text,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz
);
-- owner
ALTER TABLE componentes ADD COLUMN IF NOT EXISTS created_by uuid;

CREATE INDEX IF NOT EXISTS idx_componentes_oem_code ON componentes (oem_code);

-- Fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
  id bigserial PRIMARY KEY,
  nome text NOT NULL,
  pais text,
  cidade text,
  marketplace text,
  url_loja text,
  reputacao_score real,
  reputacao_detalhes_json jsonb,
  qualidade_score real,
  certificacoes jsonb,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz
);
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS created_by uuid;

-- Ofertas
CREATE TABLE IF NOT EXISTS ofertas (
  id bigserial PRIMARY KEY,
  componente_id int NOT NULL REFERENCES componentes(id),
  fornecedor_id int NOT NULL REFERENCES fornecedores(id),
  url_produto text,
  preco_unitario_original numeric(12,2),
  moeda_original text,
  preco_usd numeric(12,2),
  preco_brl numeric(12,2),
  incoterm text,
  moq int,
  status_compatibilidade text,
  origem_regra text,
  status_oferta text,
  coletado_em timestamptz DEFAULT now()
);
ALTER TABLE ofertas ADD COLUMN IF NOT EXISTS created_by uuid;

-- Chunks (RAG)
CREATE TABLE IF NOT EXISTS chunks (
  id bigserial PRIMARY KEY,
  document_id int NOT NULL,
  content text NOT NULL,
  metadata jsonb,
  embedding vector(1536),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS created_by uuid;

-- Index for nearest neighbor
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 64);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks (document_id);

-- Import cost estimates
CREATE TABLE IF NOT EXISTS import_cost_estimates (
  id bigserial PRIMARY KEY,
  componente_id int REFERENCES componentes(id),
  oferta_id int REFERENCES ofertas(id),
  total_brl numeric,
  breakdown_json jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE import_cost_estimates ADD COLUMN IF NOT EXISTS created_by uuid;

-- Additional indexes
CREATE UNIQUE INDEX IF NOT EXISTS ux_componentes_oem_code ON componentes (oem_code) WHERE oem_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ofertas_componente_id ON ofertas (componente_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_fornecedor_id ON ofertas (fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_import_cost_componente_id ON import_cost_estimates (componente_id);
CREATE INDEX IF NOT EXISTS idx_import_cost_oferta_id ON import_cost_estimates (oferta_id);

-- RPC function for vector retrieval
CREATE OR REPLACE FUNCTION match_chunks(p_embedding vector, p_k int)
RETURNS TABLE (id int, content text, metadata jsonb, score float) AS $$
  SELECT id, content, metadata, (embedding <=> p_embedding) as score
  FROM chunks
  ORDER BY score
  LIMIT p_k;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION match_chunks_filtered(p_embedding vector, p_k int, p_doc_id int DEFAULT NULL)
RETURNS TABLE (id int, content text, metadata jsonb, score float) AS $$
  SELECT id, content, metadata, (embedding <=> p_embedding) as score
  FROM chunks
  WHERE (p_doc_id IS NULL OR document_id = p_doc_id)
  ORDER BY score
  LIMIT p_k;
$$ LANGUAGE SQL STABLE;

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

-- Create triggers to update atualizado_em
DO $$
BEGIN
  -- create triggers only if not present
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'componentes') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid
      WHERE t.tgname = 'set_updated_at_componentes' AND c.relname = 'componentes'
    ) THEN
      EXECUTE 'CREATE TRIGGER set_updated_at_componentes BEFORE UPDATE ON componentes FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'fornecedores') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid
      WHERE t.tgname = 'set_updated_at_fornecedores' AND c.relname = 'fornecedores'
    ) THEN
      EXECUTE 'CREATE TRIGGER set_updated_at_fornecedores BEFORE UPDATE ON fornecedores FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ofertas') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid
      WHERE t.tgname = 'set_updated_at_ofertas' AND c.relname = 'ofertas'
    ) THEN
      EXECUTE 'CREATE TRIGGER set_updated_at_ofertas BEFORE UPDATE ON ofertas FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()';
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;
