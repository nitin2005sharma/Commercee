# --- Stage 1: install deps + build ---
FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# NEXT_PUBLIC_* vars must be present at build time to be baked into the client bundle.
ARG NEXT_PUBLIC_API_URL_PROD
ENV NEXT_PUBLIC_API_URL_PROD=$NEXT_PUBLIC_API_URL_PROD

RUN npm run build

# --- Stage 2: slim runtime image ---
FROM node:20-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

# `output: "standalone"` (set in next.config.ts) produces a minimal server bundle
# with only the dependencies actually used, so we don't need to npm install here.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
