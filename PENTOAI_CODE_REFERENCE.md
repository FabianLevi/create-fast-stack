# Pentoai Code Reference - Patterns to Adopt

Complete code samples from pentoai/ai-tooling-pp-backend for reference.

---

## 1. Database Session Management

**File**: `app/db/session.py`

```python
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.settings import EnvSettings

env = EnvSettings()


database_url_template = "postgresql+asyncpg://{user}:{password}@{server}/{db}"

database_url = database_url_template.format(
    user=env.DB_USER,
    password=env.DB_PASSWORD,
    server=env.DB_HOST,
    db=env.DB_NAME,
)

async_engine = create_async_engine(
    url=database_url,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_timeout=30,
    isolation_level="READ COMMITTED",
    connect_args={
        "command_timeout": 60,
    },
)

AsyncSessionLocal = async_sessionmaker(
    autocommit=False, autoflush=False, bind=async_engine
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async database session to be used in dependency injection.

    Yields:
        AsyncSession: An async database session

    """
    async with AsyncSessionLocal() as db:
        try:
            yield db
        finally:
            try:
                await db.close()
            except Exception:
                # Connection may have been closed by server; ignore on close
                pass
```

---

## 2. Database Initialization

**File**: `app/db/init_db.py`

```python
from app.db.session import async_engine
from app.models import Base


async def init_db() -> None:
    """Create all database tables.

    This function should be called on application startup to ensure
    all tables defined in the models are created in the database.
    """
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

---

## 3. Base Model with Timestamps

**File**: `app/models/_base.py`

```python
import uuid

from sqlalchemy import UUID, DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.core.utils.datetime_utils import utc_now_naive


class Base(DeclarativeBase):
    """Base class for all models."""

    id: Mapped[UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4, nullable=False, sort_order=-1
    )
    created_at: Mapped[DateTime] = mapped_column(
        DateTime, default=utc_now_naive, nullable=False, sort_order=1
    )
    modified_at: Mapped[DateTime] = mapped_column(
        DateTime,
        default=utc_now_naive,
        onupdate=utc_now_naive,
        nullable=False,
        sort_order=2,
    )
```

---

## 4. Example Model (Users)

**File**: `app/models/users.py`

```python
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.models._base import Base


class Users(Base):
    """User model representing application users."""

    __tablename__ = "users"
    __mapper_args__ = {"eager_defaults": True}

    name: Mapped[str] = mapped_column(String, nullable=True)
    email: Mapped[str] = mapped_column(String, unique=True)
    phone_number: Mapped[str] = mapped_column(String, nullable=True)
```

---

## 5. Model Exports

**File**: `app/models/__init__.py`

```python
from app.models._base import Base
from app.models.users import Users

__all__ = ["Base", "Users"]
```

---

## 6. Base Response Schema

**File**: `app/schemas/_base.py`

```python
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class BaseResponse(BaseModel):
    """Base response schema with common fields."""

    id: UUID
    created_at: datetime
    modified_at: datetime

    model_config = {"from_attributes": True}
```

---

## 7. Example Resource Schemas

**File**: `app/schemas/users.py`

```python
from pydantic import BaseModel, EmailStr

from app.schemas._base import BaseResponse


class UserBase(BaseModel):
    """Base schema for User."""

    email: EmailStr
    name: str | None = "Fabian"
    phone_number: str | None = None


class UserCreate(UserBase):
    """Schema for creating a User object."""

    pass


class UserUpdate(BaseModel):
    """Schema for updating a User object.

    All fields optional to support partial updates.
    """

    email: EmailStr | None = None
    name: str | None = None
    phone_number: str | None = None


class UserResponse(BaseResponse, UserBase):
    """Schema for User response."""

    pass
