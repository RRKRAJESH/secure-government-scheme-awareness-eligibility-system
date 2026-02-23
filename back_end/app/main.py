from fastapi import FastAPI, Request , HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

from app.db.mongo import init_client, close_client
from app.middleware.request_response_middleware import log_request_response
from app.services.error import _default_status_text
from app.api.v1.auth import router as auth_router
from app.api.v1.update_profile import router as profile_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    init_client()
    yield
    # shutdown
    close_client()

version = "v1"

app = FastAPI(title="Secure Government Scheme Awareness and Eligibility System", root_path=f"/api/{version}/backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.middleware("http")(log_request_response)
app.include_router(auth_router, prefix= "/auth", tags= ["Authentication"])
app.include_router(profile_router, prefix= "/profile", tags= ["Profile Information"])

#Handle HTTPException (from raise_http_error or manual raises)
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "data" in exc.detail:
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.detail  # Already in your error format
        )

    # Fallback (e.g., FastAPI raised an HTTPException with string detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "data": {
                "statusCode": exc.status_code,
                "statusText": _default_status_text(exc.status_code),
                "errorMessage": str(exc.detail),
                "errorData": {}
            }
        }
    )

#Handle Pydantic validation errors (body, query, path, etc.)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Extract detailed error messages from the validation error
    error_messages = []
    for error in exc.errors():
        error_messages.append({
            "loc": error.get('loc'),
            "msg": error.get('msg'),
            "type": error.get('type')
        })


    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "data": {
                "statusCode": 422,
                "statusText": "Unprocessable Entity",
                "errorMessage": "Validation failed",
                "errorData": error_messages[0]  # Provide more detailed validation info
            }
        }
    )