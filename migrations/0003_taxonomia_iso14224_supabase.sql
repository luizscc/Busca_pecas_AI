-- Migration 0003 (Supabase): Adicionar taxonomia ISO 14224 aos componentes
-- ISO 14224: Equipamento > Sistema > Subsistema > Componente

ALTER TABLE componentes ADD COLUMN IF NOT EXISTS equipamento text;
ALTER TABLE componentes ADD COLUMN IF NOT EXISTS sistema text;
ALTER TABLE componentes ADD COLUMN IF NOT EXISTS subsistema text;
ALTER TABLE componentes ADD COLUMN IF NOT EXISTS taxonomia_iso14224 text;

CREATE INDEX IF NOT EXISTS idx_componentes_equipamento ON componentes (equipamento);
CREATE INDEX IF NOT EXISTS idx_componentes_sistema ON componentes (sistema);
CREATE INDEX IF NOT EXISTS idx_componentes_taxonomia ON componentes (taxonomia_iso14224);

-- Comentário: Formato sugerido: EQUIPAMENTO.SISTEMA.SUBSISTEMA.SEQUENCIAL
-- Ex.: PC200-8.HYD.PUMP.001