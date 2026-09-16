import { AppError } from "@payvo/shared/error";
import { HttpStatusCode } from "@payvo/shared/http";
import ApiKeyErrorCode from "./ApiKeyErrorCode.js";

export class ApiKeyNotFoundError extends AppError {
  constructor(message: string = "Api key not found") {
    super({
      message,
      statusCode: HttpStatusCode.Error.NOT_FOUND,
      code: ApiKeyErrorCode.API_KEY_NOT_FOUND,
    });
  }
}

export class ApiKeyAlreadyExistsError extends AppError {
  constructor(message: string = "Api key already exists") {
    super({
      message,
      statusCode: HttpStatusCode.Error.CONFLICT,
      code: ApiKeyErrorCode.API_KEY_ALREADY_EXISTS,
    });
  }
}

export class ApiKeyInvalidError extends AppError {
  constructor(message: string = "Api key invalid") {
    super({
      message,
      statusCode: HttpStatusCode.Error.UNAUTHORIZED,
      code: ApiKeyErrorCode.API_KEY_INVALID,
    });
  }
}

export class ApiKeyRevokedError extends AppError {
  constructor(message: string = "Api key revoked") {
    super({
      message,
      statusCode: HttpStatusCode.Error.UNAUTHORIZED,
      code: ApiKeyErrorCode.API_KEY_REVOKED,
    });
  }
}
