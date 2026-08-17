import { config } from "dotenv";

config({ path: ".env" });

import {
  getDocumentChunkCount,
  getSupabaseAdmin,
  GOVERN_CHUNKS_TABLE,
  GOVERN_MATCH_RPC,
} from "@/lib/supabase";

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env");
    process.exit(1);
  }

  console.log("🔌 Test Supabase (Govern)…\n");
  const supabase = getSupabaseAdmin();

  const { error: tableError, count } = await supabase
    .from(GOVERN_CHUNKS_TABLE)
    .select("*", { count: "exact", head: true });

  if (tableError) {
    console.error(`❌ Table ${GOVERN_CHUNKS_TABLE} introuvable`);
    console.error(`   ${tableError.message}`);
    console.error("\n→ Exécutez supabase/schema.sql dans Supabase SQL Editor");
    process.exit(1);
  }

  console.log(`✅ Table ${GOVERN_CHUNKS_TABLE} OK — ${count ?? 0} chunks`);

  const zeroVector = Array.from({ length: 1536 }, () => 0);
  const { error: rpcError } = await supabase.rpc(GOVERN_MATCH_RPC, {
    query_embedding: zeroVector,
    match_count: 1,
    match_threshold: 0,
    filter_locale: null,
  });

  if (rpcError) {
    console.error(`❌ RPC ${GOVERN_MATCH_RPC} échoué`);
    console.error(`   ${rpcError.message}`);
    process.exit(1);
  }

  console.log(`✅ RPC ${GOVERN_MATCH_RPC} OK`);

  if ((count ?? 0) === 0) {
    console.log("\nℹ️  Table vide — lancez: npm run ingest");
  } else {
    const total = await getDocumentChunkCount();
    console.log(`\n✅ ${total} chunks prêts pour le mode RAG`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
