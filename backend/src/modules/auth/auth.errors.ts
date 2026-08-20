import StatusCode from "@/core/api/StatusCode";
import AppError from "@/core/error/AppError";
import AuthErrorCode from "./AuthErrorCode";

export class EmailAlreadyExistsError extends AppError {
  constructor(message: string) {
    super({
      message,
      statusCode: StatusCode.Error.CONFLICT,
      code: AuthErrorCode.EMAIL_ALREADY_EXISTS,
    });
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message:string) {
    super({
      message,
      statusCode: StatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.INVALID_CREDENTIALS,
    });
  }
}

export class InvalidRefreshTokenError extends AppError {
  constructor(message:string) {
    super({
      message,
      statusCode: StatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.INVALID_REFRESH_TOKEN,
    });
  }
}

export class ExpiredRefreshTokenError extends AppError {
  constructor(message:string) {
    super({
      message,
      statusCode: StatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.EXPIRED_REFRESH_TOKEN,
    });
  }
}

export class RevokedRefreshTokenError extends AppError {
  constructor(message:string) {
    super({
      message,
      statusCode: StatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.REVOKED_REFRESH_TOKEN,
    });
  }
}

export class SessionExpiredError extends AppError{
  constructor(message:string){
    super({
      message,
      statusCode: StatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.SESSION_EXPIRED,
    })
  }
}

export class SessionRevokedError extends AppError{
  constructor(message:string){
    super({
      message,
      statusCode: StatusCode.Error.UNAUTHORIZED,
      code: AuthErrorCode.SESSION_REVOKED,
    })
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