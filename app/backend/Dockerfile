FROM node:24

WORKDIR /app


COPY package*.json ./

RUN npm ci
COPY . .
RUN npx prisma generate
COPY . .


EXPOSE 3000
 
CMD ["npm", "run", "dev"]
