# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.32.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN pnpm install --frozen-lockfile --prod=false

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.32.0 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG DATABASE_URL
ARG NAVIGATOR_PHASE=production
ARG ORIGIN=https://navigator.berlin
ARG NOMINATIM_ENDPOINT=https://nominatim.openstreetmap.org
ENV DATABASE_URL=${DATABASE_URL}
ENV NAVIGATOR_PHASE=${NAVIGATOR_PHASE}
ENV ORIGIN=${ORIGIN}
ENV NOMINATIM_ENDPOINT=${NOMINATIM_ENDPOINT}
ENV NODE_ENV=production
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN pnpm run build

FROM node:22-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache curl tini && corepack enable && corepack prepare pnpm@10.32.0 --activate
COPY --from=build /app/build ./build
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/.npmrc ./
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts/db ./scripts/db
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN pnpm install --frozen-lockfile --prod --ignore-scripts
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD curl -fsS http://127.0.0.1:3000/api/healthz || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
