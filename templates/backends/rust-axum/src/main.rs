//! API server entry point.

mod config;
mod error;
mod handlers;
mod middleware;
mod routes;

use std::process;

use config::Config;

#[tokio::main]
async fn main() {
    // Load config
    let config = match Config::from_env() {
        Ok(cfg) => cfg,
        Err(err) => {
            eprintln!("failed to load config: {err}");
            process::exit(1);
        }
    };

    // Init tracing
    tracing_subscriber::fmt()
        .with_env_filter(&config.rust_log)
        .with_target(false)
        .init();

    // Build router
    let app = routes::create_router();

    // Start server
    let addr = format!("{}:{}", config.app_host, config.app_port);
    tracing::info!("starting server on {addr}");

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .unwrap_or_else(|err| {
            eprintln!("failed to bind {addr}: {err}");
            process::exit(1);
        });

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .unwrap_or_else(|err| {
            eprintln!("server error: {err}");
            process::exit(1);
        });
}

async fn shutdown_signal() {
    tokio::signal::ctrl_c()
        .await
        .expect("failed to install ctrl+c handler");
    tracing::info!("shutdown signal received");
}
