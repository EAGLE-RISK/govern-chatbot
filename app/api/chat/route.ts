import { NextResponse } from "next/server";

import {
  getBlockedReply,
  isBlockedQuestion,
  sanitizeAssistantReply,
} from "@/lib/chat/guardrails";
import { buildSystemPrompt } from "@/lib/chat/systemPrompt";
import { chatRequestSchema } from "@/lib/chat/validation";
import { loadKnowledgeBase } from "@/lib/content/loadKnowledge";
import { generateChatReply, isGeminiConfigured, streamChatReply } from "@/lib/gemini";
import { buildRagSystemPrompt } from "@/lib/rag/prompt";
import { retrieveRelevantChunks } from "@/lib/rag/retrieve";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { isSupabaseConfigured } from "@/lib/supabase";
import { corsHeaders, options } from "@/lib/api";
import type { Locale } from "@/lib/types";

export const maxDuration = 60;

function getLastUserMessage(
  messages: { role: string; content: string }[],
): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === "user") return messages[index].content;
  }
  return null;
}

function chatResponseHeaders(
  origin: string | null,
  extra: Record<string, string>,
): Record<string, string> {
  return { ...corsHeaders(origin), ...extra };
}

function guessChatMode(): "rag" | "baseline" {
  return isSupabaseConfigured() ? "rag" : "baseline";
}

async function buildPromptForRequest(
  locale: Locale,
  lastUserMessage: string,
): Promise<{ systemPrompt: string; mode: "rag" | "baseline" }> {
  if (isSupabaseConfigured()) {
    try {
      const chunks = await retrieveRelevantChunks(lastUserMessage, locale);
      if (chunks.length > 0) {
        return {
          systemPrompt: buildRagSystemPrompt(locale, chunks),
          mode: "rag",
        };
      }
    } catch (error) {
      console.warn("[/api/chat] RAG failed, falling back to baseline:", error);
    }
  }

  const knowledgeBase = await loadKnowledgeBase(locale);
  return {
    systemPrompt: buildSystemPrompt(locale, knowledgeBase),
    mode: "baseline",
  };
}

export async function OPTIONS(request: Request) {
  return options(request.headers.get("origin"));
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  try {
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: "AI service is not configured." },
        { status: 503, headers: chatResponseHeaders(origin, {}) },
      );
    }

    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: chatResponseHeaders(origin, {
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimit.resetAt),
          }),
        },
      );
    }

    const body = await request.json();
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body.", details: parsed.error.flatten() },
        { status: 400, headers: chatResponseHeaders(origin, {}) },
      );
    }

    const { locale, messages } = parsed.data;
    const lastUserMessage = getLastUserMessage(messages);

    if (!lastUserMessage) {
      return NextResponse.json(
        { error: "A user message is required." },
        { status: 400, headers: chatResponseHeaders(origin, {}) },
      );
    }

    if (isBlockedQuestion(lastUserMessage)) {
      return NextResponse.json(
        { reply: getBlockedReply(locale) },
        {
          headers: chatResponseHeaders(origin, {
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-Chat-Mode": guessChatMode(),
          }),
        },
      );
    }

    const acceptHeader = request.headers.get("accept") ?? "";
    const wantsStream =
      acceptHeader.includes("text/plain") ||
      acceptHeader.includes("text/event-stream");

    const baseHeaders = chatResponseHeaders(origin, {
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-Chat-Mode": guessChatMode(),
    });

    if (!wantsStream) {
      const { systemPrompt, mode } = await buildPromptForRequest(
        locale,
        lastUserMessage,
      );

      const rawReply = await generateChatReply(systemPrompt, messages);
      const reply = sanitizeAssistantReply(rawReply, locale);

      return NextResponse.json(
        { reply },
        {
          headers: {
            ...baseHeaders,
            "X-Chat-Mode": mode,
          },
        },
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const { systemPrompt } = await buildPromptForRequest(
            locale,
            lastUserMessage,
          );

          let accumulated = "";

          for await (const chunk of streamChatReply(systemPrompt, messages)) {
            accumulated += chunk;
            controller.enqueue(encoder.encode(chunk));
          }

          const sanitized = sanitizeAssistantReply(accumulated, locale);
          if (sanitized.length > accumulated.length) {
            controller.enqueue(
              encoder.encode(sanitized.slice(accumulated.length)),
            );
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...baseHeaders,
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[/api/chat]", error);
    return NextResponse.json(
      { error: "Failed to generate a response." },
      { status: 500, headers: chatResponseHeaders(origin, {}) },
    );
  }
}
