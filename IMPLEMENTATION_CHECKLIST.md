# Implementation Checklist - Pentoai Patterns

Quick reference for adding patterns from pentoai's backend to your template.

---

## Phase 1: Database Infrastructure (Priority: HIGH)

- [ ] Create `app/db/` directory
- [ ] Add `app/db/__init__.py` (empty)
- [ ] Add `app/db/session.py` (async engine + get_db)
  - [ ] PostgreSQL+asyncpg URL construction
  - [ ] Connection pooling config (pool_pre_ping, pool_recycle, isolation_level)
  - [ ] AsyncSessionLocal factory
  - [ ] get_db() generator function
- [ ] Add `app/db/init_db.py` (startup initialization)
  - [ ] init_db() function that creates all tables

- [ ] Create `app/models/` directory
- [ ] Add `app/models/__init__.py`
  - [ ] Export Base and all model classes
- [ ] Add `app/models/_base.py` (DeclarativeBase)
  - [ ] UUID primary key with default=uuid.uuid4
  - [ ] created_at timestamp with default=utc_now_naive
  - [ ] modified_at timestamp with default + onupdate=utc_now_naive
  - [ ] sort_order hints for column ordering

- [ ] Update `app/api/app.py`
  - [ ] Add @asynccontextmanager lifespan
  - [ ] Call init_db() on startup
  - [ ] Add lifespan parameter to FastAPI()
  - [ ] Include example routers (health, users)

- [ ] Add `docker-compose.yml` (PostgreSQL)
  - [ ] postgres:16-alpine image
  - [ ] Environment variables (POSTGRES_USER, PASSWORD, DB)
  - [ ] Port mapping 5432:5432
  - [ ] Healthcheck configuration
  - [ ] Volume for data persistence

- [ ] Update `pyproject.toml`
  - [ ] Add asyncpg>=0.30.0
  - [ ] Add sqlalchemy>=2.0.43
  - [ ] Add pydantic[email]>=2.11.9
  - [ ] Add greenlet>=3.2.4
  - [ ] Add load-dotenv>=0.1.0
  - [ ] Add to dev: pytest-asyncio>=1.3.0
  - [ ] Add to dev: aiosqlite>=0.22.1

- [ ] Update `app/core/settings.py`
  - [ ] Add DB_USER config
  - [ ] Add DB_PASSWORD config
  - [ ] Add DB_HOST config
  - [ ] Add DB_NAME config
  - [ ] Add API_KEY_LENGTH (for future use)

- [ ] Create/Update `.env.example`
  - [ ] Add DB_USER=postgres
  - [ ] Add DB_PASSWORD=your_password_here
  - [ ] Add DB_HOST=localhost
  - [ ] Add DB_NAME=ai_tooling

---

## Phase 2: CRUD Patterns (Priority: HIGH)

- [ ] Create `app/crud/` directory
- [ ] Add `app/crud/__init__.py` (empty)
- [ ] Add `app/crud/_base_crud.py`
  - [ ] ModelType, CreateSchemaType, UpdateSchemaType TypeVars
  - [ ] CrudBase class (Generic)
  - [ ] async def get(db, id) → raises NotFoundException
  - [ ] async def create(db, obj_in) → commits and refreshes
  - [ ] async def update(db, db_obj, obj_in) → commits and refreshes
  - [ ] async def remove(db, id) → commits and refreshes
  - [ ] async def get_all(db, skip, limit, disable_limit) → returns list

- [ ] Add example `app/models/users.py`
  - [ ] Users class extending Base
  - [ ] __tablename__ = "users"
  - [ ] __mapper_args__ = {"eager_defaults": True}
  - [ ] Add example fields (name, email, phone_number)

- [ ] Update `app/models/__init__.py`
  - [ ] Export Base
  - [ ] Export Users

- [ ] Add `app/schemas/_base.py`
  - [ ] BaseResponse class
  - [ ] Fields: id (UUID), created_at, modified_at
  - [ ] model_config = {"from_attributes": True}

- [ ] Add example `app/schemas/users.py`
  - [ ] UserBase (inherits from BaseModel)
  - [ ] UserCreate (inherits from UserBase)
  - [ ] UserUpdate (all fields optional)
  - [ ] UserResponse (inherits BaseResponse + UserBase)
  - [ ] Use EmailStr for email validation

- [ ] Add example `app/crud/crud_users.py`
  - [ ] CrudUsers class extending CrudBase
  - [ ] crud_users instance (singleton)

