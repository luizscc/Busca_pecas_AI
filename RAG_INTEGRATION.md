# RAG Integration Guide

## Overview
Your RAG (Retrieval-Augmented Generation) system is now integrated into your agents. The system automatically retrieves relevant documentation to improve AI decision-making.

## What's Working

### ✅ Core RAG Infrastructure
- **Vector Storage**: Supabase with pgvector extension
- **Embeddings**: OpenAI `text-embedding-3-small` (1536 dimensions)
- **Search Functions**: `match_chunks_exact` and `match_chunks_filtered_exact`
- **Helper Library**: `src/lib/rag.ts` - `retrieveChunks()`

### ✅ Agent Integration
- **NCM Agent** (`src/agents/ncm.ts`): Retrieves NCM classification documentation
- **Equivalence Agent** (`src/agents/equivalence.ts`): Retrieves parts equivalence data

## How It Works

When an agent processes a request:
1. **Query Construction**: Agent builds a semantic query from the input
2. **Embedding Creation**: Query is converted to a 1536-dim vector via OpenAI
3. **Vector Search**: Supabase finds the top K most similar documentation chunks
4. **Context Injection**: Retrieved chunks are added to the AI prompt
5. **Enhanced Response**: AI makes better decisions with relevant context

## Populating the Knowledge Base

### Current State
- 2 chunks from `docs/demo.txt` (automotive parts catalog demo)
- Works as proof-of-concept

### Adding Real Documentation

#### 1. NCM Classification Data
Create `docs/ncm-codes.txt` with NCM code explanations:
```
NCM 8413.30.19 - Bombas para Líquidos
Aplicação: Bombas d'água automotivas, bombas de óleo, bombas hidráulicas
Características: Bombas volumétricas alternativas ou rotativas
Exemplos: Bomba d'água Gates, bomba hidráulica Parker

NCM 8421.23.00 - Filtros de Óleo ou Combustível
Aplicação: Filtros para motores de combustão interna
Características: Elemento filtrante descartável ou lavável
Exemplos: Mann Filter, Tecfil, Fram
...
```

#### 2. Parts Equivalence Data
Create `docs/equivalences.txt`:
```
BOMBA D'ÁGUA - Motor EA888 Gen3 (VW/Audi 1.8/2.0 TSI)
OEM Original: 06H121026DD (VW), 06H121026BA (Audi)
Equivalências:
- Gates: 42153
- Urby: UBG1234
- Maxauto: MAX5678
Aplicação: Golf VII, Audi A3 8V, Tiguan II (2014-2020)
...
```

#### 3. Technical Specifications
Create `docs/technical-specs.txt`:
```
Bomba Hidráulica - Escavadeira PC200-8 (Komatsu)
Part Number: 708-2G-00024
Tipo: Bomba de pistão axial de deslocamento variável
Pressão máxima: 350 bar
Vazão: 2x226 L/min
Aplicação: Sistema hidráulico principal
...
```

### Ingestion Commands

```powershell
# Ingest NCM documentation
npx ts-node scripts/ingest-poc.ts .\docs\ncm-codes.txt

# Ingest equivalence data
npx ts-node scripts/ingest-poc.ts .\docs\equivalences.txt

# Ingest technical specs
npx ts-node scripts/ingest-poc.ts .\docs\technical-specs.txt
```

### Testing the Knowledge Base

```powershell
# Test NCM search
npx ts-node scripts/test-rag.ts "bomba hidráulica classificação fiscal"

# Test equivalence search
npx ts-node scripts/test-rag.ts "equivalente bomba água EA888 TSI"

# Test technical search
npx ts-node scripts/test-rag.ts "PC200-8 hydraulic pump specifications"
```

## Usage Examples

### In Your Cloudflare Worker

The agents are now RAG-enabled, so when you call them:

```typescript
// NCM classification with RAG
const ficha = {
  categoria: "Bomba Hidráulica",
  oem_code: "708-2G-00024",
  descricao_tecnica: "Bomba de pistão axial",
  fabricante_maquina: "Komatsu",
  modelo_maquina: "PC200-8"
};

const ncmResult = await ncmAgent(env, ficha);
// Now includes context from your NCM documentation!

// Equivalence search with RAG
const equivResult = await equivalenceAgent(env, ficha);
// Now includes context from your equivalence database!
```

## Performance Considerations

### Current Setup (< 1000 vectors)
- Using `match_chunks_exact` - brute force search
- Works fine for small datasets
- No index overhead

### Future (> 1000 vectors)
When you have more data:
1. The ivfflat index will automatically improve performance
2. Switch from `_exact` to regular functions in `src/lib/rag.ts`:
   ```typescript
   const rpcName = documentId ? 'match_chunks_filtered' : 'match_chunks';
   ```
3. Rebuild index in Supabase:
   ```sql
   REINDEX INDEX idx_chunks_embedding;
   ```

## Chunk Management

### Clear all chunks
```powershell
npx ts-node scripts/clear-chunks.ts
```

### View chunks
```powershell
npx ts-node scripts/debug-chunks.ts
```

### Check embeddings
```powershell
npx ts-node scripts/check-embeddings.ts
```

## Next Steps

1. **Create Real Documentation**
   - NCM code database
   - Parts equivalence tables
   - Technical specifications
   - Supplier catalogs

2. **Ingest Documentation**
   - Run ingestion scripts for each document
   - Verify with test-rag.ts

3. **Monitor Performance**
   - Track RAG retrieval quality
   - Adjust K parameter (number of chunks retrieved)
   - Fine-tune chunk sizes if needed

4. **Add More Agents**
   - QA agent can use RAG for fact-checking
   - Hunter agents can use RAG for supplier data
   - ETL agent can use RAG for data validation rules

## Cost Optimization

- **Embeddings**: ~$0.0001 per 1000 tokens (very cheap)
- **Storage**: Supabase free tier: 500MB (sufficient for ~10,000 documents)
- **Search**: No cost (runs on your Supabase instance)

## Troubleshooting

### No results from RAG search
- Verify chunks exist: `npx ts-node scripts/debug-chunks.ts`
- Check embeddings are 1536 dims: `npx ts-node scripts/check-embeddings.ts`
- Ensure migrations applied: Check Supabase Functions panel

### Poor relevance
- Adjust chunk size in `ingest-poc.ts` (currently 1000 chars)
- Increase K parameter in `retrieveChunks()` calls
- Improve documentation quality

### Slow performance
- For > 1000 vectors, switch to indexed functions
- Consider caching frequently accessed chunks
- Reduce K parameter if retrieving too many chunks
