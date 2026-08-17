import { NextResponse } from "next/server";

const DEV_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

/** Origines prod Govern One (avec et sans www). */
const PROD_ORIGINS = new Set([
  "https://www.govern-one.com",
  "https://govern-one.com",
]);

function parseExtraOrigins(): string[] {
  const raw = process.env.FRONTEND_URLS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function buildAllowedOrigins(): Set<string> {
  const origins = new Set<string>([
    ...DEV_ORIGINS,
    ...PROD_ORIGINS,
    ...parseExtraOrigins(),
  ]);

  const primary = process.env.FRONTEND_URL?.trim();
  if (primary) origins.add(primary);

  return origins;
}

export function corsHeaders(origin?: string | null) {
  const primary = process.env.FRONTEND_URL || "http://localhost:5173";
  const allowedOrigins = buildAllowedOrigins();
  const requestOrigin = origin || primary;
  const allow = allowedOrigins.has(requestOrigin);

  return {
    "Access-Control-Allow-Origin": allow ? requestOrigin : primary,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
    "Access-Control-Allow-Credentials": "true",
  };
}

export function json(
  data: unknown,
  init?: ResponseInit & { origin?: string | null },
) {
  const { origin, ...rest } = init || {};
  return NextResponse.json(data, {
    ...rest,
    headers: {
      ...corsHeaders(origin),
      ...(rest.headers || {}),
    },
  });
}

export function options(origin?: string | null) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}
