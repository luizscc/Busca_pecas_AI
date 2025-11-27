# Base de Conhecimento - Equivalências

Coloque aqui tabelas de equivalência entre códigos OEM e peças de reposição.

## Formatos Aceitos
- `.txt` - Arquivos de texto simples
- `.md` - Arquivos Markdown

## O que Incluir

### Exemplos de Conteúdo:

```
BOMBA D'ÁGUA - Motor EA888 Gen3 (VW/Audi 1.8/2.0 TSI)

OEM Original:
- VW: 06H121026DD, 06H121026BA, 06H121026CQ
- Audi: 06H121026DD

Equivalências Premium:
- Gates: 42153 (Water Pump)
- Urby: UBG1234
- Maxauto: MAX5678
- Graf: PA1234

Aplicação:
- VW Golf VII 1.8/2.0 TSI (2014-2020)
- VW Tiguan II 2.0 TSI (2016-2020)
- Audi A3 8V 1.8/2.0 TFSI (2013-2020)
- Seat Leon 5F 1.8/2.0 TSI (2013-2020)

Especificações:
- Tipo: Bomba mecânica acionada por correia dentada
- Material: Alumínio fundido
- Vazão: 150 L/min
- Pressão máxima: 2 bar

---

FILTRO DE ÓLEO - Motores Fire 1.0/1.4 8V Flex (Fiat)

OEM Original:
- Fiat: 55238304, 46796687

Equivalências:
- Mann Filter: W712/73
- Tecfil: PSL140
- Fram: PH5796
- Bosch: 0986452041

Aplicação:
- Fiat Uno Fire 1.0/1.4 (2010-2020)
- Fiat Palio Fire 1.0/1.4 (2011-2020)
- Fiat Siena Fire 1.0/1.4 (2012-2017)
```

## Como Adicionar

1. Coloque arquivos nesta pasta
2. Execute: `npx ts-node scripts/ingest-all.ts`
3. O sistema processar automaticamente

## Dicas

- Organize por fabricante ou categoria de peça
- Sempre inclua números OEM originais
- Liste equivalências de marcas premium
- Especifique aplicações completas com anos
- Inclua dados técnicos quando disponível
