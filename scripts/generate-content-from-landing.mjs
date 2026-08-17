/**
 * Génère content/fr/ et content/en/ à partir des traductions govern-landing.
 * Usage: node scripts/generate-content-from-landing.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LANDING = path.join(ROOT, "..", "govern-landing");
const CONTENT = path.join(ROOT, "content");

const PRODUCT_ROUTES = {
  risque: "/produits/risque",
  gouvernance: "/produits/gouvernance",
  antiCorruption: "/produits/anti-corruption",
  conformite: "/produits/conformite",
  governAI: "/govern-ai",
  conformiteNormesStandards: "/produits/conformite-normes-standards",
  conformiteObligationsCedeaoCemac: "/produits/conformite-obligations-cedeao-cemac",
  conformiteLcbFtFp: "/produits/conformite-lcb-ft-fp",
  controleInterne: "/produits/controle-interne",
};

const SOLUTION_ROUTES = {
  gestionConseils: "/solutions/gestion-conseils",
  gestionMeetings: "/solutions/gestion-meetings",
  gestionComitesEntreprise: "/solutions/gestion-comites-entreprise",
  gestionFormationsEvaluations: "/solutions/gestion-formations-evaluations",
  gestionAuditsGouvernance: "/solutions/gestion-audits-gouvernance",
  gestionVotesProcesVerbaux: "/solutions/gestion-votes-proces-verbaux",
  gestionEntitesFiliales: "/solutions/gestion-entites-filiales",
  remunerationIntelligence: "/solutions/remuneration-intelligence",
  gouvernanceConseilsPublics: "/solutions/gouvernance-conseils-publics",
  gouvernanceConseilsNonLucratif: "/solutions/gouvernance-conseils-non-lucratif",
  gestionRisquesOperationnels: "/solutions/gestion-risques-operationnels",
  risquesITCybersecurite: "/solutions/risques-it-cybersecurite",
  gestionRisquesFournisseurs: "/solutions/gestion-risques-fournisseurs",
  auditInterne: "/solutions/audit-interne",
  analyticsACL: "/solutions/analytics-acl",
  formationComplianceEthique: "/solutions/formation-compliance-ethique",
  templatesModeles: "/solutions/templates-modeles",
  intelligenceMarche: "/solutions/intelligence-marche",
  gestionCasSignalement: "/solutions/gestion-cas-signalement",
  gestionPolitiques: "/solutions/gestion-politiques",
};

const SECTOR_ROUTES = {
  servicesFinanciers: "/secteurs/services-financiers",
  technologie: "/secteurs/technologie",
  energie: "/secteurs/energie",
  immobilierConstruction: "/secteurs/immobilier-construction",
  gouvernementLocal: "/secteurs/gouvernement-local",
  commerceDetail: "/secteurs/commerce-detail",
  manufacturing: "/secteurs/manufacturing",
  transportLogistique: "/secteurs/transport-logistique",
  juridique: "/secteurs/juridique",
  agriculture: "/secteurs/agriculture",
  mediasTelecoms: "/secteurs/medias-telecoms",
  sante: "/secteurs/sante",
  enseignementSuperieur: "/secteurs/enseignement-superieur",
  gouvernementFederal: "/secteurs/gouvernement-federal",
  agroAlimentaire: "/secteurs/agro-alimentaire",
};

const RESOURCE_ROUTES = {
  documentation: "/ressources/documentation",
  guides: "/ressources/guides",
  webinars: "/ressources/webinaires",
  caseStudies: "/ressources/etudes-de-cas",
  whitepapers: "/ressources/livres-blancs",
  support: "/ressources/support",
};

const SOLUTION_FILENAMES = {
  risquesITCybersecurite: "risques-it-cybersecurite",
};

const LEGAL_ROUTES = {
  privacyPolicy: "/privacy-policy",
  termsOfService: "/terms-of-service",
  cookiePolicy: "/cookie-policy",
  digitalServicesAct: "/digital-services-act",
  privacyChoices: "/privacy-choices",
  trustCenter: "/trust-center",
  vulnerabilityDisclosure: "/vulnerability-disclosure",
  modernSlaveryStatement: "/modern-slavery-statement",
  modernSlaveryStatement: "/modern-slavery-statement",
};

function camelToKebab(str) {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

function loadJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(LANDING, relativePath), "utf8"));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(relativePath, content) {
  const full = path.join(CONTENT, relativePath);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, content.trim() + "\n", "utf8");
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function collectStrings(obj, skipKeys = new Set()) {
  const lines = [];
  function walk(value, keyPath = "") {
    if (value == null) return;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed || trimmed.length < 2) return;
      if (/^https?:\/\//.test(trimmed) && trimmed.length > 80) return;
      if (/\.(png|jpg|svg|woff2?)$/i.test(trimmed)) return;
      lines.push(trimmed);
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) walk(item, keyPath);
      return;
    }
    if (isPlainObject(value)) {
      for (const [k, v] of Object.entries(value)) {
        if (skipKeys.has(k)) continue;
        walk(v, keyPath ? `${keyPath}.${k}` : k);
      }
    }
  }
  walk(obj);
  return [...new Set(lines)];
}

function joinTitleParts(...parts) {
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function heroTitle(hero) {
  if (!hero) return "";
  if (typeof hero.title === "string") return hero.title;
  if (hero.title?.line1) {
    return joinTitleParts(
      hero.title.line1,
      hero.title.line1Highlight || hero.title.highlight,
      hero.title.line2,
      hero.title.line2Highlight,
      hero.title.line3,
      hero.title.line3Highlight,
      hero.title.before,
      hero.title.accent,
    );
  }
  return joinTitleParts(
    hero.title,
    hero.titleHighlight,
    hero.titleSuffix,
    hero.titleBefore,
  );
}

function sectionItems(items, label = "Éléments") {
  if (!items) return "";
  const list = Array.isArray(items) ? items : Object.values(items);
  if (list.length === 0) return "";
  return (
    `\n## ${label}\n\n` +
    list
      .map((item) => {
        if (typeof item === "string") return `- ${item}`;
        const title = item.title || item.name || item.question;
        const desc = item.description || item.answer || item.text || item.content;
        if (title && desc) return `- **${title}** : ${desc}`;
        if (title) return `- **${title}**`;
        return `- ${collectStrings(item).join(" — ")}`;
      })
      .join("\n")
  );
}

function flattenLegalSections(sections, depth = 0) {
  if (!sections || typeof sections !== "object") return "";
  let md = "";
  for (const section of Object.values(sections)) {
    if (!section || typeof section !== "object") continue;
    if (section.title) {
      md += `\n${"#".repeat(Math.min(depth + 2, 4))} ${section.title}\n\n`;
    }
    if (section.content) md += `${section.content}\n\n`;
    if (section.items) {
      md += sectionItems(section.items);
    }
    for (const [k, v] of Object.entries(section)) {
      if (["title", "content", "items"].includes(k)) continue;
      if (isPlainObject(v)) md += flattenLegalSections({ [k]: v }, depth + 1);
    }
  }
  return md;
}

function buildProductMd(key, data, route, locale) {
  const hero = data.hero || {};
  const title =
    heroTitle(hero) ||
    hero.eyebrow ||
    hero.badge ||
    key;
  const desc = hero.description || "";
  let md = `---
locale: "${locale}"
type: "product"
key: "${key}"
route: "${route}"
---

# ${title}

${desc ? `\n${desc}\n` : ""}`;

  if (hero.eyebrow) md += `\n**Catégorie :** ${hero.eyebrow}\n`;
  if (data.features?.title || data.features?.subtitle) {
    md += `\n## Fonctionnalités\n\n${data.features.title || ""}\n${data.features.subtitle || ""}\n`;
    md += sectionItems(data.features.items, "Fonctionnalités détaillées");
  }
  if (data.benefits) {
    md += `\n## Avantages\n\n${data.benefits.title || ""}\n`;
    md += sectionItems(data.benefits.items, "Bénéfices");
  }
  if (data.modules?.items) md += sectionItems(data.modules.items, "Modules");
  if (data.useCases?.items) md += sectionItems(data.useCases.items, "Cas d'usage");
  if (data.standards?.items) md += sectionItems(data.standards.items, "Normes et standards");
  if (data.cta?.title) {
    md += `\n## Appel à l'action\n\n**${data.cta.title}**\n${data.cta.description || ""}\n`;
  }
  md += `\n**Page :** ${route}\n`;
  return md;
}

function buildSolutionMd(key, data, route, locale) {
  const hero = data.hero || {};
  const title = joinTitleParts(hero.title, hero.titleHighlight, hero.titleSuffix) || key;
  let md = `---
locale: "${locale}"
type: "solution"
key: "${key}"
route: "${route}"
---

# ${title}

${data.category ? `**Catégorie :** ${data.category}\n` : ""}
${hero.description || ""}
`;
  if (data.features) {
    md += `\n## Fonctionnalités\n\n${data.features.title || ""}\n${data.features.subtitle || ""}\n`;
    md += sectionItems(data.features.items);
  }
  if (data.benefits) {
    md += `\n## Avantages\n\n`;
    md += sectionItems(data.benefits.items);
  }
  if (data.cta?.title) {
    md += `\n## Appel à l'action\n\n**${data.cta.title}**\n${data.cta.description || ""}\n`;
  }
  md += `\n**Page :** ${route}\n`;
  return md;
}

function buildSectorMd(key, data, route, locale) {
  const name = data.name || key;
  let md = `---
locale: "${locale}"
type: "sector"
key: "${key}"
route: "${route}"
---

# ${name}

${data.heroDescription || ""}

## Vue d'ensemble

${data.overview || ""}
`;
  md += sectionItems(data.challenges, "Enjeux du secteur");
  md += sectionItems(data.solutions, "Solutions proposées");
  md += sectionItems(data.benefits, "Avantages Govern One");
  md += sectionItems(data.features, "Fonctionnalités clés");
  md += `\n**Page :** ${route}\n`;
  return md;
}

function buildHomeMd(t, locale) {
  const h = t.homePage;
  const hero = h.heroPremium || h.hero;
  let md = `---
locale: "${locale}"
type: "home"
route: "/"
---

# Govern One — Accueil

## ${joinTitleParts(hero.title?.before, hero.title?.accent) || heroTitle(hero)}

${hero.description || h.hero?.description || ""}

## Points clés

`;
  if (h.heroPremium?.trust?.items) {
    for (const item of Object.values(h.heroPremium.trust.items)) {
      md += `- ${item}\n`;
    }
  }
  if (h.quizCta) {
    md += `\n## Quiz GRC\n\n**${h.quizCta.title}**\n${h.quizCta.description}\n`;
  }
  if (h.modulesSection) {
    md += `\n## Modules\n\n${h.modulesSection.title || ""}\n${h.modulesSection.subtitle || ""}\n`;
    md += sectionItems(h.modulesSection.modules || h.modulesSection.items);
  }
  if (h.featureSections?.items) md += sectionItems(h.featureSections.items, "Sections fonctionnalités");
  if (h.standardsSection) {
    md += `\n## Standards\n\n${h.standardsSection.title || ""}\n`;
    md += sectionItems(h.standardsSection.items || h.standardsSection.standards);
  }
  md += `\n**Page :** /\n`;
  return md;
}

function buildAboutMd(t, locale) {
  const a = t.aboutPage;
  const missionTitle = joinTitleParts(
    a.mission?.titleBefore,
    a.mission?.titleHighlight,
    a.mission?.titleAfter,
  );
  const valuesTitle = joinTitleParts(
    a.values?.titleBefore,
    a.values?.titleHighlight,
    a.values?.titleAfter,
  );
  let md = `---
locale: "${locale}"
type: "about"
route: "/about"
---

# ${heroTitle(a.hero) || "À propos de Govern One"}

${a.hero?.description || ""}

## Mission

${missionTitle}
${a.mission?.description || a.mission?.description1 || ""}

`;
  md += sectionItems(a.values?.items, valuesTitle || "Valeurs");
  if (a.team) {
    md += `\n## Équipe\n\n${joinTitleParts(a.team.titleBefore, a.team.titleHighlight, a.team.titleAfter)}\n${a.team.description || ""}\n`;
    md += sectionItems(a.team.members, "Membres de l'équipe");
    if (a.team.manifestoTitle) {
      md += `\n### ${a.team.manifestoTitle}\n\n${a.team.manifestoText || ""}\n`;
    }
  }
  md += `\n**Page :** /about\n`;
  return md;
}

function buildCommercialMd(t, locale, pageKey, route, filename) {
  const page = t[`${pageKey}Page`] || t[pageKey];
  if (!page) return null;
  let md = `---
locale: "${locale}"
type: "commercial"
route: "${route}"
---

# ${heroTitle(page.hero) || pageKey}

${page.hero?.description || ""}

`;
  if (page.whatToExpect) {
    md += `\n## À quoi s'attendre\n\n${page.whatToExpect.title || ""}\n`;
    md += sectionItems(page.whatToExpect.items || page.whatToExpect.steps);
  }
  if (page.form) {
    md += `\n## Formulaire\n\n${page.form.title || ""}\n${page.form.subtitle || ""}\n`;
    md += sectionItems(page.form.fields, "Champs");
  }
  if (page.supportTeams) md += sectionItems(page.supportTeams.items, "Équipes support");
  if (page.stats) md += sectionItems(page.stats.items, "Statistiques");
  if (page.cta) {
    md += `\n## CTA\n\n**${page.cta.title || ""}**\n${page.cta.description || ""}\n`;
  }
  md += `\n**Page :** ${route}\n`;
  writeFile(`${locale}/commercial/${filename}`, md);
}

function buildPricingMd(t, locale, pricingPlans) {
  const p = t.pricing;
  let md = `---
locale: "${locale}"
type: "pricing"
route: "/quote"
---

# Tarification Govern One

${p?.subtitle || ""}

## Plans disponibles

`;
  for (const plan of pricingPlans.data || []) {
    md += `\n### ${plan.name}\n\n`;
    md += `- **Description :** ${plan.description}\n`;
    md += `- **Prix Afrique :** ${plan.priceAfrique} ${plan.currency}/mois\n`;
    md += `- **Prix Europe :** ${plan.priceEurope} ${plan.currency}/mois\n`;
    md += `- **Modules activés :**\n`;
    for (const mod of plan.modules || []) {
      if (!mod.enabled) continue;
      md += `  - ${mod.module}\n`;
      for (const feat of mod.features || []) {
        if (!feat.enabled) continue;
        const limit = feat.limit != null ? ` (limite: ${feat.limit})` : "";
        md += `    - ${feat.public_name}${limit}\n`;
      }
    }
  }

  const quote = t.chatWidget?.responses?.quote;
  if (quote) {
    md += `\n## Informations complémentaires (assistant)\n\n`;
    for (const [k, v] of Object.entries(quote)) {
      md += `- **${k}** : ${v}\n`;
    }
  }

  md += `\n**Demande de devis :** /quote\n**Assistant de devis :** /quote/wizard\n`;
  writeFile(`${locale}/commercial/pricing.md`, md);
}

function buildPartnersMd(t, locale) {
  const p = t.partnersPage;
  let md = `---
locale: "${locale}"
type: "partners"
route: "/partners"
---

# ${heroTitle(p.hero) || "Partenaires"}

${p.hero?.description || ""}

`;
  md += sectionItems(p.whyJoinUs?.items, "Pourquoi nous rejoindre");
  md += sectionItems(p.programs?.items, "Programmes");
  md += sectionItems(p.faq?.items, "FAQ partenaires");
  md += `\n**Page :** /partners\n**Programmes :** /partners/programs\n`;
  writeFile(`${locale}/partners.md`, md);
}

function buildCareersMd(t, locale) {
  const c = t.careersPage;
  let md = `---
locale: "${locale}"
type: "careers"
route: "/careers"
---

# ${heroTitle(c.hero) || "Carrières"}

${c.hero?.description || ""}

`;
  md += collectStrings(c)
    .slice(0, 80)
    .map((s) => `- ${s}`)
    .join("\n");
  md += `\n\n**Page :** /careers\n`;
  writeFile(`${locale}/careers.md`, md);
}

function buildQuizMd(t, locale) {
  const q = t.quizPage;
  let md = `---
locale: "${locale}"
type: "quiz"
route: "/quiz"
---

# ${heroTitle(q.hero) || "Quiz GRC"}

${q.hero?.description || ""}

## Description

${q.selection?.title || ""}
${q.selection?.description || ""}

**Page :** /quiz
`;
  writeFile(`${locale}/quiz.md`, md);
}

function buildResourceMd(key, data, route, locale) {
  let md = `---
locale: "${locale}"
type: "resource"
key: "${key}"
route: "${route}"
---

# ${data.badge || data.hero?.title || key}

${data.hero?.description || ""}

${data.hero?.promise ? `**En bref :** ${data.hero.promise}\n` : ""}
`;
  if (data.categories) {
    md += `\n## Catégories\n\n`;
    for (const [k, v] of Object.entries(data.categories)) {
      md += `- **${k}** : ${v}\n`;
    }
  }
  if (data.items) md += sectionItems(data.items, "Contenus");
  if (data.featured) md += sectionItems(data.featured, "À la une");
  md += `\n**Page :** ${route}\n`;
  return md;
}

function buildLegalMd(key, data, route, locale) {
  let md = `---
locale: "${locale}"
type: "legal"
key: "${key}"
route: "${route}"
---

# ${data.title || data.hero?.title || key}

${data.lastUpdated ? `**Dernière mise à jour :** ${data.lastUpdated}\n` : ""}
${data.hero?.description || data.intro || data.description || ""}

`;
  if (data.sections) md += flattenLegalSections(data.sections);
  md += sectionItems(data.items);
  md += `\n**Page :** ${route}\n`;
  return md;
}

function buildGuideDetailMd(slug, guide, locale) {
  let md = `---
locale: "${locale}"
type: "guide"
slug: "${slug}"
route: "/ressources/guides/${slug}"
---

# ${guide.title}

${guide.description || ""}

- **Niveau :** ${guide.level || ""}
- **Durée de lecture :** ${guide.readTime || ""}
${guide.tags ? `- **Tags :** ${guide.tags.join(", ")}` : ""}

`;
  if (guide.sections) {
    for (const section of Object.values(guide.sections)) {
      md += `\n## ${section.title}\n\n${section.content || ""}\n`;
    }
  }
  md += `\n**Page :** /ressources/guides/${slug}\n`;
  return md;
}

function buildDocumentationDetailMd(slug, doc, locale) {
  let md = `---
locale: "${locale}"
type: "documentation"
slug: "${slug}"
route: "/ressources/documentation/${slug}"
---

# ${doc.title}

${doc.description || ""}

${doc.content || ""}

**Page :** /ressources/documentation/${slug}
`;
  return md;
}

function buildCaseStudyMd(study, locale) {
  let md = `---
locale: "${locale}"
type: "case-study"
slug: "${study.slug}"
route: "/ressources/etudes-de-cas/${study.slug}"
---

# ${study.title}

${study.description || ""}

- **Entreprise :** ${study.company || ""}
- **Secteur :** ${study.sector || ""}
${study.results ? `- **Résultats :** ${study.results.join(", ")}` : ""}
${study.tags ? `- **Tags :** ${study.tags.join(", ")}` : ""}

**Page :** /ressources/etudes-de-cas/${study.slug}
`;
  return md;
}

function buildChatbotFaqMd(t, locale) {
  const r = t.chatWidget?.responses;
  if (!r) return;
  let md = `---
locale: "${locale}"
type: "chatbot-faq"
---

# FAQ Assistant Eynam — réponses prédéfinies

`;
  for (const [category, entries] of Object.entries(r)) {
    md += `\n## ${category}\n\n`;
    for (const [keyword, answer] of Object.entries(entries)) {
      md += `### ${keyword}\n\n${answer}\n\n`;
    }
  }
  writeFile(`${locale}/chatbot-faq.md`, md);
}

function buildFaqMd(t, locale) {
  const faq = t.faq;
  if (!faq?.items) return;
  let md = `---
locale: "${locale}"
type: "faq"
route: "/"
---

# FAQ Govern One

${faq.title || ""}
${faq.subtitle || ""}

`;
  md += sectionItems(faq.items, "Questions fréquentes");
  writeFile(`${locale}/faq.md`, md);
}

function buildNavigationMd(t, locale) {
  const h = t.header;
  let md = `---
locale: "${locale}"
type: "navigation"
---

# Navigation du site Govern One

## Produits

`;
  for (const item of h.productsMenu?.items || []) {
    md += `- ${item.title || item.label || collectStrings(item)[0] || ""}\n`;
  }
  md += `\n## Solutions\n\n`;
  for (const cat of h.solutionsMenu?.categories || []) {
    md += `\n### ${cat.title || cat.label || ""}\n\n`;
    for (const item of cat.items || []) {
      md += `- ${item.title || ""} : ${item.description || ""}\n`;
    }
  }
  md += `\n## Secteurs\n\n`;
  for (const [k, v] of Object.entries(h.sectorsMenu || {})) {
    if (typeof v === "string") md += `- **${k}** : ${v}\n`;
  }
  md += `\n## Ressources\n\n`;
  for (const [k, v] of Object.entries(h.resourcesMenu || {})) {
    if (typeof v === "string") md += `- **${k}** : ${v}\n`;
  }
  writeFile(`${locale}/navigation.md`, md);
}

function buildProductsOverview(t, locale) {
  const menu = t.header?.productsMenu;
  let md = `---
locale: "${locale}"
type: "products-overview"
route: "/#products"
---

# Produits Govern One

${menu?.description || ""}

`;
  for (const item of menu?.items || []) {
    md += `- **${item.title || ""}** : ${item.description || ""}\n`;
  }
  md += `\n## Résumé chatbot\n\n${t.chatWidget?.responses?.products?.produits || ""}\n`;
  writeFile(`${locale}/products/overview.md`, md);
}

function buildSectorsOverview(t, locale) {
  let md = `---
locale: "${locale}"
type: "sectors-overview"
route: "/#domains"
---

# Secteurs d'activité

${t.chatWidget?.responses?.sectors?.secteur || ""}

`;
  for (const [key, route] of Object.entries(SECTOR_ROUTES)) {
    const data = t.sectorPages?.[key];
    if (data?.name) md += `- **${data.name}** : ${route}\n`;
  }
  writeFile(`${locale}/sectors/overview.md`, md);
}

function buildSolutionsOverview(t, locale) {
  let md = `---
locale: "${locale}"
type: "solutions-overview"
---

# Solutions Govern One

`;
  for (const [key, route] of Object.entries(SOLUTION_ROUTES)) {
    const data = t.solutionPages?.[key];
    const title = joinTitleParts(data?.hero?.title, data?.hero?.titleHighlight) || key;
    md += `- **${title}** (${data?.category || ""}) : ${route}\n`;
  }
  writeFile(`${locale}/solutions/overview.md`, md);
}

function generateLocale(locale) {
  const t = loadJson(`src/i18n/locales/${locale}.json`);
  const pricingPlans = loadJson("public/pricing-plans.json");

  writeFile(`${locale}/home.md`, buildHomeMd(t, locale));
  writeFile(`${locale}/about.md`, buildAboutMd(t, locale));
  buildProductsOverview(t, locale);
  buildSectorsOverview(t, locale);
  buildSolutionsOverview(t, locale);
  buildFaqMd(t, locale);
  buildChatbotFaqMd(t, locale);
  buildNavigationMd(t, locale);

  buildCommercialMd(t, locale, "demo", "/demo", "demo.md");
  buildCommercialMd(t, locale, "quote", "/quote", "quote.md");
  buildCommercialMd(t, locale, "support", "/support", "support.md");
  buildPricingMd(t, locale, pricingPlans);
  buildPartnersMd(t, locale);
  buildCareersMd(t, locale);
  buildQuizMd(t, locale);

  for (const [key, route] of Object.entries(PRODUCT_ROUTES)) {
    const data = t.productsPages?.[key];
    if (!data) continue;
    const filename =
      key === "governAI"
        ? "govern-ai.md"
        : `products/${camelToKebab(key)}.md`;
    writeFile(`${locale}/${filename}`, buildProductMd(key, data, route, locale));
  }

  for (const [key, route] of Object.entries(SOLUTION_ROUTES)) {
    const data = t.solutionPages?.[key];
    if (!data || key === "common") continue;
    const filename = SOLUTION_FILENAMES[key] || camelToKebab(key);
    writeFile(
      `${locale}/solutions/${filename}.md`,
      buildSolutionMd(key, data, route, locale),
    );
  }

  const guides = t.resourcesPages?.guides?.guides;
  if (guides) {
    for (const [slug, guide] of Object.entries(guides)) {
      writeFile(
        `${locale}/resources/guides/${slug}.md`,
        buildGuideDetailMd(slug, guide, locale),
      );
    }
  }

  const docs = t.resourcesPages?.documentation?.details;
  if (docs) {
    for (const [slug, doc] of Object.entries(docs)) {
      writeFile(
        `${locale}/resources/documentation/${slug}.md`,
        buildDocumentationDetailMd(slug, doc, locale),
      );
    }
  }

  const caseStudies = t.resourcesPages?.caseStudies?.caseStudies;
  if (Array.isArray(caseStudies)) {
    for (const study of caseStudies) {
      if (!study.slug) continue;
      writeFile(
        `${locale}/resources/case-studies/${study.slug}.md`,
        buildCaseStudyMd(study, locale),
      );
    }
  }

  const webinars = t.resourcesPages?.webinars?.webinars;
  if (Array.isArray(webinars)) {
    let webinarsMd = `---
locale: "${locale}"
type: "webinars-list"
route: "/ressources/webinaires"
---

# Webinaires Govern One

${t.resourcesPages?.webinars?.hero?.description || ""}

`;
    for (const w of webinars) {
      webinarsMd += `\n## ${w.title}\n\n${w.description || ""}\n`;
      if (w.date) webinarsMd += `- **Date :** ${w.date}\n`;
      if (w.duration) webinarsMd += `- **Durée :** ${w.duration}\n`;
      if (w.speaker) webinarsMd += `- **Intervenant :** ${w.speaker}\n`;
    }
    writeFile(`${locale}/resources/webinars-list.md`, webinarsMd);
  }

  const whitepapers = t.resourcesPages?.whitepapers?.whitepapers;
  if (Array.isArray(whitepapers)) {
    let wpMd = `---
locale: "${locale}"
type: "whitepapers-list"
route: "/ressources/livres-blancs"
---

# Livres blancs

${t.resourcesPages?.whitepapers?.hero?.description || ""}

`;
    for (const w of whitepapers) {
      wpMd += `\n## ${w.title}\n\n${w.description || ""}\n`;
      if (w.readTime) wpMd += `- **Lecture :** ${w.readTime}\n`;
      if (w.tags) wpMd += `- **Tags :** ${w.tags.join(", ")}\n`;
    }
    writeFile(`${locale}/resources/whitepapers-list.md`, wpMd);
  }

  for (const [key, route] of Object.entries(SECTOR_ROUTES)) {
    const data = t.sectorPages?.[key];
    if (!data) continue;
    writeFile(
      `${locale}/sectors/${camelToKebab(key)}.md`,
      buildSectorMd(key, data, route, locale),
    );
  }

  for (const [key, route] of Object.entries(RESOURCE_ROUTES)) {
    const data = t.resourcesPages?.[key];
    if (!data) continue;
    writeFile(
      `${locale}/resources/${camelToKebab(key)}.md`,
      buildResourceMd(key, data, route, locale),
    );
  }

  for (const [key, route] of Object.entries(LEGAL_ROUTES)) {
    const data = t.legalPages?.[key];
    if (!data) continue;
    writeFile(
      `${locale}/legal/${camelToKebab(key)}.md`,
      buildLegalMd(key, data, route, locale),
    );
  }

  // Ressources overview
  const rp = t.resourcesPages;
  let resourcesOverview = `---
locale: "${locale}"
type: "resources-overview"
---

# Ressources Govern One

${t.chatWidget?.responses?.resources?.ressources || ""}

`;
  for (const [key, route] of Object.entries(RESOURCE_ROUTES)) {
    const data = rp?.[key];
    resourcesOverview += `- **${data?.hero?.title || data?.badge || key}** : ${route}\n`;
  }
  writeFile(`${locale}/resources/overview.md`, resourcesOverview);
}

function countMdFiles(dir) {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) count += countMdFiles(p);
    else if (entry.name.endsWith(".md")) count += 1;
  }
  return count;
}

console.log("Generating content from govern-landing...");
ensureDir(CONTENT);
generateLocale("fr");
generateLocale("en");
const frCount = countMdFiles(path.join(CONTENT, "fr"));
const enCount = countMdFiles(path.join(CONTENT, "en"));
console.log(`Done: ${frCount} FR files, ${enCount} EN files`);
