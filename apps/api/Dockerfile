# -----------------------------------------------------------------------------
# Stage 1: Base (Node.js 런타임 및 Corepack 활성화)
# -----------------------------------------------------------------------------
FROM node:24.18.0-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PNPM_HOME:$PATH"

# 버전 명시 없이 Corepack 프록시만 활성화
# 모노레포 루트 package.json packageManager 설정 필요
RUN corepack enable

# -----------------------------------------------------------------------------
# Stage 2: Pruner (모노레포 슬라이싱)
# -----------------------------------------------------------------------------
FROM base AS pruner
WORKDIR /app

RUN pnpm add -g turbo@2.10.11

COPY . .

RUN turbo prune api --docker

# -----------------------------------------------------------------------------
# Stage 3: Builder (의존성 설치 및 컴파일)
# -----------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY --from=pruner /app/out/json/ .

# 이 시점에 pnpm을 실행하면, Corepack이 복사된 package.json의 packageManager 필드에 명시된 버전의 pnpm을 자동으로 다운로드하여 실행함
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .

RUN pnpm exec turbo run build --filter=api

# 워크스페이스 의존성을 끊고 프로덕션 배포본 격리 추출

# * package.json에 필수 설정
# api - "files": ["dist", "uploads"]
# 상위 의존성 - "files": ["dist"]

# * turbo.json에 필수 설정
# tasks.build.dependsOn: ["^build"]

RUN pnpm --filter=api --prod --legacy deploy /app/deployed

# -----------------------------------------------------------------------------
# Stage 4: Runner (프로덕션 배포)
# -----------------------------------------------------------------------------
FROM node:24.18.0-bookworm-slim AS runner

RUN apt-get update \
  && apt-get install -y --no-install-recommends tini wget \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
  PORT=4000 \
  TZ=UTC

WORKDIR /home/node/app
RUN chown -R node:node /home/node/app

COPY --from=builder --chown=node:node /app/deployed .

EXPOSE ${PORT}
USER node

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "--enable-source-maps", "--dns-result-order=ipv4first", "dist/main.js"]
