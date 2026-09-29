# ---------- Stage 1: build ----------
FROM node:22-alpine AS build
WORKDIR /app

# Install ALL dependencies (dev + prod) once.
COPY package*.json ./
RUN npm ci

# Copy source.
COPY . .

# Prisma 7 config requires DATABASE_URL to exist even for `generate`.
# The value is not used — client generation is schema-only.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

RUN npx prisma7 generate
RUN npm run build

# Remove devDependencies after build so the runtime image stays lean.
RUN npm prune --omit=dev

# ---------- Stage 2: runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy everything the server needs — no second npm install.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/generated ./src/generated
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma7.config.ts ./prisma7.config.ts
COPY --from=build /app/package.json ./package.json

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]