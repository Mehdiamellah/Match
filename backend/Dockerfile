# Image de développement Phase 0 (simple et fidèle au workflow `npm run dev`).
# Une image de production multi-stage (tsc build + node server) arrivera avec la CI.
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src

EXPOSE 3000
CMD ["npm", "run", "dev"]
