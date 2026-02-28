//! Router setup and middleware composition.

use axum::{middleware, routing::get, Router};
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

use crate::handlers;
use crate::middleware::request_id::request_id_middleware;

/// Creates the application router with all middleware and routes.
pub fn create_router() -> Router {
    Router::new()
        .route("/health", get(handlers::health::health))
        .layer(middleware::from_fn(request_id_middleware))
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive())
}
