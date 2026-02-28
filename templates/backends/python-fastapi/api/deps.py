import uuid

from fastapi import Request

from api.context import ApiContext


async def get_context(request: Request) -> ApiContext:
    """Create unified API context for the request."""
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))

    return ApiContext(request_id=request_id)
