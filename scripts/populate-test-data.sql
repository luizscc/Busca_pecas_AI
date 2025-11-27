-- Popular base com dados de teste para sistema de atualização

-- Componente 1: Rolamento 6203
INSERT INTO componentes (id, categoria, nome_comercial, fabricante_maquina, modelo_maquina, oem_code, descricao_tecnica, ncm_sugerido, ncm_confianca, criado_em)
VALUES (1, 'Rolamento', 'Rolamento de Esferas 6203', 'SKF', 'Genérico', '6203', 'Rolamento de esferas radial de uma carreira, diâmetro interno 17mm, externo 40mm, largura 12mm', '84821000', 'alto', datetime('now', '-30 days'));

-- Fornecedores para Rolamento 6203
INSERT INTO fornecedores (id, nome, pais, cidade, marketplace, reputacao_score, ativo, criado_em)
VALUES 
(1, 'Shanghai Bearing Co', 'China', 'Shanghai', 'Alibaba', 4.2, 1, datetime('now', '-30 days')),
(2, 'Mumbai Industrial Parts', 'Índia', 'Mumbai', 'IndiaMART', 3.8, 1, datetime('now', '-30 days')),
(3, 'Istanbul Machinery', 'Turquia', 'Istanbul', 'TurkishExporter', 4.0, 1, datetime('now', '-30 days'));

-- Ofertas antigas (preços que serão atualizados)
INSERT INTO ofertas (id, componente_id, fornecedor_id, url_produto, preco_unitario_original, moeda_original, preco_usd, preco_brl, status_compatibilidade, status_oferta, ativo, data_preco, coletado_em)
VALUES
(1, 1, 1, 'https://alibaba.com/product/6203-bearing', 5.80, 'USD', 5.80, 29.00, 'confirmado', 'ativo', 1, datetime('now', '-30 days'), datetime('now', '-30 days')),
(2, 1, 2, 'https://indiamart.com/bearing-6203', 320.00, 'INR', 3.90, 19.50, 'confirmado', 'ativo', 1, datetime('now', '-30 days'), datetime('now', '-30 days')),
(3, 1, 3, 'https://turkish-exporter.com/6203', 160.00, 'TRY', 4.70, 23.50, 'confirmado', 'ativo', 1, datetime('now', '-30 days'), datetime('now', '-30 days'));

-- Componente 2: Bomba Hidráulica
INSERT INTO componentes (id, categoria, nome_comercial, fabricante_maquina, modelo_maquina, oem_code, descricao_tecnica, ncm_sugerido, ncm_confianca, criado_em)
VALUES (2, 'Bomba Hidráulica', 'Bomba de Pistão', 'Komatsu', 'PC200-8', '708-2L-00300', 'Bomba hidráulica de pistão axial, vazão 140 L/min, pressão máxima 350 bar', '84136000', 'alto', datetime('now', '-25 days'));

-- Fornecedores para Bomba Hidráulica
INSERT INTO fornecedores (id, nome, pais, cidade, marketplace, reputacao_score, ativo, criado_em)
VALUES 
(4, 'Guangzhou Hydraulics', 'China', 'Guangzhou', 'Alibaba', 4.5, 1, datetime('now', '-25 days')),
(5, 'Delhi Heavy Parts', 'Índia', 'Delhi', 'IndiaMART', 4.1, 1, datetime('now', '-25 days')),
(6, 'Ankara Hydraulic Systems', 'Turquia', 'Ankara', 'TurkishExporter', 3.9, 1, datetime('now', '-25 days'));

-- Ofertas antigas para Bomba Hidráulica
INSERT INTO ofertas (id, componente_id, fornecedor_id, url_produto, preco_unitario_original, moeda_original, preco_usd, preco_brl, status_compatibilidade, status_oferta, ativo, data_preco, coletado_em)
VALUES
(4, 2, 4, 'https://alibaba.com/hydraulic-pump-708', 850.00, 'USD', 850.00, 4250.00, 'confirmado', 'ativo', 1, datetime('now', '-25 days'), datetime('now', '-25 days')),
(5, 2, 5, 'https://indiamart.com/komatsu-pump', 72000.00, 'INR', 880.00, 4400.00, 'confirmado', 'ativo', 1, datetime('now', '-25 days'), datetime('now', '-25 days')),
(6, 2, 6, 'https://turkish-exporter.com/hydraulic-pump', 28000.00, 'TRY', 820.00, 4100.00, 'confirmado', 'ativo', 1, datetime('now', '-25 days'), datetime('now', '-25 days'));

