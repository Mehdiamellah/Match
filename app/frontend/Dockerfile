FROM node:24 AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN  npm run build



FROM nginx:1.30.6-trixie

COPY --from=build /app/dist /usr/share/nginx/html


EXPOSE 80
