from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Gemini
    gemini_api_key: str = "gemini-placeholder"
    gemini_model: str = "gemini-2.5-flash-lite"
    gemini_embedding_model: str = "gemini-embedding-001"

    # ChromaDB
    chroma_persist_dir: str = "./chroma_db"
    chroma_collection_name: str = "institute_knowledge"

    # App
    app_secret_key: str = "dev-secret-key"
    app_env: str = "development"
    cors_origins: str = "http://localhost:3000"

    # Human Agent Hours
    agent_start_hour: int = 9
    agent_end_hour: int = 17

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()