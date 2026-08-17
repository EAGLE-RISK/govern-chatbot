export const GEMINI_QUOTA_ERROR_CODE = "gemini_quota_exceeded" as const;

export class GeminiKeysExhaustedError extends Error {
  constructor(message = "All Gemini API keys are quota-exhausted.") {
    super(message);
    this.name = "GeminiKeysExhaustedError";
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return JSON.stringify(error);
}

export function isGeminiRateLimitError(error: unknown): boolean {
  const message = getErrorMessage(error);

  return (
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("quota") ||
    message.includes("Quota exceeded")
  );
}

export function isGeminiDailyQuotaError(error: unknown): boolean {
  const message = getErrorMessage(error);

  return (
    message.includes("PerDay") ||
    message.includes("PerDayPerProject") ||
    message.includes("EmbedContentRequestsPerDay")
  );
}

export function isTransientNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("fetch failed") ||
    message.includes("econnreset") ||
    message.includes("etimedout") ||
    message.includes("network") ||
    message.includes("socket hang up")
  );
}

export class GeminiDailyQuotaError extends Error {
  constructor(message = "Gemini daily embedding quota exceeded.") {
    super(message);
    this.name = "GeminiDailyQuotaError";
  }
}

export function isGeminiQuotaError(error: unknown): boolean {
  return (
    error instanceof GeminiKeysExhaustedError || isGeminiRateLimitError(error)
  );
}
