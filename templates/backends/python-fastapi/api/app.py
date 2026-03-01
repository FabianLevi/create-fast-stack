from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.endpoints import health
from api.middleware import add_request_id, log_requests
from core.settings import EnvSettings

env = EnvSettings()


def create_app() -> FastAPI:
    app = FastAPI(title=env.PROJECT_NAME)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.middleware("http")(add_request_id)
    app.middleware("http")(log_requests)

    app.include_router(health.router, tags=["health"])

    return app


app = create_app()
