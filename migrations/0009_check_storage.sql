-- Check the actual stored embedding type

CREATE OR REPLACE FUNCTION check_embedding_storage()
RETURNS TABLE (
  chunk_id int,
  content_preview text,
  embedding_pg_type text,
  embedding_is_null boolean,
  embedding_length int
) AS $$
  SELECT 
    id,
    substring(content, 1, 50) as content_preview,
    pg_typeof(embedding)::text as embedding_pg_type,
    (embedding IS NULL) as embedding_is_null,
    CASE 
      WHEN embedding IS NOT NULL THEN length(embedding::text)
      ELSE 0
    END as embedding_length
  FROM chunks
  LIMIT 5;
$$ LANGUAGE SQL STABLE;
