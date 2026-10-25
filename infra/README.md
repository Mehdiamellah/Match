# infra/ — Infrastructure locale (Phase 0)

## Lancer la stack

```bash
cd infra
docker compose up --build          # Postgres + backend + Adminer
```

| Service | Accès | Notes |
|---|---|---|
| API backend | http://localhost:3000 | `GET /health` pour tester |
| SQLite… non : **Postgres** | `localhost:5433` (hôte) | `foot / localpwd`, base `foot_matchmaking` |
| Adminer | http://localhost:8080 | moteur *PostgreSQL*, serveur `postgres`, user `foot` |
| Kafka | `localhost:9092` | `docker compose --profile events up` |

## Ciclo migration après un `docker compose up`

```bash
docker compose exec backend npx prisma migrate dev
```

## Pourquoi 5433 ?

Ton Postgres **local** tourne déjà sur 5432 ; la stack Docker mappe le sien sur
5433 côté hôte. À l'intérieur du réseau Compose (= ce que voir backend/Terraform
plus tard), c'est toujours `postgres:5432`. Idem pour le front : il continue de
parler à `http://localhost:3000` — rien ne change.

## Suite de cette salle (axe DevOps)

- CI GitHub Actions → build/images → registre
- Terraform : états S3, modules vpc/rds/compute, hébergement statique du front
- Kafka : producteurs dans les routes métier (`interet.confirme`, `offre.matchee`)
