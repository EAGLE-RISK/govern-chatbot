"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { DEFAULT_LANDING_URL } from "@/lib/chat/pageRoutes";
import { renderChatMessage } from "@/lib/chat/renderChatMessage";

type Locale = "fr" | "en";
type Role = "user" | "assistant";

interface Message {
  id: number;
  role: Role;
  content: string;
}

interface HealthStatus {
  gemini: boolean;
  supabase?: boolean;
  rag?: { enabled: boolean; chunks: number };
  chatMode: string;
}

const QUICK_QUESTIONS: Record<Locale, string[]> = {
  fr: [
    "Quels sont vos produits ?",
    "Comment demander une démo ?",
    "Quels sont vos plans tarifaires ?",
    "Parlez-moi de la gouvernance",
  ],
  en: [
    "What are your products?",
    "How do I request a demo?",
    "What are your pricing plans?",
    "Tell me about governance",
  ],
};

const LANDING_URL =
  process.env.NEXT_PUBLIC_LANDING_URL ?? DEFAULT_LANDING_URL;

const ERROR_MESSAGES: Record<Locale, Record<number, string>> = {
  fr: {
    429: "Trop de requêtes. Réessayez dans quelques minutes.",
    503: "Service IA non configuré. Vérifiez GEMINI_API_KEYS dans .env.",
    500: "Erreur serveur. Consultez les logs du terminal.",
  },
  en: {
    429: "Too many requests. Please try again in a few minutes.",
    503: "AI service not configured. Check GEMINI_API_KEYS in .env.",
    500: "Server error. Check the terminal logs.",
  },
};

async function streamChat(
  locale: Locale,
  messages: { role: Role; content: string }[],
  onDelta: (text: string) => void,
): Promise<{ content: string; chatMode: string | null }> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/plain",
    },
    body: JSON.stringify({ locale, messages }),
  });

  const chatMode = response.headers.get("X-Chat-Mode");

  if (!response.ok) {
    let message = `Erreur ${response.status}`;
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // ignore
    }
    const err = new Error(message) as Error & { status?: number };
    err.status = response.status;
    throw err;
  }

  if (!response.body) {
    throw new Error("Réponse vide");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let content = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    content += decoder.decode(value, { stream: true });
    onDelta(content);
  }

  content += decoder.decode();
  return { content: content.trim(), chatMode };
}

