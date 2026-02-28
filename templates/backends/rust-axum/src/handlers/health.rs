//! Health check endpoint handler.

use axum::response::IntoResponse;
use axum::{Extension, Json};
use serde_json::json;

use crate::error::AppError;
use crate::middleware::request_id::RequestId;

/// Handles GET /health requests.
pub async fn health(
    Extension(request_id): Extension<RequestId>,
) -> Result<impl IntoResponse, AppError> {
    Ok(Json(json!({
        "status": "ok",
        "request_id": request_id.0
    })))
}