- [ ] Add example `app/api/endpoints/users.py`
  - [ ] @router.get("") list_users
  - [ ] @router.post("", status_code=201) create_user
  - [ ] @router.get("/{user_id}") get_user
  - [ ] @router.put("/{user_id}") update_user
  - [ ] @router.delete("/{user_id}") delete_user
  - [ ] All endpoints use get_context dependency
  - [ ] Error handling with HTTPException + NotFoundException mapping

- [ ] Update `app/api/app.py`
  - [ ] Include users router at /users prefix
  - [ ] Tag as "users"

- [ ] Update `app/api/deps.py`
  - [ ] Add _db: AsyncSession = Depends(get_db) parameter
  - [ ] ApiContext still only needs request_id for now

---

## Phase 3: Polish (Priority: MEDIUM)

- [ ] Add `ruff.toml`
  - [ ] exclude list (common build/venv directories)
  - [ ] line-length = 88
  - [ ] target-version = "py311"
  - [ ] [lint] select rules: F, I, E, W, ARG, T201, D, ANN, B, C4, UP
  - [ ] [lint] ignore: D100, D104, D107, B008
  - [ ] [lint.per-file-ignores]: tests, scripts
  - [ ] [lint.pydocstyle]: convention = "google"
  - [ ] [lint.isort]: known-first-party = ["app"]
  - [ ] [format]: double quotes, space indentation

- [ ] Update `pyproject.toml`
  - [ ] Add [tool.pyright] section
  - [ ] pythonVersion = "3.11"
  - [ ] typeCheckingMode = "basic"
  - [ ] venvPath = "."
  - [ ] venv = ".venv"
  - [ ] Add [tool.pytest.ini_options]
  - [ ] testpaths = ["tests"]
  - [ ] asyncio_mode = "auto"

- [ ] Update `app/core/exceptions.py`
  - [ ] Add BaseException class
  - [ ] Add PermissionException class
  - [ ] Keep NotFoundException class

- [ ] Update `app/api/context.py`
  - [ ] Add docstring "Unified context for API requests"
  - [ ] request_id: str field

- [ ] Update `CLAUDE.md` in templates directory
  - [ ] Document new directory structure (models, crud, db)
  - [ ] Add database setup instructions
  - [ ] Document CRUD pattern with example
  - [ ] Add docker-compose startup instructions

---

## Testing (Priority: MEDIUM)

- [ ] Create `tests/` directory
- [ ] Add `tests/conftest.py`
  - [ ] SQLite in-memory database fixture for tests
  - [ ] AsyncSession fixture
  - [ ] Override get_db dependency

- [ ] Add `tests/test_users.py`
  - [ ] Test create_user endpoint
  - [ ] Test get_user endpoint
  - [ ] Test list_users endpoint
  - [ ] Test update_user endpoint
  - [ ] Test delete_user endpoint
  - [ ] Test 404 not found

---

## Verification

- [ ] `uv sync` installs all dependencies
- [ ] `docker-compose up -d` starts PostgreSQL
- [ ] `uv run python -m app.api.main` starts server
- [ ] `GET http://localhost:8000/health` returns 200
- [ ] `POST http://localhost:8000/users` creates user
- [ ] `GET http://localhost:8000/users/{id}` retrieves user
- [ ] `PUT http://localhost:8000/users/{id}` updates user
- [ ] `DELETE http://localhost:8000/users/{id}` deletes user
- [ ] `ruff check .` passes linting
- [ ] `pyright .` passes type checking
- [ ] `uv run pytest` passes all tests

---

## NOT On Checklist (Skip These)

- ~~Alembic migrations~~ (too opinionated, can be added later)
- ~~Authentication/JWT~~ (domain-specific)
- ~~Celery tasks~~ (premature optimization)
- ~~Redis caching~~ (add only when needed)
- ~~S3/file uploads~~ (business logic, not infrastructure)

---

## Time Estimate

- Phase 1 (Database): 1-2 hours
- Phase 2 (CRUD): 1-2 hours
- Phase 3 (Polish): 30-60 minutes
- Testing: 30-60 minutes
- **Total: 3.5-5.5 hours**

Most value comes from Phase 1-2. Phase 3 can be done incrementally.

---

## Quick Wins (Do First)

1. Add docker-compose.yml (5 mins) → enables local database
2. Add db/session.py (10 mins) → enables database access
3. Add models/_base.py (5 mins) → reduces model boilerplate
4. Add crud/_base_crud.py (15 mins) → enables 80% of CRUD operations
5. Update app.py with lifespan (10 mins) → connects database to startup

**Total: 45 mins for maximum value**
