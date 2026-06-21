FROM --platform=$BUILDPLATFORM node:24-alpine AS build-base
WORKDIR /app
RUN corepack enable

FROM build-base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM build-base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM --platform=$TARGETPLATFORM node:24-alpine AS runtime-base
WORKDIR /app
RUN corepack enable

FROM runtime-base AS runtime-deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

FROM runtime-base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=runtime-deps /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/content ./content
EXPOSE 3000
CMD ["pnpm", "exec", "next", "start", "-p", "3000"]
