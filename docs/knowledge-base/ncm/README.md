# Base de Conhecimento - NCM

Coloque aqui arquivos com informações sobre códigos NCM (Nomenclatura Comum do Mercosul).

## Formatos Aceitos
- `.txt` - Arquivos de texto simples
- `.md` - Arquivos Markdown

## O que Incluir

### Exemplos de Conteúdo:

```
NCM 8413.30.19 - Bombas para Líquidos
Classificação: Bombas volumétricas alternativas ou rotativas
Aplicação: Bombas d'água automotivas, bombas hidráulicas, bombas de óleo
Exemplos: Bomba d'água Gates, bomba hidráulica Parker, bomba de concreto Putzmeister
Alíquota II: 14%
Observações: Exclui bombas centrífugas (8413.70)

NCM 8421.23.00 - Filtros de Óleo ou Combustível para Motores
Classificação: Aparelhos para filtrar óleos minerais
Aplicação: Filtros automotivos e industriais
Exemplos: Mann Filter, Tecfil, Fram, Bosch
Alíquota II: 16%
```

## Como Adicionar Novos Arquivos

1. Coloque seu arquivo `.txt` ou `.md` nesta pasta
2. Execute: `npx ts-node scripts/ingest-all.ts`
3. O sistema processará automaticamente

## Dicas

- Use um arquivo por categoria de NCM ou por capítulo
- Inclua descrições detalhadas e exemplos práticos
- Mencione exclusões e observações fiscais importantes
- Atualize regularmente com mudanças na legislação
