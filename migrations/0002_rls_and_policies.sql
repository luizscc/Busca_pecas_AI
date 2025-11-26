-- migrations/0002_rls_and_policies.sql
-- Enable Row Level Security and example policies for authenticated users and owner-based write access

-- We expect that Supabase Auth is in use and auth.uid(), auth.role() are available. 

-- Enable RLS
ALTER TABLE componentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ofertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_cost_estimates ENABLE ROW LEVEL SECURITY;

-- Example: allow authenticated users to read components
CREATE POLICY select_authenticated_componentes ON componentes
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

-- Example: allow service_role and owner to insert/update/delete
CREATE POLICY owner_write_componentes ON componentes
FOR ALL
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Replicate analogous policies for fornecedores and ofertas
CREATE POLICY select_authenticated_fornecedores ON fornecedores
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY owner_write_fornecedores ON fornecedores
FOR ALL
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY select_authenticated_ofertas ON ofertas
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY owner_write_ofertas ON ofertas
FOR ALL
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Example policy for chunks: reading requires authenticated, writing only by service role
CREATE POLICY select_authenticated_chunks ON chunks
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY insert_service_chunks ON chunks
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'service_role');

-- Example policy for import_cost_estimates
CREATE POLICY select_authenticated_import_costs ON import_cost_estimates
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY write_service_import_costs ON import_cost_estimates
FOR ALL
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Notes: adapt policy definitions depending on your auth model (multi-tenant, owner-based, or service-only).
