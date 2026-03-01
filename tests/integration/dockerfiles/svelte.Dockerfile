# svelte.Dockerfile
# Dev container for SvelteKit frontend
# .dockerignore: node_modules, .svelte-kit, build, .git

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

ENV VITE_BACKEND_URL=http://host.docker.internal:8000

EXPOSE 5173

HEALTHCHECK --interval=5s --timeout=3s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:5173/ || exit 1

CMD ["pnpm", "dev", "--host", "0.0.0.0"]
