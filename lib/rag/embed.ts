import {
  EMBEDDING_MODEL,
  withGeminiKeys,
} from "@/lib/gemini";
import {
  GeminiDailyQuotaError,
  getErrorMessage,
  isGeminiDailyQuotaError,
  isGeminiRateLimitError,
  isTransientNetworkError,
} from "@/lib/gemini/errors";
import { EMBEDDING_DIMENSIONS } from "@/lib/rag/types";
import {
  getCachedQueryEmbedding,
  setCachedQueryEmbedding,
} from "@/lib/rag/queryEmbeddingCache";

export { EMBEDDING_MODEL };

export const EMBEDDING_BATCH_SIZE = 20;
const FREE_TIER_REQUESTS_PER_MINUTE = 80;
const RATE_WINDOW_MS = 60_000;
const MAX_RETRIES = 5;

let windowStart = Date.now();
let requestsInWindow = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForQuota(requestCount: number): Promise<void> {
  if (requestsInWindow + requestCount <= FREE_TIER_REQUESTS_PER_MINUTE) return;

  const elapsed = Date.now() - windowStart;
  const waitMs = RATE_WINDOW_MS - elapsed + 1000;

  if (waitMs > 0) {
    console.log(
      `   ⏳ Gemini rate limit — pause ${Math.ceil(waitMs / 1000)}s…`,
    );
    await sleep(waitMs);
  }

  windowStart = Date.now();
  requestsInWindow = 0;
}

async function withRetry<T>(
  operation: () => Promise<T>,
  requestCount: number,
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await waitForQuota(requestCount);
      const result = await operation();
      requestsInWindow += requestCount;
      return result;
    } catch (error) {
      if (isGeminiDailyQuotaError(error)) {
        throw new GeminiDailyQuotaError(getErrorMessage(error));
      }

      const retryable =
        isGeminiRateLimitError(error) || isTransientNetworkError(error);

      if (retryable && attempt < MAX_RETRIES) {
        const reason = isTransientNetworkError(error) ? "réseau" : "quota";
        console.log(`   ⏳ Retry ${attempt}/${MAX_RETRIES} (${reason}) in 15s…`);
        await sleep(15_000);
        windowStart = Date.now();
        requestsInWindow = 0;
        continue;
      }

      throw error;
    }
  }

  throw new Error("Embedding request failed after retries");
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  return withRetry(async () => {
    const response = await withGeminiKeys((ai) =>
      ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: texts,
        config: {
          outputDimensionality: EMBEDDING_DIMENSIONS,
          taskType: "RETRIEVAL_DOCUMENT",
        },
      }),
    );

    const embeddings = (response.embeddings ?? []).map(
      (item) => item.values ?? [],
    );

    if (embeddings.length !== texts.length) {
      throw new Error(
        `Embedding count mismatch: expected ${texts.length}, got ${embeddings.length}`,
      );
    }

    return embeddings;
  }, texts.length);
}

export interface EmbedBatchOptions {
  batchSize?: number;
  startIndex?: number;
  onBatchComplete?: (
    batchIndex: number,
    startIndex: number,
    embeddings: number[][],
  ) => void | Promise<void>;
}

export async function embedTextsInBatches(
  texts: string[],
  options: EmbedBatchOptions = {},
): Promise<number[][]> {
  const batchSize = options.batchSize ?? EMBEDDING_BATCH_SIZE;
  const startIndex = options.startIndex ?? 0;
  const totalBatches = Math.ceil(texts.length / batchSize);
  const allEmbeddings: number[][] = [];

  for (let index = startIndex; index < texts.length; index += batchSize) {
    const batch = texts.slice(index, index + batchSize);
    const embeddings = await embedTexts(batch);
    allEmbeddings.push(...embeddings);

    const batchNumber = Math.floor(index / batchSize) + 1;
    console.log(`   Embeddings batch ${batchNumber}/${totalBatches}`);

    if (options.onBatchComplete) {
      await options.onBatchComplete(batchNumber, index, embeddings);
    }
  }

  return allEmbeddings;
}

export async function embedQuery(text: string): Promise<number[]> {
  const cached = getCachedQueryEmbedding(text);
  if (cached) {
    return cached;
  }

  const embeddings = await withRetry(async () => {
    const response = await withGeminiKeys((ai) =>
      ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: [text],
        config: {
          outputDimensionality: EMBEDDING_DIMENSIONS,
          taskType: "RETRIEVAL_QUERY",
        },
      }),
    );

    return (response.embeddings ?? []).map((item) => item.values ?? []);
  }, 1);

  const embedding = embeddings[0] ?? [];
  if (embedding.length > 0) {
    setCachedQueryEmbedding(text, embedding);
  }

  return embedding;
}
