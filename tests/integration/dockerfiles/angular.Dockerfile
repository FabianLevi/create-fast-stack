# angular.Dockerfile
# Dev container for Angular frontend
# .dockerignore: node_modules, dist, .git, .angular

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

EXPOSE 4200

HEALTHCHECK --interval=5s --timeout=3s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:4200/ || exit 1

CMD ["pnpm", "exec", "ng", "serve", "--host", "0.0.0.0"]
