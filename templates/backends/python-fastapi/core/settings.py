from pydantic_settings import BaseSettings, SettingsConfigDict

from schemas.settings import Environment


class EnvSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    PROJECT_NAME: str = "{{projectName}}"

    APP_ENV: Environment | None = Environment.DEVELOP
    APP_HOST: str = "127.0.0.1"
    APP_PORT: int = 8000
    APP_WORKERS: int = 1
