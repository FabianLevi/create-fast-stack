//! Health check endpoint handler.

use axum::{Extension, Json};
use serde_json::{json, Value};

use crate::middleware::request_id::RequestId;

/// Handles GET /health requests.
pub async fn health(Extension(request_id): Extension<RequestId>) -> Json<Value> {
    Json(json!({
        "status": "ok",
        "request_id": request_id.0
    }))
}
