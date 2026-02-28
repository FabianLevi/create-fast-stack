# {{projectName}} — Rust Axum Backend

Comprehensive coding standards for this project. Follow these rules in all code.

## Stack

- **Language**: Rust 2021 edition
- **Web Framework**: Axum 0.8
- **Async Runtime**: Tokio
- **Logging**: tracing + tracing-subscriber
- **HTTP**: tower-http (CORS, middleware, utilities)
- **Serialization**: serde + serde_json
- **Configuration**: dotenvy + envy
- **Error Handling**: thiserror
- **ID Generation**: uuid

## Commands

```bash
# Development
cargo run

# Build
cargo build --release

# Lint (strict: all + pedantic)
cargo clippy

# Format
cargo fmt

# Test
cargo test

# Quick check
cargo check
```

## Project Structure

```
src/
  main.rs             Entry point, server startup, graceful shutdown
  config.rs           Config struct, from_env() loader
  error.rs            AppError enum, HTTP response mapping
  routes.rs           create_router(), middleware layers
  handlers/
    mod.rs            Public handler exports
    health.rs         GET /health endpoint
  middleware/
    mod.rs            Public middleware exports
    request_id.rs     Request ID generation and extension
```

## Code Standards

### Documentation

Every public item MUST have a doc comment.

**Functions/Methods**:
```rust
/// Handles GET /health requests.
pub async fn health(Extension(request_id): Extension<RequestId>) -> Json<Value> {
    // ...
}
```

**Types/Structs**:
```rust
/// Config holds all application configuration.
#[derive(Deserialize, Clone, Debug)]
pub struct Config {
    /// Port to listen on (default: 8000).
    pub app_port: u16,
}
```

