import { AppError } from "@payvo/shared/error";
import AccountErrorCode from "./AccountErrorCode.js";
import { StatusCode } from "@payvo/shared/api";

export class AccountAlreadyExistsError extends AppError {
  constructor(message = "Account already exists") {
    super({
      message,
      code: AccountErrorCode.ACCOUNT_ALREADY_EXISTS,
      statusCode: StatusCode.Error.CONFLICT,
    });
  }
}

export class AccountNotFoundError extends AppError {
  constructor(message = "Account not found") {
    super({
      message,
      code: AccountErrorCode.ACCOUNT_NOT_FOUND,
      statusCode: StatusCode.Error.NOT_FOUND,
    });
  }
}
