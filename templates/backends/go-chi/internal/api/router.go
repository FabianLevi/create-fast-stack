// Package api defines the HTTP API router and routes.
package api

import (
	"log/slog"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"{{projectName}}/internal/handler"
	mw "{{projectName}}/internal/middleware"
)

// NewRouter creates and configures the chi router with all middleware and routes.
//
// Middleware stack: CORS, RequestID, Logging, Recovery, ContentType.
func NewRouter(log *slog.Logger) *chi.Mux {
	r := chi.NewRouter()

	// CORS middleware
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"X-Request-ID"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// Custom middleware stack
	r.Use(mw.RequestID)
	r.Use(mw.Logging(log))
	r.Use(mw.Recovery(log))
	r.Use(middleware.AllowContentType("application/json"))

	// Handlers
	h := handler.New(log)

	// Routes
	r.Get("/health", h.Health)

	return r
}
