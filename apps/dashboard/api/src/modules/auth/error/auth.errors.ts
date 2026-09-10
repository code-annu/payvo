import { AppError } from "@payvo/shared/error";
import { HttpStatusCode } from "@payvo/shared/http";
import AuthErrorCode from "./AuthErrorCode";

export class EmailAlreadyExists extends AppError {
  constructor(message: string = "Email already exists") {
    super({
      message,
      statusCode: HttpStatusCode.Error.CONFLICT,
      code: AuthErrorCode.EMAIL_ALREADY_EXISTS,
    });
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message: string = "Invalid auth credentials") {
    super({
      message,
      statusCode: HttpStatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.INVALID_CREDENTIALS,
    });
  }
}

export class InvalidRefreshTokenError extends AppError {
  constructor(message: string = "Invalid refresh token") {
    super({
      message,
      statusCode: HttpStatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.INVALID_REFRESH_TOKEN,
    });
  }
}

export class RevokedRefreshTokenError extends AppError {
  constructor(message: string = "Revoked refresh token") {
    super({
      message,
      statusCode: HttpStatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.REVOKED_REFRESH_TOKEN,
    });
  }
}

export class ExpiredSessionError extends AppError {
  constructor(message: string = "Expired session") {
    super({
      message,
      statusCode: HttpStatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.EXPIRED_SESSION,
    });
  }
}

export class SessionRevokedError extends AppError {
  constructor(message: string = "Session revoked") {
    super({
      message,
      statusCode: HttpStatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.REVOKED_SESSION,
    });
  }
}

export class InactiveUserError extends AppError {
  constructor(message: string = "Inactive user") {
    super({
      message,
      statusCode: HttpStatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.INACTIVE_USER,
    });
  }
}

export class InvalidAccessTokenError extends AppError {
  constructor(message: string = "Invalid access token") {
    super({
      message,
      statusCode: HttpStatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.INVALID_ACCESS_TOKEN,
    });
  }
}

export class MissingAccessTokenError extends AppError {
  constructor(message: string = "Missing access token") {
    super({
      message,
      statusCode: HttpStatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.MISSING_ACCESS_TOKEN,
    });
  }
}
