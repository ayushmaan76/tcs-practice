import os
try:
    from pydantic_settings import BaseSettings
except ImportError:
    class BaseSettings:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "tcs_practice.db")

class Settings(BaseSettings):
    PROJECT_NAME: str = "TCS Coding Practice & Mock Test Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "tcs_super_secret_key_change_in_production_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")
    
    # Code Execution Limits
    DEFAULT_TIME_LIMIT_SEC: float = 2.0
    DEFAULT_MEMORY_LIMIT_MB: int = 256
    MAX_OUTPUT_BYTES: int = 64 * 1024  # 64 KB limit for stdout/stderr
    
    # Docker Sandbox Settings
    USE_DOCKER_SANDBOX: bool = os.getenv("USE_DOCKER_SANDBOX", "false").lower() == "true"

settings = Settings()