export default function ChatPlayground() {
  const [locale, setLocale] = useState<Locale>("fr");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content:
        locale === "fr"
          ? "👋 Bonjour ! Je suis **Eynam**. Posez-moi une question sur Govern One."
          : "👋 Hello! I'm **Eynam**. Ask me anything about Govern One.",
    },
  ]);
  const [streaming, setStreaming] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [lastChatMode, setLastChatMode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        content:
          locale === "fr"
            ? "👋 Bonjour ! Je suis **Eynam**. Posez-moi une question sur Govern One."
            : "👋 Hello! I'm **Eynam**. Ask me anything about Govern One.",
      },
    ]);
    setError(null);
    setLastChatMode(null);
  }, [locale]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    setError(null);
    const userMsg: Message = { id: Date.now(), role: "user", content: trimmed };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setStreaming(true);

    const apiMessages = history
      .filter((m) => m.content)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    const assistantId = Date.now() + 1;
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const { chatMode } = await streamChat(locale, apiMessages, (content) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content } : m)),
        );
      });
      if (chatMode) setLastChatMode(chatMode);
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      const msg =
        (status && ERROR_MESSAGES[locale][status]) ||
        (err instanceof Error ? err.message : "Erreur inconnue");
      setError(msg);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setStreaming(false);
    }
  };

  const activeMode = lastChatMode ?? health?.chatMode ?? "baseline";

  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Eynam — Test local</h1>
          <p style={styles.subtitle}>
            Playground govern-chatbot · mode {activeMode}
          </p>
        </div>
        <div style={styles.headerActions}>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            style={styles.select}
            disabled={streaming}
          >
            <option value="fr">FR</option>
            <option value="en">EN</option>
          </select>
          {health && (
            <span style={health.gemini ? styles.badgeOk : styles.badgeWarn}>
              Gemini {health.gemini ? "OK" : "—"} ·{" "}
              {health.rag?.chunks ? `RAG ${health.rag.chunks} chunks` : activeMode}
            </span>
          )}
        </div>
      </header>

      {!health?.gemini && (
        <div style={styles.alert}>
          Ajoutez <code>GEMINI_API_KEYS</code> dans <code>.env</code> puis relancez{" "}
          <code>npm run dev</code>.
        </div>
      )}

      {health?.gemini && !health?.supabase && (
        <div style={styles.info}>
          Mode <strong>baseline</strong> — ajoutez Supabase + <code>npm run ingest</code>{" "}
          pour activer le RAG.
        </div>
      )}

      {health?.supabase && (health.rag?.chunks ?? 0) === 0 && (
        <div style={styles.info}>
          Supabase configuré mais table vide — exécutez <code>npm run ingest</code>.
        </div>
      )}

      <div style={styles.quickRow}>
        {QUICK_QUESTIONS[locale].map((q) => (
          <button
            key={q}
            type="button"
            style={styles.quickBtn}
            onClick={() => sendMessage(q)}
            disabled={streaming}
          >
            {q}
          </button>
        ))}
      </div>

      <div style={styles.messages}>
        {messages.map((msg) => {
          const isStreamingThis =
            streaming && msg.role === "assistant" && msg.id === messages.at(-1)?.id;
          const showCursor = isStreamingThis && msg.content.length > 0;

          return (
            <div
              key={msg.id}
              style={{
                ...styles.bubble,
                ...(msg.role === "user" ? styles.userBubble : styles.botBubble),
              }}
            >
              <strong>{msg.role === "user" ? "Vous" : "Eynam"}</strong>
              <div style={styles.bubbleText}>
                {msg.content ? (
                  <>
                    {msg.role === "assistant"
                      ? renderChatMessage(msg.content, {
                          locale,
                          baseUrl: LANDING_URL,
                        })
                      : msg.content}
                    {showCursor && <span style={styles.cursor}>▋</span>}
                  </>
                ) : isStreamingThis ? (
                  <span style={styles.thinking}>
                    {locale === "fr" ? "Eynam réfléchit…" : "Eynam is thinking…"}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <form
        style={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
      >
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={locale === "fr" ? "Votre message…" : "Your message…"}
          disabled={streaming}
          maxLength={500}
        />
        <button type="submit" style={styles.sendBtn} disabled={streaming || !input.trim()}>
          {streaming ? "…" : "Envoyer"}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    fontFamily: "system-ui, sans-serif",
    maxWidth: 820,
    margin: "0 auto",
    padding: "1.5rem",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem",
    flexWrap: "wrap",
  },
  title: { margin: 0, fontSize: "1.5rem", color: "#0b485a" },
  subtitle: { margin: "0.25rem 0 0", color: "#666", fontSize: "0.9rem" },
  headerActions: { display: "flex", gap: "0.5rem", alignItems: "center" },
  select: { padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid #ccc" },
  badgeOk: {
    fontSize: "0.75rem",
    background: "#e6f4ea",
    color: "#137333",
    padding: "0.25rem 0.5rem",
    borderRadius: 999,
  },
  badgeWarn: {
    fontSize: "0.75rem",
    background: "#fef7e0",
    color: "#b06000",
    padding: "0.25rem 0.5rem",
    borderRadius: 999,
  },
  alert: {
    background: "#fff8e1",
    border: "1px solid #ffe082",
    padding: "0.75rem 1rem",
    borderRadius: 8,
    fontSize: "0.9rem",
  },
  info: {
    background: "#e8f4f8",
    border: "1px solid #b3dce8",
    padding: "0.75rem 1rem",
    borderRadius: 8,
    fontSize: "0.9rem",
  },
  quickRow: { display: "flex", flexWrap: "wrap", gap: "0.5rem" },
  quickBtn: {
    fontSize: "0.8rem",
    padding: "0.35rem 0.65rem",
    borderRadius: 999,
    border: "1px solid #0b485a",
    background: "#fff",
    color: "#0b485a",
    cursor: "pointer",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    padding: "1rem",
    background: "#f7f9fa",
    borderRadius: 12,
    minHeight: 360,
    maxHeight: "60vh",
  },
  bubble: { padding: "0.75rem 1rem", borderRadius: 10, maxWidth: "85%" },
  userBubble: { alignSelf: "flex-end", background: "#0b485a", color: "#fff" },
  botBubble: { alignSelf: "flex-start", background: "#fff", border: "1px solid #e0e0e0" },
  bubbleText: { margin: "0.35rem 0 0", whiteSpace: "pre-wrap", lineHeight: 1.5 },
  thinking: {
    color: "#666",
    fontStyle: "italic",
    fontSize: "0.95rem",
  },
  cursor: {
    display: "inline-block",
    marginLeft: 2,
    animation: "blink 1s step-end infinite",
    color: "#0b485a",
  },
  error: {
    background: "#fdecea",
    color: "#c62828",
    padding: "0.75rem",
    borderRadius: 8,
    fontSize: "0.9rem",
  },
  form: { display: "flex", gap: "0.5rem" },
  input: {
    flex: 1,
    padding: "0.75rem 1rem",
    borderRadius: 8,
    border: "1px solid #ccc",
    fontSize: "1rem",
  },
  sendBtn: {
    padding: "0.75rem 1.25rem",
    borderRadius: 8,
    border: "none",
    background: "#0b485a",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
};
