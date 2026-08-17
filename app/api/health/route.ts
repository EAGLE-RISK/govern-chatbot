import { isGeminiConfigured } from "@/lib/gemini";
import { corsHeaders } from "@/lib/api";
import { getQueryEmbeddingCacheSize } from "@/lib/rag/queryEmbeddingCache";
import { getDocumentChunkCount, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const supabase = isSupabaseConfigured();

  let ragChunks = 0;
  if (supabase) {
    try {
      ragChunks = await getDocumentChunkCount();
    } catch {
      ragChunks = 0;
    }
  }

  const chatMode = supabase && ragChunks > 0 ? "rag" : "baseline";

  return Response.json(
    {
      service: "govern-chatbot",
      status: "ok",
      gemini: isGeminiConfigured(),
      supabase,
      rag: { enabled: supabase, chunks: ragChunks },
      embeddingCache: getQueryEmbeddingCacheSize(),
      chatMode,
      version: "0.2.0",
    },
    { headers: corsHeaders(origin) },
  );
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}
