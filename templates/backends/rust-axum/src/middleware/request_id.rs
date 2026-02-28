//! Request ID middleware for request tracing.

use axum::{extract::Request, middleware::Next, response::Response};
use uuid::Uuid;

/// Newtype wrapper for request IDs.
#[derive(Clone, Debug)]
pub struct RequestId(pub String);

/// Middleware that generates a unique request ID per request.
pub async fn request_id_middleware(mut req: Request, next: Next) -> Response {
    let id = Uuid::new_v4().to_string();
    req.extensions_mut().insert(RequestId(id.clone()));

    let mut response = next.run(req).await;
    response.headers_mut().insert(
        "x-request-id",
        id.parse()
            .expect("UUID is valid header value"),
    );
    response
}
