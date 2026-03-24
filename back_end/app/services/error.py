from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException
from typing import Optional


def raise_http_error(
    status_code: int,
    message: str,
    status_text: Optional[str] = None,
    error_data: Optional[dict] = None,
):
    raise HTTPException(
        status_code=status_code,
        detail={
            "error": True,
            "data": {
                "statusCode": status_code,
                "statusText": status_text or _default_status_text(status_code),
                "errorMessage": message,
                "errorData": error_data or {}
            }
        }
    )

def _default_status_text(code: int) -> str:
    mapping = {
        400: "Bad Request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Not Found",
        409: "Conflict",
        422: "Unprocessable Entity",
        500: "Internal Server Error",
    }
    return mapping.get(code, "Unknown Error")