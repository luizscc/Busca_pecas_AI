-- migrations/0003_convert_real_to_numeric.sql
-- Convert monetary columns from real to numeric(12,2) with minimal downtime
-- IMPORTANT: run only after creating a backup of your DB and during a maintenance window if you have traffic.

-- 1) Add new columns
ALTER TABLE ofertas ADD COLUMN IF NOT EXISTS preco_unitario_original_new numeric(12,2);
ALTER TABLE ofertas ADD COLUMN IF NOT EXISTS preco_usd_new numeric(12,2);
ALTER TABLE ofertas ADD COLUMN IF NOT EXISTS preco_brl_new numeric(12,2);

-- 2) Copy data and cast
UPDATE ofertas
SET preco_unitario_original_new = CAST(preco_unitario_original AS numeric(12,2)),
    preco_usd_new = CAST(preco_usd AS numeric(12,2)),
    preco_brl_new = CAST(preco_brl AS numeric(12,2));

-- 3) Validate sample
-- SELECT id, preco_unitario_original, preco_unitario_original_new FROM ofertas LIMIT 10;

-- 4) Create indices on new columns if necessary
CREATE INDEX IF NOT EXISTS idx_ofertas_preco_brl_new ON ofertas (preco_brl_new);

-- 5) Optional: swap columns
-- After verifying correctness, drop old columns and rename new ones
-- ALTER TABLE ofertas DROP COLUMN preco_unitario_original;
-- ALTER TABLE ofertas RENAME COLUMN preco_unitario_original_new TO preco_unitario_original;
-- Repeat for preco_usd and preco_brl.
