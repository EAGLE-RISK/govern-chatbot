# Guide d'intégration — Chatbot IA Govern One

Document de suivi pour connecter **govern-landing** au backend **govern-chatbot**.
Modèle inspiré du projet [Portfolio](../Portfolio) (landing + backend séparés).

---

## Vue d'ensemble

```
┌─────────────────────────┐         POST /api/chat          ┌─────────────────────────┐
│   govern-landing        │  ───────────────────────────►   │   govern-chatbot        │
│   (Vite + React)        │   locale + messages[]           │   (Next.js + Vercel)    │
│                         │   Accept: text/plain            │                         │
│   ChatWidget.jsx        │ ◄── streaming texte ──────────  │   Gemini + content/     │
│   URL API hardcodée     │                                 │   (+ RAG Supabase)      │
└─────────────────────────┘                                 └─────────────────────────┘
```

| Élément | Valeur |
|---------|--------|
| Assistant | **Eynam** |
| Langues | FR / EN |
| Clés API | **Backend uniquement** (jamais dans le landing) |
| URL landing → API | Hardcodée dans `govern-landing/src/lib/chat/config.js` |
| Port dev backend | `1337` |
| Port dev landing | `5173` |

---

## Tableau de bord

| Phase | Nom | Projet | Statut |
|-------|-----|--------|--------|
| **0** | Cadrage | govern-chatbot | ✅ Fait |
| **1** | Backend MVP | govern-chatbot | ✅ Fait (code) — deploy + clé Gemini à faire |
| **2** | Connexion widget | govern-landing | ✅ Fait |
| **3** | RAG Supabase | govern-chatbot | ✅ Fait |
| **4** | Garde-fous & UX | les deux | ✅ Fait |
| **5** | Mise en production | les deux | ⏳ [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md) |

> Mettre à jour la colonne **Statut** au fur et à mesure.

---

## Phase 0 — Cadrage

**But :** préparer le projet backend et la base de connaissances, sans API.

**Projet :** `govern-chatbot` uniquement

### Actions réalisées
- [x] Repo créé + structure `content/fr/` et `content/en/`
- [x] 109 fichiers markdown FR + 109 EN (générés depuis govern-landing)
- [x] Script `npm run content:generate`
- [x] Documentation (ce guide, décisions, inventaire)

