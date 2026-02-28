// The api command runs the HTTP API server.
package main

import (
	"fmt"
	"net/http"
	"os"

	"{{projectName}}/internal/api"
	"{{projectName}}/internal/config"
	"{{projectName}}/internal/logger"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to load config: %v\n", err)
		os.Exit(1)
	}

	log := logger.New(cfg.LogLevel, cfg.AppEnv)

	router := api.NewRouter(log)

	addr := fmt.Sprintf("%s:%d", cfg.AppHost, cfg.AppPort)
	log.Info("starting server", "addr", addr)

	if err := http.ListenAndServe(addr, router); err != nil {
		log.Error("server error", "err", err)
		os.Exit(1)
	}
}
