/**
 * Smoke test de l'API chat — govern-chatbot
 * Usage: node scripts/test-chat.mjs [baseUrl]
 * Exemple: node scripts/test-chat.mjs http://localhost:1337
 */
const baseUrl = process.argv[2] || "http://localhost:1337";

async function checkHealth() {
  const res = await fetch(`${baseUrl}/api/health`);
  const data = await res.json();
  console.log("Health:", data);
  if (!data.gemini) {
    console.warn("⚠ GEMINI_API_KEYS manquante — le chat renverra 503");
  }
  return data;
}

async function checkChatStreaming() {
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/plain",
    },
    body: JSON.stringify({
      locale: "fr",
      messages: [{ role: "user", content: "Quels sont vos 4 produits principaux ?" }],
    }),
  });

  console.log("Chat status:", res.status);
  console.log("X-Chat-Mode:", res.headers.get("X-Chat-Mode"));
  console.log("X-RateLimit-Remaining:", res.headers.get("X-RateLimit-Remaining"));

  if (!res.ok) {
    const err = await res.text();
    console.error("Chat error:", err);
    process.exit(1);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let content = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    content += decoder.decode(value, { stream: true });
  }

  console.log("\n--- Réponse Eynam (extrait) ---");
  console.log(content.slice(0, 500) + (content.length > 500 ? "…" : ""));
  console.log(`\n✓ ${content.length} caractères reçus`);
}

console.log(`Testing ${baseUrl}\n`);
await checkHealth();
await checkChatStreaming();
