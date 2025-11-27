-- Migration: Update match_chunks_exact to accept vector as float array (jsonb)

DROP FUNCTION IF EXISTS match_chunks_exact(vector, int);
DROP FUNCTION IF EXISTS match_chunks_exact(text, int);
DROP FUNCTION IF EXISTS match_chunks_exact(jsonb, int);

CREATE OR REPLACE FUNCTION match_chunks_exact(p_embedding jsonb, p_k int)
RETURNS TABLE (id bigint, content text, metadata jsonb, score float) AS $$
  SELECT 
    chunks.id, 
    chunks.content, 
    chunks.metadata, 
    (chunks.embedding <=> p_embedding::text::vector)::float as score
  FROM chunks
  WHERE chunks.embedding IS NOT NULL
  ORDER BY score
  LIMIT p_k;
$$ LANGUAGE SQL STABLE;

-- Also update the filtered version
DROP FUNCTION IF EXISTS match_chunks_filtered_exact(vector, int, int);
DROP FUNCTION IF EXISTS match_chunks_filtered_exact(text, int, int);
DROP FUNCTION IF EXISTS match_chunks_filtered_exact(jsonb, int, int);

CREATE OR REPLACE FUNCTION match_chunks_filtered_exact(p_embedding jsonb, p_k int, p_doc_id int DEFAULT NULL)
RETURNS TABLE (id bigint, content text, metadata jsonb, score float) AS $$
  SELECT 
    chunks.id, 
    chunks.content, 
    chunks.metadata, 
    (chunks.embedding <=> p_embedding::text::vector)::float as score
  FROM chunks
  WHERE chunks.embedding IS NOT NULL AND (p_doc_id IS NULL OR chunks.document_id = p_doc_id)
  ORDER BY score
  LIMIT p_k;
$$ LANGUAGE SQL STABLE;
