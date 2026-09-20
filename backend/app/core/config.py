import os
from pathlib import Path
from pydantic import BaseModel

class Settings:
    APP_NAME: str = "NyayaLens — AI Legal Document Intelligence & Guidance"
    TAGLINE: str = "Understand the law. Understand your document. Know your next step."
    DESCRIPTION: str = "Evidence-grounded GenAI legal document intelligence platform"
    VERSION: str = "1.0.0"
    
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: Path = BASE_DIR / "storage"
    DATA_DIR: Path = BASE_DIR / "data"
    
    # AI API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "nyayalens-super-secret-key-2026-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Defaults
    DEFAULT_JURISDICTION: str = "India"
    DEMO_MODE: bool = True
    MAX_FILE_SIZE_MB: int = 50

settings = Settings()
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
