# Intégration technique — govern-landing ↔ govern-chatbot

> **Suivi phase par phase :** voir [GUIDE_INTEGRATION.md](./GUIDE_INTEGRATION.md)

## Principe

Le landing **ne stocke aucune clé API**. Il appelle uniquement l'endpoint public du backend via une **URL hardcodée** dans le code source.

```
govern-landing                          govern-chatbot
┌─────────────────────┐                ┌─────────────────────┐
│ ChatWidget.jsx      │  POST /api/chat │ app/api/chat/       │
│ streamChatMessage() │ ──────────────► │ route.ts            │
│ locale: fr|en       │  Accept:        │ Gemini + RAG        │
│ messages[]          │  text/plain     │                     │
└─────────────────────┘                └─────────────────────┘
```

## Fichiers govern-landing (Phase 2)

| Fichier | Rôle |
|---------|------|
| `src/lib/chat/config.js` | URL API prod + dev (hardcodée) |
| `src/lib/chat/client.js` | `streamChatMessage(locale, messages, onDelta)` |
| `src/lib/chat/types.js` | Types des messages |
| `src/components/ChatWidget.jsx` | Widget adapté (streaming + fallback) |

## URL hardcodée (exemple Phase 2)

```javascript
// src/lib/chat/config.js
const isDev = import.meta.env.DEV;

export const CHAT_API_URL = isDev
  ? 'http://localhost:1337/api/chat'
  : 'https://govern-chatbot.vercel.app/api/chat';
```

> Mettre à jour l'URL prod une seule fois après le premier deploy Vercel du backend.

## Format de la requête

```json
POST /api/chat
Content-Type: application/json
Accept: text/plain

{
  "locale": "fr",
  "messages": [
    { "role": "user", "content": "Quels sont vos produits ?" },
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "Parlez-moi de la conformité" }
  ]
}
```

- Historique : **10 derniers messages** envoyés au backend
- Streaming : réponse `text/plain` token par token
- Header réponse : `X-Chat-Mode: baseline` ou `rag`

## CORS (côté govern-chatbot)

Variables dans le backend :

| Variable | Valeur |
|----------|--------|
| `FRONTEND_URL` | `https://www.govern-one.com` (origine principale) |
| `FRONTEND_URLS` | Optionnel — previews Vercel du landing (virgules) |

Origines autorisées automatiquement :
- `http://localhost:5173` (dev)
- `https://www.govern-one.com`
- `https://govern-one.com`

Test : `npm run test:cors -- https://govern-chatbot.vercel.app https://www.govern-one.com`

## Fallback rule-based

Si l'API retourne une erreur (503, 429, réseau), le widget retombe sur le bot actuel :

```javascript
import { findAnswer } from '../data/chatbotData';

try {
  await streamChatMessage(...);
} catch {
  const answer = findAnswer(userMessage, t, context);
  // afficher answer ou defaultResponse
}
```

Cela garantit que le widget reste utilisable même si le backend est indisponible.

## Test d'intégration (Phase 2)

1. Backend local sur `:1337`
2. Landing local sur `:5173`
3. Ouvrir le widget → poser une question
4. DevTools → Network → vérifier `POST /api/chat` vers localhost:1337
5. Vérifier le streaming et les liens internes (`injectPageLinks`)

## Widget actuel (avant Phase 2)

Le widget rule-based reste en place dans :
- `src/components/ChatWidget.jsx`
- `src/data/chatbotData.js`
- `src/i18n/locales/fr.json` → section `chatWidget`

Il sera **étendu**, pas supprimé (fallback + quick questions + i18n conservés).
