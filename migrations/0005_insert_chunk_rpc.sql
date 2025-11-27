-- Migration to add insert_chunk RPC function for proper vector insertion
-- Accept the embedding as text (JSON array string) and cast it to vector

-- Drop any existing versions first
DROP FUNCTION IF EXISTS insert_chunk(int, text, jsonb, vector);
DROP FUNCTION IF EXISTS insert_chunk(int, text, jsonb, text);

-- Create the correct version
CREATE OR REPLACE FUNCTION insert_chunk(
  p_document_id int,
  p_content text,
  p_metadata jsonb,
  p_embedding text
)
RETURNS TABLE (id bigint) AS $$
  INSERT INTO chunks (document_id, content, metadata, embedding)
  VALUES (p_document_id, p_content, p_metadata, p_embedding::vector)
  RETURNING chunks.id;
$$ LANGUAGE SQL VOLATILE;
