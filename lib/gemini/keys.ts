import { GoogleGenAI } from "@google/genai";

import {
  GeminiKeysExhaustedError,
  getErrorMessage,
  isGeminiDailyQuotaError,
  isGeminiRateLimitError,
} from "@/lib/gemini/errors";

const DEFAULT_QUOTA_COOLDOWN_MS = 60 * 60 * 1000;
const DAILY_QUOTA_COOLDOWN_MS = 24 * 60 * 60 * 1000;

interface KeyState {
  key: string;
  exhaustedUntil: number | null;
}

let keyStates: KeyState[] | null = null;
const clients = new Map<string, GoogleGenAI>();

/** Clés Gemini séparées par des virgules dans GEMINI_API_KEYS (ex. 4 projets Google). */
export function getGeminiApiKeys(): string[] {
  const raw = process.env.GEMINI_API_KEYS?.trim();
  if (!raw) return [];

  const seen = new Set<string>();
  const keys: string[] = [];

  for (const part of raw.split(",")) {
    const key = part.trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  }

  return keys;
}

export function isGeminiConfigured(): boolean {
  return getGeminiApiKeys().length > 0;
}

function ensureKeyStates(): KeyState[] {
  if (!keyStates) {
    keyStates = getGeminiApiKeys().map((key) => ({
      key,
      exhaustedUntil: null,
    }));
  }

  return keyStates;
}

export function getQuotaCooldownMs(error: unknown): number {
  if (isGeminiDailyQuotaError(error)) {
    return DAILY_QUOTA_COOLDOWN_MS;
  }

  const message = getErrorMessage(error);
  const match = message.match(/retry in ([\d.]+)s/i);

  if (match) {
    const seconds = Number.parseFloat(match[1]);
    if (seconds <= 300) {
      return Math.ceil(seconds * 1000) + 5000;
    }
  }

  return DEFAULT_QUOTA_COOLDOWN_MS;
}

export function markKeyExhausted(apiKey: string, error: unknown): void {
  const cooldownMs = getQuotaCooldownMs(error);
  const state = ensureKeyStates().find((entry) => entry.key === apiKey);

  if (state) {
    state.exhaustedUntil = Date.now() + cooldownMs;
  }
}

export function getAvailableApiKeys(): string[] {
  const now = Date.now();

  return ensureKeyStates()
    .filter((state) => {
      if (!state.exhaustedUntil) {
        return true;
      }

      if (now >= state.exhaustedUntil) {
        state.exhaustedUntil = null;
        return true;
      }

      return false;
    })
    .map((state) => state.key);
}

export function getGeminiClientForKey(apiKey: string): GoogleGenAI {
  let client = clients.get(apiKey);

  if (!client) {
    client = new GoogleGenAI({ apiKey });
    clients.set(apiKey, client);
  }

  return client;
}

function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return "***";
  }

  return `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}`;
}

export async function withGeminiKeys<T>(
  operation: (client: GoogleGenAI, apiKey: string) => Promise<T>,
): Promise<T> {
  const availableKeys = getAvailableApiKeys();

  if (availableKeys.length === 0) {
    throw new GeminiKeysExhaustedError();
  }

  let lastError: unknown;

  for (let index = 0; index < availableKeys.length; index += 1) {
    const apiKey = availableKeys[index];

    try {
      return await operation(getGeminiClientForKey(apiKey), apiKey);
    } catch (error) {
      lastError = error;

      if (isGeminiRateLimitError(error) && index < availableKeys.length - 1) {
        markKeyExhausted(apiKey, error);
        const reason = isGeminiDailyQuotaError(error)
          ? "quota journalier atteint"
          : "quota dépassé";
        console.warn(
          `[gemini] Clé ${maskApiKey(apiKey)} — ${reason}, bascule clé ${index + 2}/${availableKeys.length}…`,
        );
        continue;
      }

      if (isGeminiRateLimitError(error)) {
        markKeyExhausted(apiKey, error);
      }

      throw error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new GeminiKeysExhaustedError();
}

export function resetGeminiKeyPool(): void {
  keyStates = null;
  clients.clear();
}
