# nextjs.Dockerfile
# Dev container for Next.js frontend
# .dockerignore: node_modules, .next, .git

FROM node:20-slim

LABEL maintainer="create-fast-stack"
LABEL cfs-e2e="true"

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

COPY . .

ENV BACKEND_URL=http://backend:8000

EXPOSE 3000

HEALTHCHECK --interval=5s --timeout=3s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

CMD ["pnpm", "dev"]
