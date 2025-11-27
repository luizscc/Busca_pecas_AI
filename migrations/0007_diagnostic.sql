-- Diagnostic: Create a test function to see what the conversion produces

CREATE OR REPLACE FUNCTION test_vector_conversion(p_embedding jsonb)
RETURNS TABLE (
  jsonb_sample text,
  text_sample text,
  vector_sample text,
  chunk_count int,
  chunk_with_embedding_count int
) AS $$
  SELECT 
    p_embedding::text as jsonb_sample,
    p_embedding::text as text_sample,
    p_embedding::text::vector::text as vector_sample,
    (SELECT COUNT(*)::int FROM chunks) as chunk_count,
    (SELECT COUNT(*)::int FROM chunks WHERE embedding IS NOT NULL) as chunk_with_embedding_count;
$$ LANGUAGE SQL STABLE;
