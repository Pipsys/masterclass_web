import asyncio
from collections import defaultdict, deque
from time import monotonic

from fastapi import Request, status
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.errors import error_response


class AuthRateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, *, max_requests: int, window_seconds: int):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    async def dispatch(self, request: Request, call_next):
        if not request.url.path.startswith("/auth/"):
            return await call_next(request)

        client_id = _extract_client_id(request)
        key = f"{client_id}:{request.url.path}"
        now = monotonic()
        retry_after = 0

        async with self._lock:
            bucket = self._events[key]
            threshold = now - self.window_seconds
            while bucket and bucket[0] <= threshold:
                bucket.popleft()

            if len(bucket) >= self.max_requests:
                retry_after = max(1, int(self.window_seconds - (now - bucket[0])))
            else:
                bucket.append(now)

        if retry_after > 0:
            request_id = getattr(request.state, "request_id", None)
            return error_response(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                message="Too many auth requests. Please retry later.",
                details={"retry_after_seconds": retry_after},
                request_id=request_id,
                headers={"Retry-After": str(retry_after)},
            )

        return await call_next(request)


def _extract_client_id(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        first = forwarded_for.split(",")[0].strip()
        if first:
            return first
    if request.client and request.client.host:
        return request.client.host
    return "unknown"
