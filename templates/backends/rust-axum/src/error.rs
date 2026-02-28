//! Centralized error types with HTTP response mapping.

use axum::{http::StatusCode, response::IntoResponse, Json};
use serde_json::json;

/// Application-level error type.
///
/// Variants are available for handlers to return typed HTTP errors.
/// Extend this enum as new error cases are needed.
#[derive(Debug, thiserror::Error)]
#[allow(dead_code)]
pub enum AppError {
    /// Internal server error.
    #[error("internal server error")]
    Internal,

    /// Configuration error.
    #[error("configuration error: {0}")]
    Config(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        let (status, message) = match &self {
            Self::Internal => (StatusCode::INTERNAL_SERVER_ERROR, "internal server error"),
            Self::Config(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.as_str()),
        };
        (status, Json(json!({"error": message}))).into_response()
    }
}
