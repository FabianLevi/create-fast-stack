# {{projectName}}

Backend powered by [Go Chi](https://github.com/go-chi/chi).

## Quick Start

```bash
go mod download
go run cmd/api/main.go
```

Server runs at http://localhost:8000

## Commands

- Install: `go mod download`
- Dev: `go run cmd/api/main.go` or `make dev` (with [air](https://github.com/cosmtrek/air))
- Build: `make build`
- Lint: `golangci-lint run ./...`
- Format: `gofmt -w .`
- Test: `go test ./...`

## Endpoints

- `GET /health` — Health check

## Environment

Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

Default port is 8000, configurable via `APP_PORT` environment variable.

## Structure

```
internal/
├── config/          # Configuration from environment
├── logger/          # slog setup (JSON/text handlers)
├── middleware/      # HTTP middleware (request ID, logging, recovery)
├── handler/         # HTTP handlers
└── api/             # Router setup and middleware stack
cmd/
└── api/             # Server entry point
```

## Stack

- **Go 1.22+**
- **Chi v5** — lightweight router
- **slog** — standard library logging
- **caarlos0/env** — environment parsing
- **go-chi/cors** — CORS middleware
- **google/uuid** — request ID generation
