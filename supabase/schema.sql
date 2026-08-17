-- Govern Chatbot — RAG schema (Supabase SQL Editor)
-- Compatible avec un projet Supabase partagé (ex. Portfolio) :
-- table et RPC dédiées, sans toucher à document_chunks / match_documents.

create extension if not exists vector;

create table if not exists public.govern_document_chunks (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

comment on table public.govern_document_chunks is
  'Text chunks and embeddings for Govern One chatbot RAG (FR/EN).';

create index if not exists govern_document_chunks_metadata_idx
  on public.govern_document_chunks using gin (metadata);

create or replace function public.match_govern_documents(
  query_embedding vector(1536),
  match_count int default 5,
  match_threshold float default 0.5,
  filter_locale text default null
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    dc.id,
    dc.content,
    dc.metadata,
    (1 - (dc.embedding <=> query_embedding))::float as similarity
  from public.govern_document_chunks dc
  where dc.embedding is not null
    and (1 - (dc.embedding <=> query_embedding)) > match_threshold
    and (
      filter_locale is null
      or dc.metadata->>'locale' = filter_locale
    )
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;

alter table public.govern_document_chunks enable row level security;

grant all on public.govern_document_chunks to service_role;
grant execute on function public.match_govern_documents(vector, int, float, text) to service_role;
