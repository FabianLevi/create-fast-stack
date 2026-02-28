from fastapi import APIRouter, Depends

from api import deps
from api.context import ApiContext

router = APIRouter()


@router.get("/health")
def health(ctx: ApiContext = Depends(deps.get_context)) -> dict[str, str]:
    """Health check endpoint."""
    return {
        "status": "ok",
        "request_id": ctx.request_id,
    }
