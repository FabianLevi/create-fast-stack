# {{projectName}}

## Stack
- Go 1.22+, Chi v5, slog, caarlos0/env v11
- CORS: allow_origins=["*"]
- Default port: 8000

## Commands
- Install: `go mod download`
- Dev: `go run cmd/api/main.go` or `make dev` (with air)
- Build: `make build`
- Lint: `golangci-lint run ./...`
- Format: `gofmt -w .`
- Test: `go test ./...`

## Structure
```
internal/
├── config/
│   └── config.go           # Config struct with env tags, Load()
├── logger/
│   └── logger.go           # New(level, env) creates slog.Logger
├── middleware/
│   ├── request_id.go       # RequestID middleware + RequestIDFromContext()
│   ├── logging.go          # Logging middleware (method, path, status, duration)
│   └── recovery.go         # Panic recovery middleware
├── handler/
│   └── health.go           # Handler struct with Health(w, r) method
└── api/
    └── router.go           # NewRouter(log) creates chi.Mux with middleware stack
cmd/
└── api/
    └── main.go             # Load config, create logger, start server
```

## Code Standards

### Documentation
- Every package MUST have a package doc comment:
```go
// Package config loads application configuration from environment variables.
package config
```
- Every exported function/type MUST have a doc comment starting with its name:
```go
// Load parses environment variables and returns a Config instance.
func Load() (*Config, error) {
```
- Struct fields: use inline comments for purpose and defaults

### Error Handling
- Use explicit error returns: `(T, error)`
- Check errors immediately after operations
- Wrap errors with context using `fmt.Errorf("...: %w", err)`
- Use `os.Exit(1)` for fatal startup errors, not `panic()`
```go
result, err := someFunc()
if err != nil {
    return nil, fmt.Errorf("do something: %w", err)
}
```

### Naming Conventions
- **Exported** (public): PascalCase (e.g., `Config`, `Handler`, `NewRouter`)
- **Unexported** (private): camelCase (e.g., `requestIDKey`, `responseWriter`)
- Functions: PascalCase if exported, camelCase if unexported
- Variables: camelCase
- Constants: UPPER_SNAKE_CASE or PascalCase depending on export

### Struct Tags
Use standard struct tags for configuration:
```go
type Config struct {
    Field string `env:"FIELD_NAME" envDefault:"default_value"`
}
```

### Middleware Pattern
Middleware returns a function that wraps the next handler:
```go
func MiddlewareName(logger *slog.Logger) func(next http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // Before
            next.ServeHTTP(w, r)
            // After
        })
    }
}
```

### Handler Pattern
Handlers are methods on a Handler struct:
```go
type Handler struct {
    log *slog.Logger
}

func (h *Handler) EndpointName(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    // implementation
}
```

### Logging
Use slog structured logging:
```go
log.Info("message", slog.String("key", "value"), slog.Int("count", 42))
log.Error("error occurred", "err", err, slog.String("context", "info"))
```

## Conventions
- Config via `.env` file (parsed by caarlos0/env)
- Router-based endpoints mounted in `internal/api/router.go`
- Middleware stack applied in `NewRouter()`
- Handlers grouped by domain (e.g., handler.go for multiple related endpoints)
- CORS configured for ["*"] origins (development-friendly)
- Request IDs generated per request, accessible via context
- All handlers return responses with explicit status codes and Content-Type headers
