import { StatusCode } from "@payvo/shared/api";
import { AppError } from "@payvo/shared/error";

export enum MerchantErrorCode {
  MERCHANT_NOT_FOUND = "MERCHANT_NOT_FOUND",
  MERCHANT_NOT_ACTIVE = "MERCHANT_NOT_ACTIVE",
}

export class MerchantNotFoundError extends AppError {
  constructor(message = "Merchant not found") {
    super({
      message,
      code: MerchantErrorCode.MERCHANT_NOT_FOUND,
      statusCode: StatusCode.Error.NOT_FOUND,
    });
  }
}

export class MerchantNotActiveError extends AppError {
  constructor(message = "Merchant is not active") {
    super({
      message,
      code: MerchantErrorCode.MERCHANT_NOT_ACTIVE,
      statusCode: StatusCode.Error.CONFLICT,
    });
  }
}
