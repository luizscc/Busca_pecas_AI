-- scripts/db-verify.sql
-- Quick verification queries to run in Supabase SQL editor

-- 1) List extensions
SELECT * FROM pg_extension;

-- 2) List tables and columns
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 3) List indexes
SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public';

-- 4) List functions
SELECT p.oid, p.proname, pg_get_functiondef(p.oid) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' ORDER BY p.proname;

-- 5) Check match_chunks
SELECT * FROM match_chunks(ARRAY[0::float8]::vector, 5);
