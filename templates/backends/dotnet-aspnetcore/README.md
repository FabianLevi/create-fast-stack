# {{projectName}}

C# backend built with ASP.NET Core 10 + Carter.

## Quick Start

```bash
cp .env.example .env
dotnet restore
dotnet run
```

Server starts at `http://localhost:8000`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check — returns `{"status":"ok","request_id":"..."}` |
| GET | /hello | Greeting — returns `{"message":"Hello from {{baseName}}!","request_id":"..."}` |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| APP_ENV | develop | Environment (develop/staging/production) |
| APP_HOST | 0.0.0.0 | Bind address |
| APP_PORT | 8000 | Server port |

## Project Structure

```
Program.cs                  # Entry point, middleware pipeline
Modules/
└── Health/
    └── HealthModule.cs     # Health + hello endpoints (Carter module)
App.csproj                  # Project config and dependencies
```

## Development

```bash
dotnet watch                 # Hot reload
dotnet build                 # Build
```
