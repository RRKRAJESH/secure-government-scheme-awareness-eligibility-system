from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_CONNECTION_STRING: str
    PRODUCTION_DATABASE_NAME: str
    USERS_COLLECTION_NAME: str
    USERS_PROFILE_COLLECTION_NAME: str
    REQUEST_RESPONSE_LOGGER_COLLECTION_NAME: str
    SCHEMES_COLLECTION_NAME: str
    SECRET_KEY: str
    ALGORITHM: str
    FRONT_END_BASE_URL: str

    class Config:
        env_file = "/home/ubuntu/final_year_project/secure-government-scheme-awareness-eligibility-system/.env"


settings = Settings()
