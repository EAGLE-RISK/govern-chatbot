/**
 * Vérifie le CORS depuis une origine frontend (preflight + POST).
 *
 * Usage:
 *   node scripts/test-cors.mjs [baseUrl] [origin]
 *
 * Exemples:
 *   node scripts/test-cors.mjs http://localhost:1337 http://localhost:5173
 *   node scripts/test-cors.mjs https://govern-chatbot.vercel.app https://www.govern-one.com
 */
const baseUrl = (process.argv[2] || "http://localhost:1337").replace(/\/$/, "");
const origin = process.argv[3] || "https://www.govern-one.com";

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

console.log(`CORS test — ${baseUrl}`);
console.log(`Origin: ${origin}\n`);

const preflight = await fetch(`${baseUrl}/api/chat`, {
  method: "OPTIONS",
  headers: {
    Origin: origin,
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "Content-Type, Accept",
  },
});

console.log("OPTIONS status:", preflight.status);
const preflightAllowOrigin = preflight.headers.get("Access-Control-Allow-Origin");
console.log("Access-Control-Allow-Origin:", preflightAllowOrigin);

if (preflight.status !== 204 && preflight.status !== 200) {
  fail(`Preflight inattendu (${preflight.status})`);
}

if (preflightAllowOrigin !== origin) {
  fail(
    `Preflight CORS refusé — attendu "${origin}", reçu "${preflightAllowOrigin ?? "null"}"`,
  );
}

const chat = await fetch(`${baseUrl}/api/chat`, {
  method: "POST",
  headers: {
    Origin: origin,
    "Content-Type": "application/json",
    Accept: "text/plain",
  },
  body: JSON.stringify({
    locale: "fr",
    messages: [{ role: "user", content: "Bonjour Eynam" }],
  }),
});

console.log("\nPOST status:", chat.status);
console.log(
  "Access-Control-Allow-Origin:",
  chat.headers.get("Access-Control-Allow-Origin"),
);
console.log("X-Chat-Mode:", chat.headers.get("X-Chat-Mode"));

if (!chat.ok) {
  const err = await chat.text();
  fail(`POST /api/chat a échoué: ${err.slice(0, 300)}`);
}

const reader = chat.body?.getReader();
if (!reader) fail("Corps de réponse vide");

const decoder = new TextDecoder();
let content = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  content += decoder.decode(value, { stream: true });
}

if (!content.trim()) fail("Réponse chat vide");

console.log(`\n✓ CORS OK — ${content.length} caractères reçus`);
console.log(content.slice(0, 200) + (content.length > 200 ? "…" : ""));
