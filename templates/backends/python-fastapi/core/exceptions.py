"""Shared exceptions module."""


class AppException(Exception):
    """Base exception for application services."""

    pass


class PermissionException(AppException):
    """Raised when a user lacks permissions for an action."""

    def __init__(
        self,
        message: str | None = "User does not have the right to perform this action",
    ):
        self.message = message
        super().__init__(self.message)


class NotFoundException(AppException):
    """Raised when a requested object is not found."""

    def __init__(self, message: str | None = "Object not found"):
        self.message = message
        super().__init__(self.message)
