import time
import uuid
from typing import Callable

from fastapi import Request, Response

from core.logger import logger


async def add_request_id(request: Request, call_next: Callable) -> Response:
    """Generate and attach a request ID for tracing."""
    request.state.request_id = str(uuid.uuid4())
    return await call_next(request)


async def log_requests(request: Request, call_next: Callable) -> Response:
    """Log incoming requests with duration."""
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    logger.info(
        f"{request.method} {request.url} — {response.status_code} in {duration:.2f}s"
    )
    return response
