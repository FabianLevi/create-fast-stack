// Package logger provides structured logging using slog.
package logger

import (
	"log/slog"
	"os"
	"strings"
)

// New creates a new slog.Logger configured with the given log level and environment.
//
// Valid log levels: debug, info, warn, error. Defaults to info if unrecognized.
// For "develop" environment, uses a text handler for human-readable output.
// For other environments, uses a JSON handler for machine-readable structured logs.
func New(level string, env string) *slog.Logger {
	// Parse log level
	var logLevel slog.Level
	switch strings.ToLower(level) {
	case "debug":
		logLevel = slog.LevelDebug
	case "info":
		logLevel = slog.LevelInfo
	case "warn":
		logLevel = slog.LevelWarn
	case "error":
		logLevel = slog.LevelError
	default:
		logLevel = slog.LevelInfo
	}

	var handler slog.Handler
	opts := &slog.HandlerOptions{
		Level: logLevel,
	}

	if strings.EqualFold(env, "develop") {
		handler = slog.NewTextHandler(os.Stdout, opts)
	} else {
		handler = slog.NewJSONHandler(os.Stdout, opts)
	}

	return slog.New(handler)
}
