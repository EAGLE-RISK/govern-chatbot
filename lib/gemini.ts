import type { ApiChatMessage } from "@/lib/chat/validation";

export {
  GEMINI_QUOTA_ERROR_CODE,
  GeminiKeysExhaustedError,
  isGeminiQuotaError,
  isGeminiRateLimitError,
} from "@/lib/gemini/errors";
export {
  getAvailableApiKeys,
  getGeminiApiKeys,
  getGeminiClientForKey,
  isGeminiConfigured,
  resetGeminiKeyPool,
  withGeminiKeys,
} from "@/lib/gemini/keys";

import { withGeminiKeys } from "@/lib/gemini/keys";

export const CHAT_MODEL =
  process.env.GEMINI_CHAT_MODEL ?? "gemini-3.6-flash";
export const EMBEDDING_MODEL = "gemini-embedding-001" as const;
export const MAX_OUTPUT_TOKENS = 800;

function buildContents(messages: ApiChatMessage[]) {
  return messages.map((message) => ({
    role: message.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: message.content }],
  }));
}

function buildConfig(systemPrompt: string) {
  return {
    systemInstruction: systemPrompt,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    temperature: 0.4,
  };
}

export async function generateChatReply(
  systemPrompt: string,
  messages: ApiChatMessage[],
): Promise<string> {
  const response = await withGeminiKeys((ai) =>
    ai.models.generateContent({
      model: CHAT_MODEL,
      contents: buildContents(messages),
      config: buildConfig(systemPrompt),
    }),
  );

  const reply = response.text?.trim();

  if (!reply) {
    throw new Error("Gemini returned an empty response");
  }

  return reply;
}

export async function openChatStream(
  systemPrompt: string,
  messages: ApiChatMessage[],
) {
  return withGeminiKeys((ai) =>
    ai.models.generateContentStream({
      model: CHAT_MODEL,
      contents: buildContents(messages),
      config: buildConfig(systemPrompt),
    }),
  );
}

export async function* streamChatReply(
  systemPrompt: string,
  messages: ApiChatMessage[],
): AsyncGenerator<string> {
  const stream = await openChatStream(systemPrompt, messages);

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) {
      yield text;
    }
  }
}
