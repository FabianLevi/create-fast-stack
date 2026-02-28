.PHONY: run dev build lint fmt test

run:
	go run cmd/api/main.go

dev:
	air

build:
	go build -o bin/api cmd/api/main.go

lint:
	golangci-lint run ./...

fmt:
	gofmt -w .

test:
	go test ./...

install:
	go mod download
