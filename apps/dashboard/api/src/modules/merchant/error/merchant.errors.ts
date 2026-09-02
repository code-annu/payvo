import { AppError } from "@payvo/shared/error";
import MerchantErrorCode from "./MerchantErrorCode.js";
import { StatusCode } from "@payvo/shared/http";

export class MerchantNotFoundError extends AppError {
  constructor(message: string = "Merchant not found") {
    super({
      message,
      statusCode: StatusCode.Error.NOT_FOUND,
      code: MerchantErrorCode.MERCHANT_NOT_FOUND,
    });
  }
}

export class MerchantInactiveError extends AppError {
  constructor(message: string = "Merchant is not active") {
    super({
      message,
      statusCode: StatusCode.Error.CONFLICT,
      code: MerchantErrorCode.MERCHANT_INACTIVE,
    });
  }
}

export class MerchantUserMismatchError extends AppError {
  constructor(
    message: string = "User is not authorized for this merchant",
  ) {
    super({
      message,
      statusCode: StatusCode.Error.FORBIDDEN,
      code: MerchantErrorCode.MERCHANT_USER_MISMATCH,
    });
  }
}