```

---

## 8. Generic CRUD Base Class

**File**: `app/crud/_base_crud.py`

```python
from typing import Any, Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.models._base import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CrudBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """CRUD for system-wide resources."""

    def __init__(self, model: type[ModelType]) -> None:
        """Initialize the CRUD object.

        Args:
            model (Type[ModelType]): The model to be used in the CRUD operations.
        """
        self.model = model

    async def get(self, db: AsyncSession, id: UUID) -> ModelType:
        """Get resource - no access control.

        Args:
            db (AsyncSession): The database session.
            id (UUID): The UUID of the object to get.

        Returns:
            Optional[ModelType]: The object with the given ID.
        """
        result = await db.execute(select(self.model).where(self.model.id == id))
        db_obj = result.unique().scalar_one_or_none()
        if not db_obj:
            raise NotFoundException(f"Object with ID {id} not found")
        return db_obj

    async def create(
        self,
        db: AsyncSession,
        *,
        obj_in: CreateSchemaType,
    ) -> ModelType:
        """Create resource.

        Args:
            db (AsyncSession): The database session.
            obj_in (CreateSchemaType): The object to create.

        Returns:
            ModelType: The created object.
        """
        obj_data = (
            obj_in
            if isinstance(obj_in, dict)
            else obj_in.model_dump(exclude_unset=True)
        )

        db_obj = self.model(**obj_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)

        return db_obj

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: ModelType,
        obj_in: UpdateSchemaType | dict[str, Any],
    ) -> ModelType:
        """Update resource.

        Args:
            db (AsyncSession): The database session.
            db_obj (ModelType): The object to update.
            obj_in (Union[UpdateSchemaType, dict[str, Any]]): The new object data.

        Returns:
            ModelType: The updated object.
        """
        obj_data = (
            obj_in
            if isinstance(obj_in, dict)
            else obj_in.model_dump(exclude_unset=True)
        )

        for field, value in obj_data.items():
            setattr(db_obj, field, value)

        await db.commit()
        await db.refresh(db_obj)

        return db_obj

    async def remove(
        self,
        db: AsyncSession,
        *,
        id: UUID,
    ) -> ModelType | None:
        """Delete resource.

        Args:
            db (AsyncSession): The database session.
            id (UUID): The UUID of the object to delete.

        Returns:
            Optional[ModelType]: The deleted object.
        """
        result = await db.execute(select(self.model).where(self.model.id == id))
        db_obj = result.unique().scalar_one_or_none()

        if db_obj is None:
            raise NotFoundException(f"Object with ID {id} not found")

        await db.delete(db_obj)
        await db.commit()

        return db_obj

    async def get_all(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
        disable_limit: bool = True,
    ) -> list[ModelType]:
        """Get multiple objects.

        Args:
            db (AsyncSession): The database session.
            skip (int): The number of objects to skip.
            limit (int): The number of objects to return.
            disable_limit (bool): Disable the limit parameter by default.

        Returns:
            List[ModelType]: A list of objects.

        """
        query = select(self.model).offset(skip)
        if not disable_limit:
            query = query.limit(limit)

        result = await db.execute(query)
        return list(result.unique().scalars().all())
```

---

## 9. Concrete CRUD Implementation

**File**: `app/crud/crud_users.py`

```python
from app.crud._base_crud import CrudBase
from app.models.users import Users
from app.schemas.users import UserCreate, UserUpdate


class CrudUsers(CrudBase[Users, UserCreate, UserUpdate]):
    """CRUD operations for Users."""

    pass


crud_users = CrudUsers(Users)
```

---

## 10. Complete Endpoint Example

**File**: `app/api/endpoints/users.py`

```python
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.api.context import ApiContext
from app.core.exceptions import NotFoundException
from app.crud.crud_users import crud_users
from app.db.session import get_db
from app.schemas.users import UserCreate, UserResponse, UserUpdate

router = APIRouter()


