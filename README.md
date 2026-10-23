# Football Matchmaking

API de mise en relation d'équipes de football amateur (5v5 / 6v6) : un utilisateur publie une offre de match, les autres expriment leur intérêt, le créateur confirme.

## Stack
Node.js, Express 5, TypeScript, Prisma 6, PostgreSQL, JWT (bcrypt pour les mots de passe).

## Structure
- `backend/` : API (src, schéma Prisma, migrations)
- `infra/` : à venir (Docker, Kubernetes, Jenkins)
- `docs/` : conception (MCD, cahier des charges)

## Démarrage
Prérequis : Node 20+ et PostgreSQL local avec une base `foot_matchmaking`.

    cd backend
    copy .env.example .env      (puis renseigner DATABASE_URL et JWT_SECRET)
    npm install
    npx prisma migrate dev
    npm run dev

Test : GET http://localhost:3000/health

Générer un secret JWT :

    node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

## Flow
1. POST /utilisateurs puis POST /auth/login (retourne un token)
2. POST /offres-match (token) : créneau debut/fin, format, niveau
3. GET /offres-match?latitude=..&longitude=..&rayon=..&format=.. : recherche par distance
4. POST /interets (token) : exprimer un intérêt
5. GET /offres-match/:id/interets (créateur) : voir les intéressés et leurs contacts
6. PATCH /interets/:id/confirmer (créateur) : confirme, refuse les autres, verrouille l'offre
7. GET /interets/moi : le contact du créateur n'apparaît qu'après confirmation
8. PATCH /offres-match/:id/resultat (créateur) : alimente les stats de GET /utilisateurs/:id

## Règles métier
- Pas d'intérêt sur sa propre offre ni sur une offre déjà matchée
- Pas deux offres qui se chevauchent pour un même utilisateur
- Si un intérêt est confirmé et chevauche une offre ouverte de l'intéressé, cette offre est supprimée

## Chantiers
Conteneurisation, CI/CD, Kubernetes, événements Kafka, durcissement sécurité, tests automatisés, application mobile.
