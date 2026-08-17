import { buildSystemPrompt } from "@/lib/chat/systemPrompt";
import type { MatchDocumentResult } from "@/lib/rag/types";
import type { Locale } from "@/lib/types";

function formatRetrievedContext(chunks: MatchDocumentResult[]): string {
  if (chunks.length === 0) {
    return "No relevant context was retrieved for this question.";
  }

  return chunks
    .map((chunk, index) => {
      const similarity = chunk.similarity.toFixed(2);
      return `[${index + 1}] Source: ${chunk.metadata.source} | Section: ${chunk.metadata.section} | Type: ${chunk.metadata.type} | Score: ${similarity}

${chunk.content}`;
    })
    .join("\n\n---\n\n");
}

export function buildRagSystemPrompt(
  locale: Locale,
  chunks: MatchDocumentResult[],
): string {
  return buildSystemPrompt(locale, formatRetrievedContext(chunks));
}
