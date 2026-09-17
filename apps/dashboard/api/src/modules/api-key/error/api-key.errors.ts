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

export class InvalidApiKeyStatusError extends AppError {
  constructor(message: string = "Api key is not in valid status") {
    super({
      message,
      statusCode: HttpStatusCode.Error.CONFLICT,
      code: ApiKeyErrorCode.INVALID_API_KEY_STATUS,
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

export class RevokedApiKeyError extends AppError {
  constructor(message: string = "Api key is revoked") {
    super({
      message,
      statusCode: HttpStatusCode.Error.UNAUTHORIZED,
      code: ApiKeyErrorCode.REVOKED_API_KEY,
    });
  }
}
