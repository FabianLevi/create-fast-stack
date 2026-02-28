# {{projectName}}

## Stack
- Python 3.12+, FastAPI, uvicorn, loguru
- Config: pydantic-settings
- Package manager: uv

## Commands
- Install: `uv sync`
- Dev: `uv run python -m api.main`
- Test: `uv run pytest`
- Lint: `ruff check . --fix`
- Format: `ruff format .`
- Add dep: `uv add <package>`

## Structure
```
api/
├── app.py              # App factory, CORS, middleware, routers
├── main.py             # Uvicorn entry point (env-based config)
├── context.py          # ApiContext model for request tracking
├── deps.py             # Dependency injection (get_context)
├── middleware.py        # Request ID + request logging
└── endpoints/
    └── health.py       # GET /health
core/
├── settings.py         # EnvSettings (pydantic-settings from .env)
├── logger.py           # Loguru setup + log_time context manager
├── exceptions.py       # AppException, NotFoundException, PermissionException
└── utils/
    └── datetime_utils.py  # utc_now(), utc_now_naive()
schemas/
└── settings.py         # Environment enum (develop/staging/production)
```

## Code Standards

### Type Hints
All functions must have type hints for parameters and return values:
```python
def get_user(user_id: UUID) -> UserResponse:
```

### Modern Python Syntax
- Use `str | None` instead of `Optional[str]`
- Use `list[str]` instead of `List[str]`
- Use `dict[str, Any]` instead of `Dict[str, Any]`

### Docstrings
Google-style docstrings on all public functions:
```python
def example(param: str) -> bool:
    """Short description.

    Args:
        param: Description of param.

    Returns:
        Description of return value.
    """
```

## Conventions
- snake_case for functions and variables
- Router-based endpoints (one router per domain)
- Dependency injection via `Depends(deps.get_context)`
- Pydantic schemas for all request/response validation
- Async endpoints preferred

## Environment
Config via `.env` file (pydantic-settings). See `.env.example`.
