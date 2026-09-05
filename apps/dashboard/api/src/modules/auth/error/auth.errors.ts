import { AppError } from "@payvo/shared/error";
import AuthErrorCode from "./AuthErrorCode.js";
import { StatusCode } from "@payvo/shared/http";

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
      code: AuthErrorCode.EXPIRED_SESSION,
    });
  }
}

export class RevokedSessionError extends AppError {
  constructor(message: string = "This session is already revoked") {
    super({
      message,
      statusCode: StatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.EXPIRED_SESSION,
    });
  }
}

export class SessionExpiredError extends AppError {
  constructor(message: string) {
    super({
      message,
      statusCode: StatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.EXPIRED_SESSION,
    });
  }
}

export class SessionRevokedError extends AppError {
  constructor(message: string) {
    super({
      message,
      statusCode: StatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.REVOKED_SESSION,
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
