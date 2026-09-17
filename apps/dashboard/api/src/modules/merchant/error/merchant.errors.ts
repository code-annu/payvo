import { AppError } from "@payvo/shared/error";
import { HttpStatusCode } from "@payvo/shared/http";
import MerchantErrorCode from "./MerchantErrorCode.js";

export class MerchantNotFoundError extends AppError {
  constructor(message: string = "Merchant not found") {
    super({
      message,
      statusCode: HttpStatusCode.Error.NOT_FOUND,
      code: MerchantErrorCode.MERCHANT_NOT_FOUND,
    });
  }
}

export class MerchantInactiveError extends AppError {
  constructor(message: string = "Merchant is inactive") {
    super({
      message,
      statusCode: HttpStatusCode.Error.CONFLICT,
      code: MerchantErrorCode.MERCHANT_INACTIVE,
    });
  }
}

export class MerchantAccessDeniedError extends AppError {
  constructor(message: string = "Merchant does not belong to user") {
    super({
      message,
      statusCode: HttpStatusCode.Error.FORBIDDEN,
      code: MerchantErrorCode.MERCHANT_ACCESS_DENIED,
    });
  }
}
