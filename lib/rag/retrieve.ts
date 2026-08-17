import { embedQuery } from "@/lib/rag/embed";
import { RAG_CONFIG } from "@/lib/rag/config";
import type { MatchDocumentResult } from "@/lib/rag/types";
import { matchDocuments } from "@/lib/supabase";
import type { Locale } from "@/lib/types";

export async function retrieveRelevantChunks(
  query: string,
  locale: Locale,
): Promise<MatchDocumentResult[]> {
  const queryEmbedding = await embedQuery(query);

  let results = await matchDocuments({
    queryEmbedding,
    matchCount: RAG_CONFIG.matchCount,
    matchThreshold: RAG_CONFIG.matchThreshold,
    locale,
  });

  if (results.length === 0) {
    results = await matchDocuments({
      queryEmbedding,
      matchCount: RAG_CONFIG.matchCount,
      matchThreshold: RAG_CONFIG.fallbackMatchThreshold,
      locale,
    });
  }

  return results;
}

export { RAG_CONFIG };
