import StatusCode from "@/core/api/StatusCode";
import AppError from "@/core/error/AppError";
import UserErrorCode from "./UserErrorCode";

export class UserNotFoundError extends AppError {
  constructor(message: string) {
    super({
      message,
      statusCode: StatusCode.Error.NOT_FOUND,
      code: UserErrorCode.USER_NOT_FOUND,
    });
  }
}
