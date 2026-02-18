from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    project_name: str = "Tradsy"
    debug: bool = False

    # Database
    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/tradsy"
    database_sync_url: str | None = None  # Optional; derived from database_url if unset (Railway sets only DATABASE_URL)

    @property
    def database_url_async(self) -> str:
        """Ensure async driver (asyncpg) for SQLAlchemy async engine. Railway gives postgresql://."""
        url = self.database_url
        if url.startswith("postgresql://") and "asyncpg" not in url:
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    @property
    def effective_database_sync_url(self) -> str:
        """Sync URL for Alembic. Uses DATABASE_SYNC_URL if set, else derives from DATABASE_URL."""
        if self.database_sync_url:
            return self.database_sync_url
        url = self.database_url
        if "+asyncpg" in url:
            return url.replace("postgresql+asyncpg://", "postgresql://", 1)
        return url

    # Auth
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # CORS (comma-separated for multiple origins)
    frontend_origin: str = "http://localhost:5173"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.frontend_origin.split(",") if o.strip()]

    # OAuth / external
    google_client_id: str = ""
    google_client_secret: str = ""
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""
    tradingview_client_id: str = ""
    tradingview_client_secret: str = ""

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Broker (Alpaca) - for real execution
    alpaca_api_key: str = ""
    alpaca_api_secret: str = ""
    alpaca_base_url: str = "https://paper-api.alpaca.markets"  # Use paper for dev

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
