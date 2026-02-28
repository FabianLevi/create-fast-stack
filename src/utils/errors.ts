/**
 * Custom error classes for create-fast-stack
 * Tagged errors for better error handling and debugging
 */

/**
 * Validation error — invalid input or configuration
 */
export class ValidationError extends Error {
  tag = "ValidationError" as const;

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Git error — git command failed
 */
export class GitError extends Error {
  tag = "GitError" as const;

  constructor(message: string) {
    super(message);
    this.name = "GitError";
  }
}

/**
 * Scaffold error — file generation or template issues
 */
export class ScaffoldError extends Error {
  tag = "ScaffoldError" as const;

  constructor(message: string) {
    super(message);
    this.name = "ScaffoldError";
  }
}
