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
