//! Application configuration loaded from environment variables.

use serde::Deserialize;

/// Config holds all application configuration.
#[derive(Deserialize, Clone, Debug)]
pub struct Config {
    /// Port to listen on (default: 8000).
    #[serde(default = "default_port")]
    pub app_port: u16,
    /// Log level filter (default: "info").
    #[serde(default = "default_log_level")]
    pub rust_log: String,
    /// Environment name (default: "develop").
    #[serde(default = "default_env")]
    pub app_env: String,
    /// Host address to bind (default: "0.0.0.0").
    #[serde(default = "default_host")]
    pub app_host: String,
}

fn default_port() -> u16 {
    8000
}

fn default_log_level() -> String {
    "info".to_string()
}

fn default_env() -> String {
    "develop".to_string()
}

fn default_host() -> String {
    "0.0.0.0".to_string()
}

impl Config {
    /// Load configuration from environment variables and optional .env file.
    pub fn from_env() -> Result<Self, envy::Error> {
        dotenvy::dotenv().ok();
        envy::from_env::<Self>()
    }
}
