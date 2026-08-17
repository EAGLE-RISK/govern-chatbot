import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, appendFile, rm } from "node:fs/promises";
import path from "node:path";

import type { TextChunk } from "@/lib/rag/chunk";

const CACHE_DIR = path.join(process.cwd(), ".ingest-cache");

export interface IngestManifest {
  fingerprint: string;
  totalChunks: number;
  completedChunks: number;
  updatedAt: string;
}

function cachePath(fingerprint: string, file: string): string {
  return path.join(CACHE_DIR, fingerprint, file);
}

export function computeChunksFingerprint(chunks: TextChunk[]): string {
  const hash = createHash("sha256");

  for (const chunk of chunks) {
    hash.update(chunk.metadata.locale);
    hash.update(chunk.metadata.source);
    hash.update(chunk.metadata.section);
    hash.update(chunk.content);
  }

  return hash.digest("hex").slice(0, 16);
}

export async function loadManifest(
  fingerprint: string,
): Promise<IngestManifest | null> {
  try {
    const raw = await readFile(cachePath(fingerprint, "manifest.json"), "utf8");
    return JSON.parse(raw) as IngestManifest;
  } catch {
    return null;
  }
}

export async function loadCachedEmbeddings(
  fingerprint: string,
  totalChunks: number,
): Promise<(number[] | null)[]> {
  const embeddings: (number[] | null)[] = Array.from(
    { length: totalChunks },
    () => null,
  );

  try {
    const raw = await readFile(cachePath(fingerprint, "embeddings.jsonl"), "utf8");
    const lines = raw.split("\n").filter(Boolean);

    for (const line of lines) {
      const row = JSON.parse(line) as { i: number; e: number[] };
      if (row.i >= 0 && row.i < totalChunks) {
        embeddings[row.i] = row.e;
      }
    }
  } catch {
    // cache vide
  }

  return embeddings;
}

export function countCompletedEmbeddings(
  embeddings: (number[] | null)[],
): number {
  return embeddings.filter((embedding) => embedding !== null).length;
}

export async function initIngestCache(
  fingerprint: string,
  totalChunks: number,
): Promise<void> {
  await mkdir(cachePath(fingerprint, ""), { recursive: true });

  const manifest: IngestManifest = {
    fingerprint,
    totalChunks,
    completedChunks: 0,
    updatedAt: new Date().toISOString(),
  };

  await writeFile(
    cachePath(fingerprint, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
}

export async function appendEmbeddingBatch(
  fingerprint: string,
  startIndex: number,
  batchEmbeddings: number[][],
  totalChunks: number,
): Promise<void> {
  await mkdir(cachePath(fingerprint, ""), { recursive: true });

  const lines = batchEmbeddings
    .map((embedding, offset) =>
      JSON.stringify({ i: startIndex + offset, e: embedding }),
    )
    .join("\n");

  await appendFile(cachePath(fingerprint, "embeddings.jsonl"), `${lines}\n`);

  const manifest: IngestManifest = {
    fingerprint,
    totalChunks,
    completedChunks: startIndex + batchEmbeddings.length,
    updatedAt: new Date().toISOString(),
  };

  await writeFile(
    cachePath(fingerprint, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
}

export async function clearIngestCache(fingerprint: string): Promise<void> {
  await rm(cachePath(fingerprint, ""), { recursive: true, force: true });
}
