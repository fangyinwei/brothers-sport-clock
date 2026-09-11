FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY test ./test
COPY migrations ./migrations
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist/src ./dist/src
COPY --from=build /app/migrations ./migrations

USER node
EXPOSE 8080
CMD ["node", "dist/src/server.js"]