**Modules** (use //! at top):
```rust
//! HTTP request handlers for API endpoints.

pub mod health;
```

**Fallible Functions**: Add `# Errors` section:
```rust
/// Load configuration from environment variables.
///
/// # Errors
///
/// Returns `envy::Error` if required env vars are missing.
pub fn from_env() -> Result<Self, envy::Error> {
    // ...
}
```

### Error Handling

**RULE**: Never use `.unwrap()` in production code except as documented below.

**Pattern 1: Use `?` operator**
```rust
let config = Config::from_env()?;
```

**Pattern 2: For invariants only, use `.expect()` with message**
```rust
response.headers_mut().insert(
    "x-request-id",
    id.parse()
        .expect("UUID is valid header value"),
);
```

**Pattern 3: Fatal startup errors use `.unwrap_or_else()`**
```rust
let listener = tokio::net::TcpListener::bind(&addr)
    .await
    .unwrap_or_else(|err| {
        eprintln!("failed to bind {addr}: {err}");
        process::exit(1);
    });
```

**Define errors with thiserror**:
```rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("internal server error")]
    Internal,
    #[error("not found: {0}")]
    NotFound(String),
}
```

Implement `IntoResponse` for HTTP mapping:
```rust
impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        let (status, msg) = match self {
            Self::Internal => (StatusCode::INTERNAL_SERVER_ERROR, "error"),
            Self::NotFound(id) => (StatusCode::NOT_FOUND, &format!("{id}")),
        };
        (status, Json(json!({"error": msg}))).into_response()
    }
}
```

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Functions | snake_case | `handle_request` |
| Variables | snake_case | `request_id` |
| Types | PascalCase | `AppError`, `Config` |
| Traits | PascalCase | `Handler` |
| Constants | SCREAMING_SNAKE_CASE | `DEFAULT_PORT` |
| Modules | snake_case | `middleware`, `handlers` |
| Method prefixes | `as_`, `to_`, `into_` | `as_str()`, `to_string()`, `into_response()` |

### Async

**RULE**: Always use Tokio. Never mix runtimes.

**RULE**: Never hold locks (Mutex, RwLock) across `.await`.

**Correct**:
```rust
let value = {
    let state = state.lock().await;
    state.value.clone()
};  // lock dropped before await
do_something_async(value).await;
```

**Wrong**:
```rust
let state = state.lock().await;
do_something_async(state.value).await;  // lock held across await!
```

**Spawning concurrent tasks**:
```rust
tokio::spawn(async {
    // background work
});
```

### Type Safety

**Accept `&str`, not `&String`**:
```rust
// Good
pub fn process(name: &str) -> Result<(), Error> { /* */ }

// Avoid
pub fn process(name: &String) -> Result<(), Error> { /* */ }
```

**Accept `&[T]`, not `&Vec<T>`**:
```rust
// Good
pub fn handle_items(items: &[String]) { /* */ }

// Avoid
pub fn handle_items(items: &Vec<String>) { /* */ }
```

**Use newtype wrappers for IDs**:
```rust
#[derive(Clone, Debug)]
pub struct RequestId(pub String);

#[derive(Clone, Debug)]
pub struct UserId(pub String);
```

**Use enums for states**:
```rust
#[derive(Debug, Clone)]
pub enum Status {
    Active,
    Inactive,
    Pending,
}
```

### Clippy & Linting

Enabled in `Cargo.toml`:
```toml
[lints.clippy]
all = "warn"
pedantic = "warn"

[lints.rust]
unsafe_code = "deny"
```

Run `cargo clippy` before committing. Fix all warnings.

### Performance

- Use `with_capacity()` when size is known:
  ```rust
  let mut vec = Vec::with_capacity(10);
  ```
- Prefer iterators over indexing:
  ```rust
  // Good
  items.iter().map(|x| x * 2).collect()

  // Avoid
  for i in 0..items.len() { items[i] *= 2; }
  ```
- Clone only when necessary; use references
- Profile before optimizing (`cargo flamegraph`)

## Handler Pattern

```rust
/// Handles GET /endpoint requests.
pub async fn endpoint_name(
    Extension(request_id): Extension<RequestId>,
    // other extractors...
) -> Json<Value> {
    Json(json!({
        "status": "ok",
        "request_id": request_id.0
    }))
}
```

Handlers use Axum extractors:
- `Extension<T>` — Values from middleware
- `Path<T>` — URL path params
- `Query<T>` — Query string params
- `Json<T>` — Request body
- `State<T>` — Shared app state

## Middleware Pattern

Use `axum::middleware::from_fn`:

```rust
pub async fn my_middleware(mut req: Request, next: Next) -> Response {
    // Pre-processing
    let start = Instant::now();

    let response = next.run(req).await;

    // Post-processing
    let duration = start.elapsed();
    tracing::info!(duration_ms = duration.as_millis(), "request handled");

    response
}
```

Apply in router:
```rust
Router::new()
    .route("/endpoint", get(handler))
    .layer(middleware::from_fn(my_middleware))
```

## Logging with tracing

Initialize in main:
```rust
tracing_subscriber::fmt()
    .with_env_filter(&config.rust_log)
    .with_target(false)
    .init();
```

Use macros:
```rust
tracing::info!("starting server on {addr}");
tracing::warn!("request failed: {err}");
tracing::error!("fatal: {err}");
tracing::debug!("detailed info: {value}");
```

With structured fields:
```rust
tracing::info!(
    request_id = %request_id.0,
    method = %req.method(),
    uri = %req.uri(),
    "request received"
);
```

## Conventions

### Configuration

Load from .env and environment variables:

```rust
pub fn from_env() -> Result<Self, envy::Error> {
    dotenvy::dotenv().ok();  // Load .env if present
    envy::from_env::<Self>()  // Parse env vars
}
```

Use sensible defaults:
```rust
#[serde(default = "default_port")]
pub app_port: u16,

fn default_port() -> u16 { 8000 }
```

### CORS

For development, use permissive:
```rust
.layer(CorsLayer::permissive())
```

For production, configure:
```rust
.layer(
    CorsLayer::new()
        .allow_origin("https://example.com".parse().unwrap())
        .allow_methods([Method::GET, Method::POST])
)
```

### Request IDs

Every request gets a unique UUID via middleware:

```rust
pub async fn request_id_middleware(mut req: Request, next: Next) -> Response {
    let id = Uuid::new_v4().to_string();
    req.extensions_mut().insert(RequestId(id.clone()));

    let mut response = next.run(req).await;
    response.headers_mut().insert("x-request-id", id.parse().unwrap());
    response
}
```

Extract in handlers:
```rust
pub async fn handler(Extension(request_id): Extension<RequestId>) {
    tracing::info!(request_id = %request_id.0, "handling request");
}
```

### Graceful Shutdown

Listen for Ctrl+C:

```rust
async fn shutdown_signal() {
    tokio::signal::ctrl_c()
        .await
        .expect("failed to install ctrl+c handler");
    tracing::info!("shutdown signal received");
}

// In main:
axum::serve(listener, app)
    .with_graceful_shutdown(shutdown_signal())
    .await
    .unwrap_or_else(|err| {
        eprintln!("server error: {err}");
        process::exit(1);
    });
```

---

**Last Updated**: 2026-02-28