@router.get("", response_model=list[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _ctx: ApiContext = Depends(deps.get_context),
) -> list[UserResponse]:
    """List all users.

    Args:
        db: Database session.
        _ctx: API context with request metadata.

    Returns:
        List of all users.
    """
    users = await crud_users.get_all(db)
    return [UserResponse.model_validate(user) for user in users]


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
    _ctx: ApiContext = Depends(deps.get_context),
) -> UserResponse:
    """Create a new user.

    Args:
        body: User creation data.
        db: Database session.
        _ctx: API context with request metadata.

    Returns:
        The created user.
    """
    user = await crud_users.create(db, obj_in=body)
    return UserResponse.model_validate(user)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ctx: ApiContext = Depends(deps.get_context),
) -> UserResponse:
    """Get a user by ID.

    Args:
        user_id: The user's UUID.
        db: Database session.
        _ctx: API context with request metadata.

    Returns:
        The requested user.
    """
    try:
        user = await crud_users.get(db, user_id)
    except NotFoundException as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return UserResponse.model_validate(user)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    _ctx: ApiContext = Depends(deps.get_context),
) -> UserResponse:
    """Update a user by ID.

    Args:
        user_id: The user's UUID.
        body: User update data (partial).
        db: Database session.
        _ctx: API context with request metadata.

    Returns:
        The updated user.
    """
    try:
        db_obj = await crud_users.get(db, user_id)
    except NotFoundException as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    assert db_obj is not None  # get() raises NotFoundException if not found
    user = await crud_users.update(db, db_obj=db_obj, obj_in=body)
    return UserResponse.model_validate(user)


@router.delete("/{user_id}", response_model=UserResponse)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ctx: ApiContext = Depends(deps.get_context),
) -> UserResponse:
    """Delete a user by ID.

    Args:
        user_id: The user's UUID.
        db: Database session.
        _ctx: API context with request metadata.

    Returns:
        The deleted user.
    """
    try:
        user = await crud_users.remove(db, id=user_id)
    except NotFoundException as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return UserResponse.model_validate(user)
```

---

## 11. App with Lifespan

**File**: `app/api/app.py`

```python
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints import health, users
from app.api.middleware import add_request_id, log_requests
from app.core.settings import EnvSettings
from app.db.init_db import init_db

env = EnvSettings()


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Initialize database on startup."""
    await init_db()
    yield


app = FastAPI(title=env.PROJECT_NAME, port=env.APP_PORT, lifespan=lifespan)


origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.middleware("http")(add_request_id)
app.middleware("http")(log_requests)


app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(users.router, prefix="/users", tags=["users"])
```

---

## 12. Enhanced Settings

**File**: `app/core/settings.py`

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.schemas.settings import Environment


class EnvSettings(BaseSettings):
    """Environment settings loaded from .env file."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    PROJECT_NAME: str = "AI Tooling Backend"

    API_KEY_LENGTH: int = 32

    APP_ENV: Environment | None = Environment.DEVELOP
    APP_HOST: str = "127.0.0.1"
    APP_PORT: int = 8000
    APP_WORKERS: int = 1

    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""
    DB_HOST: str = "localhost"
    DB_NAME: str = "ai_tooling"
```

---

## 13. Updated Context with DB

**File**: `app/api/deps.py`

```python
import uuid

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.context import ApiContext
from app.db.session import get_db


async def get_context(
    request: Request,
    _db: AsyncSession = Depends(get_db),
) -> ApiContext:
    """Create unified API context for the request.

    This is the primary dependency for all API endpoints, providing:
    - Request tracking (request_id)

    """
    # Get request ID from middleware
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))

    return ApiContext(
        request_id=request_id,
    )
```

---

## 14. Docker Compose

**File**: `docker-compose.yml`

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: ai_tooling_db
    environment:
      POSTGRES_USER: ai_tooling
      POSTGRES_PASSWORD: ai_tooling1234!
      POSTGRES_DB: ai_tooling
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ai_tooling -d ai_tooling"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

volumes:
  postgres_data:
```

---

## 15. Enhanced pyproject.toml

**File**: `pyproject.toml`

