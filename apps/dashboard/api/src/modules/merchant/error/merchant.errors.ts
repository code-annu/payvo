import { AppError } from "@payvo/shared/error";
import { HttpStatusCode } from "@payvo/shared/http";
import MerchantErrorCode from "./MerchantErrorCode.js";

export class MerchantNotFoundError extends AppError {
  constructor(message: string = "Merchant not found") {
    super({
      message,
      code: MerchantErrorCode.MERCHANT_NOT_FOUND,
      statusCode: HttpStatusCode.Error.NOT_FOUND,
    });
  }
}

export class MerchantInactiveError extends AppError {
  constructor(
    message: string = "Inactive merchant cannot perform api key operations",
  ) {
    super({
      message,
      code: MerchantErrorCode.MERCHANT_INACTIVE,
      statusCode: HttpStatusCode.Error.FORBIDDEN,
    });
  }
}
