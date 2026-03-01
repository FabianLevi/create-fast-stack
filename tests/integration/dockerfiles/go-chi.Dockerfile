# go-chi.Dockerfile
# Multi-stage build for Go Chi backend
# .dockerignore: .git, .env, tmp/

# --- Builder stage ---
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/server ./cmd/api

# --- Runtime stage ---
FROM alpine:3.20

LABEL maintainer="create-fast-stack"
LABEL cfs-e2e="true"

RUN apk add --no-cache wget

WORKDIR /app

COPY --from=builder /app/server .

ENV APP_HOST=0.0.0.0
ENV APP_PORT=8000

EXPOSE 8000

HEALTHCHECK --interval=5s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:8000/health || exit 1

CMD ["./server"]
