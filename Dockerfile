# ── Stage 1: Base ──────────────────────────────────────────────────────────────
# Shared base with pnpm installed for all stages
FROM node:22-alpine AS base

# Security: add tini for proper PID 1 signal handling
RUN apk add --no-cache tini

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app

# ── Stage 2: Dependencies ─────────────────────────────────────────────────────
# Install all deps (including devDependencies for build)
FROM base AS deps

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN pnpm install --frozen-lockfile

# ── Stage 3: Build API ────────────────────────────────────────────────────────
FROM deps AS build-api

COPY tsconfig.base.json ./
COPY apps/api/ apps/api/

RUN pnpm --filter @kunci/api build

# ── Stage 4: Build Web ────────────────────────────────────────────────────────
FROM deps AS build-web

COPY tsconfig.base.json ./
COPY apps/api/ apps/api/
COPY apps/web/ apps/web/

RUN pnpm --filter @kunci/web build

# ── Stage 5: Production deps only ─────────────────────────────────────────────
FROM base AS prod-deps

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN pnpm install --frozen-lockfile --prod

# ── Stage 6: Final runtime ────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

# Security: add tini + busybox (for nc)
RUN apk add --no-cache tini

# Install pnpm and tsx for migrations
RUN npm install -g pnpm tsx

# Security: non-root user
RUN addgroup -g 1001 -S kunci && \
    adduser -S kunci -u 1001 -G kunci

WORKDIR /app

# Copy production node_modules
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy API build output
COPY --from=build-api /app/apps/api/dist ./apps/api/dist
COPY --from=build-api /app/apps/api/package.json ./apps/api/package.json
COPY --from=build-api /app/apps/api/drizzle ./apps/api/drizzle
# We need src for tsx db:migrate and db:seed to work
COPY --from=build-api /app/apps/api/src ./apps/api/src

# Copy Web build output
COPY --from=build-web /app/apps/web/dist ./apps/web/dist

# Copy root config and scripts
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/scripts/bootstrap.sh ./apps/api/scripts/bootstrap.sh

# Security: ensure non-root ownership and execution rights
RUN chown -R kunci:kunci /app && chmod +x /app/apps/api/scripts/bootstrap.sh

# Security: drop to non-root user
USER kunci

# Expose API port
EXPOSE 3001

# Security: read-only filesystem marker
ENV NODE_ENV=production

# Use tini as PID 1
ENTRYPOINT ["/sbin/tini", "--"]

# Run bootstrap script
CMD ["/app/apps/api/scripts/bootstrap.sh"]
