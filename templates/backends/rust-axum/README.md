# {{projectName}}

A minimal, production-ready Rust backend using Axum 0.8.

## Stack

- **Language**: Rust 2021 edition
- **Web Framework**: Axum 0.8
- **Async Runtime**: Tokio
- **Logging**: tracing + tracing-subscriber
- **HTTP Utilities**: tower-http (CORS, request tracing, utilities)
- **Serialization**: serde + serde_json
- **Configuration**: dotenvy + envy
- **Error Handling**: thiserror
- **ID Generation**: uuid v4

## Quick Start

### Prerequisites

- Rust 1.70+ (install via [rustup](https://rustup.rs/))

### Development

```bash
# Copy example environment
cp .env.example .env

# Run the server
cargo run

# Run with custom log level
RUST_LOG=debug cargo run
```

The server will start on `http://0.0.0.0:8000` by default.

### Build

```bash
# Debug build
cargo build

# Release build (optimized)
cargo build --release
```

## Commands

| Command | Purpose |
|---------|---------|
| `cargo run` | Run dev server |
| `cargo build --release` | Production build |
| `cargo clippy` | Lint with Clippy |
| `cargo fmt` | Format code |
| `cargo test` | Run tests |
| `cargo check` | Fast compile check |

## API Endpoints

### Health Check

```bash
GET /health
```

Returns:
```json
{
  "status": "ok",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Project Structure

```
src/
  main.rs           Entry point, server startup
  config.rs         Configuration from env vars
  error.rs          Error types and HTTP mapping
  routes.rs         Router and middleware setup
  handlers/
    mod.rs
    health.rs       Health check handler
  middleware/
    mod.rs
    request_id.rs   Request ID generation middleware
```

## Configuration

Environment variables (see `.env.example`):

- `APP_PORT` — Server port (default: 8000)
- `APP_HOST` — Bind address (default: 0.0.0.0)
- `RUST_LOG` — Log level (default: info)
- `APP_ENV` — Environment name (default: develop)

## Features

- **Request ID Middleware** — Every request gets a unique UUID; included in response headers
- **Structured Logging** — Built-in tracing with JSON output support
- **CORS** — Permissive CORS enabled for development
- **Graceful Shutdown** — Listens for Ctrl+C signal
- **Error Handling** — Centralized error types with HTTP status mapping

## Code Standards

See `CLAUDE.md` for detailed coding conventions, including:

- Documentation requirements
- Error handling patterns
- Async best practices
- Type safety principles
- Performance guidelines
