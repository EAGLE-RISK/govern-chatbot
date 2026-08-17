import { parseFrontmatter, extractSectionTitle } from "@/lib/content/parseMarkdown";
import type { ChunkMetadata, ContentType } from "@/lib/rag/types";
import type { ContentFile } from "@/lib/content/collectMarkdown";

export interface TextChunk {
  content: string;
  metadata: ChunkMetadata;
}

const TARGET_CHUNK_SIZE = 1500;
const MAX_CHUNK_SIZE = 2000;
const OVERLAP_SIZE = 200;

const VALID_TYPES = new Set<ContentType>([
  "home",
  "about",
  "product",
  "solution",
  "sector",
  "commercial",
  "resource",
  "legal",
  "faq",
  "guide",
  "partner",
  "unknown",
]);

function inferContentType(
  source: string,
  frontmatter: Record<string, string>,
): ContentType {
  const fromFrontmatter = frontmatter.type as ContentType | undefined;
  if (fromFrontmatter && VALID_TYPES.has(fromFrontmatter)) {
    return fromFrontmatter;
  }

  if (source.includes("/products/")) return "product";
  if (source.includes("/solutions/")) return "solution";
  if (source.includes("/sectors/")) return "sector";
  if (source.includes("/commercial/")) return "commercial";
  if (source.includes("/resources/guides/")) return "guide";
  if (source.includes("/resources/")) return "resource";
  if (source.includes("/legal/")) return "legal";
  if (source.endsWith("faq.md") || source.endsWith("chatbot-faq.md")) return "faq";
  if (source.endsWith("home.md")) return "home";
  if (source.endsWith("about.md")) return "about";
  if (source.endsWith("partners.md")) return "partner";

  return "unknown";
}

function buildContextPrefix(
  frontmatter: Record<string, string>,
  locale: string,
): string {
  const name = frontmatter.name?.trim();
  const route = frontmatter.route?.trim();
  const type = frontmatter.type?.trim();

  if (!name && !route) return "";

  const parts = [name, type ? `(${type})` : "", route ? `→ ${route}` : ""]
    .filter(Boolean)
    .join(" ");

  return locale === "fr" ? `Contexte: ${parts}\n\n` : `Context: ${parts}\n\n`;
}

function splitIntoSections(body: string): string[] {
  const sections = body
    .split(/(?=^#{1,3}\s)/m)
    .map((section) => section.trim())
    .filter(Boolean);

  return sections.length > 0 ? sections : [body.trim()];
}

function splitOversizedSection(text: string): string[] {
  if (text.length <= MAX_CHUNK_SIZE) return [text];

  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;

    if (candidate.length <= TARGET_CHUNK_SIZE) {
      current = candidate;
      continue;
    }

    if (current) chunks.push(current.trim());

    if (paragraph.length > MAX_CHUNK_SIZE) {
      let start = 0;
      while (start < paragraph.length) {
        const end = Math.min(start + MAX_CHUNK_SIZE, paragraph.length);
        chunks.push(paragraph.slice(start, end).trim());
        start = Math.max(end - OVERLAP_SIZE, start + 1);
      }
      current = "";
      continue;
    }

    current = paragraph;
  }

  if (current.trim()) chunks.push(current.trim());
  return applyOverlap(chunks);
}

function applyOverlap(chunks: string[]): string[] {
  if (chunks.length <= 1) return chunks;

  const overlapped: string[] = [chunks[0]];
  for (let index = 1; index < chunks.length; index += 1) {
    const overlap = chunks[index - 1].slice(-OVERLAP_SIZE);
    overlapped.push(`${overlap}\n\n${chunks[index]}`.trim());
  }
  return overlapped;
}

export function chunkContentFile(file: ContentFile): TextChunk[] {
  const { frontmatter, body } = parseFrontmatter(file.raw);
  const type = inferContentType(file.source, frontmatter);
  const prefix = buildContextPrefix(frontmatter, file.locale);
  const sections = splitIntoSections(`${prefix}${body}`);
  const chunks: TextChunk[] = [];

  for (const section of sections) {
    const sectionTitle = extractSectionTitle(section);
    for (const part of splitOversizedSection(section)) {
      const content = part.trim();
      if (!content) continue;

      chunks.push({
        content,
        metadata: {
          locale: file.locale,
          source: file.source,
          section: sectionTitle,
          type,
        },
      });
    }
  }

  return chunks;
}

export function chunkAllContentFiles(files: ContentFile[]): TextChunk[] {
  return files.flatMap(chunkContentFile);
}
