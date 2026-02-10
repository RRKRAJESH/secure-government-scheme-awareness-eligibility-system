from pymongo import MongoClient
from typing import Dict
from app.configs.config import settings

_client: MongoClient | None = None
_dbs: Dict[str, any] = {}  # cache db handles


def init_client():
    global _client

    if not settings.DATABASE_CONNECTION_STRING:
        raise Exception("DATABASE_CONNECTION_STRING is not found...")

    _client = MongoClient(
        settings.DATABASE_CONNECTION_STRING,
        maxPoolSize=50,
        minPoolSize=5,
        serverSelectionTimeoutMS=5000,
    )

    # Verify connection
    _client.admin.command("ping")
    print("[Mongo] DB client connected", flush=True)


def get_client() -> MongoClient:
    if _client is None:
        raise Exception("Mongo client not initialized. Call init_client() first.")
    return _client


def get_db(db_name: str):
    if db_name not in _dbs:
        _dbs[db_name] = get_client()[db_name]
    return _dbs[db_name]


def get_collection(db_name: str, collection_name: str):
    return get_db(db_name)[collection_name]

def close_client():
    global _client, _dbs
    if _client:
        _client.close()
        print("[Mongo] Client closed", flush=True)
    _client = None
    _dbs = {}
