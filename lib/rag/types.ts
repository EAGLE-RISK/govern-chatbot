import type { Locale } from "@/lib/types";

export const EMBEDDING_DIMENSIONS = 1536;

export type ContentType =
  | "home"
  | "about"
  | "product"
  | "solution"
  | "sector"
  | "commercial"
  | "resource"
  | "legal"
  | "faq"
  | "guide"
  | "partner"
  | "unknown";

export interface ChunkMetadata {
  locale: Locale;
  source: string;
  section: string;
  type: ContentType;
}

export interface MatchDocumentResult {
  id: string;
  content: string;
  metadata: ChunkMetadata;
  similarity: number;
}

export interface MatchDocumentsParams {
  queryEmbedding: number[];
  matchCount?: number;
  matchThreshold?: number;
  locale?: Locale;
}
