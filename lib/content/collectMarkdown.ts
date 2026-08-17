import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import type { Locale } from "@/lib/types";

export const CONTENT_DIR = path.join(process.cwd(), "content");

export interface ContentFile {
  locale: Locale;
  source: string;
  raw: string;
}

const PRIORITY_PREFIXES = [
  "commercial/pricing.md",
  "chatbot-faq.md",
  "home.md",
  "about.md",
  "products/overview.md",
  "commercial/demo.md",
  "commercial/quote.md",
  "commercial/support.md",
  "faq.md",
  "navigation.md",
];

function priorityScore(source: string): number {
  const index = PRIORITY_PREFIXES.findIndex((prefix) => source.endsWith(prefix));
  if (index >= 0) return index;
  if (source.includes("/products/")) return 20;
  if (source.includes("/solutions/")) return 30;
  if (source.includes("/sectors/")) return 40;
  if (source.includes("/commercial/")) return 10;
  if (source.includes("/resources/")) return 50;
  if (source.includes("/legal/")) return 60;
  return 45;
}

async function collectMarkdownPaths(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownPaths(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

export async function loadContentFiles(
  locales: Locale[] = ["fr", "en"],
): Promise<ContentFile[]> {
  const results: ContentFile[] = [];

  for (const locale of locales) {
    const localeDir = path.join(CONTENT_DIR, locale);

    try {
      const filePaths = await collectMarkdownPaths(localeDir);

      for (const filePath of filePaths) {
        const source = path.relative(CONTENT_DIR, filePath).replaceAll("\\", "/");
        const raw = await readFile(filePath, "utf8");
        results.push({ locale, source, raw });
      }
    } catch (error) {
      console.warn(`[content] Missing locale directory: ${localeDir}`, error);
    }
  }

  return results;
}

export function sortContentFiles(files: ContentFile[]): ContentFile[] {
  return [...files].sort((a, b) => {
    const scoreDiff = priorityScore(a.source) - priorityScore(b.source);
    if (scoreDiff !== 0) return scoreDiff;
    return a.source.localeCompare(b.source);
  });
}
