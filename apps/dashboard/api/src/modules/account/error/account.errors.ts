import { AppError } from "@payvo/shared/error";
import { HttpStatusCode } from "@payvo/shared/http";
import AccountErrorCode from "./AccountErrorCode.js";

export class AccountNotFoundError extends AppError {
  constructor(message: string = "Account not found") {
    super({
      message,
      code: AccountErrorCode.ACCOUNT_NOT_FOUND,
      statusCode: HttpStatusCode.Error.NOT_FOUND,
    });
  }
}