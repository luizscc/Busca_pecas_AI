-- Simplest possible vector comparison test

CREATE OR REPLACE FUNCTION test_simple_compare(p_embedding jsonb)
RETURNS TABLE (
  chunk_id bigint,
  distance float
) AS $$
  SELECT 
    id as chunk_id,
    (embedding <=> p_embedding::text::vector)::float as distance
  FROM chunks
  LIMIT 5;
$$ LANGUAGE SQL STABLE;
