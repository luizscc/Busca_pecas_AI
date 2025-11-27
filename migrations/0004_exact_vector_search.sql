-- Migration to add exact vector search function for small datasets
-- This function bypasses the ivfflat index and does exact nearest neighbor search

CREATE OR REPLACE FUNCTION match_chunks_exact(p_embedding vector, p_k int)
RETURNS TABLE (id int, content text, metadata jsonb, score float) AS $$
  SELECT id, content, metadata, (embedding <=> p_embedding) as score
  FROM chunks
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> p_embedding
  LIMIT p_k;
$$ LANGUAGE SQL STABLE;

-- Also create filtered version
CREATE OR REPLACE FUNCTION match_chunks_filtered_exact(p_embedding vector, p_k int, p_doc_id int DEFAULT NULL)
RETURNS TABLE (id int, content text, metadata jsonb, score float) AS $$
  SELECT id, content, metadata, (embedding <=> p_embedding) as score
  FROM chunks
  WHERE embedding IS NOT NULL AND (p_doc_id IS NULL OR document_id = p_doc_id)
  ORDER BY embedding <=> p_embedding
  LIMIT p_k;
$$ LANGUAGE SQL STABLE;
