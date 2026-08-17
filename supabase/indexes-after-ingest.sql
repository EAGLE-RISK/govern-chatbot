-- Run AFTER npm run ingest (when govern_document_chunks has rows)
-- Supabase → SQL Editor → New query → paste → Run

create index if not exists govern_document_chunks_embedding_idx
  on public.govern_document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
