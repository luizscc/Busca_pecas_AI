# 📚 Base de Conhecimento RAG - Buscador de Peças AI

Sistema de ingestão automatizada para alimentar o sistema RAG (Retrieval-Augmented Generation) com conhecimento especializado em peças automotivas e industriais.

## 🎯 Como Usar

### 1. **Adicione seus arquivos nas pastas apropriadas:**

- `ncm/` - Códigos NCM e classificações fiscais
- `equivalences/` - Tabelas de equivalência OEM ↔ Aftermarket
- `technical/` - Fichas técnicas e especificações
- `suppliers/` - Catálogos de fornecedores e dados de sourcing

### 2. **Execute o comando de ingestão:**

```bash
npx ts-node scripts/ingest-all.ts
```

O sistema automaticamente:
- ✅ Encontra todos arquivos `.txt` e `.md`
- ✅ Divide em chunks de 1000 caracteres
- ✅ Gera embeddings via OpenAI (text-embedding-3-small)
- ✅ Armazena no Supabase com pgvector
- ✅ Adiciona metadados (categoria, arquivo, data)
- ✅ Mostra estatísticas por categoria

### 3. **Os agentes automaticamente usarão esse conhecimento:**

- **NCM Agent** - Classifica peças usando exemplos da base
- **Equivalence Agent** - Encontra equivalências baseadas em dados reais
- **Outros agentes** - Acesso via `retrieveChunks()` em `src/lib/rag.ts`

## 📁 Estrutura de Pastas

```
docs/knowledge-base/
├── README.md (este arquivo)
├── ncm/
│   ├── README.md (exemplos de NCM)
│   └── [seus arquivos .txt/.md aqui]
├── equivalences/
│   ├── README.md (exemplos de equivalências)
│   └── [seus arquivos .txt/.md aqui]
├── technical/
│   ├── README.md (exemplos de fichas técnicas)
│   └── [seus arquivos .txt/.md aqui]
└── suppliers/
    ├── README.md (exemplos de fornecedores)
    └── [seus arquivos .txt/.md aqui]
```

## 🔍 Formatos Aceitos

- `.txt` - Texto simples
- `.md` - Markdown

## 💡 Dicas para Melhores Resultados

### ✅ BOM:
```
NCM 8413.30.19 - Bombas para Líquidos
Aplicação: Bombas d'água automotivas
Exemplos: Bomba d'água Gates, bomba hidráulica Parker
```

### ❌ EVITE:
```
bomba agua gates
```

**Por quê?** Informações estruturadas e contextuais melhoram a qualidade das buscas semânticas.

### Recomendações:

1. **Seja descritivo:** Inclua contexto completo
2. **Use estrutura:** Títulos, categorias, especificações
3. **Adicione exemplos:** Marcas, modelos, anos
4. **Inclua sinônimos:** "Bomba d'água = Water pump = Bomba de água"
5. **Especifique aplicações:** Modelos de veículos, equipamentos

## 📊 Monitoramento

Após a ingestão, você verá estatísticas como:

```
✅ Ingestão concluída!

Estatísticas por categoria:
  📁 ncm: 15 chunks de 3 arquivos
  📁 equivalences: 42 chunks de 8 arquivos
  📁 technical: 28 chunks de 5 arquivos
  📁 suppliers: 19 chunks de 4 arquivos

Total: 104 chunks processados de 20 arquivos
```

## 🧪 Testando o RAG

Execute o script de teste para verificar se o sistema está encontrando informações:

```bash
npx ts-node scripts/test-rag.ts
```

Exemplo de saída:
```
Resultados para "BOMBA D'ÁGUA":
  1. [Score: 0.8234] BOMBA D'ÁGUA - Motor EA888
     Fonte: equivalences/vw-audi.txt
  2. [Score: 0.7654] NCM 8413.30.19 - Bombas para Líquidos
     Fonte: ncm/capitulo-84.txt
```

## 🚀 Fluxo Completo

```
1. Você adiciona arquivo → docs/knowledge-base/ncm/codigos-bomba.txt
2. Executa → npx ts-node scripts/ingest-all.ts
3. Sistema processa → Chunks + Embeddings + Armazenamento
4. Agente usa → NCM Agent busca "classificação bomba" no RAG
5. Resultado melhor → Resposta baseada em exemplos reais
```

## 🔧 Manutenção

### Atualizar conhecimento existente:
1. Edite os arquivos nas pastas
2. Execute `npx ts-node scripts/ingest-all.ts` novamente
3. O sistema adicionará novos chunks (não sobrescreve automaticamente)

### Limpar base de dados:
```sql
-- Conecte no Supabase SQL Editor
DELETE FROM chunks WHERE document_id = 408716; -- ID do seu documento
```

### Ver o que está armazenado:
```bash
npx ts-node scripts/test-rag.ts
```

## 📖 Documentação Adicional

- `RAG_INTEGRATION.md` - Guia técnico completo do sistema RAG
- `docs/knowledge-base/ncm/README.md` - Exemplos de NCM
- `docs/knowledge-base/equivalences/README.md` - Exemplos de equivalências
- `docs/knowledge-base/technical/README.md` - Exemplos de fichas técnicas
- `docs/knowledge-base/suppliers/README.md` - Exemplos de fornecedores

## ❓ Perguntas Frequentes

**Q: Preciso rodar a ingestão toda vez que adiciono um arquivo?**
A: Sim, mas é rápido. Em produção, você pode adicionar um file watcher para automatizar.

**Q: Posso adicionar PDFs?**
A: Não diretamente. Converta para `.txt` ou `.md` primeiro.

**Q: Os agentes já estão usando o RAG?**
A: Sim! `NCM Agent` e `Equivalence Agent` já estão integrados. Outros agentes podem usar `retrieveChunks()`.

**Q: Quanto custa processar documentos?**
A: Embeddings: $0.0001 por 1K tokens (~750 palavras). Um arquivo de 10KB ≈ $0.001.

**Q: Posso testar localmente antes de colocar em produção?**
A: Sim! Use `npx ts-node scripts/test-rag.ts` para validar resultados.

---

**Pronto para começar?** Adicione seus primeiros arquivos em uma das pastas e execute `npx ts-node scripts/ingest-all.ts`! 🚀
