# nestjs.Dockerfile
# Dev container for NestJS backend
# .dockerignore: node_modules, dist, .git, .env

FROM node:20-slim

LABEL maintainer="create-fast-stack"
LABEL cfs-e2e="true"

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

ENV APP_HOST=0.0.0.0
ENV APP_PORT=8000

EXPOSE 8000

HEALTHCHECK --interval=5s --timeout=3s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["npm", "run", "start:dev"]
