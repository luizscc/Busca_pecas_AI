# IA Agents – MVP

### Rodar localmente:

Pré-requisitos:
- Node 18+ (compatível com Wrangler e supabase client)
- wrangler CLI

Instalação:
```powershell
npm install
```

Configurar variáveis/segredos (Cloudflare Wrangler):
```powershell
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_KEY
```

Rodar em ambiente de desenvolvimento:
```powershell
npx wrangler dev
```

Observações:
- Leia `SUPABASE_SETUP.md` para configurar seu projeto Supabase e rodar a ingestão RAG.
- O projeto tem um fallback para D1 (Cloudflare D1) caso Supabase não esteja configurado.

Migrations:
- `migrations/0001_init_supabase.sql` — cria schema inicial, vetores e funções.
- `migrations/0002_rls_and_policies.sql` — habilita RLS e adiciona policies de exemplo.
- `migrations/0003_convert_real_to_numeric.sql` — script para conversão de `real` -> `numeric`.

Ingestão POC:
1) Configure as variáveis de ambiente localmente (PowerShell):
```powershell
$env:SUPABASE_URL = "https://<your-project>.supabase.co"
$env:SUPABASE_SERVICE_KEY = "<service-role-key>"
$env:OPENAI_API_KEY = "<your-openai-key>"
npm run ingest ./docs/your-manual.txt
```

2) Ou, usando `setx` (persistente) no PowerShell:
```powershell
setx SUPABASE_URL "https://<your-project>.supabase.co"
setx SUPABASE_SERVICE_KEY "<service-role-key>"
setx OPENAI_API_KEY "<your-openai-key>"
npm run ingest ./docs/your-manual.txt
```