-- Componente 3: Filtro Hidráulico
INSERT INTO componentes (id, categoria, nome_comercial, fabricante_maquina, modelo_maquina, oem_code, descricao_tecnica, ncm_sugerido, ncm_confianca, criado_em)
VALUES (3, 'Filtro', 'Filtro Hidráulico', 'Caterpillar', 'CAT 320D', '1R-0750', 'Filtro de óleo hidráulico, elemento filtrante 10 microns, rosca 1-12 UN', '84212300', 'médio', datetime('now', '-20 days'));

-- Fornecedores para Filtro
INSERT INTO fornecedores (id, nome, pais, cidade, marketplace, reputacao_score, ativo, criado_em)
VALUES 
(7, 'Shenzhen Filters Ltd', 'China', 'Shenzhen', 'Alibaba', 4.3, 1, datetime('now', '-20 days')),
(8, 'Bangalore Filter Co', 'Índia', 'Bangalore', 'IndiaMART', 3.7, 1, datetime('now', '-20 days')),
(9, 'Izmir Parts Trading', 'Turquia', 'Izmir', 'TurkishExporter', 4.0, 1, datetime('now', '-20 days'));

-- Ofertas antigas para Filtro
INSERT INTO ofertas (id, componente_id, fornecedor_id, url_produto, preco_unitario_original, moeda_original, preco_usd, preco_brl, status_compatibilidade, status_oferta, ativo, data_preco, coletado_em)
VALUES
(7, 3, 7, 'https://alibaba.com/hydraulic-filter-1r0750', 18.50, 'USD', 18.50, 92.50, 'confirmado', 'ativo', 1, datetime('now', '-20 days'), datetime('now', '-20 days')),
(8, 3, 8, 'https://indiamart.com/cat-filter', 1600.00, 'INR', 19.50, 97.50, 'confirmado', 'ativo', 1, datetime('now', '-20 days'), datetime('now', '-20 days')),
(9, 3, 9, 'https://turkish-exporter.com/filter-1r0750', 680.00, 'TRY', 20.00, 100.00, 'confirmado', 'ativo', 1, datetime('now', '-20 days'), datetime('now', '-20 days'));

-- Agora vamos simular "novos" fornecedores com preços melhores (que o job vai encontrar)
-- Estes fornecedores serão "descobertos" pelo job e vão substituir os antigos

INSERT INTO fornecedores (id, nome, pais, cidade, marketplace, reputacao_score, ativo, criado_em)
VALUES 
(10, 'Hangzhou Premium Bearings', 'China', 'Hangzhou', 'Alibaba', 4.7, 1, datetime('now')),
(11, 'Chennai Hydraulics Pro', 'Índia', 'Chennai', 'IndiaMART', 4.6, 1, datetime('now')),
(12, 'Bursa Quality Parts', 'Turquia', 'Bursa', 'TurkishExporter', 4.5, 1, datetime('now'));

-- Ofertas "novas" com preços melhores (que o job vai inserir e comparar)
-- Rolamento 6203 - novo fornecedor com preço 15% menor e reputação melhor
INSERT INTO ofertas (componente_id, fornecedor_id, url_produto, preco_unitario_original, moeda_original, preco_usd, preco_brl, status_compatibilidade, status_oferta, ativo, data_preco, coletado_em)
VALUES
(1, 10, 'https://alibaba.com/premium-6203-bearing', 4.90, 'USD', 4.90, 24.50, 'confirmado', 'ativo', 1, datetime('now'), datetime('now'));

-- Bomba Hidráulica - novo fornecedor com preço 8% menor e reputação melhor
INSERT INTO ofertas (componente_id, fornecedor_id, url_produto, preco_unitario_original, moeda_original, preco_usd, preco_brl, status_compatibilidade, status_oferta, ativo, data_preco, coletado_em)
VALUES
(2, 11, 'https://indiamart.com/premium-komatsu-pump', 62000.00, 'INR', 755.00, 3775.00, 'confirmado', 'ativo', 1, datetime('now'), datetime('now'));

-- Filtro - novo fornecedor com preço 12% menor
INSERT INTO ofertas (componente_id, fornecedor_id, url_produto, preco_unitario_original, moeda_original, preco_usd, preco_brl, status_compatibilidade, status_oferta, ativo, data_preco, coletado_em)
VALUES
(3, 12, 'https://turkish-exporter.com/premium-filter', 580.00, 'TRY', 17.00, 85.00, 'confirmado', 'ativo', 1, datetime('now'), datetime('now'));
