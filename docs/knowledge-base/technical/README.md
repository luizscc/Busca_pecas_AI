# Base de Conhecimento - Especificações Técnicas

Coloque aqui fichas técnicas, manuais e especificações de componentes.

## Formatos Aceitos
- `.txt` - Arquivos de texto simples
- `.md` - Arquivos Markdown

## O que Incluir

### Exemplos de Conteúdo:

```
BOMBA HIDRÁULICA - Escavadeira PC200-8 (Komatsu)

Part Number: 708-2G-00024
Fabricante: Kawasaki
Modelo: K3V112DT

Especificações Técnicas:
- Tipo: Bomba de pistão axial de deslocamento variável
- Configuração: Bomba dupla (2 circuitos)
- Pressão máxima: 350 bar (5075 psi)
- Vazão nominal: 2 x 226 L/min @ 2000 rpm
- Deslocamento: 2 x 112 cc/rev
- Peso: 165 kg
- Fluido: Óleo hidráulico ISO VG 46

Aplicação:
- Komatsu PC200-8 (escavadeira 20 ton)
- Komatsu PC220-8
- Sistema hidráulico principal

Componentes Internos:
- Bloco de cilindros de bronze
- Pistões com sapatas (9 pistões por bomba)
- Servo controle hidráulico
- Válvula de corte de pressão integrada

Manutenção:
- Troca de filtro: 500h
- Análise de óleo: 1000h
- Inspeção geral: 5000h
- Vida útil: 10000-15000h

Fornecedores:
- Original Komatsu: $$$$
- Recondicionado: $$$
- Compatível aftermarket: $$

---

PASTILHA DE FREIO DIANTEIRA - Sistema Bosch (Toyota Corolla)

Part Number: 04465-02280 (Toyota OEM)

Especificações:
- Tipo: Pastilha cerâmica com shim anti-ruído
- Dimensões: 130 x 55 x 16.5 mm
- Área de contato: 71.5 cm²
- Material: Composto cerâmico baixo-metálico
- Temperatura de trabalho: -40°C a 400°C
- Coeficiente de fricção: 0.42 (frio), 0.38 (quente)
- Peso: 280g (jogo)

Aplicação:
- Toyota Corolla 2.0 GLi/XEi/Altis (2015-2023)
- Toyota RAV4 2.0 (2015-2018)
- Pinça Bosch 4 pistões
- Disco ventilado Ø280mm

Características:
- Baixo nível de ruído
- Baixa geração de pó
- Desgaste uniforme
- Não agride discos

Torque de Montagem:
- Parafusos da pinça: 100 Nm
- Parafusos do suporte: 120 Nm
```

## Como Adicionar

1. Coloque fichas técnicas nesta pasta
2. Execute: `npx ts-node scripts/ingest-all.ts`

## Dicas

- Inclua especificações técnicas completas
- Sempre mencione part numbers originais
- Liste aplicações específicas (modelo + ano)
- Adicione dados de manutenção e vida útil
- Inclua informações de instalação quando relevante
