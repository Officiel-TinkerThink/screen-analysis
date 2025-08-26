import os
from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    PROJECT_NAME: str = "Screen Analysis"
    VERSION: str = "1.0.0"
    API_STR: str = "/api"
    
    # Docker Ollama Settings
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "ollama")
    OLLAMA_PORT: str = os.getenv("OLLAMA_PORT", "11434")
    OLLAMA_URL: str = f"http://{OLLAMA_HOST}:{OLLAMA_PORT}/api/generate"

    # # Local Ollama Settings
    # OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "localhost")
    # OLLAMA_PORT: str = os.getenv("OLLAMA_PORT", "11434")
    # OLLAMA_URL: str = f"http://{OLLAMA_HOST}:{OLLAMA_PORT}/api/generate"
    
    # Application Settings
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
    
    # File Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STATIC_DIR: Path = BASE_DIR / "static"
    TEMPLATES_DIR: Path = BASE_DIR / "templates"

settings = Settings()