```toml
[project]
name = "ai-tooling-pp-backend"
version = "0.1.0"
description = "Backend service for AI tooling"
requires-python = ">=3.11"
dependencies = [
    "asyncpg>=0.30.0",
    "fastapi>=0.109.0",
    "greenlet>=3.2.4",
    "load-dotenv>=0.1.0",
    "loguru>=0.7.3",
    "pydantic-settings>=2.11.0",
    "pydantic[email]>=2.11.9",
    "sqlalchemy>=2.0.43",
    "uvicorn[standard]>=0.27.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "httpx>=0.27.0",
]

[tool.uv]
dev-dependencies = [
    "pytest>=8.0.0",
    "httpx>=0.27.0",
    "ruff>=0.15.0",
    "pyright>=1.1.408",
    "pytest-asyncio>=1.3.0",
    "aiosqlite>=0.22.1",
]

[tool.pyright]
pythonVersion = "3.11"
typeCheckingMode = "basic"
venvPath = "."
venv = ".venv"

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
asyncio_default_fixture_loop_scope = "function"
markers = [
    "integration: marks tests as integration tests",
    "unit: marks tests as unit tests",
]
```

---

## 16. Ruff Configuration

**File**: `ruff.toml`

```toml
exclude = [
  ".bzr",
  ".direnv",
  ".eggs",
  ".git",
  ".git-rewrite",
  ".hg",
  ".mypy_cache",
  ".nox",
  ".pants.d",
  ".pytype",
  ".ruff_cache",
  ".svn",
  ".tox",
  ".venv",
  "venv",
  "__pypackages__",
  "_build",
  "buck-out",
  "build",
  "dist",
  "node_modules",
]

line-length = 88
indent-width = 4
target-version = "py311"

[lint]
select = [
  "F",      # pyflakes
  "I",      # isort
  "E",      # pycodestyle errors
  "W",      # pycodestyle warnings
  "ARG",    # flake8-unused-arguments
  "T201",   # print statements
  "D",      # pydocstyle (Google docstrings per CLAUDE.md)
  "ANN",    # flake8-annotations (type hints per CLAUDE.md)
  "B",      # flake8-bugbear
  "C4",     # flake8-comprehensions
  "UP",     # pyupgrade
]
fixable = ["I", "F", "UP"]
ignore = [
  "D100",   # Missing docstring in public module
  "D104",   # Missing docstring in public package
  "D107",   # Missing docstring in __init__
  "B008",   # Do not perform function call in argument defaults (false positive for FastAPI Depends)
]

# Allow unused variables when underscore-prefixed.
dummy-variable-rgx = "^(_+|(_+[a-zA-Z0-9_]*[a-zA-Z0-9]+?))$"

[lint.per-file-ignores]
"tests/**/*.py" = ["E712", "ARG001", "D", "ANN"]
"scripts/**/*.py" = ["T201", "D"]

[lint.pydocstyle]
convention = "google"

[lint.isort]
known-first-party = ["app"]

[format]
quote-style = "double"
indent-style = "space"
skip-magic-trailing-comma = false
line-ending = "auto"
```

---

## 17. .env.example

```
# Database
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_NAME=ai_tooling

# App
APP_ENV=develop
APP_HOST=127.0.0.1
APP_PORT=8000
```

---

## 18. Enhanced Exception Handling

**File**: `app/core/exceptions.py`

```python
"""Shared exceptions module."""


class BaseException(Exception):
    """Base exception for Backend services."""

    pass


class PermissionException(BaseException):
    """Exception raised when user lacks permissions."""

    def __init__(
        self,
        message: str | None = "User does not have the right to perform this action",
    ) -> None:
        """Create a new PermissionException instance.

        Args:
            message (str, optional): The error message. Has default message.

        """
        self.message = message
        super().__init__(self.message)


class NotFoundException(BaseException):
    """Exception raised when an object is not found."""

    def __init__(self, message: str | None = "Object not found") -> None:
        """Create a new NotFoundException instance.

        Args:
            message (str, optional): The error message. Has default message.

        """
        self.message = message
        super().__init__(self.message)
```
