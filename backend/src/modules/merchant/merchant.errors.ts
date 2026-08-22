import StatusCode from "@/core/api/StatusCode";
import AppError from "@/core/error/AppError";
import MerchantErrorCode from "./MerchantErrorCode";

export class MerchantNotFoundError extends AppError {
  constructor(message: string = "Merchant not found") {
    super({
      message,
      statusCode: StatusCode.Error.NOT_FOUND,
      code: MerchantErrorCode.MERCHANT_NOT_FOUND,
    });
  }
}

export class MerchantAccessDeniedError extends AppError {
  constructor(
    message: string = "You don't have permission to access this merchant",
  ) {
    super({
      message,
      statusCode: StatusCode.Error.FORBIDDEN,
      code: MerchantErrorCode.MERCHANT_ACCESS_DENIED,
    });
  }
}