### Actions manuelles restantes
- [ ] Obtenir une clé **Gemini** → [Google AI Studio](https://aistudio.google.com/apikey)
- [ ] Créer le repo GitHub et pousser le code

### Validation
Phase 0 terminée quand le repo est versionné et la clé Gemini est prête pour la Phase 1.

---

## Phase 1 — Backend MVP (baseline)

**But :** une API `/api/chat` qui répond en streaming, sans RAG.

**Projet :** `govern-chatbot`

### Ce qu'on fait
1. Initialiser Next.js (App Router) si pas encore fait
2. Copier/adapter depuis `Portfolio/backend/` :
   - `app/api/chat/route.ts`
   - `lib/gemini/`, `lib/chat/`, `lib/content/`, `lib/rateLimit.ts`, `lib/api.ts`
3. Écrire le **system prompt Eynam** (Govern One, pas d'invention de prix)
4. Charger tout le markdown `content/{locale}/` dans le prompt (mode baseline)
5. Configurer CORS : `FRONTEND_URL=https://www.govern-one.com`
6. Déployer sur Vercel

### Variables d'environnement (backend)
```env
GEMINI_API_KEYS=cle1,cle2,cle3,cle4
FRONTEND_URL=https://www.govern-one.com
```

### Commandes
```bash
cd govern-chatbot
cp .env.example .env    # remplir les clés
npm install
npm run dev             # → http://localhost:1337
```

### Test local
```bash
curl -X POST http://localhost:1337/api/chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/plain" \
  -d "{\"locale\":\"fr\",\"messages\":[{\"role\":\"user\",\"content\":\"Quels sont vos produits ?\"}]}"
```

### Checklist
- [x] `POST /api/chat` implémenté (streaming + JSON)
- [x] Header `X-Chat-Mode: baseline`
- [x] Rate limit actif (20 req / 15 min / IP)
- [x] CORS configuré (`FRONTEND_URL` + localhost:5173)
- [x] System prompt **Eynam** + garde-fous tarifs
- [x] Chargement markdown `content/{locale}/` (priorité + limite 400k chars)
- [x] `GET /api/health` — statut service
- [x] `npm run build` OK
- [ ] `.env` local avec `GEMINI_API_KEYS`
- [ ] Test curl avec réponse Gemini
- [ ] Backend déployé sur Vercel (noter l'URL finale)

### Validation
Phase 1 terminée quand l'API prod répond à un `curl` avec une réponse cohérente sur Govern One.

---

## Phase 2 — Connexion du widget landing

**But :** remplacer le bot rule-based par l'API IA, avec fallback si erreur.

**Projet :** `govern-landing`

### Ce qu'on fait
1. Créer `src/lib/chat/config.js` — URL API hardcodée (dev + prod)
2. Créer `src/lib/chat/client.js` — `streamChatMessage(locale, messages, onDelta)`
3. Modifier `src/components/ChatWidget.jsx` :
   - Appel API en priorité
   - Streaming token par token
   - Fallback → `findAnswer()` si API indisponible
   - Conserver i18n, quick questions, `injectPageLinks()`

### Fichiers à créer/modifier
```
govern-landing/
├── src/lib/chat/config.js      ← NOUVEAU
├── src/lib/chat/client.js      ← NOUVEAU
└── src/components/ChatWidget.jsx  ← MODIFIER
```

### Exemple `config.js`
```javascript
const isDev = import.meta.env.DEV;

export const CHAT_API_URL = isDev
  ? 'http://localhost:1337/api/chat'
  : 'https://govern-chatbot.vercel.app/api/chat';  // URL Vercel Phase 1
```

### Pas de variable d'env sur le landing
L'URL prod se met à jour **une seule fois** dans `config.js` après le deploy Vercel.

### Test local
1. Backend sur `:1337`, landing sur `:5173`
2. Ouvrir le widget → poser une question
3. DevTools → Network → `POST /api/chat` visible
4. Réponse streamée dans la bulle Eynam

### Checklist
- [ ] Streaming visible dans le widget
- [ ] Locale FR/EN transmise à l'API
- [ ] Fallback rule-based fonctionne (couper le backend pour tester)
- [ ] Liens internes toujours cliquables

### Validation
Phase 2 terminée quand un visiteur sur le landing reçoit une réponse IA streamée en conditions réelles (local ou prod).

---

## Phase 3 — RAG (recherche sémantique)

**But :** ne plus envoyer tout le contenu à chaque requête — seulement les passages pertinents.

**Projet :** `govern-chatbot`

### Ce qu'on fait
1. Créer un projet **Supabase** + exécuter `supabase/schema.sql`
2. Ajouter `lib/rag/`, `lib/supabase.ts`, `scripts/ingest.ts`
3. Indexer `content/` → vecteurs pgvector
4. Adapter `/api/chat` : RAG si Supabase configuré, sinon baseline

### Variables d'environnement (ajout)
```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Commandes
```bash
npm run ingest          # après chaque npm run content:generate
npm run test:supabase   # vérifier la connexion
```

### Workflow contenu
```
Modification govern-landing (i18n)
  → npm run content:generate   (dans govern-chatbot)
  → npm run ingest
```

### Checklist
- [ ] Supabase configuré
- [ ] `npm run ingest` OK (chunks indexés)
- [ ] Header `X-Chat-Mode: rag` sur les réponses
- [ ] Réponses plus précises sur questions spécifiques (vs baseline)

### Validation
Phase 3 terminée quand l'API répond en mode `rag` et les réponses ciblent le bon contenu (ex. un secteur, un plan tarifaire).

---

## Phase 4 — Garde-fous & UX

**But :** sécuriser les réponses et polir l'expérience utilisateur.

**Projets :** `govern-chatbot` + `govern-landing`

### Backend (govern-chatbot)
- [ ] Garde-fous tarifs : ne pas inventer de prix → orienter vers `/quote`
- [ ] Refus poli des sujets hors Govern One
- [ ] Sanitisation des réponses (post-génération)
- [ ] System prompt renforcé (Eynam, ton B2B GRC)

### Frontend (govern-landing)
- [ ] Rendu markdown basique (**gras**, liens)
- [ ] Curseur clignotant pendant le stream
- [ ] Gestion erreurs 429 / 503 (messages utilisateur clairs)
- [ ] Questions rapides alignées (démo, devis, produits)

### Validation
Phase 4 terminée quand les tests manuels ne produisent ni prix inventés, ni réponses hors sujet grossières, et l'UX streaming est fluide.

---

## Phase 5 — Mise en production

**Guide détaillé : [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)**

### govern-chatbot (Vercel)
- [ ] Variables env configurées (Gemini, FRONTEND_URL, Supabase)
- [ ] Deploy OK
- [ ] `npm run test:prod` OK

### govern-landing
- [x] `CHAT_API_URL` prod dans `config.js` (`govern-chatbot.vercel.app`)
- [ ] Deploy landing

### Tests finaux
| Test | Attendu |
|------|---------|
| Widget sur `www.govern-one.com` | Réponse IA streamée |
| Langue EN | Réponse en anglais |
| CORS | Pas d'erreur console |
| Backend down | Fallback rule-based actif |
| Question tarifs | Orientation devis, pas de chiffres inventés |
| DevTools | `X-Chat-Mode: rag` (si Phase 3 faite) |

### Validation
Phase 5 terminée quand le chatbot IA est live sur le site prod avec fallback testé.

---

## Référence rapide — qui fait quoi

| Sujet | govern-chatbot | govern-landing |
|-------|----------------|----------------|
| Clé Gemini | ✅ | ❌ |
| Contenu markdown | ✅ `content/` | ❌ (source i18n) |
| API `/api/chat` | ✅ | ❌ |
| Widget UI | ❌ | ✅ `ChatWidget.jsx` |
| URL de l'API | ❌ | ✅ hardcodée `config.js` |
| CORS | ✅ `FRONTEND_URL` | ❌ |
| Fallback rule-based | ❌ | ✅ `chatbotData.js` |
| RAG / Supabase | ✅ | ❌ |

---

## Commandes utiles (récap)

```bash
# govern-chatbot — regénérer le contenu depuis le landing
npm run content:generate

# govern-chatbot — indexer pour RAG (Phase 3+)
npm run ingest

# govern-chatbot — dev local
npm run dev

# govern-landing — dev local
npm run dev
```

---

## Documents complémentaires

| Document | Contenu |
|----------|---------|
| **[DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)** | **Mise en production Vercel (à suivre maintenant)** |
| [DECISIONS.md](./DECISIONS.md) | Choix architecture (Gemini, Eynam, URL hardcodée…) |
| [CONTENT_INVENTORY.md](./CONTENT_INVENTORY.md) | Liste des 109 fichiers markdown par locale |
| [INTEGRATION.md](./INTEGRATION.md) | Détails techniques requête/réponse, CORS, fallback |
| [PHASES.md](./PHASES.md) | Notes techniques par phase (fichiers à copier depuis Portfolio) |

---

## Ordre strict à respecter

```
Phase 0 → Phase 1 → [Validation locale] → Phase 2 (landing) → Phase 3 → 4 → 5
```

**Ne connecter govern-landing qu'après validation ici.**

### Validation locale (avant Phase 2)

1. `.env` avec `GEMINI_API_KEYS`
2. `npm run dev` → **http://localhost:1337/test** (playground Eynam)
3. Tester FR/EN, streaming, questions rapides
4. `npm run test:chat` — smoke test CLI
5. `npm run build` OK
6. (Optionnel) Deploy Vercel + `npm run test:chat https://votre-url.vercel.app`
