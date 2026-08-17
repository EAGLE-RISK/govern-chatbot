import { config } from "dotenv";

config({ path: ".env" });

import { loadContentFiles } from "@/lib/content/collectMarkdown";
import { clearKnowledgeCache } from "@/lib/content/loadKnowledge";
import { getGeminiApiKeys } from "@/lib/gemini";
import { GeminiDailyQuotaError, GeminiKeysExhaustedError, isTransientNetworkError } from "@/lib/gemini/errors";
import { chunkAllContentFiles } from "@/lib/rag/chunk";
import { embedTextsInBatches } from "@/lib/rag/embed";
import {
  appendEmbeddingBatch,
  clearIngestCache,
  computeChunksFingerprint,
  countCompletedEmbeddings,
  initIngestCache,
  loadCachedEmbeddings,
  loadManifest,
} from "@/lib/rag/ingestCache";
import {
  clearDocumentChunks,
  getDocumentChunkCount,
  insertDocumentChunks,
} from "@/lib/supabase";

const freshStart = process.argv.includes("--fresh");

async function main() {
  const geminiKeys = getGeminiApiKeys();

  if (
    geminiKeys.length === 0 ||
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.error("❌ Variables manquantes dans .env");
    console.error("   GEMINI_API_KEYS, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  console.log("📚 Govern Chatbot — Ingestion RAG\n");

  console.log("1/5 Chargement markdown…");
  const files = await loadContentFiles(["fr", "en"]);
  console.log(`   ${files.length} fichiers\n`);

  console.log("2/5 Chunking…");
  const chunks = chunkAllContentFiles(files);
  const byLocale = {
    fr: chunks.filter((c) => c.metadata.locale === "fr").length,
    en: chunks.filter((c) => c.metadata.locale === "en").length,
  };
  console.log(`   ${chunks.length} chunks (${byLocale.fr} FR, ${byLocale.en} EN)\n`);

  if (chunks.length === 0) {
    console.error("❌ Aucun chunk — vérifiez content/");
    process.exit(1);
  }

  const fingerprint = computeChunksFingerprint(chunks);

  if (freshStart) {
    console.log("♻️  Mode --fresh : cache local réinitialisé\n");
    await clearIngestCache(fingerprint);
  }

  let cachedEmbeddings = await loadCachedEmbeddings(fingerprint, chunks.length);
  let completedCount = countCompletedEmbeddings(cachedEmbeddings);
  const manifest = await loadManifest(fingerprint);

  if (manifest && manifest.totalChunks !== chunks.length) {
    console.log("⚠️  Contenu modifié — cache ignoré, nouvelle ingestion\n");
    await clearIngestCache(fingerprint);
    cachedEmbeddings = await loadCachedEmbeddings(fingerprint, chunks.length);
    completedCount = 0;
  }

  if (completedCount === 0) {
    await initIngestCache(fingerprint, chunks.length);
    console.log("4/5 Nettoyage Supabase…");
    await clearDocumentChunks();
    console.log("   Table vidée\n");
  } else {
    const supabaseCount = await getDocumentChunkCount();
    console.log(
      `↩️  Reprise — ${completedCount}/${chunks.length} embeddings en cache` +
        (supabaseCount > 0 ? `, ${supabaseCount} chunks déjà en base` : "") +
        "\n",
    );
  }

  console.log("3/5 Embeddings Gemini…");
  if (completedCount > 0) {
    console.log(`   Reprise au chunk ${completedCount}/${chunks.length}\n`);
  }
  if (geminiKeys.length > 1) {
    console.log(`   ${geminiKeys.length} clés API configurées (rotation active)\n`);
  }

  try {
    await embedTextsInBatches(
      chunks.map((chunk) => chunk.content),
      {
        startIndex: completedCount,
        onBatchComplete: async (batchNumber, startIndex, batchEmbeddings) => {
          await appendEmbeddingBatch(
            fingerprint,
            startIndex,
            batchEmbeddings,
            chunks.length,
          );

          await insertDocumentChunks(
            batchEmbeddings.map((embedding, offset) => ({
              content: chunks[startIndex + offset].content,
              metadata: chunks[startIndex + offset].metadata,
              embedding,
            })),
          );

          if (batchNumber % 10 === 0) {
            const total = await getDocumentChunkCount();
            console.log(`   💾 ${total}/${chunks.length} chunks en base`);
          }
        },
      },
    );
  } catch (error) {
    if (
      error instanceof GeminiDailyQuotaError ||
      error instanceof GeminiKeysExhaustedError
    ) {
      const done = await getDocumentChunkCount();
      console.error("\n⏸️  Quota Gemini embedding épuisé sur toutes les clés.");
      console.error(`   Progression sauvegardée : ${done}/${chunks.length} chunks`);
      console.error("\n→ Relancez demain : npm run ingest");
      console.error("→ Ajoutez des clés : GEMINI_API_KEYS=cle1,cle2,cle3,cle4");
      process.exit(2);
    }

    throw error;
  }

  clearKnowledgeCache();
  await clearIngestCache(fingerprint);

  const total = await getDocumentChunkCount();
  console.log(`\n✅ Ingestion terminée — ${total} chunks indexés`);
  console.log("ℹ️  Optionnel : exécutez supabase/indexes-after-ingest.sql pour accélérer la recherche");
}

main().catch(async (error) => {
  const message = error instanceof Error ? error.message : String(error);

  if (isTransientNetworkError(error)) {
    try {
      const total = await getDocumentChunkCount();
      console.error("\n⚠️  Erreur réseau temporaire (fetch failed).");
      console.error(`   Progression sauvegardée : ${total}/3104 chunks environ`);
      console.error("\n→ Relancez simplement : npm run ingest");
      process.exit(2);
    } catch {
      // ignore
    }
  }

  console.error("\n❌ Ingestion échouée:", message);
  process.exit(1);
});
