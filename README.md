# ⚽ Match de quartier

Mise en relation d'équipes de football amateur (5v5 / 6v6) : **un utilisateur publie une offre de match, les autres expriment leur intérêt, le créateur confirme et le contact s'échange des deux côtés.** Pensé mobile-first (tab bar, feuilles modales) avec un palier desktop responsive, en français.

---

## Stack

| Camp | Outils |
|---|---|
| **Backend** | Node.js 20+, Express 5, TypeScript, Prisma 6, PostgreSQL, JWT (bcrypt, ts-node-dev en dev) |
| **Frontend** | React 18, Vite 5, TypeScript, **CSS pur** (design system sans dépendance, zéro framework CSS) |
| **Recherche** | Distance haversine en SQL brut (Postgres), rayon configurable au moment de la requête |

👉 Les détails de conception (parcours utilisateurs, tokens du design system « stade la nuit ») sont documentés dans [`frontend/docs/UX-brief.md`](frontend/docs/UX-brief.md) et [`frontend/docs/design-system.md`](frontend/docs/design-system.md).

## Structure du dépôt

```
backend/    API Express + schéma Prisma + migrations
frontend/   App React + design system + écrans (src/screens) + docs conception
infra/      à venir : Docker, Terraform, CI/CD
```

---

## Démarrage

Prérequis : **Node 20+** et **PostgreSQL** local.

### 1. Backend (port 3000)

```bash
cd backend
copy .env.example .env        # puis remplir DATABASE_URL et JWT_SECRET
npm install
npx prisma migrate dev
npm run dev                   # ts-node-dev --respawn (rechargement auto)
```

Test : `GET http://localhost:3000/health` → `{ "status": "ok", "database": "connected" }`

### 2. Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev                   # Vite, proxy /api → http://localhost:3000
```

Ouvrir **http://localhost:5173**. Aucune clé ni variable d'environnement nécessaire côté front : `/api` est un proxy, pas une URL.

> Le front fonctionne aussi **sans compte** pour *Découvrir* ; inscription/connexion demandées pour proposer, gérer les demandes et le profil. Si la géoloc est refusée, une liste de villes/quartiers (Marrakech, Casablanca, Rabat, Agadir…) sert de position — corrigeable ensuite dans **Profil → Corriger ma position** (`PATCH /utilisateurs/moi`).

---

## Le flow produit

1. **Inscription** `POST /utilisateurs` puis `POST /auth/login` → token JWT (7 jours)
2. **Publier une offre** `POST /offres-match` : créneau `debut`/`fin`, format `CINQ_VS_CINQ | SIX_VS_SIX`, niveau facultatif
3. **Découvrir** `GET /offres-match?latitude=..&longitude=..&rayon=..&format=..` : offres **ouvertes et à venir**, triées par distance — ses propres offres et les offres passées sont exclues automatiquement
4. **Demander** `POST /interets` `{ offreMatchId }`
5. **Côté créateur** `GET /offres-match/:id/interets` : liste des demandeurs, contacts visibles
6. **Confirmer** `PATCH /interets/:id/confirmer` : l'offre devient *MATCHÉE*, les autres demandes sont **refusées automatiquement**, les offres ouvertes en conflit de créneau du confirmé sont **supprimées** (transaction Prisma)
7. **Mes demandes** `GET /interets/moi` : le téléphone du créateur n'apparaît **qu'après confirmation** (et réciproquement pour lui)
8. **Après-match** `PATCH /offres-match/:id/resultat` : `VICTOIRE_CREATEUR | VICTOIRE_INTERESSE | NUL` → alimente les stats de `GET /utilisateurs/:id`

## Règles métier garanties

- Pas d'intérêt sur sa propre offre ni sur une offre déjà matchée
- Pas deux offres qui se chevauchent pour un même utilisateur (créateur ou confirmé)
- Échec explicite si l'un des deux camps a déjà un match **confirmé** sur le créneau

## Écrans

| Onglet | Contenu |
|---|---|
| **Découvrir** | filtres format (5v5/6v6) + rayon (5/10/20/50 km), recherche par distance, CTA « Je suis intéressé » |
| **Proposer** | formulaire de création + « Mes offres » : demandes reçues (feuille modale), confirmation, notation après-match |
| **Demandes** | mes demandes : confirmées (contact tél/WhatsApp débloqué), en attente, refusées |
| **Profil** | identité, stats V/N/D, correction de position, déconnexion |

---

## 🔎 Où va le projet (roadmap)

L'application est la **base** : la suite du projet consiste à en faire un système **déployé, approvisionné par code, et durci** — deux axes:

### Axe DevOps / Cloud
- Conteneurisation (Docker multi-stage, compose local), seed/données de test
- **CI/CD** GitHub Actions : lint + typecheck + build + images → registry
- **Terraform** : VPC, RDS PostgreSQL, hébergement statique du front (S3 + CDN), compute backend
- **Kafka** : événements métier (`offre.matchee`, `interet.confirme`…) + consumers (notifications)
- Observabilité : logs structurés, métriques, alerting

### Axe Cybersécurité
- Durcissement Express (helmet, CSP, rate limiting, CORS strict, validation des entrées)
- Gestion des secrets (jamais dans le code/env partagés — vault/KMS), rotation JWT
- Audit dépendances (npm audit, Dependabot, CodeQL) + tests de sécurité automatisés
- WAF / règles passives sur l'infrastructure, journalisation forensique

Voir la *Convention de contribution* ci-dessous : les chantiers sont découpés en branches `feat/…`, `fix/…`, `ops/…`, `sec/…`.

## Convention de commit

`feat(domain): description courte` — ex. `feat(backend)`, `feat(frontend)`, `ops(ci)`, `sec(headers)`. Un commit = une intention lisible.
