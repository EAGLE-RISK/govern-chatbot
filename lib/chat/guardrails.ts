import type { Locale } from "@/lib/types";

const pricingRefusal = {
  fr: "Pour un tarif exact adapté à votre organisation, je vous invite à demander un devis sur la page Demande de Devis ou à planifier une démo sur la page Démonstration. Notre équipe analysera vos besoins et vous proposera l'offre la plus adaptée.",
  en: "For an exact price tailored to your organization, please request a quote on the Quote Request page or schedule a demo on the Demo page. Our team will review your needs and recommend the best plan.",
} as const;

const inventedPricePattern =
  /\b(\d{1,3}(?:[\s.,]\d{3})*(?:[.,]\d+)?)\s*(€|EUR|euros?|USD|\$)\s*(?:\/\s*mois|par mois|per month|\/month|\/an|par an|per year)?/gi;

const inventedContactPattern =
  /\b[\w.+-]+@(?!govern-one\.com|govern\.one)[\w.-]+\.\w{2,}\b|\b(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{0,4}\b/g;

const pricingQuestionPattern =
  /\b(prix|tarif|tarifs|coût|cout|combien|devis|pricing|price|prices|cost|how much|quote|subscription|abonnement|plan tarifaire)\b/i;

export function isPricingQuestion(message: string): boolean {
  return pricingQuestionPattern.test(message);
}

export function sanitizeAssistantReply(content: string, locale: Locale): string {
  let trimmed = content.trim();
  if (!trimmed) return trimmed;

  const priceMatches = [...trimmed.matchAll(inventedPricePattern)];
  const hasSpecificPrices = priceMatches.length > 0;
  const mentionsQuotePage =
    trimmed.includes("/quote") || trimmed.includes("Demande de Devis");

  if (hasSpecificPrices && !mentionsQuotePage) {
    trimmed = `${trimmed}\n\n${pricingRefusal[locale]}`;
  }

  const contactMatches = trimmed.match(inventedContactPattern);
  if (contactMatches && contactMatches.length > 0) {
    const supportHint =
      locale === "fr"
        ? "Pour nous contacter, utilisez la page Support ou planifiez une démo sur la page Démonstration."
        : "To contact us, use the Support page or schedule a demo on the Demo page.";
    if (!trimmed.includes("Support") && !trimmed.includes("Démonstration")) {
      trimmed = `${trimmed}\n\n${supportHint}`;
    }
  }

  return trimmed;
}

export function isBlockedQuestion(message: string): boolean {
  return /ignore (all )?previous instructions|jailbreak|system prompt|donne moi ta clé api|reveal your (system )?prompt|ignore tes règles|oublie tes instructions/i.test(
    message,
  );
}

export function getBlockedReply(locale: Locale): string {
  return locale === "fr"
    ? "Je suis Eynam, assistant Govern One. Comment puis-je vous aider sur nos solutions de gouvernance, risques et conformité ?"
    : "I'm Eynam, Govern One's assistant. How can I help you with our governance, risk, and compliance solutions?";
}
