import StatusCode from "@/core/api/StatusCode";
import AppError from "@/core/error/AppError";
import ApiKeyErrorCode from "./ApiKeyErrorCode";

export class ApiKeyNotFoundError extends AppError {
  constructor(message: string = "API key not found") {
    super({
      message,
      statusCode: StatusCode.Error.NOT_FOUND,
      code: ApiKeyErrorCode.API_KEY_NOT_FOUND,
    });
  }
}

export class ApiKeyAlreadyRevokedError extends AppError {
  constructor(message: string = "API key is already revoked") {
    super({
      message,
      statusCode: StatusCode.Error.CONFLICT,
      code: ApiKeyErrorCode.API_KEY_ALREADY_REVOKED,
    });
  }
}

export class ApiKeyInactiveError extends AppError {
  constructor(message: string = "API key is inactive") {
    super({
      message,
      statusCode: StatusCode.Error.CONFLICT,
      code: ApiKeyErrorCode.API_KEY_INACTIVE,
    });
  }
}


