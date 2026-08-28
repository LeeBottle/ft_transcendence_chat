# -----------------------------------------------------------------------------
# Stage 1: Base (Node.js 런타임 및 Corepack 활성화)
# -----------------------------------------------------------------------------
FROM node:24.18.0-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PNPM_HOME:$PATH"

RUN corepack enable

# -----------------------------------------------------------------------------
# Stage 2: Pruner (모노레포 슬라이싱)
# -----------------------------------------------------------------------------
FROM base AS pruner
WORKDIR /app

RUN pnpm add -g turbo@2.10.11

COPY . .

RUN turbo prune web --docker

# -----------------------------------------------------------------------------
# Stage 3: Builder (의존성 설치 및 컴파일)
# -----------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY --from=pruner /app/out/json/ .

RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .

RUN pnpm exec turbo run build --filter=web

# -----------------------------------------------------------------------------
# Stage 4: Runner (프로덕션 배포)
# -----------------------------------------------------------------------------
FROM node:24.18.0-bookworm-slim AS runner

RUN apt-get update \
  && apt-get install -y --no-install-recommends tini wget \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
  PORT=3000 \
  HOSTNAME=0.0.0.0 \
  TZ=UTC \
  NEXT_TELEMETRY_DISABLED=1

WORKDIR /home/node/app
RUN chown -R node:node /home/node/app

COPY --from=builder --chown=node:node /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE ${PORT}
USER node

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "--enable-source-maps", "--dns-result-order=ipv4first", "apps/web/server.js"]
