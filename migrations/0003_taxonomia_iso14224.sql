-- Migration 0003: Adicionar taxonomia ISO 14224 aos componentes
-- ISO 14224 define hierarquia: Equipamento > Sistema > Subsistema > Componente

-- Adicionar campos de taxonomia
ALTER TABLE componentes ADD COLUMN equipamento TEXT;
ALTER TABLE componentes ADD COLUMN sistema TEXT;
ALTER TABLE componentes ADD COLUMN subsistema TEXT;
ALTER TABLE componentes ADD COLUMN taxonomia_iso14224 TEXT; -- Código completo ex: "PC200-8.HYD.PUMP.001"

-- Criar índices para melhorar performance de consultas por taxonomia
CREATE INDEX IF NOT EXISTS idx_componentes_equipamento ON componentes(equipamento);
CREATE INDEX IF NOT EXISTS idx_componentes_sistema ON componentes(sistema);
CREATE INDEX IF NOT EXISTS idx_componentes_taxonomia ON componentes(taxonomia_iso14224);

-- Comentário: A taxonomia_iso14224 seguirá o formato: EQUIPAMENTO.SISTEMA.SUBSISTEMA.SEQUENCIAL
-- Exemplos:
--   PC200-8.HYD.PUMP.001 = Escavadeira PC200-8, Sistema Hidráulico, Bomba, item 001
--   PC200-8.TRN.BEARING.001 = Escavadeira PC200-8, Sistema Transmissão, Rolamento, item 001
--   CAT320.ENG.FILTER.001 = CAT 320, Sistema Motor, Filtro, item 001
