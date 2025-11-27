# 🚀 Sistema de Upload Web - Base de Conhecimento RAG

## ✨ Novidade: Interface Drag & Drop

Agora você pode adicionar documentos à base de conhecimento **diretamente pelo navegador**, sem precisar executar comandos no terminal!

## 📍 Como Acessar

1. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

2. Abra no navegador:
```
http://localhost:8787
```

3. Role até a seção **"📚 Base de Conhecimento RAG"**

## 🎯 Como Usar

### Passo 1: Escolha a Categoria

Clique em uma das abas:
- **📋 NCM** - Códigos NCM e classificações fiscais
- **🔄 Equivalências** - Tabelas OEM ↔ Aftermarket
- **⚙️ Técnico** - Fichas técnicas e especificações
- **🏭 Fornecedores** - Catálogos e dados de sourcing

### Passo 2: Adicione Arquivos

**Opção A: Drag & Drop**
1. Arraste arquivos `.txt` ou `.md` para a área cinza
2. Solte os arquivos

**Opção B: Seleção Manual**
1. Clique na área de upload
2. Selecione um ou múltiplos arquivos
3. Confirme

### Passo 3: Processamento Automático

O sistema **automaticamente**:
- ✅ Lê o conteúdo dos arquivos
- ✅ Divide em chunks de 1000 caracteres
- ✅ Gera embeddings via OpenAI
- ✅ Armazena no Supabase
- ✅ Mostra progresso em tempo real
- ✅ Exibe quantos chunks foram criados

### Passo 4: Pronto!

Os agentes **imediatamente** podem usar o novo conhecimento nas próximas buscas.

## 📊 Visualização do Status

Cada arquivo mostra:
- **Processando...** (azul) - Gerando embeddings
- **✓ X chunks** (verde) - Sucesso! X chunks foram criados
- **✗ Erro** (vermelho) - Algo deu errado

Status geral:
- `✅ X arquivo(s) processado(s) com sucesso!` - Tudo certo
- `⚠️ X sucesso, Y erro(s)` - Alguns falharam

## 🔧 Arquitetura Técnica

### Frontend (src/index.ts)
```javascript
// Drag & Drop nativo
dropzone.addEventListener('drop', async (e) => {
  const files = Array.from(e.dataTransfer.files);
  
  // Para cada arquivo
  const content = await file.text();
  
  // POST para API
  await fetch('/upload-document', {
    method: 'POST',
    body: JSON.stringify({ content, filename, category })
  });
});
```

### Backend API (src/index.ts)
```typescript
// Nova rota: POST /upload-document
if (url.pathname === "/upload-document") {
  const { content, filename, category } = await req.json();
  
  // Processar documento
  const result = await processDocument(env, content, filename, category);
  
  return Response.json(result);
}
```

### Processador (src/lib/document-processor.ts)
```typescript
export async function processDocument(env, content, filename, category) {
  // 1. Criar document_id único
  const documentId = Date.now() + Math.random();
  
  // 2. Dividir em chunks
  const chunks = chunkText(content, 1000);
  
  // 3. Para cada chunk
  for (const chunk of chunks) {
    // Gerar embedding
    const embedding = await createEmbedding(env, chunk);
    
    // Inserir no Supabase
    await env.SUPABASE.rpc('insert_chunk', {
      p_document_id: documentId,
      p_content: chunk,
      p_metadata: { source_file, category, ... },
      p_embedding: `[${embedding.join(',')}]`
    });
  }
  
  return { success: true, chunksCreated: chunks.length };
}
```

## 🆚 Comparação: Web Upload vs. Script CLI

| Aspecto | Web Upload | Script CLI |
|---------|------------|------------|
| **Interface** | Drag & Drop visual | Terminal / Linha de comando |
| **Uso** | Navegador | `npx ts-node scripts/ingest-all.ts` |
| **Múltiplos arquivos** | ✅ Sim (selecione vários) | ✅ Sim (processa pasta inteira) |
| **Feedback visual** | ✅ Tempo real | ⚠️ Console logs |
| **Categorias** | Escolhe antes do upload | Baseado em subpastas |
| **Quando usar** | Upload rápido de 1-10 arquivos | Batch grande (100+ arquivos) |
| **Ambiente** | Produção (Cloudflare Workers) | Desenvolvimento local |

