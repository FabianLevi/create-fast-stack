# rust-axum.Dockerfile
# Multi-stage build with cargo-chef for dependency caching
# .dockerignore: target/, .git, .env

# --- Chef stage (install cargo-chef) ---
FROM rust:1.85-slim AS chef

RUN apt-get update && apt-get install -y --no-install-recommends pkg-config libssl-dev \
    && rm -rf /var/lib/apt/lists/*

RUN cargo install cargo-chef --locked

WORKDIR /app

# --- Planner stage (prepare recipe) ---
FROM chef AS planner

COPY . .
RUN cargo chef prepare --recipe-path recipe.json

# --- Builder stage (cook deps + build) ---
FROM chef AS builder

COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

COPY . .
RUN cargo build --release

# --- Runtime stage ---
FROM debian:bookworm-slim

LABEL maintainer="create-fast-stack"
LABEL cfs-e2e="true"

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/backend ./server

ENV APP_HOST=0.0.0.0
ENV APP_PORT=8000

EXPOSE 8000

HEALTHCHECK --interval=5s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["./server"]
