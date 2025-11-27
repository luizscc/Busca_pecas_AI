-- Test actual vector comparison

CREATE OR REPLACE FUNCTION test_vector_compare(p_embedding jsonb)
RETURNS TABLE (
  chunk_id int,
  content_preview text,
  embedding_type text,
  distance float
) AS $$
  SELECT 
    id,
    substring(content, 1, 50) as content_preview,
    pg_typeof(embedding)::text as embedding_type,
    (embedding <=> p_embedding::text::vector) as distance
  FROM chunks
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> p_embedding::text::vector
  LIMIT 5;
$$ LANGUAGE SQL STABLE;
