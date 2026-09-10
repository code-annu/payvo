import { HttpStatusCode } from "../http";
import { AppError } from "./AppError";
import AppErrorCode from "./AppErrorCode";

export class BadRequestError extends AppError {
  constructor(message: string, details?: any) {
    super({
      message,
      code: AppErrorCode.BAD_REQUEST,
      statusCode: HttpStatusCode.Error.BAD_REQUEST,
      details,
    });
  }
}

export class RateLimitExceededError extends AppError {
  constructor(message: string) {
    super({
      message,
      code: AppErrorCode.RATE_LIMIT_EXCEEDED,
      statusCode: HttpStatusCode.Error.RATE_LIMIT,
    });
  }
}

export class InternalServerError extends AppError {
  constructor(message: string) {
    super({
      message,
      code: AppErrorCode.INTERNAL_SERVER,
      statusCode: HttpStatusCode.Error.INTERNAL_SERVER,
    });
  }
}
