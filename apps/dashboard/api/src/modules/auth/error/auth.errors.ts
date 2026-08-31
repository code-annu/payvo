import { StatusCode } from "@payvo/shared/api";
import { AppError } from "@payvo/shared/error";
import AuthErrorCode from "./AuthErrorCode.js";

export class EmailAlreadyExistsError extends AppError {
  constructor(message: string = "Email already exists") {
    super({
      message,
      statusCode: StatusCode.Error.CONFLICT,
      code: AuthErrorCode.EMAIL_ALREADY_EXISTS,
    });
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message: string = "Invalid credentials") {
    super({
      message,
      statusCode: StatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.INVALID_CREDENTIALS,
    });
  }
}

export class InvalidRefreshTokenError extends AppError {
  constructor(message: string = "Invalid refresh token") {
    super({
      message,
      statusCode: StatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.INVALID_REFRESH_TOKEN,
    });
  }
}

export class ExpiredSessionError extends AppError {
  constructor(message: string = "This session is already expired") {
    super({
      message,
      statusCode: StatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.EXPIRED_REFRESH_TOKEN,
    });
  }
}

export class RevokedSessionError extends AppError {
  constructor(message: string = "This session is already revoked") {
    super({
      message,
      statusCode: StatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.REVOKED_REFRESH_TOKEN,
    });
  }
}

export class SessionExpiredError extends AppError {
  constructor(message: string) {
    super({
      message,
      statusCode: StatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.SESSION_EXPIRED,
    });
  }
}

export class SessionRevokedError extends AppError {
  constructor(message: string) {
    super({
      message,
      statusCode: StatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.SESSION_REVOKED,
    });
  }
}

export class MissingAccessTokenError extends AppError {
  constructor(message: string) {
    super({
      message,
      statusCode: StatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.MISSING_ACCESS_TOKEN,
    });
  }
}

export class InvalidAccessTokenError extends AppError {
  constructor(message: string) {
    super({
      message,
      statusCode: StatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.INVALID_ACCESS_TOKEN,
    });
  }
}
