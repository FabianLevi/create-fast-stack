// Package config loads application configuration from environment variables.
package config

import (
	"fmt"

	"github.com/caarlos0/env/v11"
)

// Config holds all configuration for the application.
type Config struct {
	ProjectName string `env:"PROJECT_NAME" envDefault:"{{projectName}}"` // name of the project
	AppEnv      string `env:"APP_ENV" envDefault:"develop"`              // environment (develop, staging, production)
	AppHost     string `env:"APP_HOST" envDefault:"0.0.0.0"`             // host address to listen on
	AppPort     int    `env:"APP_PORT" envDefault:"8000"`                // port to listen on
	LogLevel    string `env:"LOG_LEVEL" envDefault:"info"`               // log level (debug, info, warn, error)
}

// Load parses environment variables and returns a Config instance.
func Load() (*Config, error) {
	cfg := &Config{}
	if err := env.Parse(cfg); err != nil {
		return nil, fmt.Errorf("parse environment config: %w", err)
	}
	return cfg, nil
}
