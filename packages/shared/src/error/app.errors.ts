import { StatusCode } from "../http/StatusCode.js";
import { AppError } from "./AppError.js";
import AppErrorCode from "./AppErrorCode.js";

export class BadRequestError extends AppError {
  constructor(message: string, details?: any) {
    super({
      message,
      code: AppErrorCode.BAD_REQUEST,
      statusCode: StatusCode.Error.BAD_REQUEST,
      details,
    });
  }
}

export class RateLimitExceededError extends AppError {
  constructor(message: string) {
    super({
      message,
      code: AppErrorCode.RATE_LIMIT_EXCEEDED,
      statusCode: StatusCode.Error.RATE_LIMIT,
    });
  }
}

export class InternalServerError extends AppError {
  constructor(message: string) {
    super({
      message,
      code: AppErrorCode.INTERNAL_SERVER,
      statusCode: StatusCode.Error.INTERNAL_SERVER,
    });
  }
}
