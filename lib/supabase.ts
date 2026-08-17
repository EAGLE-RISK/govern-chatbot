import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type {
  ChunkMetadata,
  MatchDocumentResult,
  MatchDocumentsParams,
} from "@/lib/rag/types";

/** Table dédiée Govern — coexiste avec document_chunks (Portfolio) sur le même projet Supabase. */
export const GOVERN_CHUNKS_TABLE = "govern_document_chunks";
export const GOVERN_MATCH_RPC = "match_govern_documents";

export interface DocumentChunkInsert {
  content: string;
  metadata: ChunkMetadata;
  embedding: number[];
}

let adminClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment",
    );
  }

  if (!adminClient) {
    adminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  return adminClient;
}

export async function getDocumentChunkCount(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from(GOVERN_CHUNKS_TABLE)
    .select("*", { count: "exact", head: true });

  if (error) {
    throw new Error(`Failed to count ${GOVERN_CHUNKS_TABLE}: ${error.message}`);
  }
  return count ?? 0;
}

const INSERT_BATCH_SIZE = 50;

export async function clearDocumentChunks(): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from(GOVERN_CHUNKS_TABLE)
    .delete()
    .not("id", "is", null);

  if (error) {
    throw new Error(`Failed to clear ${GOVERN_CHUNKS_TABLE}: ${error.message}`);
  }
}

export async function insertDocumentChunks(
  chunks: DocumentChunkInsert[],
): Promise<void> {
  const supabase = getSupabaseAdmin();

  for (let index = 0; index < chunks.length; index += INSERT_BATCH_SIZE) {
    const batch = chunks.slice(index, index + INSERT_BATCH_SIZE);
    const { error } = await supabase.from(GOVERN_CHUNKS_TABLE).insert(batch);

    if (error) {
      throw new Error(
        `Failed to insert batch ${Math.floor(index / INSERT_BATCH_SIZE) + 1}: ${error.message}`,
      );
    }

    console.log(
      `   Inserted batch ${Math.floor(index / INSERT_BATCH_SIZE) + 1}/${Math.ceil(chunks.length / INSERT_BATCH_SIZE)}`,
    );
  }
}

export async function matchDocuments({
  queryEmbedding,
  matchCount = 5,
  matchThreshold = 0.5,
  locale,
}: MatchDocumentsParams): Promise<MatchDocumentResult[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.rpc(GOVERN_MATCH_RPC, {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    match_threshold: matchThreshold,
    filter_locale: locale ?? null,
  });

  if (error) {
    throw new Error(`${GOVERN_MATCH_RPC} RPC failed: ${error.message}`);
  }

  return (data ?? []).map(
    (row: {
      id: string;
      content: string;
      metadata: ChunkMetadata;
      similarity: number;
    }) => ({
      id: row.id,
      content: row.content,
      metadata: row.metadata,
      similarity: row.similarity,
    }),
  );
}
