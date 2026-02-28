// Package middleware provides HTTP middleware for the API.
package middleware

import (
	"context"
	"net/http"

	"github.com/google/uuid"
)

// requestIDContextKey is the context key for storing request IDs.
type requestIDContextKey string

const requestIDKey requestIDContextKey = "request_id"

// RequestID middleware generates a unique request ID and stores it in the request context.
func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID := uuid.New().String()

		// Store in context
		ctx := context.WithValue(r.Context(), requestIDKey, requestID)
		r = r.WithContext(ctx)

		// Set response header
		w.Header().Set("X-Request-ID", requestID)

		next.ServeHTTP(w, r)
	})
}

// RequestIDFromContext extracts the request ID from the context.
func RequestIDFromContext(ctx context.Context) string {
	requestID, ok := ctx.Value(requestIDKey).(string)
	if !ok {
		return ""
	}
	return requestID
}
