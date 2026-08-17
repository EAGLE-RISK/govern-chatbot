# Déploiement Vercel — govern-chatbot

Guide pas à pas pour mettre en production l'API Eynam et brancher **govern-landing**.

---

## Vue d'ensemble

| Projet | Rôle | URL prod attendue |
|--------|------|-------------------|
| **govern-chatbot** | API Gemini + RAG | `https://govern-chatbot.vercel.app` |
| **govern-landing** | Widget Eynam | `https://www.govern-one.com` |

Le landing appelle l'API via une URL **hardcodée** dans `govern-landing/src/lib/chat/config.js` (pas de variable d'env côté landing).

---

## Prérequis

- [ ] Compte [Vercel](https://vercel.com) (plan **Pro** recommandé — timeout 60 s pour `/api/chat` avec RAG)
- [ ] Repo GitHub `govern-chatbot` poussé (branche `main` ou `master`)
- [ ] Clés **Gemini** (`GEMINI_API_KEYS`, 1 à 4+ clés séparées par des virgules)
- [ ] Projet **Supabase** configuré + `npm run ingest` déjà exécuté en local (3104 chunks)
- [ ] `npm run build` OK en local

---

## Étape 1 — Pousser le code sur GitHub

```bash
cd govern-chatbot
git add .
git commit -m "feat: backend Eynam prêt pour Vercel"
git remote add origin https://github.com/VOTRE_ORG/govern-chatbot.git
git push -u origin master   # ou main
```

---

## Étape 2 — Importer le projet sur Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository**
2. Sélectionner le repo **govern-chatbot**
3. Framework : **Next.js** (détecté automatiquement)
4. Root Directory : `.` (racine du repo)
5. Build Command : `npm run build` (déjà dans `vercel.json`)
6. **Ne pas** ajouter de variable d'env pour l'instant — on les configure à l'étape 3

---

## Étape 3 — Variables d'environnement Vercel

Dans **Project Settings → Environment Variables**, ajouter pour **Production** (et Preview si vous testez depuis une preview du landing) :

| Variable | Obligatoire | Exemple | Notes |
|----------|-------------|---------|-------|
| `GEMINI_API_KEYS` | ✅ | `cle1,cle2,cle3,cle4` | Clés Google AI Studio, séparées par des virgules |
| `FRONTEND_URL` | ✅ | `https://www.govern-one.com` | Origine CORS principale |
| `NEXT_PUBLIC_LANDING_URL` | ✅ | `https://www.govern-one.com` | Liens cliquables dans `/test` |
| `SUPABASE_URL` | ✅ (RAG) | `https://xxx.supabase.co` | Même projet que l'ingest local |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ (RAG) | `eyJ...` | Clé **service role** (jamais côté landing) |
| `FRONTEND_URLS` | Optionnel | `https://govern-landing-xxx.vercel.app` | Origines CORS supplémentaires (previews Vercel) |

Variables optionnelles :

| Variable | Défaut |
|----------|--------|
| `GEMINI_CHAT_MODEL` | `gemini-3.6-flash` |

> **CORS** : `https://www.govern-one.com` et `https://govern-one.com` sont autorisés automatiquement. Les previews landing passent par `FRONTEND_URLS`.

---

## Étape 4 — Premier déploiement

1. Cliquer **Deploy**
2. Attendre la fin du build (~1–2 min)
3. Noter l'URL Vercel : ex. `https://govern-chatbot.vercel.app`

Si vous souhaitez un nom de projet fixe, renommez le projet Vercel en **govern-chatbot** pour obtenir exactement `govern-chatbot.vercel.app`.

---

## Étape 5 — Vérifications post-deploy

Depuis votre machine (avec les clés déjà sur Vercel, pas besoin de `.env` local) :

```bash
cd govern-chatbot

# Santé du service (gemini: true, rag.chunks > 0)
node scripts/test-chat.mjs https://govern-chatbot.vercel.app

# CORS depuis le domaine prod du landing
node scripts/test-cors.mjs https://govern-chatbot.vercel.app https://www.govern-one.com
node scripts/test-cors.mjs https://govern-chatbot.vercel.app https://govern-one.com
```

**Attendu pour `/api/health` :**

```json
{
  "service": "govern-chatbot",
  "status": "ok",
  "gemini": true,
  "supabase": true,
  "rag": { "enabled": true, "chunks": 3104 },
  "chatMode": "rag"
}
```

**Playground** : ouvrir `https://govern-chatbot.vercel.app/test` et tester FR/EN.

---

## Étape 6 — govern-landing (URL prod)

Vérifier que l'URL dans le landing correspond au déploiement Vercel :

```javascript
// govern-landing/src/lib/chat/config.js
export const CHAT_API_URL = isDev
  ? 'http://localhost:1337/api/chat'
  : 'https://govern-chatbot.vercel.app/api/chat';  // ← ajuster si URL différente
```

Puis **redéployer govern-landing** sur Vercel (push ou redeploy manuel).

---

## Étape 7 — Tests bout en bout (prod)

| Test | Comment | Attendu |
|------|---------|---------|
| Widget sur www | Ouvrir `https://www.govern-one.com`, chat Eynam | Réponse streamée |
| Langue EN | Passer le site en EN, poser une question | Réponse en anglais |
| CORS | DevTools → Network → `POST .../api/chat` | Pas d'erreur CORS |
| Mode RAG | Header `X-Chat-Mode` dans Network | `rag` |
| Fallback | Couper temporairement le backend Vercel | Réponse rule-based (`findAnswer`) |
| Tarifs | « Quels sont vos tarifs ? » | Orientation devis, pas de prix inventés |

---

## RAG / ingest — pas sur Vercel

L'indexation Supabase se fait **en local** (les clés Gemini embedding + volume de chunks ne passent pas par le runtime Vercel) :

```bash
cd govern-chatbot
npm run content:generate   # si le contenu landing a changé
npm run ingest             # reprend depuis .ingest-cache/ si interrompu
```

Le backend Vercel lit les chunks déjà présents dans Supabase — aucun script ingest à lancer sur Vercel.

---

## Timeout & plan Vercel

- `/api/chat` est configuré à **60 s** (`vercel.json` + `export const maxDuration = 60`)
- Sur le plan **Hobby**, la limite effective est **10 s** → risque de timeout avec RAG + streaming
- **Recommandation** : plan **Pro** pour govern-chatbot en production

---

## Checklist finale

### govern-chatbot (Vercel)
- [ ] Repo GitHub connecté à Vercel
- [ ] Variables env Production configurées
- [ ] Deploy OK, URL notée
- [ ] `test-chat.mjs` OK sur l'URL prod
- [ ] `test-cors.mjs` OK (www + sans www)
- [ ] `/test` fonctionne en prod

### govern-landing (Vercel)
- [ ] `CHAT_API_URL` prod correcte dans `config.js`
- [ ] Landing redéployé
- [ ] Widget Eynam streamé sur `www.govern-one.com`
- [ ] Fallback testé (optionnel)

---

## Dépannage

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| 503 « AI service not configured » | `GEMINI_API_KEYS` manquante sur Vercel | Vérifier env vars + redeploy |
| Erreur CORS dans la console | Mauvaise `FRONTEND_URL` ou preview non listée | Ajouter l'URL dans `FRONTEND_URLS` |
| `X-Chat-Mode: baseline` au lieu de `rag` | Supabase non configuré ou 0 chunks | Vérifier env Supabase + `npm run ingest` |
| Timeout 504 | Plan Hobby (10 s) | Passer en Pro ou réduire la latence RAG |
| Widget rule-based uniquement | API injoignable ou erreur réseau | Vérifier URL dans `config.js`, tester `test-chat.mjs` |

---

## Commandes utiles

```bash
# Smoke test complet
npm run test:prod

# CORS prod
npm run test:cors -- https://govern-chatbot.vercel.app https://www.govern-one.com

# Vérifier les clés Gemini (local, avec .env)
npm run test:gemini-keys
npm run test:supabase
```
