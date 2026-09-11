import { AppError } from "@payvo/shared/error";
import { HttpStatusCode } from "@payvo/shared/http";
import UserErrorCode from "./UserErrorCode.js";

export class UserNotFoundError extends AppError {
  constructor(message: string = "User not found") {
    super({
      message,
      statusCode: HttpStatusCode.Error.NOT_FOUND,
      code: UserErrorCode.USER_NOT_FOUND,
    });
  }
}

export class UserDeletedError extends AppError {
  constructor(
    message: string = "Account has been deactivated. Please contact support for assistance.",
  ) {
    super({
      message,
      statusCode: HttpStatusCode.Error.FORBIDDEN,
      code: UserErrorCode.USER_DELETED,
    });
  }
}
