from typing import Any

from fastapi import status
from fastapi.responses import JSONResponse


STATUS_CODE_MAP = {
    status.HTTP_400_BAD_REQUEST: "bad_request",
    status.HTTP_401_UNAUTHORIZED: "unauthorized",
    status.HTTP_403_FORBIDDEN: "forbidden",
    status.HTTP_404_NOT_FOUND: "not_found",
    status.HTTP_409_CONFLICT: "conflict",
    status.HTTP_422_UNPROCESSABLE_ENTITY: "validation_error",
    status.HTTP_429_TOO_MANY_REQUESTS: "rate_limited",
    status.HTTP_500_INTERNAL_SERVER_ERROR: "internal_error",
    status.HTTP_503_SERVICE_UNAVAILABLE: "service_unavailable",
}


def build_error_payload(
    *,
    status_code: int,
    message: str,
    details: Any = None,
    request_id: str | None = None,
    code: str | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "error": {
            "code": code or STATUS_CODE_MAP.get(status_code, "request_error"),
            "message": message,
        }
    }
    if details is not None:
        payload["error"]["details"] = details
    if request_id:
        payload["error"]["request_id"] = request_id
    return payload


def error_response(
    *,
    status_code: int,
    message: str,
    details: Any = None,
    request_id: str | None = None,
    code: str | None = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content=build_error_payload(
            status_code=status_code,
            message=message,
            details=details,
            request_id=request_id,
            code=code,
        ),
        headers=headers,
    )
