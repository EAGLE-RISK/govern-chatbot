# Décisions de cadrage — Phase 0

Date : 17 août 2026

## Architecture retenue

| Décision | Choix | Justification |
|----------|-------|---------------|
| Séparation frontend / backend | **2 repos** (`govern-landing` + `govern-chatbot`) | Même pattern que Portfolio : clés API protégées, déploiement indépendant |
| Framework backend | **Next.js App Router** (API route `/api/chat`) | Déjà éprouvé dans Portfolio, deploy Vercel serverless |
| Provider IA | **Google Gemini** (`gemini-3.6-flash`) | Même stack que Portfolio, coût/perf adapté au chat |
| RAG | **Supabase pgvector** (Phase 3) | Fallback baseline (markdown complet) si Supabase absent |
| Supabase partagé | **Table `govern_document_chunks`** + RPC `match_govern_documents` | Même projet que Portfolio possible sans conflit avec `document_chunks` |
| Nom de l'assistant | **Eynam** | Déjà utilisé dans le widget govern-landing |
| Langues | **FR + EN** | Aligné sur i18n du landing (`react-i18next`) |
| Config landing | **URL hardcodée** dans le code | Pas de `VITE_*` env var sur govern-landing (demande explicite) |
| Port dev backend | **1337** | Cohérent avec Portfolio |

## Ce qu'on ne fait PAS

- Pas de CMS / admin dans govern-chatbot (contrairement au backend Portfolio complet)
- Pas d'IA côté frontend (tous les appels passent par l'API)
- Pas de variables d'environnement chatbot sur govern-landing
- Pas de remplacement brutal du bot rule-based : **fallback** en Phase 2 si l'API est down

## Garde-fous prévus (Phase 4)

Adaptés au contexte B2B GRC Govern One :

- Ne pas inventer de prix, plans ou fonctionnalités
- Orienter vers `/demo`, `/quote`, `/support` pour les demandes commerciales
- Refuser poliment les sujets hors Govern One (GRC, conformité, gouvernance)
- Rate limit : 20 requêtes / 15 min / IP (comme Portfolio)
- Validation : max 20 messages, 2000 caractères / message

## URLs de référence

| Environnement | Landing | Backend chat |
|---------------|---------|--------------|
| Production | `https://www.govern-one.com` | `https://govern-chatbot.vercel.app` (à confirmer au deploy) |
| Dev local | `http://localhost:5173` | `http://localhost:1337` |

## Prochaine étape

→ **Phase 1** : implémenter `/api/chat` en mode baseline (Gemini + markdown `content/`)
