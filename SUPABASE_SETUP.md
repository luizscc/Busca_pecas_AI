# Supabase integration setup (passo a passo)

Este documento descreve os passos mínimos para configurar Supabase e integrar com o projeto.

1) Criar um projeto no Supabase
   - Acesse https://app.supabase.com e crie um novo projeto.
   - Anote o `SUPABASE_URL` e `SUPABASE_SERVICE_KEY` (service role key) — guarde com segurança.

2) Habilitar a extensão pgvector
   - Acesse SQL editor do Supabase e rode:
     ```sql
     CREATE EXTENSION IF NOT EXISTS vector;
     ```

3) Criar o schema inicial (RAG chunks e tabelas)
    - Abra o SQL editor do Supabase e rode o script `migrations/0001_init_supabase.sql`.
    - Alternativamente, se preferir usar o CLI:
       ```bash
       supabase db query < migrations/0001_init_supabase.sql
       supabase db query < migrations/0002_rls_and_policies.sql
       ```
    - Ordem sugerida de execução:
       1. `migrations/0001_init_supabase.sql` (schema base + chunks + functions)
       2. `migrations/0002_rls_and_policies.sql` (RLS e policies) — opcional para ambiente de dev; tenha cuidado em produção
       3. `migrations/0003_convert_real_to_numeric.sql` (apenas se necessário para conversão de tipo `real`)
       - IMPORTANTE: As migrations são idempotentes, mas podem falhar se reexecutadas em alguns ambientes (por ex., triggers/policies já existentes). Se um erro ocorrer, verifique se já existem objetos e rode os comandos `DROP TRIGGER IF EXISTS` / `DROP POLICY IF EXISTS`/ `DROP INDEX IF EXISTS` antes de aplicar novamente.

4) Criar Service Role key e limites de uso
   - Em Settings -> API, copie `Service Role` key (usada no servidor/ingest).
   - Para endpoints públicos, crie policies (RLS) e use chaves restritas.

5) Configurar segredos no Cloudflare Worker (wrangler)
   - Setar as variáveis via wrangler:
     ```powershell
     npx wrangler secret put SUPABASE_URL
     npx wrangler secret put SUPABASE_SERVICE_KEY
     npx wrangler secret put OPENAI_API_KEY
     ```

6) Rodar ingest (POC)
   - Use o script de ingest (no repo, ou um script local) para carregar alguns manuais e gerar embeddings.
   - Verifique se a tabela `chunks` está preenchida com embeddings e metadados.

   - Após executar as migrations, rode `scripts/db-verify.sql` no SQL editor do Supabase para verificar extensões, índices, funções e amostras de busca (ex.: `match_chunks`).

7) Testar agents com Retrieval
   - Chamada de exemplo:
     - `engineerAgent` deve gerar embedding da query, RPC `match_chunks`, anexar contextos ao prompt e chamar LLM.

8) Segurança e boas práticas
   - Nunca exponha o Service Role para o cliente. Use chaves restritas em endpoints públicos.
   - Aplique RLS para limitar acessos por tabela se necessário.

9) Observability
   - Configure logs (Sentry/Logflare) e monitore consultas e erros.
