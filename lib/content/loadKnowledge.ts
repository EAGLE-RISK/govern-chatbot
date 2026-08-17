import {
  CONTENT_DIR,
  loadContentFiles,
  sortContentFiles,
} from "@/lib/content/collectMarkdown";
import type { Locale } from "@/lib/types";

/** ~400k chars — safe baseline for Gemini context with priority ordering. */
const MAX_KNOWLEDGE_CHARS = 400_000;

const knowledgeCache = new Map<Locale, string>();

export async function loadKnowledgeBase(locale: Locale): Promise<string> {
  const cached = knowledgeCache.get(locale);
  if (cached) {
    return cached;
  }

  const files = sortContentFiles(await loadContentFiles([locale]));
  const sections: string[] = [];
  let totalChars = 0;

  for (const file of files) {
    const section = `## Source: ${file.source}\n\n${file.raw.trim()}`;
    const nextTotal = totalChars + section.length;

    if (nextTotal > MAX_KNOWLEDGE_CHARS) {
      console.warn(
        `[content] Knowledge base truncated for ${locale} at ${file.source} (${totalChars} chars)`,
      );
      break;
    }

    sections.push(section);
    totalChars = nextTotal;
  }

  const knowledgeBase = sections.join("\n\n---\n\n");
  knowledgeCache.set(locale, knowledgeBase);

  console.info(
    `[content] Loaded ${sections.length}/${files.length} files for ${locale} (${totalChars} chars)`,
  );

  return knowledgeBase;
}

export function clearKnowledgeCache(): void {
  knowledgeCache.clear();
}

export { CONTENT_DIR, loadContentFiles };
