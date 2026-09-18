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