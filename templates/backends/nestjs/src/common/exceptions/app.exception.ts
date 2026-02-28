export class AppException extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppException.prototype);
  }
}

export class NotFoundException extends AppException {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    Object.setPrototypeOf(this, NotFoundException.prototype);
  }
}

export class PermissionException extends AppException {
  constructor(message: string = 'Permission denied') {
    super(message, 403);
    Object.setPrototypeOf(this, PermissionException.prototype);
  }
}
