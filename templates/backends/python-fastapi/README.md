# {{projectName}}

Backend powered by [FastAPI](https://fastapi.tiangolo.com/).

## Quick Start

```bash
uv sync
uv run python -m api.main
```

Server runs at http://localhost:8000

## Endpoints

- `GET /health` — Health check

## Environment

Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

Default port is 8000, configurable via `PORT` environment variable.
