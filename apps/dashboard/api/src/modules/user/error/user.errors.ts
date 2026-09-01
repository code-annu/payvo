import { AppError } from "@payvo/shared/error";
import UserErrorCode from "./UserErrorCode.js";
import { StatusCode } from "@payvo/shared/http";

export class UserNotFoundError extends AppError {
  constructor(message: string = "User not found") {
    super({
      message,
      statusCode: StatusCode.Error.NOT_FOUND,
      code: UserErrorCode.USER_NOT_FOUND,
    });
  }
}
