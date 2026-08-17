const MAX_CACHE_SIZE = 200;

const cache = new Map<string, number[]>();

export function normalizeQueryForCache(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getCachedQueryEmbedding(query: string): number[] | null {
  const key = normalizeQueryForCache(query);
  return cache.get(key) ?? null;
}

export function setCachedQueryEmbedding(query: string, embedding: number[]): void {
  const key = normalizeQueryForCache(query);

  if (cache.has(key)) {
    cache.delete(key);
  }

  cache.set(key, embedding);

  if (cache.size > MAX_CACHE_SIZE) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

export function clearQueryEmbeddingCache(): void {
  cache.clear();
}

export function getQueryEmbeddingCacheSize(): number {
  return cache.size;
}
