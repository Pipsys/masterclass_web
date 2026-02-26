from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Octopis"
    environment: str = "local"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/masterclass_web"
    api_cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    secret_key: str = "change_me"
    algorithm: str = "HS256"
    access_token_expires_minutes: int = 30  # Добавьте 's' в 'expires'
    refresh_token_expires_days: int = 7  # Добавьте 's' в 'expires'

    sql_echo: bool = False
    db_pool_pre_ping: bool = True
    db_pool_recycle_seconds: int = 1800
    auth_rate_limit_enabled: bool = True
    auth_rate_limit_requests: int = 20
    auth_rate_limit_window_seconds: int = 60

    @field_validator("api_cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    class Config:
        env_file = ".env"
        env_prefix = "OCTOPIS_"


settings = Settings()
