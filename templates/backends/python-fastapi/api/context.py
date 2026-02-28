from pydantic import BaseModel


class ApiContext(BaseModel):
    """Unified context for API requests."""

    request_id: str
