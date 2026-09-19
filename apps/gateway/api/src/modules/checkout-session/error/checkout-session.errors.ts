import { AppError } from "@payvo/shared/error";
import { HttpStatusCode } from "@payvo/shared/http";
import CheckoutSessionErrorCode from "./CheckoutSessionErrorCode.js";

export class InvalidCheckoutSessionExpiryError extends AppError {
  constructor(
    message: string = "Checkout session expiry must be in the future",
  ) {
    super({
      message,
      code: CheckoutSessionErrorCode.INVALID_CHECKOUT_SESSION_EXPIRY,
      statusCode: HttpStatusCode.Error.CONFLICT,
    });
  }
}
