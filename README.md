# Govern Chatbot — Backend IA pour Govern One

API de chatbot IA (Gemini + RAG) pour le site [govern-landing](https://github.com/.../govern-landing).
Inspiré de l'architecture du projet Portfolio (backend Next.js séparé du frontend).

## Architecture

```
govern-landing (Vite + React)     govern-chatbot (Next.js sur Vercel)
├── ChatWidget.jsx           ──►  ├── POST /api/chat
├── src/lib/chat/config.js        ├── Gemini (gemini-3.6-flash)
│   (URL hardcodée, pas d'env)    ├── Supabase pgvector (RAG)
└── i18n fr/en                    └── content/fr/ + content/en/
```

## Statut du projet

| Phase | Statut | Description |
|-------|--------|-------------|
| **0 — Cadrage** | ✅ Fait | Repo, docs, 109×2 fichiers contenu |
| **1 — Backend MVP** | ✅ Fait | API `/api/chat` baseline |
| **2 — Intégration landing** | ✅ Fait | Widget streaming + fallback rule-based |
| **3 — RAG** | ✅ Fait | Supabase + ingest (3104 chunks) |
| **4 — Garde-fous & UX** | ✅ Fait | Playground `/test`, liens, garde-fous |
| **5 — Production** | ⏳ À faire | **Deploy Vercel** → [guide](./docs/DEPLOY_VERCEL.md) |

## Déploiement Vercel

**→ [docs/DEPLOY_VERCEL.md](./docs/DEPLOY_VERCEL.md)** — guide pas à pas (env vars, tests, landing)

Résumé :

1. Pousser le repo sur GitHub
2. Importer sur Vercel (Next.js, root `.`)
3. Configurer les variables d'env (Gemini, CORS, Supabase)
4. Deploy → `https://govern-chatbot.vercel.app`
5. `npm run test:prod`
6. Redéployer govern-landing avec `CHAT_API_URL` prod

## Développement local

```bash
cd govern-chatbot
cp .env.example .env   # remplir GEMINI_API_KEYS, FRONTEND_URL, Supabase
npm install
npm run dev            # port 1337 → http://localhost:1337/test
```

## Variables d'environnement (backend uniquement)

Le **landing n'a pas de variables d'env** pour le chatbot. L'URL de l'API est hardcodée dans `govern-landing/src/lib/chat/config.js`.

| Variable | Obligatoire | Notes |
|----------|-------------|-------|
| `GEMINI_API_KEYS` | Oui | Clés séparées par des virgules |
| `FRONTEND_URL` | Oui | CORS — `https://www.govern-one.com` |
| `NEXT_PUBLIC_LANDING_URL` | Oui | Liens dans `/test` |
| `SUPABASE_URL` | Prod RAG | Même projet que l'ingest local |
| `SUPABASE_SERVICE_ROLE_KEY` | Prod RAG | Service role |
| `FRONTEND_URLS` | Optionnel | Previews Vercel du landing |

## Tests

```bash
npm run test:chat      # local :1337
npm run test:cors      # CORS local
npm run test:prod      # smoke test prod (après deploy)
npm run test:supabase
npm run test:gemini-keys
```

## Documentation

- **[Déploiement Vercel](./docs/DEPLOY_VERCEL.md)** — mise en production
- **[Guide d'intégration](./docs/GUIDE_INTEGRATION.md)** — suivi phase par phase
- [Plan en phases](./docs/PHASES.md)
- [Intégration technique](./docs/INTEGRATION.md)
- [Décisions de cadrage](./docs/DECISIONS.md)

## Contenu (base de connaissances)

Généré automatiquement depuis `govern-landing` :

```bash
npm run content:generate
npm run ingest   # indexer dans Supabase (local)
```

## Assistant

**Eynam** — assistant virtuel Govern One.
