"use client";

import type { CSSProperties, ReactNode } from "react";

import { injectPageLinks } from "@/lib/chat/injectPageLinks";
import { DEFAULT_LANDING_URL, resolvePageHref } from "@/lib/chat/pageRoutes";
import type { Locale } from "@/lib/types";

const LINK_STYLE: CSSProperties = {
  color: "#0b485a",
  textDecoration: "underline",
  fontWeight: 600,
  cursor: "pointer",
};

const INLINE_TOKEN =
  /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s]+|\/(?:demo|quote|support|pricing|about|faq|produits|solutions|secteurs|ressources)[^\s),]*)/g;

export interface RenderChatMessageOptions {
  locale: Locale;
  baseUrl?: string;
}

function renderPlainSegment(text: string, key: string): ReactNode {
  if (!text.includes("**")) return text;

  const parts: ReactNode[] = [];
  const boldPattern = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = boldPattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(<strong key={`${key}-b-${match.index}`}>{match[1]}</strong>);
    last = match.index + match[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
}

function renderLine(line: string, lineIndex: number, baseUrl: string): ReactNode {
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of line.matchAll(INLINE_TOKEN)) {
    const matchIndex = match.index ?? 0;
    if (matchIndex > lastIndex) {
      parts.push(renderPlainSegment(line.slice(lastIndex, matchIndex), `${lineIndex}-${lastIndex}`));
    }

    const token = match[0];

    if (token.startsWith("**")) {
      parts.push(<strong key={`${lineIndex}-${matchIndex}`}>{token.slice(2, -2)}</strong>);
    } else {
      const md = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      const href = md?.[2] ?? (token.startsWith("http") ? token : resolvePageHref(token, baseUrl));
      const label = md?.[1] ?? token;

      parts.push(
        <a
          key={`${lineIndex}-${matchIndex}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="chat-message-link"
          style={LINK_STYLE}
        >
          {label}
        </a>,
      );
    }

    lastIndex = matchIndex + token.length;
  }

  if (lastIndex < line.length) {
    parts.push(renderPlainSegment(line.slice(lastIndex), `${lineIndex}-tail`));
  }

  return parts.length > 0 ? parts : line;
}

/** Rendu message assistant avec liens cliquables et gras. */
export function renderChatMessage(
  content: string,
  { locale, baseUrl = DEFAULT_LANDING_URL }: RenderChatMessageOptions,
): ReactNode {
  const linked = injectPageLinks(content, locale, { baseUrl });

  return linked.split("\n").map((line, lineIndex) => (
    <span key={lineIndex}>
      {lineIndex > 0 && <br />}
      {renderLine(line, lineIndex, baseUrl)}
    </span>
  ));
}
