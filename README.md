# IA Agents – MVP

### Rodar localmente:

Pré-requisitos:
- Node 18+ (compatível com Wrangler e supabase client)
- wrangler CLI

Instalação:
```powershell
# Prefer using CMD / Command Prompt on Windows when PowerShell scripts are restricted
# or you can run PowerShell with the proper ExecutionPolicy (RemoteSigned)
npm cache clean --force
rmdir /s /q node_modules  # only if node_modules exists
del /q package-lock.json  # optional
npm install --legacy-peer-deps
```

Configurar variáveis/segredos (Cloudflare Wrangler / Worker secrets):
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

Local environment file (.env)
------------------------------
You can use `.env` (for local testing only) with the variables defined in `.env.example`. Example (PowerShell):
```powershell
# load from .env - requires tooling that supports .env (ts-node may not automatically load it)
Get-Content .env | Foreach-Object { $var = $_ -split '='; Set-Item -Path Env:\$($var[0]) -Value $var[1] }
```

If you prefer, add the required variables to the environment using `setx` (persistent) or export them in the shell session before running the ingestion/tests.


