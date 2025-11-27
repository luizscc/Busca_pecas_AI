-- Test if RPC can even read chunks table

CREATE OR REPLACE FUNCTION test_basic_select()
RETURNS TABLE (
  chunk_id bigint,
  content_preview text
) AS $$
  SELECT 
    id as chunk_id,
    substring(content, 1, 50) as content_preview
  FROM chunks
  LIMIT 5;
$$ LANGUAGE SQL STABLE;
