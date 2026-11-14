# ─── Étape 1 : le chantier (jetable) ─────────────────────────────
# Tout l'outillage (prisma CLI, tsx, typescript) vit ici et MEURT ici.
FROM node:24-slim AS build
WORKDIR /app
# OpenSSL identique à l'étape de prod, sinon Prisma génère l'engine pour la mauvaise version
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci                       # deps complètes : prod + dev
COPY . .
RUN npx prisma generate          # génère le client + engine (glibc)
RUN npx tsc                      # compile une fois → dist/

# ─── Étape 2 : la production (LA seule image finale) ─────────────
FROM node:24-slim AS production
WORKDIR /app
ENV NODE_ENV=production
# Coupe le postinstall de @prisma/client : sans lui, il relance prisma generate
# via npx → la CLI (et typescript) sont rapatriés DANS l'image de prod.
# Le client est déjà généré à l'étape build et copié juste après.
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
COPY package*.json ./
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
RUN npm ci --omit=dev --legacy-peer-deps
# (--legacy-peer-deps) : @prisma/client déclare prisma CLI + typescript en
# peerDependencies *optionnelles* ; npm >= 7 les installe quand même,
# ce qui gonflerait l'image de ~74 Mo dont elle n'a pas besoin au runtime.
# le client généré : .prisma contient l'engine ; @prisma/client vient de npm ci
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
# (bonus sécurité) : pas root pour servir
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
