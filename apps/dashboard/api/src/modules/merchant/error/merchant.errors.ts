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
