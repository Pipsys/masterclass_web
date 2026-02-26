import logging
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.db.session import engine
from app.core.errors import error_response
from app.core.rate_limit import AuthRateLimitMiddleware
from app.routers import auth, workspaces, boards, tasks

app = FastAPI(title="Octopis")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.api_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if settings.auth_rate_limit_enabled:
    app.add_middleware(
        AuthRateLimitMiddleware,
        max_requests=settings.auth_rate_limit_requests,
        window_seconds=settings.auth_rate_limit_window_seconds,
    )

app.include_router(auth.router)
app.include_router(workspaces.router)
app.include_router(boards.router)
app.include_router(tasks.router)

logger = logging.getLogger("octopis.api")


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["x-request-id"] = request_id
    return response


@app.exception_handler(HTTPException)
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    message = detail if isinstance(detail, str) else "Request failed"
    details = None if isinstance(detail, str) else detail
    return error_response(
        status_code=exc.status_code,
        message=message,
        details=details,
        request_id=getattr(request.state, "request_id", None),
        headers=exc.headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return error_response(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        message="Validation failed",
        details=exc.errors(),
        request_id=getattr(request.state, "request_id", None),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled API error on %s %s", request.method, request.url.path, exc_info=exc)
    return error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        message="Internal server error",
        request_id=getattr(request.state, "request_id", None),
    )


@app.get("/")
async def root():
    return {"status": "ok"}


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/readyz")
async def readyz():
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception:
        return error_response(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            message="Database is not ready",
            request_id=None,
        )
