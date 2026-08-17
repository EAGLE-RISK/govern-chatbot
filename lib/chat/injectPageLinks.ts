import {
  PAGE_ROUTES,
  PATH_LABELS,
  getPathLabel,
  resolvePageHref,
} from "@/lib/chat/pageRoutes";
import type { Locale } from "@/lib/types";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface InjectPageLinksOptions {
  baseUrl?: string;
}

function protectMarkdownLinks(text: string): { text: string; saved: string[] } {
  const saved: string[] = [];
  const protectedText = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match) => {
    saved.push(match);
    return `\x00MDLINK${saved.length - 1}\x00`;
  });
  return { text: protectedText, saved };
}

function restoreMarkdownLinks(text: string, saved: string[]): string {
  return text.replace(/\x00MDLINK(\d+)\x00/g, (_, index) => saved[Number(index)] ?? "");
}

/** Normalise **page Démonstration** → page Démonstration pour le matching. */
function normalizeBoldPageMentions(text: string): string {
  return text
    .replace(/\*\*page\s+([^*]+)\*\*/gi, "page $1")
    .replace(/la\s+\*\*page\s+([^*]+)\*\*/gi, "la page $1");
}

export function injectPageLinks(
  text: string,
  locale: Locale,
  options: InjectPageLinksOptions = {},
): string {
  const { text: protectedText, saved } = protectMarkdownLinks(text);
  let formatted = normalizeBoldPageMentions(protectedText);

  const labels = Object.keys(PAGE_ROUTES).sort((a, b) => b.length - a.length);

  for (const label of labels) {
    const path = PAGE_ROUTES[label];
    const href = resolvePageHref(path, options.baseUrl);
    const escapedLabel = escapeRegExp(label);
    const escapedPath = escapeRegExp(path);

    formatted = formatted.replace(
      new RegExp(`\\*\\*page\\s+${escapedLabel}\\*\\*`, "gi"),
      `[${label}](${href})`,
    );

    formatted = formatted.replace(
      new RegExp(`la\\s+\\*\\*page\\s+${escapedLabel}\\*\\*`, "gi"),
      `[${label}](${href})`,
    );

    formatted = formatted.replace(
      new RegExp(`page\\s+${escapedLabel}\\s*\\(${escapedPath}\\)`, "gi"),
      `[${label}](${href})`,
    );

    formatted = formatted.replace(
      new RegExp(`${escapedLabel}\\s*\\(${escapedPath}\\)`, "gi"),
      `[${label}](${href})`,
    );
  }

  const paths = Object.keys(PATH_LABELS).sort((a, b) => b.length - a.length);

  for (const path of paths) {
    const label = getPathLabel(path, locale);
    const href = resolvePageHref(path, options.baseUrl);
    const escapedPath = escapeRegExp(path);

    formatted = formatted.replace(
      new RegExp(`\\(page\\s+${escapedPath}\\)`, "gi"),
      `[${label}](${href})`,
    );

    formatted = formatted.replace(
      new RegExp(`page\\s+${escapedPath}(?=[.,!?)]|\\s|$)`, "gi"),
      `[${label}](${href})`,
    );

    formatted = formatted.replace(
      new RegExp(`\\(${escapedPath}\\)`, "g"),
      `[${label}](${href})`,
    );

    formatted = formatted.replace(
      new RegExp(`(^|[\\s(])${escapedPath}(?=[.,!?)]|\\s|$)`, "g"),
      (_, prefix: string) => `${prefix}[${label}](${href})`,
    );
  }

  for (const label of labels) {
    const path = PAGE_ROUTES[label];
    const href = resolvePageHref(path, options.baseUrl);
    const escapedLabel = escapeRegExp(label);

    formatted = formatted.replace(
      new RegExp(`page\\s+${escapedLabel}(?=[.,!?]|\\s|$|\\()`, "gi"),
      `[${label}](${href})`,
    );

    formatted = formatted.replace(
      new RegExp(`la\\s+page\\s+${escapedLabel}(?=[.,!?]|\\s|$)`, "gi"),
      `[${label}](${href})`,
    );

    formatted = formatted.replace(
      new RegExp(`${escapedLabel}\\s+page(?=[.,!?]|\\s|$)`, "gi"),
      `[${label}](${href})`,
    );

    formatted = formatted.replace(
      new RegExp(`\\*\\*${escapedLabel}\\*\\*`, "g"),
      `[${label}](${href})`,
    );
  }

  return restoreMarkdownLinks(formatted, saved);
}
