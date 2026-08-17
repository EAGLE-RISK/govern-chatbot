import { config } from "dotenv";

config({ path: ".env" });

import { EMBEDDING_MODEL } from "@/lib/gemini";
import { getGeminiApiKeys, getGeminiClientForKey } from "@/lib/gemini/keys";

function maskKey(key: string): string {
  return key.length <= 8 ? "***" : `${key.slice(0, 4)}…${key.slice(-4)}`;
}

async function main() {
  const keys = getGeminiApiKeys();

  if (keys.length === 0) {
    console.error("❌ GEMINI_API_KEYS manquante dans .env");
    console.error("   Exemple : GEMINI_API_KEYS=cle1,cle2,cle3,cle4");
    process.exit(1);
  }

  console.log(`🔑 Test de ${keys.length} clé(s) Gemini (GEMINI_API_KEYS)…\n`);

  let ok = 0;

  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const label = `Clé ${index + 1}/${keys.length} (${maskKey(key)})`;

    try {
      const ai = getGeminiClientForKey(key);
      const response = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: ["Govern One test embedding"],
        config: { outputDimensionality: 1536, taskType: "RETRIEVAL_DOCUMENT" },
      });

      const dims = response.embeddings?.[0]?.values?.length ?? 0;
      if (dims !== 1536) {
        throw new Error(`Dimensions inattendues: ${dims}`);
      }

      console.log(`✅ ${label} — embedding OK`);
      ok += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ ${label} — échec`);
      console.error(`   ${message.slice(0, 200)}`);
    }
  }

  console.log(`\n${ok}/${keys.length} clé(s) opérationnelle(s)`);

  if (ok === 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
