import { AppError } from "@payvo/shared/error";
import { HttpStatusCode } from "@payvo/shared/http";
import ApiKeyErrorCode from "./ApiKeyErrorCode.js";

export class ApiKeyAlreadyExistsError extends AppError {
  constructor(
    message: string = "Active api key already exists for this merchant and environment",
  ) {
    super({
      message,
      statusCode: HttpStatusCode.Error.CONFLICT,
      code: ApiKeyErrorCode.API_KEY_ALREADY_EXISTS,
    });
  }
}

export class ApiKeyNotFoundError extends AppError {
  constructor(
    message: string = "No active api key found for this merchant and environment",
  ) {
    super({
      message,
      statusCode: HttpStatusCode.Error.NOT_FOUND,
      code: ApiKeyErrorCode.API_KEY_NOT_FOUND,
    });
  }
}

export class RevokedApiKeyError extends AppError {
  constructor(message: string = "Api key has already been revoked") {
    super({
      message,
      statusCode: HttpStatusCode.Error.CONFLICT,
      code: ApiKeyErrorCode.REVOKED_API_KEY,
    });
  }
}

export class InvalidApiKeyCredentialsError extends AppError {
  constructor(message: string = "Invalid api key id or secret") {
    super({
      message,
      statusCode: HttpStatusCode.Error.UNAUTHORIZED,
      code: ApiKeyErrorCode.INVALID_API_KEY_CREDENTIALS,
    });
  }
}
