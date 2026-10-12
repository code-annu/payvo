import { AppError } from "./AppError.js";
import { StatusCode } from "../api/StatusCode.js";

export class BadRequestError extends AppError {
  constructor(
    message = "Bad Request",
    details?: unknown,
    code = "BAD_REQUEST",
  ) {
    super({
      message,
      statusCode: StatusCode.Error.BAD_REQUEST,
      code,
      details,
    });
  }
}

export class RateLimitExceededError extends AppError {
  constructor(
    message = "Rate limit exceeded. Please try again later.",
    details?: unknown,
    code = "RATE_LIMIT_EXCEEDED",
  ) {
    super({
      message,
      statusCode: StatusCode.Error.RATE_LIMIT,
      code,
      details,
    });
  }
}

// Alias for convenience
export const RateLimitError = RateLimitExceededError;
export type RateLimitError = RateLimitExceededError;

export class InternalServerError extends AppError {
  constructor(
    message = "Internal server error",
    details?: unknown,
    code = "INTERNAL_SERVER_ERROR",
  ) {
    super({
      message,
      statusCode: StatusCode.Error.INTERNAL_SERVER,
      code,
      details,
      isOperational: false,
    });
  }
}
