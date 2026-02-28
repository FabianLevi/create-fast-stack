// Package handler defines HTTP request handlers for API endpoints.
package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"{{projectName}}/internal/middleware"
)

// Handler holds dependencies for all HTTP request handlers.
type Handler struct {
	log *slog.Logger
}

// New creates a new Handler with the given logger.
func New(log *slog.Logger) *Handler {
	return &Handler{log: log}
}

// healthResponse is the response structure for the health endpoint.
type healthResponse struct {
	Status    string `json:"status"`
	RequestID string `json:"request_id"`
}

// Health handles GET /health requests.
func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	requestID := middleware.RequestIDFromContext(r.Context())

	resp := healthResponse{
		Status:    "ok",
		RequestID: requestID,
	}

	json.NewEncoder(w).Encode(resp)
}
