from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    NODE_1_HOST: str
    NODE_1_PORT: str
    NODE_1_DB: str
    NODE_1_USER: str
    NODE_1_PASS: str

    NODE_2_HOST: str
    NODE_2_PORT: str
    NODE_2_DB: str
    NODE_2_USER: str
    NODE_2_PASS: str

    NODE_3_HOST: str
    NODE_3_PORT: str
    NODE_3_DB: str
    NODE_3_USER: str
    NODE_3_PASS: str

    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()