## 💡 Casos de Uso

### ✅ Use Web Upload quando:
- Adicionar documentos ocasionalmente
- Testar rapidamente um novo documento
- Ambiente de produção (Workers já deployado)
- Usuários não-técnicos precisam adicionar conhecimento

### ✅ Use Script CLI quando:
- Importar centenas de documentos de uma vez
- Processar pasta inteira automaticamente
- Desenvolvimento local com Node.js
- Pipeline de CI/CD automatizado

## 🔐 Segurança

### Validações Implementadas

**Frontend:**
- ✅ Apenas `.txt` e `.md` aceitos
- ✅ Tamanho máximo: 10MB por arquivo
- ✅ Validação de tipo MIME

**Backend:**
- ✅ Validação de campos obrigatórios
- ✅ Whitelist de categorias permitidas
- ✅ Sanitização de input
- ✅ Error handling robusto

### Melhorias Futuras (Opcional)

```typescript
// Adicionar autenticação
if (!req.headers.get('Authorization')) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

// Rate limiting
if (uploadCount > 100) {
  return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
}

// Validação de conteúdo
if (content.length > 5_000_000) { // 5MB
  return Response.json({ error: 'File too large' }, { status: 413 });
}
```

## 📈 Monitoramento

### Ver uploads recentes no Supabase:

```sql
SELECT 
  metadata->>'source_file' as filename,
  metadata->>'category' as category,
  metadata->>'ingested_at' as uploaded_at,
  COUNT(*) as chunks
FROM chunks
GROUP BY 
  metadata->>'source_file',
  metadata->>'category',
  metadata->>'ingested_at'
ORDER BY metadata->>'ingested_at' DESC
LIMIT 10;
```

### Resultado esperado:
```
filename               | category     | uploaded_at          | chunks
-----------------------|--------------|---------------------|-------
bombas-hidraulicas.txt | technical    | 2025-11-27T10:30:00 | 8
ncm-capitulo-84.txt    | ncm          | 2025-11-27T10:25:00 | 12
equivalencias-vw.md    | equivalences | 2025-11-27T10:20:00 | 15
```

## 🧪 Testando

### 1. Teste Local

```bash
# Inicie o dev server
npm run dev

# Abra http://localhost:8787
# Faça upload de um arquivo de teste
# Verifique o status na interface
```

### 2. Validar no Banco

```bash
# Rode o script de teste RAG
npx ts-node scripts/test-rag.ts
```

### 3. Teste com Agente

```javascript
// No browser, faça uma busca após upload
// Exemplo: Upload de "bomba-dagua.txt" na categoria "equivalences"
// Depois busque: "bomba d'água para VW Golf"
// O agente deve usar o conhecimento recém-adicionado
```

## 🎨 Personalização

### Alterar categorias:

```typescript
// src/index.ts
const validCategories = ['ncm', 'equivalences', 'technical', 'suppliers', 'custom'];
```

```html
<!-- HTML -->
<button class="category-tab" data-category="custom">🎯 Custom</button>
```

### Ajustar tamanho de chunks:

```typescript
// src/lib/document-processor.ts
function chunkText(text: string, maxChunkSize = 1000) { // Mude para 500, 1500, etc
```

### Limitar tamanho de arquivo:

```javascript
// Frontend validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
if (file.size > MAX_FILE_SIZE) {
  alert('Arquivo muito grande!');
  return;
}
```

## 🚀 Deploy em Produção

```bash
# Deploy no Cloudflare Workers
npx wrangler deploy

# URL pública
https://seu-worker.workers.dev

# Upload funcionará imediatamente!
```

## 📚 Documentação Relacionada

- `RAG_INTEGRATION.md` - Guia completo do sistema RAG
- `docs/knowledge-base/README.md` - Organização de pastas e exemplos
- `scripts/ingest-all.ts` - Script CLI alternativo

---

**🎉 Pronto!** Agora você tem um sistema completo de upload web + processamento automático + RAG integrado nos agentes!
