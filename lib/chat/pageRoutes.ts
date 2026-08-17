import type { Locale } from "@/lib/types";

/** Noms affichés dans le chat → chemins sur govern-landing */
export const PAGE_ROUTES: Record<string, string> = {
  Support: "/support",
  Demonstration: "/demo",
  Démonstration: "/demo",
  Demo: "/demo",
  "Demande de Devis": "/quote",
  "Quote Request": "/quote",
  "Gestion des Risques": "/produits/risque",
  "Risk Management": "/produits/risque",
  Gouvernance: "/produits/gouvernance",
  Governance: "/produits/gouvernance",
  "Anti-Corruption": "/produits/anti-corruption",
  Conformité: "/produits/conformite",
  Compliance: "/produits/conformite",
  Tarifs: "/pricing",
  Pricing: "/pricing",
  "À propos": "/about",
  About: "/about",
  Partenaires: "/partners",
  Partners: "/partners",
  FAQ: "/faq",
  Documentation: "/ressources/documentation",
  Guides: "/ressources/guides",
  Webinaires: "/ressources/webinaires",
  Webinars: "/ressources/webinaires",
  "Études de Cas": "/ressources/etudes-de-cas",
  "Case Studies": "/ressources/etudes-de-cas",
  "Livres Blancs": "/ressources/livres-blancs",
  "White Papers": "/ressources/livres-blancs",
};

/** Chemins bruts (/demo) → libellé cliquable selon la locale */
export const PATH_LABELS: Record<string, { fr: string; en: string }> = {
  "/support": { fr: "Support", en: "Support" },
  "/demo": { fr: "Démonstration", en: "Demo" },
  "/quote": { fr: "Demande de Devis", en: "Quote Request" },
  "/pricing": { fr: "Tarifs", en: "Pricing" },
  "/about": { fr: "À propos", en: "About" },
  "/partners": { fr: "Partenaires", en: "Partners" },
  "/faq": { fr: "FAQ", en: "FAQ" },
  "/produits/risque": { fr: "Gestion des Risques", en: "Risk Management" },
  "/produits/gouvernance": { fr: "Gouvernance", en: "Governance" },
  "/produits/anti-corruption": { fr: "Anti-Corruption", en: "Anti-Corruption" },
  "/produits/conformite": { fr: "Conformité", en: "Compliance" },
  "/ressources/documentation": { fr: "Documentation", en: "Documentation" },
  "/ressources/guides": { fr: "Guides", en: "Guides" },
  "/ressources/webinaires": { fr: "Webinaires", en: "Webinars" },
  "/ressources/etudes-de-cas": { fr: "Études de Cas", en: "Case Studies" },
  "/ressources/livres-blancs": { fr: "Livres Blancs", en: "White Papers" },
};

for (const [label, path] of Object.entries(PAGE_ROUTES)) {
  if (!PATH_LABELS[path]) {
    PATH_LABELS[path] = { fr: label, en: label };
  }
}

export const DEFAULT_LANDING_URL = "https://www.govern-one.com";

export function resolvePageHref(path: string, baseUrl?: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = baseUrl?.replace(/\/$/, "") ?? "";
  return base ? `${base}${path}` : path;
}

export function getPathLabel(path: string, locale: Locale): string {
  return PATH_LABELS[path]?.[locale] ?? path;
}
