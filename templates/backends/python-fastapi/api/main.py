import uvicorn

from core.settings import EnvSettings
from schemas.settings import Environment

env = EnvSettings()

if __name__ == "__main__":
    uvicorn.run(
        "api.app:app",
        host=env.APP_HOST,
        port=env.APP_PORT,
        reload=env.APP_ENV == Environment.DEVELOP,
        workers=env.APP_WORKERS if env.APP_ENV == Environment.PRODUCTION else None,
    )
