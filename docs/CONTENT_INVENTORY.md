# Inventaire du contenu — ✅ Généré automatiquement

> **109 fichiers FR + 109 fichiers EN** générés depuis `govern-landing` via :
> ```bash
> npm run content:generate
> ```

Sources : `src/i18n/locales/fr.json`, `en.json`, `public/pricing-plans.json`

---

## Structure `content/`

```
content/
├── fr/ | en/
│   ├── home.md
│   ├── about.md
│   ├── faq.md
│   ├── chatbot-faq.md          # Toutes les réponses Eynam
│   ├── navigation.md           # Menus header
│   ├── partners.md
│   ├── careers.md
│   ├── quiz.md
│   ├── govern-ai.md
│   ├── products/
│   │   ├── overview.md
│   │   ├── risque.md
│   │   ├── gouvernance.md
│   │   ├── anti-corruption.md
│   │   ├── conformite.md
│   │   ├── conformite-normes-standards.md
│   │   ├── conformite-obligations-cedeao-cemac.md
│   │   ├── conformite-lcb-ft-fp.md
│   │   └── controle-interne.md
│   ├── solutions/              # 20 solutions
│   │   ├── overview.md
│   │   └── *.md
│   ├── sectors/                # 15 secteurs
│   │   ├── overview.md
│   │   └── *.md
│   ├── commercial/
│   │   ├── demo.md
│   │   ├── quote.md
│   │   ├── support.md
│   │   └── pricing.md          # Plans + pricing-plans.json
│   ├── resources/
│   │   ├── overview.md
│   │   ├── documentation.md
│   │   ├── guides.md
│   │   ├── webinars-list.md
│   │   ├── whitepapers-list.md
│   │   ├── case-studies.md
│   │   ├── support.md
│   │   ├── guides/             # 14 guides détaillés
│   │   ├── documentation/      # 3 docs détaillées
│   │   └── case-studies/       # Études de cas par secteur
│   └── legal/                  # 10 pages légales
│       └── *.md
```

---

## Couverture par type de page landing

| Type | Couvert | Source i18n |
|------|---------|---------------|
| Accueil | ✅ | `homePage` |
| À propos | ✅ | `aboutPage` |
| Produits (9) | ✅ | `productsPages` |
| Solutions (20) | ✅ | `solutionPages` |
| Secteurs (15) | ✅ | `sectorPages` |
| Démo / Devis / Support | ✅ | `demoPage`, `quotePage`, `supportPage` |
| Tarifs | ✅ | `pricing` + `pricing-plans.json` |
| Ressources | ✅ | `resourcesPages` |
| Guides détaillés | ✅ | `resourcesPages.guides.guides` |
| Documentation | ✅ | `resourcesPages.documentation.details` |
| Études de cas | ✅ | `resourcesPages.caseStudies.caseStudies` |
| Webinaires | ✅ | `resourcesPages.webinars.webinars` |
| Livres blancs | ✅ | `resourcesPages.whitepapers.whitepapers` |
| Partenaires | ✅ | `partnersPage` |
| Carrières | ✅ | `careersPage` |
| Quiz GRC | ✅ | `quizPage` |
| Pages légales (10) | ✅ | `legalPages` |
| FAQ site | ✅ | `faq` |
| FAQ chatbot | ✅ | `chatWidget.responses` |
| Navigation | ✅ | `header` |

---

## Regénérer après modification du landing

Quand le contenu du site change dans `govern-landing` :

```bash
cd govern-chatbot
npm run content:generate
# Phase 3 : npm run ingest
```
