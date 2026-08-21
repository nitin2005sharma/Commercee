# --- Stage 1: install deps + build ---
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install OS deps Prisma's engines need on Debian slim images
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Generate the Prisma client against the schema, then compile TypeScript -> dist/
RUN npx prisma generate
RUN npm run build

# --- Stage 2: slim runtime image ---
FROM node:20-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Bring over compiled output, the generated Prisma client, and the schema/migrations
# (migrations are applied at container start, see CMD below).
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000

# Apply any pending migrations, then start the compiled server.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
