# Plan en phases — Chatbot IA Govern One

> **Document de suivi principal :** [GUIDE_INTEGRATION.md](./GUIDE_INTEGRATION.md)  
> Ce fichier complète le guide avec les détails techniques (fichiers à copier depuis Portfolio).

## Phase 0 — Cadrage ✅

**Objectif :** poser les bases du projet sans coder l'API.

**Livrables :**
- [x] Repo `govern-chatbot` créé
- [x] Documentation (phases, décisions, inventaire contenu, intégration)
- [x] Structure de dossiers `content/fr/` et `content/en/`
- [x] 109 fichiers markdown FR + EN (`npm run content:generate`)
- [x] `.env.example` avec variables backend
- [ ] Clé Gemini obtenue (action manuelle)
- [ ] Repo GitHub créé et poussé (action manuelle)

---

## Phase 1 — Backend MVP (baseline) ✅

**Objectif :** API `/api/chat` fonctionnelle sans RAG.

**Implémenté :**
- [x] Next.js 16 + routes `/api/chat` et `/api/health`
- [x] Gemini (`gemini-3.6-flash`) — streaming + JSON
- [x] System prompt Eynam + garde-fous
- [x] Chargement `content/{locale}/` (mode baseline)
- [x] Rate limit, CORS, validation Zod
- [x] `npm run build` OK

**Reste (manuel) :**
- [ ] Créer `.env` avec `GEMINI_API_KEYS` et `FRONTEND_URL`
- [ ] Tester en local : `npm run dev` puis curl
- [ ] Déployer sur Vercel

---

## Phase 2 — Intégration govern-landing ✅

**Objectif :** connecter le widget existant à l'API.

**Implémenté dans govern-landing :**
- [x] `src/lib/chat/config.js`, `client.js`, `types.js`
- [x] `ChatWidget.jsx` — streaming API + fallback `findAnswer()`
- [x] i18n, quick questions, `injectPageLinks` conservés

---

## Phase 5 — Production

**→ Guide complet : [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)**

- [ ] Repo GitHub `govern-chatbot` poussé
- [ ] Import Vercel + variables env (Gemini, CORS, Supabase)
- [ ] Deploy backend → `https://govern-chatbot.vercel.app`
- [ ] `npm run test:prod` OK
- [ ] `CHAT_API_URL` prod vérifiée dans govern-landing
- [ ] Redéployer govern-landing
- [ ] Test CORS depuis `www.govern-one.com`
- [ ] Test FR + EN + fallback (backend down)

## Phase 3 — RAG (Supabase) ✅

**Objectif :** réponses précises via recherche sémantique.

**Implémenté :**
- [x] `lib/rag/` (embed, retrieve, chunk, prompt, config)
- [x] `lib/supabase.ts`
- [x] `supabase/schema.sql`
- [x] `scripts/ingest.ts` + `scripts/test-supabase.ts`
- [x] Route `/api/chat` — auto RAG si Supabase + chunks, sinon baseline
- [x] Header `X-Chat-Mode: rag|baseline`

**Workflow (manuel) :**
```bash
# 1. Exécuter supabase/schema.sql dans Supabase SQL Editor
#    (table govern_document_chunks — coexiste avec Portfolio sur le même projet)
# 2. Copier SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (ex. depuis Portfolio)
npm run test:supabase
npm run ingest   # après chaque mise à jour du contenu
# 3. Optionnel : supabase/indexes-after-ingest.sql pour accélérer la recherche
```

---

## Phase 4 — Garde-fous & UX ✅

- [x] Garde-fous tarifs / contacts inventés (sanitisation post-réponse)
- [x] Blocage jailbreak / prompt injection
- [x] Rendu markdown dans `/test` (**gras**, liens)
- [x] Curseur streaming
- [x] Affichage mode baseline / RAG dans le playground
- [x] Messages d'erreur 429 / 503 localisés

---

## Phase 5 — Production

**→ [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)** — guide pas à pas

### govern-chatbot (Vercel)
- [ ] Variables env configurées (Gemini, FRONTEND_URL, Supabase)
- [ ] Deploy OK sur `govern-chatbot.vercel.app`
- [ ] `npm run test:prod` OK
- [ ] RAG actif (`/api/health` → `chatMode: rag`)

### govern-landing
- [ ] `CHAT_API_URL` prod dans `config.js` (déjà `govern-chatbot.vercel.app`)
- [ ] Deploy landing
