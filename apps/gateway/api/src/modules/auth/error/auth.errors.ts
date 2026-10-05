import { AppError } from "@payvo/shared/error";
import AuthErrorCode from "./AuthErrorCode.js";
import { HttpStatusCode } from "@payvo/shared/http";

export class MissingApiKeyCredentialsError extends AppError {
  constructor(message: string = "Missing api key credentials") {
    super({
      message,
      code: AuthErrorCode.MISSING_API_KEY_CREDENTIALS,
      statusCode: HttpStatusCode.Error.UNAUTHORIZED,
    });
  }
}

export class InvalidApiKeyCredentialsError extends AppError {
  constructor(message: string = "Invalid api key credentials") {
    super({
      message,
      code: AuthErrorCode.INVALID_API_KEY_CREDENTIALS,
      statusCode: HttpStatusCode.Error.UNAUTHORIZED,
    });
  }
}

export class RevokedApiKeyError extends AppError {
  constructor(message: string = "Revoked api key") {
    super({
      message,
      code: AuthErrorCode.REVOKED_API_KEY,
      statusCode: HttpStatusCode.Error.UNAUTHORIZED,
    });
  }
}
