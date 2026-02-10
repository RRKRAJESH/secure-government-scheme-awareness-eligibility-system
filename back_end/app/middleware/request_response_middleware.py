from fastapi import Request, Response
from datetime import datetime, timezone
from starlette.concurrency import run_in_threadpool
import socket
import json

from app.db.mongo import get_collection
from app.configs.config import settings

SENSITIVE_FIELDS = {
    "password",
    "pass",
    "pwd",
    "token",
    "access_token",
    "refresh_token",
    "authorization",
    "secret",
    "api_key"
}

def mask_sensitive_data(data):
    try:
        if isinstance(data, dict):
            return {
                key: (
                    "***MASKED***"
                    if key.lower() in SENSITIVE_FIELDS
                    else mask_sensitive_data(value)
                )
                for key, value in data.items()
            }
        return data
    except Exception as e:
        return data

def  get_request_log_collection():
    return get_collection(db_name= settings.PRODUCTION_DATABASE_NAME, collection_name= settings.REQUEST_RESPONSE_LOGGER_COLLECTION_NAME)

# MongoDB connection (or import from config/db.py)
async def log_request_response(request: Request, call_next):
    exclude_paths = ["/docs", "/redoc", "/openapi.json", "/favicon.ico"]
    if any(request.url.path.startswith(path) for path in exclude_paths):
        return await call_next(request)

    body = await request.body()
    try:    
        body_text = body.decode("utf-8", errors="ignore")
        body_data = mask_sensitive_data(json.loads(body_text) if body_text else {})
    except json.JSONDecodeError:
        body_data = {"raw": body_text}

    client_host = request.client.host if request.client else "unknown"
    try:
        hostname = socket.gethostbyaddr(client_host)[0]
    except Exception as e:
        print(f"Exception occured while getting the hostname {str(e)}")
        hostname = "unknown"

    response = await call_next(request)
    response_body = b""
    async for chunk in response.body_iterator:
        response_body += chunk

    new_response = Response(
        content=response_body,
        status_code=response.status_code,
        headers=dict(response.headers),
        media_type=response.media_type
    )

    try:
        decoded_response = response_body.decode("utf-8", errors="ignore")
        parsed_response = json.loads(decoded_response) if decoded_response else {}
    except json.JSONDecodeError:
        parsed_response = {"raw": decoded_response}

    log_entry = {
        "timestamp_utc": datetime.now(timezone.utc),
        "method": request.method,
        "url": str(request.url),
        "path": request.url.path,
        "client_ip": client_host,
        "host_name": hostname,
        "headers": dict(request.headers),
        "query_params": dict(request.query_params),
        "request_body": body_data,
        "response_status": response.status_code,
        "response_body": parsed_response,
        "user_agent": request.headers.get("user-agent"),
        "content_type": request.headers.get("content-type"),
        "http_version": request.scope.get("http_version"),
        "scheme": request.scope.get("scheme"),
        "server": request.scope.get("server"),
        "client": request.scope.get("client"),
    }

    await run_in_threadpool(get_request_log_collection().insert_one, log_entry)

    return new_response